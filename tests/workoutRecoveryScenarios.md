# Workout Recovery V1 - Live Test Checklist

## 1. Resume during warm-up
1. Start a normal workout with warm-up enabled.
2. Complete one warm-up exercise.
3. Force-close the app.
4. Reopen the app.
5. Choose Resume Workout.
Expected: completed warm-up item remains completed/read-only in recovery state and workout resumes at the next item. Crash gap is not added to workout duration.

## 2. Resume during main workout
1. Complete Set 1 and Set 2 of an exercise.
2. Force-close the app.
3. Reopen and choose Resume Workout.
Expected: Set 1 and Set 2 remain recorded, current exercise is restored, and the next set is active.

## 3. Crash during set rest
1. Complete a set and enter set rest.
2. Force-close during the countdown.
3. Reopen after the original rest would have expired.
4. Resume.
Expected: the stale rest timer is not resumed; the user returns to the next active set. Offline time is excluded from workout duration.

## 4. Crash during exercise rest
1. Finish an exercise and enter exercise rest.
2. Force-close.
3. Reopen and Resume.
Expected: recovery advances safely to the next exercise instead of restoring a dead rest timer.

## 5. Manual recovery
1. Complete part of a workout, then force-close.
2. Reopen and choose Complete / Edit Remaining.
Expected: previously recorded sets show a lock and cannot be edited. Missing sets accept manual values. Warm-up/stretch items can be marked Done or Skipped without timers.

## 6. Historical guidance / MB warning
1. Use an exercise with recent comparable history around 15 reps and an MB target near that value.
2. In manual recovery enter a materially higher value (for example 25).
Expected: recent comparable values and MB are shown; an advisory warning appears; save is blocked only until the user explicitly confirms the unusual value.

## 7. Progression setting
1. Turn Use recovered data for progression Off.
2. Manually recover missing sets and save the workout.
Expected: the values remain visible in workout history, are tagged as manual recovery, and do not establish future Match-or-Beat/progression evidence.

## 8. Duration integrity - long interruption
1. Train for several minutes.
2. Force-close the app.
3. Leave it closed for at least 10 minutes (or simulate a next-day recovery).
4. Reopen and finish the workout.
Expected: Total Duration contains only trusted active/checkpointed workout time. The closed-app gap is not included.

## 9. Discard
1. Start a workout and force-close.
2. Reopen and choose Discard Workout.
Expected: active recovery state is removed, completed history is unchanged, and the app returns home.

## 10. Recovery settings
Verify defaults are all On:
- Workout Recovery
- Auto-offer interrupted workout recovery
- Show performance guidance
- Warn about unusual recovered results
- Use recovered data for progression

Turn Workout Recovery Off and start/abort a workout.
Expected: no recoverable active workout is retained while the feature is disabled.
