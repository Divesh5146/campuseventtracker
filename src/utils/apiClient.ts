import {
  CampusActivity,
  CampusAnnouncement,
  CampusMember,
  CampusRole,
} from '../data/campusData';
import { BroadcastInput } from './campusAuth';
import {
  AssistantModelMode,
  NavigationAction,
} from './campusAssistant';

export interface LoginApiResponse {
  valid: boolean;
  member?: CampusMember;
  registeredIds?: string[];
  error?: string;
}

export interface DashboardDataResponse {
  activities: CampusActivity[];
  announcements: CampusAnnouncement[];
  registeredIds: string[];
  activeMember?: CampusMember | null;
}

export interface ReserveActivityResponse {
  activities: CampusActivity[];
  registeredIds: string[];
  action: 'reserved' | 'cancelled' | 'full';
  targetActivity?: CampusActivity;
}

export interface PublishActivityResponse {
  activity: CampusActivity;
  activities: CampusActivity[];
}

export interface BroadcastAnnouncementResponse {
  valid: boolean;
  announcement?: CampusAnnouncement;
  announcements: CampusAnnouncement[];
  error?: string;
}

export async function login(
  campusId: string,
  role: CampusRole
): Promise<LoginApiResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campusId, role }),
  });

  const data = (await response.json()) as LoginApiResponse;
  if (!response.ok) {
    return {
      valid: false,
      error: data.error || 'Unable to sign in with Campus ID.',
    };
  }
  return data;
}

export async function getDashboardData(options?: {
  campusId?: string;
  role?: string;
}): Promise<DashboardDataResponse> {
  const params = new URLSearchParams();
  if (options?.campusId) {
    params.set('campusId', options.campusId);
  }
  if (options?.role) {
    params.set('role', options.role);
  }

  const queryString = params.toString();
  const url = queryString ? `/api/dashboard?${queryString}` : '/api/dashboard';

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard data (${response.status})`);
  }
  return (await response.json()) as DashboardDataResponse;
}

export async function toggleReservation(
  activityId: string,
  campusId: string
): Promise<ReserveActivityResponse> {
  const response = await fetch(
    `/api/activities/${encodeURIComponent(activityId)}/reserve`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campusId }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to toggle reservation (${response.status})`);
  }
  return (await response.json()) as ReserveActivityResponse;
}

export async function publishActivity(
  activityInput: Partial<CampusActivity>
): Promise<PublishActivityResponse> {
  const response = await fetch('/api/activities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(activityInput),
  });

  if (!response.ok) {
    throw new Error(`Failed to publish activity (${response.status})`);
  }
  return (await response.json()) as PublishActivityResponse;
}

export async function broadcastAnnouncement(
  input: BroadcastInput,
  organizer: Pick<CampusMember, 'fullName' | 'campusId'>
): Promise<BroadcastAnnouncementResponse> {
  const response = await fetch('/api/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input, organizer }),
  });

  const data = (await response.json()) as BroadcastAnnouncementResponse;
  if (!response.ok) {
    return {
      valid: false,
      error: data.error || 'Failed to broadcast announcement.',
      announcements: data.announcements || [],
    };
  }
  return data;
}

export interface ChatApiResponse {
  reply?: string;
  modelUsed?: string;
  navigationActions?: NavigationAction[];
  error?: string;
}

export interface TranscribeVoiceResponse {
  text?: string;
  modelUsed?: string;
  error?: string;
}

export interface SynthesizeSpeechResponse {
  audioBase64?: string;
  mimeType?: string;
  voiceName?: string;
  modelUsed?: string;
  error?: string;
}

export async function sendChatMessage(params: {
  message: string;
  history: Array<{ role: 'user' | 'model'; text: string }>;
  campusId?: string;
  mode?: AssistantModelMode;
}): Promise<ChatApiResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = (await response.json()) as ChatApiResponse;
  if (!response.ok) {
    return {
      error:
        data.error ||
        `Assistant request failed (${response.status}). Please check your API key in Settings > Secrets.`,
      navigationActions: data.navigationActions || [],
    };
  }
  return data;
}

export async function transcribeVoiceAudio(params: {
  audioBase64: string;
  mimeType?: string;
}): Promise<TranscribeVoiceResponse> {
  const response = await fetch('/api/voice/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = (await response.json()) as TranscribeVoiceResponse;
  if (!response.ok) {
    return {
      error:
        data.error ||
        `Voice transcription failed (${response.status}). Please check your API key in Settings > Secrets.`,
    };
  }
  return data;
}

export async function synthesizeSpeech(params: {
  text: string;
  voiceName?: string;
}): Promise<SynthesizeSpeechResponse> {
  const response = await fetch('/api/voice/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = (await response.json()) as SynthesizeSpeechResponse;
  if (!response.ok) {
    return {
      error:
        data.error ||
        `Speech synthesis failed (${response.status}). Please check your API key in Settings > Secrets.`,
    };
  }
  return data;
}

export const apiClient = {
  login,
  getDashboardData,
  toggleReservation,
  publishActivity,
  broadcastAnnouncement,
  sendChatMessage,
  transcribeVoiceAudio,
  synthesizeSpeech,
};
