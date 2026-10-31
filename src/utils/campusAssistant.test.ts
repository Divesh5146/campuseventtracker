import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCampusSystemInstruction,
  deriveNavigationActions,
  formatChatHistoryForGemini,
  resolveGeminiModelName,
} from './campusAssistant';
import {
  DEMO_CAMPUS_MEMBERS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_CAMPUS_ACTIVITIES,
} from '../data/campusData';

test('resolveGeminiModelName selects gemini-3.8-flash for general and gemini-3.1-flash-lite for fast mode', () => {
  assert.equal(resolveGeminiModelName('general'), 'gemini-3.8-flash');
  assert.equal(resolveGeminiModelName('fast'), 'gemini-3.1-flash-lite');
});

test('formatChatHistoryForGemini filters empty messages and maps turns to Gemini Content format', () => {
  const formatted = formatChatHistoryForGemini([
    { role: 'user', text: '  Where is Track A?  ' },
    { role: 'model', text: '' },
    { role: 'model', text: 'Running Track A is at Gate 2.' },
  ]);

  assert.equal(formatted.length, 2);
  assert.deepEqual(formatted[0], {
    role: 'user',
    parts: [{ text: 'Where is Track A?' }],
  });
  assert.deepEqual(formatted[1], {
    role: 'model',
    parts: [{ text: 'Running Track A is at Gate 2.' }],
  });
});

test('deriveNavigationActions identifies activity focus and venue map actions from user prompt', () => {
  const actions = deriveNavigationActions(
    'Where is the 100m Sprint Heats held and how do I open the venue map?',
    INITIAL_CAMPUS_ACTIVITIES,
    false
  );

  assert.ok(actions.some((a) => a.type === 'focus_activity' && a.activityId === 'evt-sprint-heats'));
  assert.ok(actions.some((a) => a.type === 'open_map'));
});

test('deriveNavigationActions includes broadcast composer for organizers asking to announce', () => {
  const actions = deriveNavigationActions(
    'How can I broadcast an alert notice?',
    INITIAL_CAMPUS_ACTIVITIES,
    true
  );

  assert.ok(actions.some((a) => a.type === 'open_broadcast'));
});

test('buildCampusSystemInstruction embeds live activities, announcements, and member context', () => {
  const instruction = buildCampusSystemInstruction({
    activities: INITIAL_CAMPUS_ACTIVITIES,
    announcements: INITIAL_ANNOUNCEMENTS,
    member: DEMO_CAMPUS_MEMBERS[0],
    registeredIds: ['evt-sprint-heats'],
  });

  assert.ok(instruction.includes('Maya Lin'));
  assert.ok(instruction.includes('100m Sprint Heats'));
  assert.ok(instruction.includes('Running Track A'));
  assert.ok(instruction.includes('Relay schedule shifted by 15 mins due to rain'));
});
