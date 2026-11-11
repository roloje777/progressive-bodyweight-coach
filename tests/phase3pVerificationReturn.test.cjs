const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

test('Home focus must not reload persisted progress over a freshly restored Verification cursor', () => {
  const source = read('app/(tabs)/index.tsx');
  const focus = source.match(/useFocusEffect\(\s*useCallback\(\(\) => \{([\s\S]*?)\}, \[isLoaded, program\.id, week, day\]\),\s*\);/);
  assert.ok(focus, 'expected Home focus handler with stable progression dependencies');
  assert.doesNotMatch(focus[1], /refreshProgressState\s*\(/);
  assert.match(focus[1], /loadCalendarRecovery\s*\(/);
  assert.match(focus[1], /getActiveMedicalRecovery\s*\(/);
});

test('Developer Tools still explicitly reload seeded progress into the context', () => {
  const source = read('app/screens/tests/LiveProgramPositionTest.tsx');
  assert.match(source, /await\s+refreshProgressState\s*\(/);
});

test('Verification return still restores original cursor and waits for normal-mode navigation', () => {
  const context = read('context/ProgressContext.tsx');
  const home = read('app/(tabs)/index.tsx');
  assert.match(context, /setWeek\(activeDeload\.returnWeekIndex!\)/);
  assert.match(context, /setDay\(activeDeload\.returnDayIndex!\)/);
  assert.match(home, /if \(!earlyNormalWorkout \|\| !isLoaded \|\| activeDeload \|\|/);
  assert.match(home, /week !== earlyNormalWorkout\.week \|\| day !== earlyNormalWorkout\.day/);
});
