const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const screen = fs.readFileSync(path.join(root, 'app/(tabs)/history.tsx'), 'utf8');
const report = fs.readFileSync(path.join(root, 'utils/workoutHistorySummaryExport.ts'), 'utf8');
test('filters derive from persisted workout lifecycle presentation', () => {
  assert.match(screen, /getWorkoutStatusPresentation\(item,/);
  for (const category of ['normal','aborted','deload','verification','recovery','repeat','maintenance'])
    assert.match(screen, new RegExp(`id: "${category}"`));
});
test('baseline is not inferred without a persisted discriminator', () => {
  assert.match(screen, /Baseline is intentionally not inferred/);
  assert.doesNotMatch(screen, /id: "baseline"/);
});
test('full and selected-category exports share one report builder', () => {
  assert.match(screen, /exportScope === "all" \? "all" : filter/);
  assert.match(report, /exportWorkoutReport\(buildWorkoutHistorySummaryReport/);
  assert.match(report, /category === "all" \|\| workoutHistoryCategory\(s\) === category/);
  assert.match(report, /\.slice\(\)\.sort/);
});
test('HTML escapes dynamic workout names and existing detail navigation remains', () => {
  assert.match(report, /escapeHtml\(l.heading\)/);
  assert.match(report, /escapeHtml\(d\)/);
  assert.match(screen, /pathname: "\/screens\/workoutDetail"/);
});
