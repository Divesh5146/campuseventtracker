import {
  CAMPUS_VENUES,
  type CampusActivity,
  type CampusAnnouncement,
  type CampusMember,
  PROGRESS_STEPS,
} from '../data/campusData.ts';

export type AssistantModelMode = 'general' | 'fast';

export type AssistantVoiceName = 'Kore' | 'Puck' | 'Zephyr' | 'Charon' | 'Fenrir';

const VALID_VOICE_NAMES: readonly AssistantVoiceName[] = [
  'Kore',
  'Puck',
  'Zephyr',
  'Charon',
  'Fenrir',
];

export function resolveTtsVoiceName(voice?: string): AssistantVoiceName {
  if (voice && (VALID_VOICE_NAMES as readonly string[]).includes(voice)) {
    return voice as AssistantVoiceName;
  }
  return 'Kore';
}

export function prepareTextForSpeech(rawText: string): string {
  const cleaned = rawText
    .replace(/\*\*/g, '')
    .replace(/[`#_>-]/g, ' ')
    .replace(/\s*~\s*/g, ' to ')
    .replace(/✓/g, 'checked')
    .replace(/•/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length <= 750) {
    return cleaned;
  }
  return `${cleaned.slice(0, 747).trim()}...`;
}

export type NavigationActionType =
  | 'open_schedule'
  | 'open_events'
  | 'open_map'
  | 'open_manager'
  | 'open_broadcast'
  | 'focus_activity';

export interface NavigationAction {
  id: string;
  type: NavigationActionType;
  label: string;
  description: string;
  activityId?: string;
}

export interface ChatTurnMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
  navigationActions?: NavigationAction[];
  audioBase64?: string;
  isVoiceQuery?: boolean;
}

export function resolveGeminiModelName(mode: AssistantModelMode = 'general'): string {
  if (mode === 'fast') {
    return 'gemini-3.1-flash-lite';
  }
  return 'gemini-3.8-flash';
}

export function formatChatHistoryForGemini(
  history: Array<{ role: 'user' | 'model'; text: string }>
): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  return history
    .filter((item) => typeof item.text === 'string' && item.text.trim().length > 0)
    .map((item) => ({
      role: item.role === 'model' ? 'model' : 'user',
      parts: [{ text: item.text.trim() }],
    }));
}

export function deriveNavigationActions(
  queryText: string,
  activities: CampusActivity[],
  canBroadcast = false
): NavigationAction[] {
  const q = queryText.toLowerCase();
  const actions: NavigationAction[] = [];
  const seenIds = new Set<string>();

  const addAction = (action: NavigationAction) => {
    if (!seenIds.has(action.id)) {
      seenIds.add(action.id);
      actions.push(action);
    }
  };

  // Check for specific activity matches first
  for (const act of activities) {
    const titleLower = act.title.toLowerCase();
    const buildingLower = act.locationBuilding.toLowerCase();
    const isSprint =
      act.id === 'evt-sprint-heats' &&
      (q.includes('sprint') || q.includes('100m') || q.includes('relay') || q.includes('track a'));
    const isFootball =
      act.id === 'evt-football-match' &&
      (q.includes('football') || q.includes('soccer') || q.includes('main field'));
    const isBasketball =
      act.id === 'evt-basketball-tourney' &&
      (q.includes('basketball') || q.includes('court') || q.includes('arena'));
    const isCultural =
      act.id === 'evt-cultural-symphony' &&
      (q.includes('cultural') ||
        q.includes('dance') ||
        q.includes('band') ||
        q.includes('symphony') ||
        q.includes('amphitheater') ||
        q.includes('sorrell'));

    if (isSprint || isFootball || isBasketball || isCultural || q.includes(titleLower) || q.includes(buildingLower)) {
      addAction({
        id: `focus-${act.id}`,
        type: 'focus_activity',
        label: `Focus: ${act.title}`,
        description: `${act.timeRange} · ${act.locationBuilding}`,
        activityId: act.id,
      });
    }
  }

  // Website navigation intents
  if (
    q.includes('schedule') ||
    q.includes('time') ||
    q.includes('when') ||
    q.includes('register') ||
    q.includes('reserve') ||
    q.includes('join') ||
    q.includes('session') ||
    q.includes('event')
  ) {
    addAction({
      id: 'nav-schedule',
      type: 'open_schedule',
      label: 'Open Schedule & Registration',
      description: 'View all sessions and reserve or cancel spots',
    });
  }

  if (
    q.includes('where') ||
    q.includes('map') ||
    q.includes('venue') ||
    q.includes('location') ||
    q.includes('gate') ||
    q.includes('direction') ||
    q.includes('track') ||
    q.includes('field') ||
    q.includes('arena')
  ) {
    addAction({
      id: 'nav-map',
      type: 'open_map',
      label: 'Open Venue Map',
      description: 'Gates, building codes, and live venue status notes',
    });
  }

  if (
    q.includes('switch') ||
    q.includes('program') ||
    q.includes('festival') ||
    q.includes('manager') ||
    q.includes('cultural fest') ||
    q.includes('sports day')
  ) {
    addAction({
      id: 'nav-manager',
      type: 'open_manager',
      label: 'Open Event Manager',
      description: 'Switch between Annual Sports Day & Autumn Cultural Fest',
    });
  }

  if (
    canBroadcast &&
    (q.includes('broadcast') ||
      q.includes('announce') ||
      q.includes('alert') ||
      q.includes('notice') ||
      q.includes('publish'))
  ) {
    addAction({
      id: 'nav-broadcast',
      type: 'open_broadcast',
      label: 'New Broadcast Alert',
      description: 'Post a live announcement to the campus feed',
    });
  }

  // Always provide at least 2 helpful navigation shortcuts if none matched specifically
  if (actions.length === 0) {
    addAction({
      id: 'nav-schedule',
      type: 'open_schedule',
      label: 'Open Schedule Tab',
      description: 'Browse sessions and reserve your spot',
    });
    addAction({
      id: 'nav-map',
      type: 'open_map',
      label: 'Open Venue Map',
      description: 'View campus gates and venue locations',
    });
  }

  return actions.slice(0, 3);
}

export function buildCampusSystemInstruction(params: {
  activities: CampusActivity[];
  announcements: CampusAnnouncement[];
  member?: CampusMember | null;
  registeredIds?: string[];
}): string {
  const { activities, announcements, member, registeredIds = [] } = params;

  const memberContext = member
    ? `Current Signed-In User: ${member.fullName} (Campus ID: ${member.campusId}, Role: ${member.role}, Department: ${member.department}, Verified Co-Curricular Hours: ${member.verifiedHours}/${member.coCurricularTargetHours}h). Currently registered activity IDs: ${registeredIds.join(', ') || 'None'}.`
    : 'Current User: Campus Visitor / Student browsing Alderbrook Commons.';

  const activitiesSummary = activities
    .map(
      (a) =>
        `- "${a.title}" (ID: ${a.id}, Category: ${a.category}): ${a.dateLabel}, ${a.timeRange} at ${a.locationBuilding} (${a.roomNumber}). Check-in code: ${a.checkInCode}. Credits: ${a.coCurricularHours}h. Capacity: ${a.enrolledCount}/${a.capacity}. Details: ${a.summary} Prerequisites: ${a.equipmentOrPrerequisites}. Current live stage: ${PROGRESS_STEPS[a.activeStepIndex ?? 0]?.replace(/\n/g, ' ')}.`
    )
    .join('\n');

  const announcementsSummary = announcements
    .map(
      (ann) =>
        `- [${ann.priority}] ${ann.title}: ${ann.message} (Venue: ${ann.venueName}, Window: ${ann.eventTimeLabel}, ${ann.publishedAt})`
    )
    .join('\n');

  const venuesSummary = CAMPUS_VENUES.map(
    (v) =>
      `- ${v.name} (Code: ${v.code}, Precinct: ${v.precinct}): ${v.addressOrGate}. Capacity: ${v.capacity}. Facilities: ${v.facilities}. Status: ${v.statusNote}.`
  ).join('\n');

  return `You are the Alderbrook Commons Campus Concierge & Navigation Assistant.
Your role is to help students and organizers navigate both the physical campus event venues and the Alderbrook Commons web dashboard, answer questions about today's sports and cultural events, explain schedule adjustments, and guide users to the right tools on the website.

${memberContext}

LIVE CAMPUS EVENTS & SESSIONS:
${activitiesSummary}

LIVE ANNOUNCEMENTS & ALERTS:
${announcementsSummary}

CAMPUS VENUES & GATES:
${venuesSummary}

HOW TO NAVIGATE THE WEBSITE (ALDERBROOK COMMONS DASHBOARD):
1. "Events" vs "Schedule" Switcher (Top-Left Card): Click "Schedule" to view all ${activities.length} sessions, see check-in codes, click a session to track its live progress, or click "Join Session" / "Registered ✓" to reserve or cancel your spot.
2. "Announcement" Feed (Bottom-Left Card): Shows real-time alerts (such as the 15-minute rain delay on Running Track A and volunteer muster on Main Field). Organizers (Role: organization) can click "+ New Broadcast" to post alerts.
3. Top-Right Toolbar (or Bottom Navigation Bar on mobile):
   - "Event Manager": Switches the active featured program between "Annual Sports Day 2026" and "Autumn Cultural Fest 2026".
   - "Map": Opens the Cultural & Sports Venue Locations directory with gate numbers and status notes.
   - "Campus Guide": Opens this multi-turn Event & Navigation Assistant.
4. "Progress & Real-Time" Card (Right Column): Displays the 5-stage progress tracker (Preparation → Check-in → Heats Live → Results Feed → Finals Scheduled) for the selected event, plus the "Live Timeline (Gantt)" showing overlapping venue schedules (including the Track A rain-delay overlap between 08:45 AM and 11:05 AM).

RESPONSE GUIDELINES:
- Keep answers concise, warm, and highly actionable (2–3 short paragraphs or bullet points max).
- Write in clean, natural plain text. Do NOT use markdown bold asterisks (**text**) or fake bracketed links like [Go to Schedule], because the web interface automatically attaches real clickable navigation buttons below your message.
- Always mention specific venue names, gate numbers, times, check-in codes, and which dashboard section the user can open next.`;
}
