// timers/HoldTimer.ts

export type TimerState = "idle" | "running" | "paused" | "finished";

export interface HoldTimerResult {
  duration: number; // seconds
}

export class HoldTimer {
  private startTime: number | null = null;
  private elapsed: number = 0; // seconds for current set
  private state: TimerState = "idle";

  private sets: HoldTimerResult[] = []; // store multiple sets

  constructor() {}
  
start() {
  if (this.state === "idle" || this.state === "paused" || this.state === "finished") {
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

    const result: HoldTimerResult = { duration: this.elapsed };
    this.sets.push(result); // save current set
    this.elapsed = 0; // reset for next set
    return result;
  }

  reset() {
    this.state = "idle";
    this.elapsed = 0;
    this.startTime = null;
    this.sets = [];
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

  getSets(): HoldTimerResult[] {
    return this.sets;
  }

  getSetCount(): number {
    return this.sets.length;
  }
}