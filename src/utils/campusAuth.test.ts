import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeCampusId,
  validateCampusLogin,
  filterActivities,
  toggleActivityReservation,
  createAnnouncementBroadcast,
  ensureMutableFetch,
} from './campusAuth';
import {
  INITIAL_ANNOUNCEMENTS,
  INITIAL_CAMPUS_ACTIVITIES,
} from '../data/campusData';

test('ensureMutableFetch prevents TypeError when setting fetch on a getter-only window object or after subsequent getter-only defineProperty calls', () => {
  const mockWindow: Record<string, unknown> = {};
  const originalFn = () => 'original';
  Object.defineProperty(mockWindow, 'fetch', {
    configurable: true,
    enumerable: true,
    get() {
      return originalFn;
    },
  });

  assert.throws(() => {
    mockWindow.fetch = () => 'patched';
  }, TypeError);

  const patched = ensureMutableFetch(mockWindow);
  assert.equal(patched, true);

  const interceptorFn = () => 'intercepted';
  mockWindow.fetch = interceptorFn;
  assert.equal(mockWindow.fetch, interceptorFn);

  // Simulate a browser extension redefining window.fetch with only a getter AFTER page boot
  const extGetterFn = () => 'extension-getter';
  Object.defineProperty(mockWindow, 'fetch', {
    configurable: true,
    get() {
      return extGetterFn;
    },
  });

  // Subsequent assignment to mockWindow.fetch must still succeed without throwing TypeError
  const secondInterceptorFn = () => 'second-interceptor';
  assert.doesNotThrow(() => {
    mockWindow.fetch = secondInterceptorFn;
  });
  assert.equal(mockWindow.fetch, secondInterceptorFn);
});

test('normalizeCampusId formats both full IDs and 8-digit university numbers', () => {
  assert.equal(normalizeCampusId('stu-2026-8841', 'student'), 'STU-2026-8841');
  assert.equal(normalizeCampusId('20268841', 'student'), 'STU-2026-8841');
  assert.equal(normalizeCampusId('2026-0310', 'organization'), 'ORG-2026-0310');
  assert.equal(normalizeCampusId('ORG20260310', 'organization'), 'ORG-2026-0310');
});

test('validateCampusLogin rejects empty or malformed IDs', () => {
  const emptyId = validateCampusLogin('', 'student');
  assert.equal(emptyId.valid, false);
  assert.equal(emptyId.field, 'campusId');

  const badFormat = validateCampusLogin('FAC-2019-1042', 'student');
  assert.equal(badFormat.valid, false);
  assert.equal(badFormat.field, 'campusId');
});

test('validateCampusLogin authenticates Student ID and Organizer ID without PIN', () => {
  const res1 = validateCampusLogin('STU-2026-8841', 'student');
  assert.equal(res1.valid, true);
  assert.equal(res1.member?.role, 'student');

  const res2 = validateCampusLogin('20260310', 'organization');
  assert.equal(res2.valid, true);
  assert.equal(res2.member?.role, 'organization');
  assert.equal(res2.member?.campusId, 'ORG-2026-0310');
});

test('filterActivities filters Cultural Events and Sports Events accurately', () => {
  const culturalOnly = filterActivities(INITIAL_CAMPUS_ACTIVITIES, {
    category: 'Cultural Events',
    dayOfWeek: 'All',
    searchQuery: '',
    onlyOpenSeats: false,
  });
  assert.equal(culturalOnly.length, 1);

  const sportsOnly = filterActivities(INITIAL_CAMPUS_ACTIVITIES, {
    category: 'Sports Events',
    dayOfWeek: 'All',
    searchQuery: '',
    onlyOpenSeats: false,
  });
  assert.equal(sportsOnly.length, 3);
});

test('toggleActivityReservation increments and decrements seat counts accurately', () => {
  const initialCount = INITIAL_CAMPUS_ACTIVITIES.find(
    (a) => a.id === 'evt-sprint-heats'
  )!.enrolledCount;

  const reserved = toggleActivityReservation(
    INITIAL_CAMPUS_ACTIVITIES,
    [],
    'evt-sprint-heats'
  );
  assert.equal(reserved.action, 'reserved');
  assert.ok(reserved.registeredIds.includes('evt-sprint-heats'));
  assert.equal(reserved.targetActivity?.enrolledCount, initialCount + 1);
});

test('createAnnouncementBroadcast validates required fields and prepends new broadcast', () => {
  const emptyTitle = createAnnouncementBroadcast(
    INITIAL_ANNOUNCEMENTS,
    {
      title: '   ',
      category: 'Sports Events',
      priority: 'Notice',
      venueName: 'Running Track A',
      eventTimeLabel: '08:00 AM ~ 09:30 AM',
      message: 'Track A lane assignments updated.',
    },
    { fullName: 'Prof. R. Sharma', campusId: 'ORG-2026-0310' }
  );
  assert.equal(emptyTitle.valid, false);

  const validBroadcast = createAnnouncementBroadcast(
    INITIAL_ANNOUNCEMENTS,
    {
      title: 'Notice',
      category: 'Sports Events',
      priority: 'Notice',
      venueName: 'Indoor Basketball Arena',
      eventTimeLabel: '09:00 AM ~ 12:00 PM',
      message: 'Basketball Semifinal Tip-Off Moved to Main Court.',
      pinned: true,
    },
    { fullName: 'Prof. R. Sharma', campusId: 'ORG-2026-0310' }
  );
  assert.equal(validBroadcast.valid, true);
  assert.equal(
    validBroadcast.updatedAnnouncements.length,
    INITIAL_ANNOUNCEMENTS.length + 1
  );
  assert.equal(
    validBroadcast.updatedAnnouncements[0].message,
    'Basketball Semifinal Tip-Off Moved to Main Court.'
  );
});
