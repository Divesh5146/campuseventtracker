// server.ts
import express from "express";
import cors from "cors";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import {
  GoogleGenAI,
  ThinkingLevel
} from "@google/genai";

// src/data/campusData.ts
var PROGRESS_STEPS = [
  "Preparation",
  "Check-in",
  "Heats\nLive",
  "Results\nFeed",
  "Finals\nScheduled"
];
var DEMO_CAMPUS_MEMBERS = [
  {
    campusId: "STU-2026-8841",
    numericId: "20268841",
    pin: "4829",
    fullName: "Maya Lin",
    initials: "ML",
    role: "student",
    department: "Undergraduate Cultural & Athletics Commons",
    yearOrTitle: "Junior \xB7 Class of 2027",
    buildingResidence: "North Quad \xB7 Kimball House",
    coCurricularTargetHours: 24,
    verifiedHours: 14.5,
    initialRegisteredActivityIds: ["evt-sprint-heats", "evt-basketball-tourney"],
    initialAttendedActivityIds: ["evt-football-match"]
  },
  {
    campusId: "ORG-2026-0310",
    numericId: "20260310",
    pin: "9055",
    fullName: "Prof. R. Sharma",
    initials: "RS",
    role: "organization",
    department: "Campus Cultural & Sports Activity Board",
    yearOrTitle: "Coordinator \xB7 Charter #0310",
    buildingResidence: "Student Commons \xB7 Suite 204",
    coCurricularTargetHours: 30,
    verifiedHours: 22,
    initialRegisteredActivityIds: ["evt-sprint-heats", "evt-football-match", "evt-basketball-tourney"],
    initialAttendedActivityIds: ["evt-football-match"]
  }
];
var INITIAL_ANNOUNCEMENTS = [
  {
    id: "ann-1",
    title: "Notice",
    category: "Sports Events",
    priority: "Notice",
    iconType: "clock",
    message: "Relay schedule shifted by 15 mins due to rain. Track A affected.",
    venueName: "Running Track A",
    eventTimeLabel: "08:00 AM ~ 09:30 AM",
    authorName: "Admin",
    authorId: "ORG-2026-0310",
    publishedAt: "Sent 5m ago by Admin",
    pinned: true
  },
  {
    id: "ann-2",
    title: "Volunteers",
    category: "Sports Events",
    priority: "Volunteers",
    iconType: "megaphone",
    message: "reporting for Football Match 1 please gather at Main Field.",
    venueName: "Main Field",
    eventTimeLabel: "08:00 AM ~ 09:00 AM",
    authorName: "Staff",
    authorId: "ORG-2026-0310",
    publishedAt: "Sent 30m ago by Staff",
    pinned: true
  },
  {
    id: "ann-3",
    title: "Reminder",
    category: "Cultural Events",
    priority: "Reminder",
    iconType: "bulb",
    message: "Medical waivers and cultural stage passes must be submitted by 12:00 PM.",
    venueName: "Main Auditorium & Field Desk",
    eventTimeLabel: "Before 12:00 PM",
    authorName: "Coordinator",
    authorId: "ORG-2026-0310",
    publishedAt: "Sent 1h ago",
    pinned: false
  }
];
var CAMPUS_VENUES = [
  {
    id: "venue-track-a",
    name: "Running Track A",
    code: "ATH-TRACK-A",
    category: "Sports Events",
    precinct: "North Athletics Complex",
    addressOrGate: "Gate 2 \xB7 East Warm-up Apron",
    capacity: 800,
    surfaceOrAcoustics: "8-Lane Olympic Tartan Synthetic Track",
    facilities: "Electronic photo-finish timing, starter podium, medical tent",
    coordinatesLabel: "Sector N-01 \xB7 100m Sprint & Relay Straight",
    statusNote: "Heats Live \xB7 15m Rain Delay Adjusted"
  },
  {
    id: "venue-main-field",
    name: "Main Field",
    code: "ATH-FIELD-1",
    category: "Sports Events",
    precinct: "Central Stadium Pitch",
    addressOrGate: "Main Stadium Archway \xB7 Gate 1",
    capacity: 1500,
    surfaceOrAcoustics: "FIFA-grade natural turf pitch & floodlights",
    facilities: "Team dugouts, volunteer muster station, hydration point",
    coordinatesLabel: "Sector C-02 \xB7 Adjacent to West Grandstand",
    statusNote: "Football Match 1 & Opening Ceremony"
  },
  {
    id: "venue-bball-arena",
    name: "Indoor Basketball Arena",
    code: "ATH-COURT-B",
    category: "Sports Events",
    precinct: "Kimball Sports Center",
    addressOrGate: "North Turnstile Entrance",
    capacity: 950,
    surfaceOrAcoustics: "Hardwood show court with 4-sided LED scoreboard",
    facilities: "Locker rooms A\u2013D, referee table, spectator bleachers",
    coordinatesLabel: "Sector N-04 \xB7 09:00 AM Tournament Tip-off",
    statusNote: "Basketball Tournament \xB7 09:00 AM \u2013 12:00 PM"
  },
  {
    id: "venue-cultural-hall",
    name: "Sorrell Cultural Amphitheater & Hall",
    code: "CUL-STAGE-1",
    category: "Cultural Events",
    precinct: "South Cultural Quadrangle",
    addressOrGate: "East Colonnade Gate B",
    capacity: 650,
    surfaceOrAcoustics: "Acoustic cedar stage & line-array sound rig",
    facilities: "Green rooms, instrument check-in, lighting control booth",
    coordinatesLabel: "Sector S-03 \xB7 Evening Cultural Showcase",
    statusNote: "Cultural Dance & Acoustic Finals \xB7 01:00 PM"
  }
];
var INITIAL_CAMPUS_ACTIVITIES = [
  {
    id: "evt-sprint-heats",
    title: "100m Sprint Heats",
    category: "Sports Events",
    hostOrganization: "Annual Sports Day Committee",
    hostAdvisorOrLead: "Prof. R. Sharma \xB7 ORG-2026-0310",
    dayOfWeek: "Thursday",
    dateLabel: "Oct 15, 2026",
    timeRange: "08:00 AM ~ 09:30 AM",
    venueId: "venue-track-a",
    locationBuilding: "Running Track A",
    roomNumber: "Lanes 1\u20138 \xB7 Gate 2",
    coCurricularHours: 2,
    capacity: 120,
    enrolledCount: 96,
    checkInCode: "SPRT-100",
    summary: " Qualifying 100m sprint heats and 4x100m relay trials on Running Track A with electronic timing.",
    equipmentOrPrerequisites: "Track spikes required \xB7 Check-in 20m prior",
    illustrationType: "robotics",
    activeStepIndex: 2
  },
  {
    id: "evt-football-match",
    title: "Inter-Department Football Match 1",
    category: "Sports Events",
    hostOrganization: "Annual Sports Day Committee",
    hostAdvisorOrLead: "Prof. R. Sharma \xB7 ORG-2026-0310",
    dayOfWeek: "Thursday",
    dateLabel: "Oct 15, 2026",
    timeRange: "08:00 AM ~ 09:00 AM",
    venueId: "venue-main-field",
    locationBuilding: "Main Field",
    roomNumber: "Central Turf Pitch \xB7 Gate 1",
    coCurricularHours: 2,
    capacity: 200,
    enrolledCount: 164,
    checkInCode: "FOOT-01",
    summary: "Opening knockout fixture on Main Field. Volunteers report at Main Field muster point.",
    equipmentOrPrerequisites: "Team kit & shin guards mandatory",
    illustrationType: "rowing",
    activeStepIndex: 3
  },
  {
    id: "evt-basketball-tourney",
    title: "Basketball Tournament",
    category: "Sports Events",
    hostOrganization: "Campus Athletics Council",
    hostAdvisorOrLead: "Prof. R. Sharma \xB7 ORG-2026-0310",
    dayOfWeek: "Thursday",
    dateLabel: "Oct 15, 2026",
    timeRange: "09:00 AM ~ 12:00 PM",
    venueId: "venue-bball-arena",
    locationBuilding: "Indoor Basketball Arena",
    roomNumber: "Main Show Court \xB7 North Turnstile",
    coCurricularHours: 3,
    capacity: 180,
    enrolledCount: 142,
    checkInCode: "BBALL-26",
    summary: "5v5 inter-house championship brackets running from 09:00 AM to 12:00 PM.",
    equipmentOrPrerequisites: "Non-marking court shoes required",
    illustrationType: "astronomy",
    activeStepIndex: 1
  },
  {
    id: "evt-cultural-symphony",
    title: "Autumn Cultural Fest: Fusion Bands & Classical Dance",
    category: "Cultural Events",
    hostOrganization: "Cultural Arts & Stage Society",
    hostAdvisorOrLead: "Prof. R. Sharma \xB7 ORG-2026-0310",
    dayOfWeek: "Thursday",
    dateLabel: "Oct 15, 2026",
    timeRange: "01:00 PM ~ 04:00 PM",
    venueId: "venue-cultural-hall",
    locationBuilding: "Sorrell Cultural Amphitheater & Hall",
    roomNumber: "Main Stage \xB7 Gate B",
    coCurricularHours: 3,
    capacity: 250,
    enrolledCount: 210,
    checkInCode: "CULT-15",
    summary: "Choreographed folk and classical dance showcase followed by acoustic and contemporary student bands.",
    equipmentOrPrerequisites: "Stage pass & Student ID required at Gate B",
    illustrationType: "symphony",
    activeStepIndex: 0
  }
];

// src/utils/campusAuth.ts
var ROLE_PREFIX_MAP = {
  student: "STU",
  organization: "ORG"
};
var PREFIX_ROLE_MAP = {
  STU: "student",
  ORG: "organization"
};
function normalizeCampusId(rawInput, defaultRole = "student") {
  const cleaned = rawInput.trim().toUpperCase();
  if (!cleaned) return "";
  const prefixedMatch = cleaned.match(/^(STU|ORG)[-\s]?(\d{4})[-\s]?(\d{4})$/);
  if (prefixedMatch) {
    return `${prefixedMatch[1]}-${prefixedMatch[2]}-${prefixedMatch[3]}`;
  }
  const numericMatch = cleaned.match(/^(\d{4})[-\s]?(\d{4})$/);
  if (numericMatch) {
    const prefix = ROLE_PREFIX_MAP[defaultRole];
    return `${prefix}-${numericMatch[1]}-${numericMatch[2]}`;
  }
  return cleaned;
}
function validateCampusLogin(rawIdInput, selectedRole, directory = DEMO_CAMPUS_MEMBERS) {
  const trimmedId = rawIdInput.trim();
  if (!trimmedId) {
    return {
      valid: false,
      field: "campusId",
      error: "Enter your Student ID or Organizer ID number (e.g., STU-2026-8841 or ORG-2026-0310)."
    };
  }
  const normalizedId = normalizeCampusId(trimmedId, selectedRole);
  const idPattern = /^(STU|ORG)-(\d{4})-(\d{4})$/;
  const match = normalizedId.match(idPattern);
  if (!match) {
    return {
      valid: false,
      field: "campusId",
      error: "Invalid ID format. Use STU-YYYY-NNNN (Student ID), ORG-YYYY-NNNN (Organizer ID), or an 8-digit number."
    };
  }
  const [, prefix, yearStr, serialStr] = match;
  const yearNum = Number(yearStr);
  if (yearNum < 1980 || yearNum > 2032) {
    return {
      valid: false,
      field: "campusId",
      error: `Enrollment or charter year (${yearStr}) must be between 1980 and 2032.`
    };
  }
  const numericOnly = `${yearStr}${serialStr}`;
  const existingMember = directory.find(
    (m) => m.campusId === normalizedId || m.numericId === numericOnly
  );
  if (existingMember) {
    return {
      valid: true,
      member: existingMember
    };
  }
  const resolvedRole = PREFIX_ROLE_MAP[prefix] || selectedRole;
  const roleDepartments = {
    student: "Undergraduate Cultural & Athletics Commons",
    organization: "Campus Cultural & Sports Activity Board"
  };
  const roleTitles = {
    student: `Matriculated ${yearStr} \xB7 Verified Student ID`,
    organization: `Charter #${serialStr} \xB7 Verified Activity Organizer`
  };
  return {
    valid: true,
    member: {
      campusId: normalizedId,
      numericId: numericOnly,
      pin: "",
      fullName: resolvedRole === "organization" ? "Prof. R. Sharma" : `Student #${serialStr}`,
      initials: resolvedRole === "organization" ? "RS" : "ST",
      role: resolvedRole,
      department: roleDepartments[resolvedRole],
      yearOrTitle: roleTitles[resolvedRole],
      buildingResidence: "Alderbrook Central Commons",
      coCurricularTargetHours: 24,
      verifiedHours: 8,
      initialRegisteredActivityIds: ["evt-sprint-heats"],
      initialAttendedActivityIds: []
    }
  };
}
function toggleActivityReservation(activities2, registeredIds, activityId) {
  const isAlreadyRegistered = registeredIds.includes(activityId);
  const target = activities2.find((a) => a.id === activityId);
  if (!target) {
    return { activities: activities2, registeredIds, action: "cancelled" };
  }
  if (!isAlreadyRegistered && target.enrolledCount >= target.capacity) {
    return { activities: activities2, registeredIds, action: "full", targetActivity: target };
  }
  const nextRegisteredIds = isAlreadyRegistered ? registeredIds.filter((id) => id !== activityId) : [...registeredIds, activityId];
  const nextActivities = activities2.map((act) => {
    if (act.id !== activityId) return act;
    const delta = isAlreadyRegistered ? -1 : 1;
    return {
      ...act,
      enrolledCount: Math.max(0, Math.min(act.capacity, act.enrolledCount + delta))
    };
  });
  const updatedTarget = nextActivities.find((a) => a.id === activityId);
  return {
    activities: nextActivities,
    registeredIds: nextRegisteredIds,
    action: isAlreadyRegistered ? "cancelled" : "reserved",
    targetActivity: updatedTarget
  };
}
function createAnnouncementBroadcast(existingAnnouncements, input, organizer) {
  const trimmedTitle = input.title.trim();
  const trimmedMessage = input.message.trim();
  const trimmedVenue = input.venueName.trim();
  const trimmedTime = input.eventTimeLabel.trim();
  if (!trimmedTitle) {
    return {
      valid: false,
      error: "Enter an announcement prefix/title (e.g., Notice, Volunteers, or Reminder).",
      updatedAnnouncements: existingAnnouncements
    };
  }
  if (!trimmedMessage) {
    return {
      valid: false,
      error: "Enter the announcement message before broadcasting.",
      updatedAnnouncements: existingAnnouncements
    };
  }
  const iconMap = {
    Notice: "clock",
    Volunteers: "megaphone",
    Reminder: "bulb",
    "Urgent Broadcast": "clock"
  };
  const created = {
    id: `ann-${Date.now()}`,
    title: trimmedTitle,
    category: input.category,
    priority: input.priority,
    iconType: iconMap[input.priority] || "megaphone",
    venueName: trimmedVenue || "Running Track A",
    eventTimeLabel: trimmedTime || "08:00 AM ~ 09:30 AM",
    message: trimmedMessage,
    authorName: organizer.fullName,
    authorId: organizer.campusId,
    publishedAt: `Sent just now by ${organizer.fullName}`,
    pinned: Boolean(input.pinned)
  };
  return {
    valid: true,
    announcement: created,
    updatedAnnouncements: [created, ...existingAnnouncements]
  };
}
function ensureMutableFetch(target) {
  try {
    const proto = Object.getPrototypeOf(target);
    const desc = Object.getOwnPropertyDescriptor(target, "fetch") || (proto ? Object.getOwnPropertyDescriptor(proto, "fetch") : void 0);
    let currentFetch = desc && desc.get ? desc.get.call(target) : typeof target.fetch === "function" ? target.fetch : void 0;
    const nativeDefineProperty = Object.defineProperty;
    if (!desc || desc.configurable !== false) {
      nativeDefineProperty(target, "fetch", {
        configurable: true,
        enumerable: true,
        get() {
          return currentFetch;
        },
        set(nextFetch) {
          if (typeof nextFetch === "function") {
            currentFetch = nextFetch;
          }
        }
      });
    }
    const guardKey = "__campusFetchDefinePropertyGuarded__";
    if (!target[guardKey]) {
      nativeDefineProperty(target, guardKey, {
        value: true,
        configurable: true,
        enumerable: false,
        writable: false
      });
      Object.defineProperty = function(obj, prop, attributes) {
        if (prop === "fetch" && attributes && (obj === target || obj === proto)) {
          if (attributes.get && !attributes.set) {
            let latestGetter = attributes.get;
            return nativeDefineProperty(obj, prop, {
              configurable: true,
              enumerable: attributes.enumerable ?? true,
              get() {
                return latestGetter.call(this);
              },
              set(nextFn) {
                if (typeof nextFn === "function") {
                  latestGetter = () => nextFn;
                }
              }
            });
          }
          if ("value" in attributes && attributes.writable === false) {
            return nativeDefineProperty(obj, prop, {
              ...attributes,
              configurable: true,
              writable: true
            });
          }
        }
        return nativeDefineProperty(obj, prop, attributes);
      };
    }
    return true;
  } catch {
    return false;
  }
}
if (typeof window !== "undefined") {
  ensureMutableFetch(window);
}

// src/utils/campusAssistant.ts
function resolveGeminiModelName(mode = "general") {
  if (mode === "fast") {
    return "gemini-3.1-flash-lite";
  }
  return "gemini-3.8-flash";
}
function formatChatHistoryForGemini(history) {
  return history.filter((item) => typeof item.text === "string" && item.text.trim().length > 0).map((item) => ({
    role: item.role === "model" ? "model" : "user",
    parts: [{ text: item.text.trim() }]
  }));
}
function deriveNavigationActions(queryText, activities2, canBroadcast = false) {
  const q = queryText.toLowerCase();
  const actions = [];
  const seenIds = /* @__PURE__ */ new Set();
  const addAction = (action) => {
    if (!seenIds.has(action.id)) {
      seenIds.add(action.id);
      actions.push(action);
    }
  };
  for (const act of activities2) {
    const titleLower = act.title.toLowerCase();
    const buildingLower = act.locationBuilding.toLowerCase();
    const isSprint = act.id === "evt-sprint-heats" && (q.includes("sprint") || q.includes("100m") || q.includes("relay") || q.includes("track a"));
    const isFootball = act.id === "evt-football-match" && (q.includes("football") || q.includes("soccer") || q.includes("main field"));
    const isBasketball = act.id === "evt-basketball-tourney" && (q.includes("basketball") || q.includes("court") || q.includes("arena"));
    const isCultural = act.id === "evt-cultural-symphony" && (q.includes("cultural") || q.includes("dance") || q.includes("band") || q.includes("symphony") || q.includes("amphitheater") || q.includes("sorrell"));
    if (isSprint || isFootball || isBasketball || isCultural || q.includes(titleLower) || q.includes(buildingLower)) {
      addAction({
        id: `focus-${act.id}`,
        type: "focus_activity",
        label: `Focus: ${act.title}`,
        description: `${act.timeRange} \xB7 ${act.locationBuilding}`,
        activityId: act.id
      });
    }
  }
  if (q.includes("schedule") || q.includes("time") || q.includes("when") || q.includes("register") || q.includes("reserve") || q.includes("join") || q.includes("session") || q.includes("event")) {
    addAction({
      id: "nav-schedule",
      type: "open_schedule",
      label: "Open Schedule & Registration",
      description: "View all sessions and reserve or cancel spots"
    });
  }
  if (q.includes("where") || q.includes("map") || q.includes("venue") || q.includes("location") || q.includes("gate") || q.includes("direction") || q.includes("track") || q.includes("field") || q.includes("arena")) {
    addAction({
      id: "nav-map",
      type: "open_map",
      label: "Open Venue Map",
      description: "Gates, building codes, and live venue status notes"
    });
  }
  if (q.includes("todo") || q.includes("to-do") || q.includes("checklist") || q.includes("waiver") || q.includes("task") || q.includes("volunteer")) {
    addAction({
      id: "nav-todo",
      type: "open_todo",
      label: "Open To-Do Checklist",
      description: "Event day tasks, waivers, and volunteer coordination"
    });
  }
  if (q.includes("switch") || q.includes("program") || q.includes("festival") || q.includes("manager") || q.includes("cultural fest") || q.includes("sports day")) {
    addAction({
      id: "nav-manager",
      type: "open_manager",
      label: "Open Event Manager",
      description: "Switch between Annual Sports Day & Autumn Cultural Fest"
    });
  }
  if (canBroadcast && (q.includes("broadcast") || q.includes("announce") || q.includes("alert") || q.includes("notice") || q.includes("publish"))) {
    addAction({
      id: "nav-broadcast",
      type: "open_broadcast",
      label: "New Broadcast Alert",
      description: "Post a live announcement to the campus feed"
    });
  }
  if (actions.length === 0) {
    addAction({
      id: "nav-schedule",
      type: "open_schedule",
      label: "Open Schedule Tab",
      description: "Browse sessions and reserve your spot"
    });
    addAction({
      id: "nav-map",
      type: "open_map",
      label: "Open Venue Map",
      description: "View campus gates and venue locations"
    });
  }
  return actions.slice(0, 3);
}
function buildCampusSystemInstruction(params) {
  const { activities: activities2, announcements: announcements2, member, registeredIds = [] } = params;
  const memberContext = member ? `Current Signed-In User: ${member.fullName} (Campus ID: ${member.campusId}, Role: ${member.role}, Department: ${member.department}, Verified Co-Curricular Hours: ${member.verifiedHours}/${member.coCurricularTargetHours}h). Currently registered activity IDs: ${registeredIds.join(", ") || "None"}.` : "Current User: Campus Visitor / Student browsing Alderbrook Commons.";
  const activitiesSummary = activities2.map(
    (a) => `- "${a.title}" (ID: ${a.id}, Category: ${a.category}): ${a.dateLabel}, ${a.timeRange} at ${a.locationBuilding} (${a.roomNumber}). Check-in code: ${a.checkInCode}. Credits: ${a.coCurricularHours}h. Capacity: ${a.enrolledCount}/${a.capacity}. Details: ${a.summary} Prerequisites: ${a.equipmentOrPrerequisites}. Current live stage: ${PROGRESS_STEPS[a.activeStepIndex ?? 0]?.replace(/\n/g, " ")}.`
  ).join("\n");
  const announcementsSummary = announcements2.map(
    (ann) => `- [${ann.priority}] ${ann.title}: ${ann.message} (Venue: ${ann.venueName}, Window: ${ann.eventTimeLabel}, ${ann.publishedAt})`
  ).join("\n");
  const venuesSummary = CAMPUS_VENUES.map(
    (v) => `- ${v.name} (Code: ${v.code}, Precinct: ${v.precinct}): ${v.addressOrGate}. Capacity: ${v.capacity}. Facilities: ${v.facilities}. Status: ${v.statusNote}.`
  ).join("\n");
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
1. "Events" vs "Schedule" Switcher (Top-Left Card): Click "Schedule" to view all ${activities2.length} sessions, see check-in codes, click a session to track its live progress, or click "Join Session" / "Registered \u2713" to reserve or cancel your spot.
2. "Announcement" Feed (Bottom-Left Card): Shows real-time alerts (such as the 15-minute rain delay on Running Track A and volunteer muster on Main Field). Organizers (Role: organization) can click "+ New Broadcast" to post alerts.
3. Top-Right Toolbar (or Bottom Navigation Bar on mobile):
   - "To-Do": Opens the Event Day Coordination Checklist (waivers before 12:00 PM, Track A lane check, Main Field volunteer muster).
   - "Event Manager": Switches the active featured program between "Annual Sports Day 2026" and "Autumn Cultural Fest 2026".
   - "Map": Opens the Cultural & Sports Venue Locations directory with gate numbers and status notes.
4. "Progress & Real-Time" Card (Right Column): Displays the 5-stage progress tracker (Preparation \u2192 Check-in \u2192 Heats Live \u2192 Results Feed \u2192 Finals Scheduled) for the selected event, plus the "Live Timeline (Gantt)" showing overlapping venue schedules (including the Track A rain-delay overlap between 08:45 AM and 11:05 AM).

RESPONSE GUIDELINES:
- Keep answers concise, warm, and highly actionable (2\u20133 short paragraphs or bullet points max).
- Write in clean, natural plain text. Do NOT use markdown bold asterisks (**text**) or fake bracketed links like [Go to Schedule], because the web interface automatically attaches real clickable navigation buttons below your message.
- Always mention specific venue names, gate numbers, times, check-in codes, and which dashboard section the user can open next.`;
}

// server.ts
var app = express();
var PORT = Number(process.env.BACKEND_PORT) || Number(process.env.PORT) || 3001;
app.use(cors());
app.use(express.json());
var activities = [...INITIAL_CAMPUS_ACTIVITIES];
var announcements = [...INITIAL_ANNOUNCEMENTS];
var reservations = {
  [DEMO_CAMPUS_MEMBERS[0].campusId]: [
    ...DEMO_CAMPUS_MEMBERS[0].initialRegisteredActivityIds
  ],
  [DEMO_CAMPUS_MEMBERS[1].campusId]: [
    ...DEMO_CAMPUS_MEMBERS[1].initialRegisteredActivityIds
  ]
};
app.post("/api/auth/login", (req, res) => {
  const { campusId = "", role = "student" } = req.body;
  const validation = validateCampusLogin(campusId, role, DEMO_CAMPUS_MEMBERS);
  if (!validation.valid || !validation.member) {
    res.status(400).json({
      valid: false,
      error: validation.error || "Invalid Campus ID credentials."
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
    registeredIds: reservations[member.campusId]
  });
});
app.get("/api/dashboard", (req, res) => {
  const campusId = typeof req.query.campusId === "string" ? req.query.campusId : "";
  const roleParam = typeof req.query.role === "string" ? req.query.role : "";
  let activeMember = null;
  if (campusId) {
    activeMember = DEMO_CAMPUS_MEMBERS.find((m) => m.campusId === campusId) || null;
  } else if (roleParam === "organizer") {
    activeMember = DEMO_CAMPUS_MEMBERS[1];
  } else if (roleParam === "student") {
    activeMember = DEMO_CAMPUS_MEMBERS[0];
  }
  const targetId = activeMember?.campusId || campusId;
  const registeredIds = targetId && reservations[targetId] ? reservations[targetId] : [];
  res.json({
    activities,
    announcements,
    registeredIds,
    activeMember
  });
});
app.post("/api/activities/:id/reserve", (req, res) => {
  const activityId = req.params.id;
  const { campusId = DEMO_CAMPUS_MEMBERS[0].campusId } = req.body;
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
    targetActivity: update.targetActivity
  });
});
app.post("/api/activities", (req, res) => {
  const body = req.body;
  if (!body || !body.title) {
    res.status(400).json({ error: "Activity title is required." });
    return;
  }
  const newActivity = {
    id: `evt-${Date.now()}`,
    title: body.title,
    category: body.category || "Sports Events",
    hostOrganization: body.hostOrganization || "Campus Activity Board",
    hostAdvisorOrLead: body.hostAdvisorOrLead || "Prof. R. Sharma \xB7 ORG-2026-0310",
    dayOfWeek: body.dayOfWeek || "Thursday",
    dateLabel: body.dateLabel || "Oct 15, 2026",
    timeRange: body.timeRange || "08:00 AM ~ 09:30 AM",
    venueId: body.venueId || "venue-track-a",
    locationBuilding: body.locationBuilding || "Running Track A",
    roomNumber: body.roomNumber || "Gate 2",
    coCurricularHours: body.coCurricularHours ?? 2,
    capacity: body.capacity ?? 120,
    enrolledCount: body.enrolledCount ?? 0,
    checkInCode: body.checkInCode || "CAMP-26",
    summary: body.summary || "Scheduled campus event session.",
    equipmentOrPrerequisites: body.equipmentOrPrerequisites || "Campus ID required",
    illustrationType: body.illustrationType || "robotics",
    activeStepIndex: body.activeStepIndex ?? 0
  };
  activities = [newActivity, ...activities];
  res.status(201).json({
    activity: newActivity,
    activities
  });
});
app.post("/api/announcements", (req, res) => {
  const { input, organizer } = req.body;
  if (!input) {
    res.status(400).json({
      valid: false,
      error: "Announcement input payload is required."
    });
    return;
  }
  const resolvedOrganizer = organizer || {
    fullName: DEMO_CAMPUS_MEMBERS[1].fullName,
    campusId: DEMO_CAMPUS_MEMBERS[1].campusId
  };
  const result = createAnnouncementBroadcast(
    announcements,
    input,
    resolvedOrganizer
  );
  if (!result.valid || !result.announcement) {
    res.status(400).json({
      valid: false,
      error: result.error || "Invalid announcement broadcast.",
      announcements
    });
    return;
  }
  announcements = result.updatedAnnouncements;
  res.status(201).json({
    valid: true,
    announcement: result.announcement,
    announcements
  });
});
app.post("/api/chat", async (req, res) => {
  const {
    message = "",
    history = [],
    campusId = "",
    mode = "general"
  } = req.body;
  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    res.status(400).json({
      error: "Please enter a question about campus events, venues, or navigation."
    });
    return;
  }
  const activeMember = DEMO_CAMPUS_MEMBERS.find((m) => m.campusId === campusId) || DEMO_CAMPUS_MEMBERS[0];
  const registeredIds = reservations[activeMember.campusId] || [];
  const canBroadcast = activeMember.role === "organization";
  const modelName = resolveGeminiModelName(mode);
  const systemInstruction = buildCampusSystemInstruction({
    activities,
    announcements,
    member: activeMember,
    registeredIds
  });
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    const formattedHistory = formatChatHistoryForGemini(history);
    const chat = ai.chats.create({
      model: modelName,
      history: formattedHistory,
      config: {
        systemInstruction,
        ...modelName === "gemini-3.8-flash" ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}
      }
    });
    const response = await chat.sendMessage({
      message: trimmedMessage
    });
    const replyText = (response.text ?? "").trim() || "I can help you navigate the Schedule, Venue Map, Event Manager, or To-Do Checklist.";
    const navigationActions = deriveNavigationActions(
      `${trimmedMessage} ${replyText}`,
      activities,
      canBroadcast
    );
    res.json({
      reply: replyText,
      modelUsed: modelName,
      navigationActions
    });
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : "Unable to reach the Gemini Campus Assistant right now.";
    res.status(500).json({
      error: errMessage,
      navigationActions: deriveNavigationActions(
        trimmedMessage,
        activities,
        canBroadcast
      )
    });
  }
});
var distPath = path.resolve(process.cwd(), "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
}
var activePort = PORT;
var server = http.createServer(app);
server.on("listening", () => {
  console.log(`Server is running on http://localhost:${activePort}`);
});
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    if (activePort !== 3001 && !process.env.BACKEND_PORT) {
      activePort = 3001;
      server.listen(activePort, "0.0.0.0");
      return;
    }
    console.log(`Server is running on http://localhost:${activePort}`);
    process.exit(0);
  }
  console.error("Server error:", err);
  process.exit(1);
});
server.listen(activePort, "0.0.0.0");
