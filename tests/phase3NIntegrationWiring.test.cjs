const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
test('Home checks persisted calendar recovery before opening a workout', () => {
 const source = read('app/(tabs)/index.tsx');
 assert.match(source, /loadCalendarRecovery\(\)/);
 assert.match(source, /recoveryPending\(recovery/);
 assert.ok(source.indexOf('recoveryPending(recovery') < source.indexOf('if (isPainRecovery) {', source.indexOf('onPress={async () => {')));
});
test('General Settings exposes suggested and compulsory calendar recovery', () => {
 const source = read('app/screens/settingsSection.tsx');
 assert.match(source, /setRecoveryEnforcement\(mode\)/);
 assert.match(source, /"suggested", "compulsory"/);
});
test('Live Position includes seeded locked and expired retry scenarios', () => {
 const source = read('utils/testing/LiveProgramPositionScenarioSeeder.ts');
 assert.match(source, /case "mb-retry-locked":/);
 assert.match(source, /case "mb-retry-unlocked":/);
 assert.match(source, /RET(RY)?_RECOVERY_KEY/);
});
