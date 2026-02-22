# Milestone 01 --- Multi-Set Hold Timer (Strategic Overview)

## Purpose

The Hold Timer is the first component of the Core Training Engine.

Its purpose is to:

-   Measure Time Under Tension (TUT)
-   Support multi-set holds
-   Provide real-time coaching feedback
-   Serve as a reusable engine component for any hold-based exercise

Examples: - Plank - Wall sit - L-sit - Isometric holds

------------------------------------------------------------------------

## Architectural Decision

We separated:

1.  Timer Logic (Class)
2.  React Hook (State Bridge)
3.  UI (Workout Screen)

This separation ensures:

-   Clean testable logic
-   Reusable engine components
-   UI remains declarative
-   Easy migration to cloud architecture later

------------------------------------------------------------------------

## Why Multi-Set Support Matters

Hypertrophy requires:

-   Volume tracking
-   Total TUT tracking
-   Progressive overload

Each completed set stores: - Duration - Timestamp (future enhancement) -
Associated exercise (future enhancement)

------------------------------------------------------------------------

## Scalability

This structure allows us to later add:

-   Rest timers
-   Audio cues
-   Phase-based timers
-   Cloud-based workout tracking

------------------------------------------------------------------------

Milestone 01 Complete.
