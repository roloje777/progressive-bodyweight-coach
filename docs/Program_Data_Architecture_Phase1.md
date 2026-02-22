# Program Data & App Architecture -- Phase 1 Foundation

## Progressive Bodyweight Coach

------------------------------------------------------------------------

# 1. Purpose of This Document

This document teaches you the architectural foundation you just built
--- and *why* it matters.

By the end of this phase, you have:

-   A stable Expo Router structure
-   A separated data layer (models + program data)
-   A working Hold Timer engine
-   A scalable foundation ready for a Program Engine
-   Architecture aligned for cloud readiness and monetization

This is not just "code working."\
This is system design.

------------------------------------------------------------------------

# 2. Folder Architecture -- Why It Matters

## Final Structure

/project-root\
    /app\
        /(tabs)\
            workout.tsx\
        \_layout.tsx\
    /data\
        beginnerProgram.ts\
    /models\
        Exercise.ts\
        Program.ts\
    /timers\
        useHoldTimer.ts

------------------------------------------------------------------------

## Why models and data must NOT be inside /app

Expo Router treats everything inside `/app` as a route.

If you place models or data inside `/app`, the router expects a React
component with a default export. That is why you saw warnings like:

> Route is missing the required default export.

So the rule is:

**/app = UI only**\
Everything else = logic, data, engines

This separation is fundamental for scalability.

------------------------------------------------------------------------

# 3. The Data Model Layer

## 3.1 Exercise Model

Your Exercise type supports three modes:

-   reps
-   hold
-   tempo

This is critical because different exercises behave differently.

### Hold Example

``` ts
{
  type: "hold",
  config: { durationSeconds: 30 }
}
```

### Tempo Example

``` ts
{
  type: "tempo",
  config: {
    eccentric: 2.5,
    pauseBottom: 0,
    concentric: 2.5,
    pauseTop: 0,
    reps: 20
  }
}
```

This structure allows:

-   Controlled time-under-tension
-   Advanced progression later
-   Tempo editing per level
-   Future AI auto-adjustments

You chose eccentric / pause / concentric / pause structure.

This was the correct architectural choice.

------------------------------------------------------------------------

## 3.2 Program Model

A Program contains:

-   id
-   name
-   description
-   level
-   days\[\]

Each day contains:

-   id
-   title
-   exercises\[\]

This makes programs:

-   Replaceable
-   Upgradeable
-   Monetizable per tier
-   Cloud-storable

You are not hardcoding workouts in UI.

You are defining structured program data.

That is a major architectural step.

------------------------------------------------------------------------

# 4. Beginner Program Encoding Decisions

Important architectural decisions:

### Mid-range rep values

Instead of storing ranges (10--15), you stored a working value (e.g.,
12).

Why? Because apps need concrete numbers to track progression.

Ranges are coaching language.\
Apps require data precision.

------------------------------------------------------------------------

### Rest Days as Empty Arrays

    { id: "day3-rest", exercises: [] }

This is correct.

It allows:

-   Progress tracking
-   Calendar logic
-   Streak calculation
-   Future push notifications

------------------------------------------------------------------------

### Optional Cardio / HIIT

You encoded:

-   Cardio (20 min)
-   HIIT (20 min)

Both in Day 6.

Later, the Program Engine will enforce "choose one."

You did NOT hardcode logic in UI.

That is scalable design.

------------------------------------------------------------------------

# 5. Hold Timer Integration Status

Your current Workout screen:

-   Uses useHoldTimer()
-   Tracks elapsed time
-   Tracks sets
-   Displays state
-   Displays completed sets

But currently:

-   It is NOT connected to Program data
-   It does NOT auto-load hold duration from program

This is correct for Phase 1.

We separate:

Timer Engine\
Program Data\
Program Engine (coming next)

------------------------------------------------------------------------

# 6. Why This Architecture Is Monetization-Ready

Because:

Programs are data objects.

This means you can:

-   Lock advanced programs behind subscription
-   Download programs from backend
-   Sell specialty programs
-   Push updated programs remotely

If workouts were hardcoded inside screens, none of that would scale.

------------------------------------------------------------------------

# 7. What You Built (Strategic Summary)

You moved from:

"A timer app"

To:

"A structured coaching system foundation."

This is the difference between:

A feature\
and\
A product platform.

------------------------------------------------------------------------

# 8. What Comes Next

Next phase:

ProgramEngine.ts

It will:

-   Load a program
-   Track current day
-   Track current exercise
-   Handle optional selections
-   Connect exercise type to correct timer
-   Track set completion

That is the bridge between:

Data Layer\
and\
User Interface

------------------------------------------------------------------------

# Final Reflection

You just completed a true architecture milestone.

Most beginner developers skip this separation.

You did not.

This is how scalable apps are built.
