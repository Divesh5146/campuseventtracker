export type CampusRole = 'student' | 'organization';

export interface CampusMember {
  campusId: string;
  numericId: string;
  pin: string;
  fullName: string;
  initials: string;
  role: CampusRole;
  department: string;
  yearOrTitle: string;
  buildingResidence: string;
  coCurricularTargetHours: number;
  verifiedHours: number;
  initialRegisteredActivityIds: string[];
  initialAttendedActivityIds: string[];
}

export type ActivityCategory = 'Cultural Events' | 'Sports Events';

export interface CampusActivity {
  id: string;
  title: string;
  category: ActivityCategory;
  hostOrganization: string;
  hostAdvisorOrLead: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  dateLabel: string;
  timeRange: string;
  venueId: string;
  locationBuilding: string;
  roomNumber: string;
  coCurricularHours: number;
  capacity: number;
  enrolledCount: number;
  checkInCode: string;
  summary: string;
  equipmentOrPrerequisites: string;
  illustrationType: 'symphony' | 'rowing' | 'debate' | 'robotics' | 'conservatory' | 'astronomy';
  activeStepIndex?: number;
}

export type AnnouncementPriority = 'Notice' | 'Volunteers' | 'Reminder' | 'Urgent Broadcast';

export interface CampusAnnouncement {
  id: string;
  title: string;
  category: ActivityCategory;
  priority: AnnouncementPriority;
  iconType: 'clock' | 'megaphone' | 'bulb';
  message: string;
  venueName: string;
  eventTimeLabel: string;
  authorName: string;
  authorId: string;
  publishedAt: string;
  pinned?: boolean;
}

export interface CampusVenue {
  id: string;
  name: string;
  code: string;
  category: ActivityCategory;
  precinct: string;
  addressOrGate: string;
  capacity: number;
  surfaceOrAcoustics: string;
  facilities: string;
  coordinatesLabel: string;
  statusNote: string;
}

export interface GanttTimelineRow {
  id: string;
  venueLabel: string;
  category: ActivityCategory;
  bars: {
    id: string;
    label: string;
    timeSlot: string;
    startCol: number; // 0 to 100 percentage across 08:00 AM - 12:00 PM
    widthPct: number;
    isConflict?: boolean;
  }[];
}

export const PROGRESS_STEPS = [
  'Preparation',
  'Check-in',
  'Heats\nLive',
  'Results\nFeed',
  'Finals\nScheduled',
];

export const DEMO_CAMPUS_MEMBERS: CampusMember[] = [
  {
    campusId: 'STU-2026-8841',
    numericId: '20268841',
    pin: '4829',
    fullName: 'Maya Lin',
    initials: 'ML',
    role: 'student',
    department: 'Undergraduate Cultural & Athletics Commons',
    yearOrTitle: 'Junior · Class of 2027',
    buildingResidence: 'North Quad · Kimball House',
    coCurricularTargetHours: 24,
    verifiedHours: 14.5,
    initialRegisteredActivityIds: ['evt-sprint-heats', 'evt-basketball-tourney'],
    initialAttendedActivityIds: ['evt-football-match'],
  },
  {
    campusId: 'ORG-2026-0310',
    numericId: '20260310',
    pin: '9055',
    fullName: 'Prof. R. Sharma',
    initials: 'RS',
    role: 'organization',
    department: 'Campus Cultural & Sports Activity Board',
    yearOrTitle: 'Coordinator · Charter #0310',
    buildingResidence: 'Student Commons · Suite 204',
    coCurricularTargetHours: 30,
    verifiedHours: 22.0,
    initialRegisteredActivityIds: ['evt-sprint-heats', 'evt-football-match', 'evt-basketball-tourney'],
    initialAttendedActivityIds: ['evt-football-match'],
  },
];

export const INITIAL_ANNOUNCEMENTS: CampusAnnouncement[] = [
  {
    id: 'ann-1',
    title: 'Notice',
    category: 'Sports Events',
    priority: 'Notice',
    iconType: 'clock',
    message: 'Relay schedule shifted by 15 mins due to rain. Track A affected.',
    venueName: 'Running Track A',
    eventTimeLabel: '08:00 AM ~ 09:30 AM',
    authorName: 'Admin',
    authorId: 'ORG-2026-0310',
    publishedAt: 'Sent 5m ago by Admin',
    pinned: true,
  },
  {
    id: 'ann-2',
    title: 'Volunteers',
    category: 'Sports Events',
    priority: 'Volunteers',
    iconType: 'megaphone',
    message: 'reporting for Football Match 1 please gather at Main Field.',
    venueName: 'Main Field',
    eventTimeLabel: '08:00 AM ~ 09:00 AM',
    authorName: 'Staff',
    authorId: 'ORG-2026-0310',
    publishedAt: 'Sent 30m ago by Staff',
    pinned: true,
  },
  {
    id: 'ann-3',
    title: 'Reminder',
    category: 'Cultural Events',
    priority: 'Reminder',
    iconType: 'bulb',
    message: 'Medical waivers and cultural stage passes must be submitted by 12:00 PM.',
    venueName: 'Main Auditorium & Field Desk',
    eventTimeLabel: 'Before 12:00 PM',
    authorName: 'Coordinator',
    authorId: 'ORG-2026-0310',
    publishedAt: 'Sent 1h ago',
    pinned: false,
  },
];

export const INITIAL_GANTT_ROWS: GanttTimelineRow[] = [
  {
    id: 'row-main-field',
    venueLabel: 'Main Field',
    category: 'Sports Events',
    bars: [
      {
        id: 'bar-main-field',
        label: 'Main Field',
        timeSlot: '08:00 AM – 09:00 AM',
        startCol: 1,
        widthPct: 24,
        isConflict: false,
      },
    ],
  },
  {
    id: 'row-track-a',
    venueLabel: 'Track A',
    category: 'Sports Events',
    bars: [
      {
        id: 'bar-conflict',
        label: 'Venue Overlap Conflict',
        timeSlot: '08:45 AM – 11:05 AM',
        startCol: 16,
        widthPct: 52,
        isConflict: true,
      },
    ],
  },
  {
    id: 'row-basketball',
    venueLabel: '',
    category: 'Sports Events',
    bars: [
      {
        id: 'bar-bball',
        label: 'Basketball Tournament',
        timeSlot: '09:00 AM – 12:00 PM',
        startCol: 25,
        widthPct: 68,
        isConflict: false,
      },
    ],
  },
];

export const CAMPUS_VENUES: CampusVenue[] = [
  {
    id: 'venue-track-a',
    name: 'Running Track A',
    code: 'ATH-TRACK-A',
    category: 'Sports Events',
    precinct: 'North Athletics Complex',
    addressOrGate: 'Gate 2 · East Warm-up Apron',
    capacity: 800,
    surfaceOrAcoustics: '8-Lane Olympic Tartan Synthetic Track',
    facilities: 'Electronic photo-finish timing, starter podium, medical tent',
    coordinatesLabel: 'Sector N-01 · 100m Sprint & Relay Straight',
    statusNote: 'Heats Live · 15m Rain Delay Adjusted',
  },
  {
    id: 'venue-main-field',
    name: 'Main Field',
    code: 'ATH-FIELD-1',
    category: 'Sports Events',
    precinct: 'Central Stadium Pitch',
    addressOrGate: 'Main Stadium Archway · Gate 1',
    capacity: 1500,
    surfaceOrAcoustics: 'FIFA-grade natural turf pitch & floodlights',
    facilities: 'Team dugouts, volunteer muster station, hydration point',
    coordinatesLabel: 'Sector C-02 · Adjacent to West Grandstand',
    statusNote: 'Football Match 1 & Opening Ceremony',
  },
  {
    id: 'venue-bball-arena',
    name: 'Indoor Basketball Arena',
    code: 'ATH-COURT-B',
    category: 'Sports Events',
    precinct: 'Kimball Sports Center',
    addressOrGate: 'North Turnstile Entrance',
    capacity: 950,
    surfaceOrAcoustics: 'Hardwood show court with 4-sided LED scoreboard',
    facilities: 'Locker rooms A–D, referee table, spectator bleachers',
    coordinatesLabel: 'Sector N-04 · 09:00 AM Tournament Tip-off',
    statusNote: 'Basketball Tournament · 09:00 AM – 12:00 PM',
  },
  {
    id: 'venue-cultural-hall',
    name: 'Sorrell Cultural Amphitheater & Hall',
    code: 'CUL-STAGE-1',
    category: 'Cultural Events',
    precinct: 'South Cultural Quadrangle',
    addressOrGate: 'East Colonnade Gate B',
    capacity: 650,
    surfaceOrAcoustics: 'Acoustic cedar stage & line-array sound rig',
    facilities: 'Green rooms, instrument check-in, lighting control booth',
    coordinatesLabel: 'Sector S-03 · Evening Cultural Showcase',
    statusNote: 'Cultural Dance & Acoustic Finals · 01:00 PM',
  },
];

export const INITIAL_CAMPUS_ACTIVITIES: CampusActivity[] = [
  {
    id: 'evt-sprint-heats',
    title: '100m Sprint Heats',
    category: 'Sports Events',
    hostOrganization: 'Annual Sports Day Committee',
    hostAdvisorOrLead: 'Prof. R. Sharma · ORG-2026-0310',
    dayOfWeek: 'Thursday',
    dateLabel: 'Oct 15, 2026',
    timeRange: '08:00 AM ~ 09:30 AM',
    venueId: 'venue-track-a',
    locationBuilding: 'Running Track A',
    roomNumber: 'Lanes 1–8 · Gate 2',
    coCurricularHours: 2.0,
    capacity: 120,
    enrolledCount: 96,
    checkInCode: 'SPRT-100',
    summary:
      ' Qualifying 100m sprint heats and 4x100m relay trials on Running Track A with electronic timing.',
    equipmentOrPrerequisites: 'Track spikes required · Check-in 20m prior',
    illustrationType: 'robotics',
    activeStepIndex: 2,
  },
  {
    id: 'evt-football-match',
    title: 'Inter-Department Football Match 1',
    category: 'Sports Events',
    hostOrganization: 'Annual Sports Day Committee',
    hostAdvisorOrLead: 'Prof. R. Sharma · ORG-2026-0310',
    dayOfWeek: 'Thursday',
    dateLabel: 'Oct 15, 2026',
    timeRange: '08:00 AM ~ 09:00 AM',
    venueId: 'venue-main-field',
    locationBuilding: 'Main Field',
    roomNumber: 'Central Turf Pitch · Gate 1',
    coCurricularHours: 2.0,
    capacity: 200,
    enrolledCount: 164,
    checkInCode: 'FOOT-01',
    summary:
      'Opening knockout fixture on Main Field. Volunteers report at Main Field muster point.',
    equipmentOrPrerequisites: 'Team kit & shin guards mandatory',
    illustrationType: 'rowing',
    activeStepIndex: 3,
  },
  {
    id: 'evt-basketball-tourney',
    title: 'Basketball Tournament',
    category: 'Sports Events',
    hostOrganization: 'Campus Athletics Council',
    hostAdvisorOrLead: 'Prof. R. Sharma · ORG-2026-0310',
    dayOfWeek: 'Thursday',
    dateLabel: 'Oct 15, 2026',
    timeRange: '09:00 AM ~ 12:00 PM',
    venueId: 'venue-bball-arena',
    locationBuilding: 'Indoor Basketball Arena',
    roomNumber: 'Main Show Court · North Turnstile',
    coCurricularHours: 3.0,
    capacity: 180,
    enrolledCount: 142,
    checkInCode: 'BBALL-26',
    summary:
      '5v5 inter-house championship brackets running from 09:00 AM to 12:00 PM.',
    equipmentOrPrerequisites: 'Non-marking court shoes required',
    illustrationType: 'astronomy',
    activeStepIndex: 1,
  },
  {
    id: 'evt-cultural-symphony',
    title: 'Autumn Cultural Fest: Fusion Bands & Classical Dance',
    category: 'Cultural Events',
    hostOrganization: 'Cultural Arts & Stage Society',
    hostAdvisorOrLead: 'Prof. R. Sharma · ORG-2026-0310',
    dayOfWeek: 'Thursday',
    dateLabel: 'Oct 15, 2026',
    timeRange: '01:00 PM ~ 04:00 PM',
    venueId: 'venue-cultural-hall',
    locationBuilding: 'Sorrell Cultural Amphitheater & Hall',
    roomNumber: 'Main Stage · Gate B',
    coCurricularHours: 3.0,
    capacity: 250,
    enrolledCount: 210,
    checkInCode: 'CULT-15',
    summary:
      'Choreographed folk and classical dance showcase followed by acoustic and contemporary student bands.',
    equipmentOrPrerequisites: 'Stage pass & Student ID required at Gate B',
    illustrationType: 'symphony',
    activeStepIndex: 0,
  },
];
