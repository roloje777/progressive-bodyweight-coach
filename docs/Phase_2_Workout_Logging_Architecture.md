# Phase 2 -- Workout Logging & Performance Architecture

## Progressive Bodyweight Coach

------------------------------------------------------------------------

# 1. Why Phase 2 Exists

Phase 1 established:

-   Program structure
-   Exercise models
-   Folder architecture
-   Timer engine foundation

Phase 2 introduces something far more important:

Performance Tracking.

Without logging, your app is a timer. With logging, your app becomes a
training system.

------------------------------------------------------------------------

# 2. The Critical Separation

You must permanently separate:

PROGRAM (Prescription) vs PERFORMANCE (What the user actually did)

If you mix these, your system will break when you:

-   Add weights
-   Add RPE
-   Track progression
-   Sync to cloud
-   Calculate volume
-   Estimate 1RM

This separation is non-negotiable.

------------------------------------------------------------------------

# 3. Architectural Layers Now

/models Exercise.ts Program.ts WorkoutLog.ts ← NEW

/data beginnerProgram.ts

/timers useHoldTimer.ts

/app screens/

You now officially have a Domain Model Layer.

------------------------------------------------------------------------

# 4. WorkoutLog Model Design

WorkoutLog must represent real performance data.

Example structure:

``` ts
export type CompletedSet = {
  setNumber: number;
  repsCompleted?: number;
  durationSeconds?: number;
  weightUsed?: number;
  rpe?: number;
};

export type CompletedExercise = {
  exerciseId: string;
  sets: CompletedSet[];
};

export type CompletedWorkout = {
  programId: string;
  dayId: string;
  date: string;
  exercises: CompletedExercise[];
};
```

------------------------------------------------------------------------

# 5. Why This Structure Is Powerful

It supports:

Bodyweight holds\
Tempo training\
Hypertrophy\
Strength training\
Weighted calisthenics\
Future AI adjustments

Without changing your Program model.

That means your foundation is scalable.

------------------------------------------------------------------------

# 6. Why Weight Does NOT Belong in Exercise Model

The Exercise model defines:

What should be done.

The WorkoutLog defines:

What was actually done.

If you store weight in Exercise:

-   You lose per-set variation
-   You break progression logic
-   You mix prescription and performance

That is bad architecture.

------------------------------------------------------------------------

# 7. Future Capabilities This Enables

Because logs are separate, you can later:

-   Calculate total volume
-   Graph weekly progress
-   Suggest progression
-   Estimate 1RM
-   Track PRs
-   Sync to backend
-   Sell advanced analytics features

You are building infrastructure, not features.

------------------------------------------------------------------------

# 8. What We Are NOT Doing Yet

We are NOT:

-   Building a database
-   Adding backend
-   Writing analytics logic
-   Overengineering

We are defining the structure properly.

This is disciplined development.

------------------------------------------------------------------------

# 9. Strategic Milestone

After Phase 2, your app has:

-   Program definitions
-   Exercise modeling
-   Timer engine
-   Performance logging model

That is a real training architecture.

Most fitness apps never reach this structural clarity.

------------------------------------------------------------------------

# 10. What Comes Next

Phase 3:

ProgramEngine

This engine will:

-   Load program
-   Manage current day
-   Move between exercises
-   Connect exercise type to correct timer
-   Create a WorkoutLog session

This is where everything connects.

------------------------------------------------------------------------

# Final Reflection

You are no longer building screens.

You are building a training system.

Phase 2 marks the transition from feature building to system design.
