// Source-level regression guard for the lifecycle boundary.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../app/screens/workoutSummary.tsx'), 'utf8');
const guard = source.indexOf('if (!isDeloadWorkout && !isVerificationWorkout && !normalWorkoutMayAdvance)');
const lifecycle = source.indexOf('const lifecycleResult = await evaluateProgramLifecycle(');
assert(guard > 0 && guard < lifecycle, 'failed normal attempts must return before lifecycle evaluation');
const guardedSection = source.slice(guard, lifecycle);
assert(guardedSection.includes('saveWorkoutProgress('));
assert(guardedSection.includes('completed: false'));
assert(guardedSection.includes('"/screens/incompleteWorkoutCoach"'));
assert(guardedSection.includes('"./painCoach"'));
assert(guardedSection.includes('return;'));
console.log('Phase 3N lifecycle source guard: PASS');
