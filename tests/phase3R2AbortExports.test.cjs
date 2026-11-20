const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../app/screens/workoutDetail.tsx'), 'utf8');
test('abort evidence is included in text export', () => {
  assert.match(source, /const abortTextLines = abort \?/);
  assert.match(source, /\.\.\.abortTextLines/);
});
test('abort evidence is included in HTML and therefore PDF', () => {
  assert.match(source, /const abortHtml = abort \?/);
  assert.match(source, /\$\{abortHtml\}/);
  assert.match(source, /escapeHtml\(String\(value\)\)/);
});
test('export includes reason, stage, partial sets, duration, timestamp and optional notes', () => {
  for (const field of ['abortReasonText', 'abortStageText', 'abort.completedSets', 'abort.plannedSets', 'abort.durationSeconds', 'abort.recordedAt', 'abort.notes', 'abort.attemptId']) assert.ok(source.includes(field), field);
});
