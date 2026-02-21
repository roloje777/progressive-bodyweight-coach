// timers/HoldTimer.ts
export type TimerState = "idle" | "running" | "paused" | "finished";

export interface HoldTimerResult {
  duration: number; // seconds
}

export class HoldTimer {
  private startTime: number | null = null;
  private elapsed: number = 0; // seconds
  private state: TimerState = "idle";

  constructor() {}

  start() {
    if (this.state === "idle" || this.state === "paused") {
      this.startTime = Date.now() - this.elapsed * 1000;
      this.state = "running";
    }
  }

  pause() {
    if (this.state === "running" && this.startTime) {
      this.elapsed = (Date.now() - this.startTime) / 1000;
      this.state = "paused";
      this.startTime = null;
    }
  }

  stop(): HoldTimerResult {
    if (this.state === "running" && this.startTime) {
      this.elapsed = (Date.now() - this.startTime) / 1000;
    }
    this.state = "finished";
    this.startTime = null;
    return { duration: this.elapsed };
  }

  reset() {
    this.state = "idle";
    this.elapsed = 0;
    this.startTime = null;
  }

  getElapsed(): number {
    if (this.state === "running" && this.startTime) {
      return (Date.now() - this.startTime) / 1000;
    }
    return this.elapsed;
  }

  getState(): TimerState {
    return this.state;
  }
}