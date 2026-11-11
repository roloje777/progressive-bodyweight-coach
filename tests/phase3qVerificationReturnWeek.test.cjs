const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

test('live Verification scenario preserves selected normal return week and day', () => {
  const source = fs.readFileSync(path.join(root, 'utils/testing/LiveProgramPositionScenarioSeeder.ts'), 'utf8');
  const branch = source.split('case "verification":')[1].split('case "repeat-week":')[0];
  assert.match(branch, /returnWeekIndex:\s*position\.weekIndex\s*,/);
  assert.match(branch, /returnDayIndex:\s*position\.dayIndex\s*,/);
  assert.doesNotMatch(branch, /returnWeekIndex:\s*Math\.max\(0,\s*position\.weekIndex\s*-\s*2\)/);
});

test('medical recovery preserves an already saved return week when starting pain deload', () => {
  const source = fs.readFileSync(path.join(root, 'context/ProgressContext.tsx'), 'utf8');
  const branch = source.split('const beginPainRecovery =')[1].split('const advanceVerificationDay')[0];
  assert.match(branch, /activeDeload\.returnWeekIndex\s*!=\s*null/);
  assert.match(branch, /activeDeload\.returnWeekIndex\s*:\s*triggeredAtWeekIndex/);
});
