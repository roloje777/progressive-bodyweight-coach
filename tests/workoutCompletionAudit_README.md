# PBH behavioural baseline — October 10

Run from project root:

```bash
node --test tests/completionLifecycleBaseline.test.cjs tests/workoutCompletionBehavior.test.cjs
```

These tests **execute** the real production `calculateWorkoutProgress` and `recordAbortedWorkout` functions, transpiled in memory with TypeScript. The abort storage dependency is replaced with an in-memory write recorder; no real user data is touched. They are not React/Expo integration tests.

## Confirmed baseline behaviours

- Set progress percentages for 0/12, 8/12, 10/12, 11/12, 12/12.
- Abort history records zero work, partial work, and pain reasons.
- Multiple attempts get unique IDs.
- **Known risk documented**: abort helper counts pending/non-skipped sets as completed.
- **Known risk documented**: optional sets can exceed the prescribed denominator; displayed percentage is capped at 100%.

## Not yet behaviourally covered

- React Summary screen calling ProgressContext and actual cursor movement.
- Deload and verification state transitions with AsyncStorage.
- Graduation acceptance and persistence.
- Primary-exercise coverage and skip handling.
- Actual MB evidence writes.

These require isolated adapters around the UI/context orchestration and stateful integration fixtures; source assertions alone do not prove them. Do not enable the 85% rule based on these tests.

## No production changes

Only new files under `tests/` are delivered.
