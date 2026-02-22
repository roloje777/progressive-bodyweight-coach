# Milestone 01 --- Multi-Set Hold Timer

## Deep Technical Breakdown (Advanced Developer Edition)

------------------------------------------------------------------------

# 1. Architectural Context

The Hold Timer is not a UI feature.

It is an **engine component**.

We intentionally separated:

-   Engine Logic (Class)
-   React State Bridge (Hook Layer)
-   Presentation Layer (UI)

This follows clean architecture principles:

-   Business logic is framework-independent
-   UI consumes engine state
-   Engine is reusable and testable

This design prepares us for:

-   Cloud sync
-   Program-driven workouts
-   Analytics layer
-   Monetized program loading
-   Future web compatibility

------------------------------------------------------------------------

# 2. State Machine Design

The HoldTimer internally behaves like a finite state machine.

## States

-   idle
-   running
-   paused
-   finished

Why this matters:

Timers are not just counters. They have lifecycle transitions.

Improper state handling causes:

-   Double intervals
-   Memory leaks
-   Corrupted elapsed time
-   Broken multi-set logic

------------------------------------------------------------------------

## State Transition Logic

Valid transitions:

idle → running\
running → paused\
paused → running\
running → finished\
finished → running (new set)

This is intentional.

Allowing `finished → running` enables multi-set training without
recreating the object.

------------------------------------------------------------------------

# 3. Time Calculation Strategy

We do NOT increment elapsed manually every 100ms.

Instead:

1.  Store startTime (timestamp)
2.  Compute difference from Date.now()

Why?

Because setInterval is NOT precise.

Relying on interval increments introduces drift.

Correct method:

elapsed = (Date.now() - startTime) / 1000

This ensures:

-   Accurate TUT tracking
-   Long-duration stability
-   Resistance to dropped frames

------------------------------------------------------------------------

# 4. Engine Isolation via useRef

``` ts
const timerRef = useRef<HoldTimer>(new HoldTimer())
```

Why not useState?

Because:

-   useState causes re-renders on mutation
-   The engine should not trigger React automatically
-   We want explicit UI updates

useRef gives:

-   Persistent object instance
-   Stable reference
-   No automatic re-render

This is a clean bridge pattern.

------------------------------------------------------------------------

# 5. React Synchronization Layer

React subscribes to engine state indirectly.

We manually sync:

``` ts
useEffect(() => {
  let interval: NodeJS.Timer;

  if (state === "running") {
    interval = setInterval(() => {
      setElapsed(timerRef.current.getElapsed());
    }, 100);
  }

  return () => clearInterval(interval);
}, [state]);
```

Important concepts:

-   React renders from state
-   Engine mutates internally
-   Hook layer polls engine state
-   Cleanup prevents memory leaks

------------------------------------------------------------------------

# 6. Immutable Updates and React Rendering

Critical bug we solved:

FlatList did not re-render for additional sets.

Cause:

React performs shallow comparison on state.

Fix:

``` ts
setSets([...timerRef.current.getSets()])
```

Spreading creates a new array reference.

Lesson:

React re-renders when references change --- not when internal values
mutate.

This is foundational React knowledge.

------------------------------------------------------------------------

# 7. Multi-Set Training Logic

Completed sets are stored in:

``` ts
private sets: HoldTimerResult[]
```

Each entry stores:

-   duration (seconds)
-   future: timestamp
-   future: exerciseId

This enables:

-   Total TUT calculation
-   Per-session volume tracking
-   Historical analytics
-   PR detection

------------------------------------------------------------------------

# 8. Current Set Derivation

UI logic:

``` ts
const currentSetNumber =
  sets.length + (state === "running" || state === "paused" ? 1 : 0);
```

This mimics real gym logic:

Completed sets + Active set

Separation of concerns:

Engine stores completed sets. UI derives current set index.

------------------------------------------------------------------------

# 9. Scalability Considerations

This architecture allows:

Future Enhancements:

-   Add RestTimer class
-   Add TempoTimer class
-   Create BaseTimer abstract class
-   Add audio coaching cues
-   Attach analytics engine
-   Sync sets to backend
-   Load workouts dynamically

Because engine logic is isolated, none of these require UI rewrites.

------------------------------------------------------------------------

# 10. Performance Considerations

We update UI every 100ms.

Why 100ms?

-   10 updates per second feels smooth
-   Reduces render pressure
-   Minimizes battery impact

Updating every 16ms (60fps) is unnecessary for strength training.

------------------------------------------------------------------------

# 11. Testing Strategy (Future)

Because HoldTimer is a class:

We can unit test:

-   State transitions
-   Elapsed time logic
-   Multi-set recording
-   Reset behavior

Without React.

This is professional architecture.

------------------------------------------------------------------------

# 12. Developer Growth Takeaways

From this milestone you implemented:

-   A finite state machine
-   Clean engine/UI separation
-   React ref bridge pattern
-   Immutable state updates
-   Real-time UI synchronization
-   Multi-set hypertrophy tracking logic

This is beyond beginner React.

This is intermediate system design.

------------------------------------------------------------------------

# 13. Default Deep-Dive Standard

From now on, all Deep-Dive documents will include:

-   Architectural intent
-   State modeling
-   Lifecycle analysis
-   Performance considerations
-   Scalability plan
-   Testing strategy
-   Developer lessons

This is now our documentation standard.

------------------------------------------------------------------------

Milestone 01 --- Advanced Deep Dive Complete.
