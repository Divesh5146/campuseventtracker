import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {
  GoogleGenAI,
  type GenerateContentResponse,
  ThinkingLevel,
} from '@google/genai';
import {
  type CampusActivity,
  type CampusAnnouncement,
  type CampusMember,
  type CampusRole,
  DEMO_CAMPUS_MEMBERS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_CAMPUS_ACTIVITIES,
} from './src/data/campusData.ts';
import {
  type BroadcastInput,
  createAnnouncementBroadcast,
  toggleActivityReservation,
  validateCampusLogin,
} from './src/utils/campusAuth.ts';
import {
  type AssistantModelMode,
  buildCampusSystemInstruction,
  deriveNavigationActions,
  formatChatHistoryForGemini,
  prepareTextForSpeech,
  resolveGeminiModelName,
  resolveTtsVoiceName,
} from './src/utils/campusAssistant.ts';

const app = express();
const PORT =
  Number(process.env.BACKEND_PORT) ||
  Number(process.env.PORT) ||
  3001;

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// In-memory state persisted while the server runs
let activities: CampusActivity[] = [...INITIAL_CAMPUS_ACTIVITIES];
let announcements: CampusAnnouncement[] = [...INITIAL_ANNOUNCEMENTS];
let reservations: Record<string, string[]> = {
  [DEMO_CAMPUS_MEMBERS[0].campusId]: [
    ...DEMO_CAMPUS_MEMBERS[0].initialRegisteredActivityIds,
  ],
  [DEMO_CAMPUS_MEMBERS[1].campusId]: [
    ...DEMO_CAMPUS_MEMBERS[1].initialRegisteredActivityIds,
  ],
};

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { campusId = '', role = 'student' } = req.body as {
    campusId?: string;
    role?: CampusRole;
  };

  const validation = validateCampusLogin(campusId, role, DEMO_CAMPUS_MEMBERS);
  if (!validation.valid || !validation.member) {
    res.status(400).json({
      valid: false,
      error: validation.error || 'Invalid Campus ID credentials.',
    });
    return;
  }

  const member = validation.member;
  if (!reservations[member.campusId]) {
    reservations[member.campusId] = [...member.initialRegisteredActivityIds];
  }

  res.json({
    valid: true,
    member,
    registeredIds: reservations[member.campusId],
  });
});

// GET /api/dashboard
app.get('/api/dashboard', (req, res) => {
  const campusId = typeof req.query.campusId === 'string' ? req.query.campusId : '';
  const roleParam = typeof req.query.role === 'string' ? req.query.role : '';

  let activeMember: CampusMember | null = null;
  if (campusId) {
    activeMember =
      DEMO_CAMPUS_MEMBERS.find((m) => m.campusId === campusId) || null;
  } else if (roleParam === 'organizer') {
    activeMember = DEMO_CAMPUS_MEMBERS[1];
  } else if (roleParam === 'student') {
    activeMember = DEMO_CAMPUS_MEMBERS[0];
  }

  const targetId = activeMember?.campusId || campusId;
  const registeredIds =
    targetId && reservations[targetId] ? reservations[targetId] : [];

  res.json({
    activities,
    announcements,
    registeredIds,
    activeMember,
  });
});

// POST /api/activities/:id/reserve
app.post('/api/activities/:id/reserve', (req, res) => {
  const activityId = req.params.id;
  const { campusId = DEMO_CAMPUS_MEMBERS[0].campusId } = req.body as {
    campusId?: string;
  };

  const currentRegistered = reservations[campusId] || [];
  const update = toggleActivityReservation(
    activities,
    currentRegistered,
    activityId
  );

  activities = update.activities;
  reservations[campusId] = update.registeredIds;

  res.json({
    activities,
    registeredIds: reservations[campusId],
    action: update.action,
    targetActivity: update.targetActivity,
  });
});

// POST /api/activities
app.post('/api/activities', (req, res) => {
  const body = req.body as Partial<CampusActivity>;
  if (!body || !body.title) {
    res.status(400).json({ error: 'Activity title is required.' });
    return;
  }

  const newActivity: CampusActivity = {
    id: `evt-${Date.now()}`,
    title: body.title,
    category: body.category || 'Sports Events',
    hostOrganization: body.hostOrganization || 'Campus Activity Board',
    hostAdvisorOrLead: body.hostAdvisorOrLead || 'Prof. R. Sharma · ORG-2026-0310',
    dayOfWeek: body.dayOfWeek || 'Thursday',
    dateLabel: body.dateLabel || 'Oct 15, 2026',
    timeRange: body.timeRange || '08:00 AM ~ 09:30 AM',
    venueId: body.venueId || 'venue-track-a',
    locationBuilding: body.locationBuilding || 'Running Track A',
    roomNumber: body.roomNumber || 'Gate 2',
    coCurricularHours: body.coCurricularHours ?? 2.0,
    capacity: body.capacity ?? 120,
    enrolledCount: body.enrolledCount ?? 0,
    checkInCode: body.checkInCode || 'CAMP-26',
    summary: body.summary || 'Scheduled campus event session.',
    equipmentOrPrerequisites: body.equipmentOrPrerequisites || 'Campus ID required',
    illustrationType: body.illustrationType || 'robotics',
    activeStepIndex: body.activeStepIndex ?? 0,
  };

  activities = [newActivity, ...activities];
  res.status(201).json({
    activity: newActivity,
    activities,
  });
});

// POST /api/announcements
app.post('/api/announcements', (req, res) => {
  const { input, organizer } = req.body as {
    input?: BroadcastInput;
    organizer?: Pick<CampusMember, 'fullName' | 'campusId'>;
  };

  if (!input) {
    res.status(400).json({
      valid: false,
      error: 'Announcement input payload is required.',
    });
    return;
  }

  const resolvedOrganizer = organizer || {
    fullName: DEMO_CAMPUS_MEMBERS[1].fullName,
    campusId: DEMO_CAMPUS_MEMBERS[1].campusId,
  };

  const result = createAnnouncementBroadcast(
    announcements,
    input,
    resolvedOrganizer
  );

  if (!result.valid || !result.announcement) {
    res.status(400).json({
      valid: false,
      error: result.error || 'Invalid announcement broadcast.',
      announcements,
    });
    return;
  }

  announcements = result.updatedAnnouncements;

  res.status(201).json({
    valid: true,
    announcement: result.announcement,
    announcements,
  });
});

// POST /api/chat — Multi-turn Gemini Campus Navigation & Event Concierge
app.post('/api/chat', async (req, res) => {
  const {
    message = '',
    history = [],
    campusId = '',
    mode = 'general',
  } = req.body as {
    message?: string;
    history?: Array<{ role: 'user' | 'model'; text: string }>;
    campusId?: string;
    mode?: AssistantModelMode;
  };

  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    res.status(400).json({
      error: 'Please enter a question about campus events, venues, or navigation.',
    });
    return;
  }

  const activeMember =
    DEMO_CAMPUS_MEMBERS.find((m) => m.campusId === campusId) ||
    DEMO_CAMPUS_MEMBERS[0];
  const registeredIds = reservations[activeMember.campusId] || [];
  const canBroadcast = activeMember.role === 'organization';
  const modelName = resolveGeminiModelName(mode);

  const systemInstruction = buildCampusSystemInstruction({
    activities,
    announcements,
    member: activeMember,
    registeredIds,
  });

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const formattedHistory = formatChatHistoryForGemini(history);
    const chat = ai.chats.create({
      model: modelName,
      history: formattedHistory,
      config: {
        systemInstruction,
        ...(modelName === 'gemini-3.8-flash'
          ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
          : {}),
      },
    });

    const response: GenerateContentResponse = await chat.sendMessage({
      message: trimmedMessage,
    });

    const replyText =
      (response.text ?? '').trim() ||
      'I can help you navigate the Schedule, Venue Map, Event Manager, or To-Do Checklist.';

    const navigationActions = deriveNavigationActions(
      `${trimmedMessage} ${replyText}`,
      activities,
      canBroadcast
    );

    res.json({
      reply: replyText,
      modelUsed: modelName,
      navigationActions,
    });
  } catch (err: unknown) {
    const errMessage =
      err instanceof Error
        ? err.message
        : 'Unable to reach the Gemini Campus Assistant right now.';
    res.status(500).json({
      error: errMessage,
      navigationActions: deriveNavigationActions(
        trimmedMessage,
        activities,
        canBroadcast
      ),
    });
  }
});

// POST /api/voice/transcribe — Speech-to-Text via gemini-3.5-transcribe
app.post('/api/voice/transcribe', async (req, res) => {
  const { audioBase64 = '', mimeType = 'audio/webm' } = req.body as {
    audioBase64?: string;
    mimeType?: string;
  };

  const cleanedAudio = audioBase64.trim();
  if (!cleanedAudio) {
    res.status(400).json({ error: 'Audio recording payload is required.' });
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'audio/webm',
              data: cleanedAudio,
            },
          },
          {
            text: 'Transcribe this spoken question about university campus events or navigation accurately into plain text. Return only the transcribed words.',
          },
        ],
      },
    });

    const transcript = (response.text ?? '').trim();
    res.json({
      text: transcript,
      modelUsed: 'gemini-3.5-transcribe',
    });
  } catch (err: unknown) {
    const errMessage =
      err instanceof Error
        ? err.message
        : 'Unable to transcribe audio right now.';
    res.status(500).json({ error: errMessage });
  }
});

// POST /api/voice/tts — Text-to-Speech via gemini-3.8-flash-lite-tts
app.post('/api/voice/tts', async (req, res) => {
  const { text = '', voiceName = 'Kore' } = req.body as {
    text?: string;
    voiceName?: string;
  };

  const speechText = prepareTextForSpeech(text);
  if (!speechText) {
    res.status(400).json({ error: 'Text is required for speech synthesis.' });
    return;
  }

  const resolvedVoice = resolveTtsVoiceName(voiceName);

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: speechText,
              speechMetadata: {
                style: 'Warm, clear, helpful university campus concierge',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: resolvedVoice },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      res.status(500).json({
        error: 'No audio data returned from Gemini TTS model.',
      });
      return;
    }

    res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
      voiceName: resolvedVoice,
      modelUsed: 'gemini-3.8-flash-lite-tts',
    });
  } catch (err: unknown) {
    const errMessage =
      err instanceof Error
        ? err.message
        : 'Unable to synthesize speech right now.';
    res.status(500).json({ error: errMessage });
  }
});

// Serve static production build when dist/ exists (for Cloud Run deployment)
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) {
      next();
      return;
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

let activePort = PORT;
const server = http.createServer(app);

server.on('listening', () => {
  console.log(`Server is running on http://localhost:${activePort}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    if (activePort !== 3001 && !process.env.BACKEND_PORT) {
      // In local preview containers where PORT=8080 is used by the proxy, fall back to 3001
      activePort = 3001;
      server.listen(activePort, '0.0.0.0');
      return;
    }
    console.log(`Server is running on http://localhost:${activePort}`);
    process.exit(0);
  }
  console.error('Server error:', err);
  process.exit(1);
});

server.listen(activePort, '0.0.0.0');
