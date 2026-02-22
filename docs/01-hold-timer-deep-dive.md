# Milestone 01 --- Multi-Set Hold Timer (Deep Technical Breakdown)

## Technologies Used

-   React Native (Expo)
-   TypeScript
-   React Hooks
-   useRef
-   useState
-   setInterval
-   FlatList

------------------------------------------------------------------------

# 1. Timer Engine (Class-Based Logic)

We implemented a class:

``` ts
export class HoldTimer {
```

Why a class instead of pure hooks?

-   Encapsulates timer state independently of React
-   Makes logic reusable
-   Easier to test
-   Cleaner architecture

------------------------------------------------------------------------

## Internal Properties

``` ts
private startTime: number | null
private elapsed: number
private state: TimerState
private sets: HoldTimerResult[]
```

------------------------------------------------------------------------

# 2. The React Hook Bridge

``` ts
const timerRef = useRef<HoldTimer>(new HoldTimer())
```

Why useRef?

-   Persists across re-renders
-   Does NOT trigger re-renders when mutated
-   Perfect for storing class instances

------------------------------------------------------------------------

## Real-Time Updates

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

------------------------------------------------------------------------

# 3. Why We Spread the Array

Bug fix:

``` ts
setSets([...timerRef.current.getSets()])
```

React compares references, not deep values.

------------------------------------------------------------------------

# 4. Key Developer Lessons

-   React requires immutable updates
-   useRef is ideal for persistent engine objects
-   Clean separation of concerns scales better
-   Architecture decisions matter early

------------------------------------------------------------------------

Milestone 01 Complete.
