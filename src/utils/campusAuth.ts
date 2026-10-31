import {
  type ActivityCategory,
  type AnnouncementPriority,
  type CampusActivity,
  type CampusAnnouncement,
  type CampusMember,
  type CampusRole,
  DEMO_CAMPUS_MEMBERS,
} from '../data/campusData.ts';

export interface LoginValidationResult {
  valid: boolean;
  error?: string;
  field?: 'campusId';
  member?: CampusMember;
}

const ROLE_PREFIX_MAP: Record<CampusRole, string> = {
  student: 'STU',
  organization: 'ORG',
};

const PREFIX_ROLE_MAP: Record<string, CampusRole> = {
  STU: 'student',
  ORG: 'organization',
};

/**
 * Normalizes a user-entered Campus ID string.
 * Supports full formatted IDs ("STU-2026-8841", "ORG-2026-0310") or 8-digit university numbers ("20268841").
 */
export function normalizeCampusId(rawInput: string, defaultRole: CampusRole = 'student'): string {
  const cleaned = rawInput.trim().toUpperCase();
  if (!cleaned) return '';

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

/**
 * Validates Campus ID Number login credentials against format rules and campus directory.
 */
export function validateCampusLogin(
  rawIdInput: string,
  selectedRole: CampusRole,
  directory: CampusMember[] = DEMO_CAMPUS_MEMBERS
): LoginValidationResult {
  const trimmedId = rawIdInput.trim();

  if (!trimmedId) {
    return {
      valid: false,
      field: 'campusId',
      error: 'Enter your Student ID or Organizer ID number (e.g., STU-2026-8841 or ORG-2026-0310).',
    };
  }

  const normalizedId = normalizeCampusId(trimmedId, selectedRole);
  const idPattern = /^(STU|ORG)-(\d{4})-(\d{4})$/;
  const match = normalizedId.match(idPattern);

  if (!match) {
    return {
      valid: false,
      field: 'campusId',
      error:
        'Invalid ID format. Use STU-YYYY-NNNN (Student ID), ORG-YYYY-NNNN (Organizer ID), or an 8-digit number.',
    };
  }

  const [, prefix, yearStr, serialStr] = match;
  const yearNum = Number(yearStr);
  if (yearNum < 1980 || yearNum > 2032) {
    return {
      valid: false,
      field: 'campusId',
      error: `Enrollment or charter year (${yearStr}) must be between 1980 and 2032.`,
    };
  }

  const numericOnly = `${yearStr}${serialStr}`;
  const existingMember = directory.find(
    (m) => m.campusId === normalizedId || m.numericId === numericOnly
  );

  if (existingMember) {
    return {
      valid: true,
      member: existingMember,
    };
  }

  const resolvedRole = PREFIX_ROLE_MAP[prefix] || selectedRole;
  const roleDepartments: Record<CampusRole, string> = {
    student: 'Undergraduate Cultural & Athletics Commons',
    organization: 'Campus Cultural & Sports Activity Board',
  };
  const roleTitles: Record<CampusRole, string> = {
    student: `Matriculated ${yearStr} · Verified Student ID`,
    organization: `Charter #${serialStr} · Verified Activity Organizer`,
  };

  return {
    valid: true,
    member: {
      campusId: normalizedId,
      numericId: numericOnly,
      pin: '',
      fullName:
        resolvedRole === 'organization'
          ? 'Prof. R. Sharma'
          : `Student #${serialStr}`,
      initials: resolvedRole === 'organization' ? 'RS' : 'ST',
      role: resolvedRole,
      department: roleDepartments[resolvedRole],
      yearOrTitle: roleTitles[resolvedRole],
      buildingResidence: 'Alderbrook Central Commons',
      coCurricularTargetHours: 24,
      verifiedHours: 8.0,
      initialRegisteredActivityIds: ['evt-sprint-heats'],
      initialAttendedActivityIds: [],
    },
  };
}

export interface ActivityFilterOptions {
  category: ActivityCategory | 'All';
  dayOfWeek: string;
  searchQuery: string;
  onlyOpenSeats: boolean;
}

/**
 * Filters cultural and sports events by category, day, search query, and open seat availability.
 */
export function filterActivities(
  activities: CampusActivity[],
  options: ActivityFilterOptions
): CampusActivity[] {
  const query = options.searchQuery.trim().toLowerCase();

  return activities.filter((act) => {
    if (options.category !== 'All' && act.category !== options.category) {
      return false;
    }
    if (options.dayOfWeek !== 'All' && act.dayOfWeek !== options.dayOfWeek) {
      return false;
    }
    if (options.onlyOpenSeats && act.enrolledCount >= act.capacity) {
      return false;
    }
    if (query) {
      const searchable = [
        act.title,
        act.hostOrganization,
        act.locationBuilding,
        act.roomNumber,
        act.checkInCode,
        act.summary,
      ]
        .join(' ')
        .toLowerCase();
      if (!searchable.includes(query)) {
        return false;
      }
    }
    return true;
  });
}

export interface ReservationUpdateResult {
  activities: CampusActivity[];
  registeredIds: string[];
  action: 'reserved' | 'cancelled' | 'full';
  targetActivity?: CampusActivity;
}

/**
 * Toggles seat reservation for a campus event and updates enrolled seat counts deterministically.
 */
export function toggleActivityReservation(
  activities: CampusActivity[],
  registeredIds: string[],
  activityId: string
): ReservationUpdateResult {
  const isAlreadyRegistered = registeredIds.includes(activityId);
  const target = activities.find((a) => a.id === activityId);

  if (!target) {
    return { activities, registeredIds, action: 'cancelled' };
  }

  if (!isAlreadyRegistered && target.enrolledCount >= target.capacity) {
    return { activities, registeredIds, action: 'full', targetActivity: target };
  }

  const nextRegisteredIds = isAlreadyRegistered
    ? registeredIds.filter((id) => id !== activityId)
    : [...registeredIds, activityId];

  const nextActivities = activities.map((act) => {
    if (act.id !== activityId) return act;
    const delta = isAlreadyRegistered ? -1 : 1;
    return {
      ...act,
      enrolledCount: Math.max(0, Math.min(act.capacity, act.enrolledCount + delta)),
    };
  });

  const updatedTarget = nextActivities.find((a) => a.id === activityId);

  return {
    activities: nextActivities,
    registeredIds: nextRegisteredIds,
    action: isAlreadyRegistered ? 'cancelled' : 'reserved',
    targetActivity: updatedTarget,
  };
}

export interface BroadcastInput {
  title: string;
  category: ActivityCategory;
  priority: AnnouncementPriority;
  venueName: string;
  eventTimeLabel: string;
  message: string;
  pinned?: boolean;
}

export interface BroadcastResult {
  valid: boolean;
  error?: string;
  announcement?: CampusAnnouncement;
  updatedAnnouncements: CampusAnnouncement[];
}

/**
 * Validates and broadcasts a new cultural or sports event announcement from an Organizer ID.
 */
export function createAnnouncementBroadcast(
  existingAnnouncements: CampusAnnouncement[],
  input: BroadcastInput,
  organizer: Pick<CampusMember, 'fullName' | 'campusId'>
): BroadcastResult {
  const trimmedTitle = input.title.trim();
  const trimmedMessage = input.message.trim();
  const trimmedVenue = input.venueName.trim();
  const trimmedTime = input.eventTimeLabel.trim();

  if (!trimmedTitle) {
    return {
      valid: false,
      error: 'Enter an announcement prefix/title (e.g., Notice, Volunteers, or Reminder).',
      updatedAnnouncements: existingAnnouncements,
    };
  }

  if (!trimmedMessage) {
    return {
      valid: false,
      error: 'Enter the announcement message before broadcasting.',
      updatedAnnouncements: existingAnnouncements,
    };
  }

  const iconMap: Record<AnnouncementPriority, CampusAnnouncement['iconType']> = {
    Notice: 'clock',
    Volunteers: 'megaphone',
    Reminder: 'bulb',
    'Urgent Broadcast': 'clock',
  };

  const created: CampusAnnouncement = {
    id: `ann-${Date.now()}`,
    title: trimmedTitle,
    category: input.category,
    priority: input.priority,
    iconType: iconMap[input.priority] || 'megaphone',
    venueName: trimmedVenue || 'Running Track A',
    eventTimeLabel: trimmedTime || '08:00 AM ~ 09:30 AM',
    message: trimmedMessage,
    authorName: organizer.fullName,
    authorId: organizer.campusId,
    publishedAt: `Sent just now by ${organizer.fullName}`,
    pinned: Boolean(input.pinned),
  };

  return {
    valid: true,
    announcement: created,
    updatedAnnouncements: [created, ...existingAnnouncements],
  };
}

/**
 * Ensures `target.fetch` always has both a getter and a setter and wraps `Object.defineProperty`
 * so any script or browser extension that defines `fetch` with only a getter still receives a working setter,
 * preventing `TypeError: Cannot set property fetch of #<Window> which has only a getter`.
 */
export function ensureMutableFetch(target: Record<string, unknown>): boolean {
  try {
    const proto = Object.getPrototypeOf(target);
    const desc =
      Object.getOwnPropertyDescriptor(target, 'fetch') ||
      (proto ? Object.getOwnPropertyDescriptor(proto, 'fetch') : undefined);

    let currentFetch: unknown =
      desc && desc.get
        ? desc.get.call(target)
        : typeof target.fetch === 'function'
          ? target.fetch
          : undefined;

    const nativeDefineProperty = Object.defineProperty;

    if (!desc || desc.configurable !== false) {
      nativeDefineProperty(target, 'fetch', {
        configurable: true,
        enumerable: true,
        get() {
          return currentFetch;
        },
        set(nextFetch: unknown) {
          if (typeof nextFetch === 'function') {
            currentFetch = nextFetch;
          }
        },
      });
    }

    const guardKey = '__campusFetchDefinePropertyGuarded__';
    if (!target[guardKey]) {
      nativeDefineProperty(target, guardKey, {
        value: true,
        configurable: true,
        enumerable: false,
        writable: false,
      });

      Object.defineProperty = function <T>(
        obj: T,
        prop: PropertyKey,
        attributes: PropertyDescriptor & ThisType<unknown>
      ): T {
        if (
          prop === 'fetch' &&
          attributes &&
          (obj === target || obj === proto)
        ) {
          if (attributes.get && !attributes.set) {
            let latestGetter = attributes.get;
            return nativeDefineProperty(obj, prop, {
              configurable: true,
              enumerable: attributes.enumerable ?? true,
              get() {
                return latestGetter.call(this);
              },
              set(nextFn: unknown) {
                if (typeof nextFn === 'function') {
                  latestGetter = () => nextFn;
                }
              },
            });
          }
          if ('value' in attributes && attributes.writable === false) {
            return nativeDefineProperty(obj, prop, {
              ...attributes,
              configurable: true,
              writable: true,
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

if (typeof window !== 'undefined') {
  ensureMutableFetch(window as unknown as Record<string, unknown>);
}
