import { AudioPlayer, createAudioPlayer } from "expo-audio";
import { AppState } from "react-native";
import type { SupportedLanguage } from "../i18n";

type Player = AudioPlayer;

type SoundKey =
  | "tick"
  | "ready"
  | "go"
  | "stop"
  | "nextSet"
  | "nextExercise"
  | "nextSide"
  | "beep"
  | "concentric"
  | "eccentric"
  | "readySetGo"
  | "halfWay"
  | "rest"
  | "restBefore"
  | "start"
  | "complete"
  | "targetReached";

class SoundManager {
  private static instance: SoundManager;

  private enabled = true;
  private soundsLoaded = false;

  private players: Partial<Record<SoundKey, Player>> = {};

  private playQueue: Promise<void> = Promise.resolve(); // a queue

  private language: SupportedLanguage = "en";
  private languageChange: Promise<void> = Promise.resolve();
  private loading: Promise<void> | null = null;
  private generation = 0;
  private foregroundRefresh: Promise<void> = Promise.resolve();
  // Measured from the bundled audio assets. Used only when the native player
  // has not yet reported a reliable duration (common just after app resume).
  private readonly clipSeconds: Record<"en" | "pt-PT", Record<SoundKey, number>> = {
    en: {
      tick: 1.11, ready: 0.49, go: 0.96, stop: 0.98,
      nextSet: 1.27, nextExercise: 1.82, nextSide: 1.03,
      beep: 1.46, concentric: 1.46, eccentric: 0.82,
      readySetGo: 7.10, halfWay: 1.70, rest: 0.60,
      restBefore: 1.10, start: 0.65, complete: 1.08,
      targetReached: 1.08,
    },
    "pt-PT": {
      tick: 1.11, ready: 0.49, go: 0.82, stop: 0.70,
      nextSet: 1.39, nextExercise: 1.70, nextSide: 1.22,
      beep: 1.46, concentric: 1.46, eccentric: 0.82,
      readySetGo: 8.16, halfWay: 2.62, rest: 1.20,
      restBefore: 1.92, start: 1.01, complete: 1.56,
      targetReached: 1.87,
    },
  };


  // Non-verbal cues are shared by every language pack. Spoken assets use
  // explicit static maps because Metro/Expo requires bundled assets to be
  // statically require()-able.
  private readonly commonSources: Partial<Record<SoundKey, any>> = {
    tick: require("../assets/sounds/tick.wav"),
    beep: require("../assets/sounds/beep.mp3"),
    concentric: require("../assets/sounds/beep-up.mp3"),
    eccentric: require("../assets/sounds/beep-down.mp3"),
    ready: require("../assets/sounds/get-ready.wav"),
  };

  private readonly englishSpokenSources: Partial<Record<SoundKey, any>> = {
    go: require("../assets/sounds/go.mp3"),
    stop: require("../assets/sounds/stop.mp3"),
    nextSet: require("../assets/sounds/next-set.mp3"),
    nextExercise: require("../assets/sounds/next-exercise.mp3"),
    nextSide: require("../assets/sounds/next-side.mp3"),
    readySetGo: require("../assets/sounds/ready-set-go.mp3"),
    halfWay: require("../assets/sounds/half-way-keep-going.mp3"),
    rest: require("../assets/sounds/rest.mp3"),
    restBefore: require("../assets/sounds/rest-before.mp3"),
    start: require("../assets/sounds/start.mp3"),
    complete: require("../assets/sounds/workout-complete.mp3"),
    targetReached: require("../assets/sounds/target-reached.mp3"),
  };

  // European Portuguese spoken coaching pack. `ready` is intentionally not
  // duplicated here because get-ready.wav is a language-neutral cue.
  private readonly portugueseSpokenSources: Partial<Record<SoundKey, any>> = {
    go: require("../assets/sounds/pt-PT/go.mp3"),
    stop: require("../assets/sounds/pt-PT/stop.mp3"),
    nextSet: require("../assets/sounds/pt-PT/next-set.mp3"),
    nextExercise: require("../assets/sounds/pt-PT/next-exercise.mp3"),
    nextSide: require("../assets/sounds/pt-PT/next-side.mp3"),
    readySetGo: require("../assets/sounds/pt-PT/ready-set-go.mp3"),
    halfWay: require("../assets/sounds/pt-PT/half-way-keep-going.mp3"),
    rest: require("../assets/sounds/pt-PT/rest.mp3"),
    restBefore: require("../assets/sounds/pt-PT/rest-before.mp3"),
    start: require("../assets/sounds/pt-PT/start.mp3"),
    complete: require("../assets/sounds/pt-PT/workout-complete.mp3"),
    targetReached: require("../assets/sounds/pt-PT/target-reached.mp3"),
  };

  private getSources(language = this.language): Record<SoundKey, any> {
    const spoken = language === "pt-PT"
      ? this.portugueseSpokenSources
      : this.englishSpokenSources;

    return { ...this.commonSources, ...spoken } as Record<SoundKey, any>;
  }

  private constructor() {
    // Native audio players can become stale after Android backgrounds the app.
    // Recreate them on foreground, without modifying the workout's timer state.
    AppState.addEventListener("change", (state) => {
      if (state !== "active" || !this.soundsLoaded) return;
      this.foregroundRefresh = this.foregroundRefresh.then(async () => {
        await this.unload();
        await this.loadSounds();
      }).catch((error) => console.warn("SoundManager: foreground refresh failed", error));
    });
  }

  static getInstance() {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }

    return SoundManager.instance;
  }

  private enqueue(task: () => Promise<void>): Promise<void> {
    const next = this.playQueue.then(task);

    // Prevent the queue from getting stuck if one task throws
    this.playQueue = next.catch(() => {});

    return next;
  }

  //player helper

  private getPlayer(key: SoundKey): Player {
    const player = this.players[key];

    if (!player) {
      throw new Error(`Missing player: ${key}`);
    }

    return player;
  }

  async loadSounds() {
    if (this.soundsLoaded) return;
    if (this.loading) return this.loading;
    this.loading = (async () => {
      const next: Partial<Record<SoundKey, Player>> = {};
      try {
        for (const [key, source] of Object.entries(this.getSources()) as [SoundKey, any][]) {
          const player = createAudioPlayer(source);
          player.volume = 1;
          next[key] = player;
        }
        this.players = next;
        this.soundsLoaded = true;
      } catch (error) {
        Object.values(next).forEach(player => { try { player?.release(); } catch {} });
        console.warn("SoundManager: load error", error);
      }
    })();
    try { await this.loading; } finally { this.loading = null; }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  getLanguage(): SupportedLanguage {
    return this.language;
  }

  async setLanguage(language: SupportedLanguage): Promise<void> {
    const change = async () => {
      if (language === this.language) return;

      const wasLoaded = this.soundsLoaded;
      if (wasLoaded) {
        await this.unload();
      }

      this.language = language;

      if (wasLoaded) {
        await this.loadSounds();
      }
    };

    const next = this.languageChange.then(change);
    this.languageChange = next.catch(() => {});
    return next;
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Play immediately (non-blocking)
   */
  private async play(key: SoundKey) {
    if (!this.enabled) return;

    if (!this.soundsLoaded) {
      throw new Error("SoundManager.loadSounds() has not been called.");
    }

    const player = this.getPlayer(key);

    //     player.addListener("playbackStatusUpdate", (status) => {
    //     console.log(
    //         "STATUS",
    //         key,
    //         status.playbackState,
    //         status.playing,
    //         status.currentTime.toFixed(2),
    //         status.didJustFinish
    //     );
    // });

    try {
      // player.pause();
      player.seekTo(0);
      player.play();
    } catch (err) {
      console.log(`❌ play(${key})`, err);
    }
  }

  /**
   * Play and wait until playback completes.
   */
  //  private async playAndWait(key: SoundKey): Promise<void> {
  //     if (!this.enabled) return;

  //     if (!this.soundsLoaded) {
  //         throw new Error(
  //             "SoundManager.loadSounds() has not been called."
  //         );
  //     }

  //     const player = this.getPlayer(key);

  //   try {
  //     // player.pause();
  //     player.seekTo(0);
  //     player.play();

  //     const startTimeout = Date.now();

  //     while (!player.playing) {

  //         if (Date.now() - startTimeout > 1000) {
  //             throw new Error(`Playback never started: ${key}`);
  //         }

  //         await this.sleep(10);
  //     }

  //         const started = Date.now();

  //         while (player.playing) {

  //             if (Date.now() - started > 15000) {
  //                 console.warn(`Timeout waiting for ${key}`);
  //                 break;
  //             }

  //             await this.sleep(20);
  //         }

  //     } catch (err) {
  //         console.log(`❌ playAndWait(${key})`, err);
  //     }
  // }

  // private async playAndWait(key: SoundKey): Promise<void> {
  //   const player = this.getPlayer(key);

  //   console.log(`▶ START ${key}`);

  //   player.seekTo(0);
  //   player.play();

  //   let loops = 0;

  //   while (player.playing) {
  //     loops++;

  //     console.log(
  //       `${key}: playing=${player.playing} current=${player.currentTime}`
  //     );

  //     await this.sleep(50);
  //   }

  //   console.log(`■ END ${key} (${loops} loops)`);
  // }

  // private async playAndWait(key: SoundKey): Promise<void> {
  //   const player = this.getPlayer(key);

  //   // console.log("==========");
  //   // console.log(key);
  //   // console.log(Object.keys(player));
  //   // console.log(player);

  //   // player.seekTo(0);
  //   // console.log(player.currentTime);
  //   // player.play();

  //   // await this.sleep(300);
  //   //  console.log(player.currentTime);
  //   player.seekTo(0);

  //   console.log("Before play");
  //   console.log(player.currentStatus);

  //   player.play();

  //   await this.sleep(50);

  //   console.log("50ms");
  //   console.log(player.currentStatus);

  //   await this.sleep(100);

  //   console.log("150ms");
  //   console.log(player.currentStatus);

  //   await this.sleep(200);

  //   console.log("350ms");
  //   console.log(player.currentStatus);
  // }

  // private playAndWait(key: SoundKey): Promise<void> {
  //   if (!this.enabled) {
  //     return Promise.resolve();
  //   }

  //   if (!this.soundsLoaded) {
  //     return Promise.reject(
  //       new Error("SoundManager.loadSounds() has not been called."),
  //     );
  //   }

  //   const player = this.getPlayer(key);

  //   return new Promise((resolve, reject) => {
  //     let finished = false;

  //     const subscription = player.addListener(
  //       "playbackStatusUpdate",
  //       (status) => {
  //         if (status.didJustFinish && !finished) {
  //           finished = true;
  //           subscription.remove();
  //           resolve();
  //         }
  //       },
  //     );

  //     try {
  //       player.seekTo(0);
  //       player.play();
  //     } catch (err) {
  //       subscription.remove();
  //       reject(err);
  //       return;
  //     }

  //     setTimeout(() => {
  //       if (!finished) {
  //         subscription.remove();
  //         // reject(new Error(`Timeout waiting for ${key}`));

  //         console.warn(`Timeout waiting for ${key}`);

  //         resolve(); // NOT reject()
  //       }
  //     }, 15000);
  //   });
  // }
  // Playback completion events are not guaranteed after Expo Go resume.
  // Bound the wait by measured asset duration when native duration is unavailable.
  private async playInternal(key: SoundKey, wait: boolean): Promise<void> {
    if (!this.enabled) return;
    await this.foregroundRefresh;
    if (!this.soundsLoaded) await this.loadSounds();
    const player = this.players[key];
    if (!player || !this.enabled) return;
    const generation = this.generation;

    if (!wait) {
      try { void player.seekTo(0); player.play(); }
      catch (error) { console.warn(`SoundManager: failed to play "${key}"`, error); }
      return;
    }

    await new Promise<void>((resolve) => {
      let settled = false;
      let subscription: { remove: () => void } | undefined;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let poll: ReturnType<typeof setInterval> | undefined;
      const finish = () => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        if (poll) clearInterval(poll);
        try { subscription?.remove(); } catch {}
        resolve();
      };
      try {
        subscription = player.addListener("playbackStatusUpdate", (status) => {
          if (status.didJustFinish) finish();
        });
        // Fall back to a short, duration-aware wait if the native finish event
        // never arrives. A missing event must not stall workout timing.
        const reportedDuration = Number(player.duration);
        const measuredDuration = this.clipSeconds[this.language === "pt-PT" ? "pt-PT" : "en"][key];
        // Some Expo audio players initially report 0, or a partial duration.
        // Never shorten the fallback below the known bundled clip length.
        const durationSeconds = Number.isFinite(reportedDuration) && reportedDuration > 0
          ? Math.max(reportedDuration, measuredDuration)
          : measuredDuration;
        const timeoutMs = Math.min(12000, Math.max(900, Math.ceil(durationSeconds * 1000 + 750)));
        timer = setTimeout(finish, timeoutMs);
        poll = setInterval(() => {
          if (generation !== this.generation || !this.enabled) finish();
        }, 100);
        void player.seekTo(0);
        player.play();
      } catch (error) {
        console.warn(`SoundManager: failed to play "${key}"`, error);
        finish();
      }
    });
  }
  // Unload
  async unload() {
    this.generation += 1;
    for (const key of Object.keys(this.players) as SoundKey[]) {
      try {
        this.players[key]?.release();
      } catch {}
    }

    this.players = {};
    this.soundsLoaded = false;
    this.playQueue = Promise.resolve();

  }

  async playTick(wait = false) {
    return this.playSound("tick", wait);
  }

  async playGetReady(wait = false) {
    return this.playSound("ready", wait);
  }

  async playGo(wait = false) {
    return this.playSound("go", wait);
  }

  async playStart(wait = false) {
    return this.playSound("start", wait);
  }

  async playStop(wait = false) {
    return this.playSound("stop", wait);
  }

  async playWorkoutComplete(wait = false) {
    return this.playSound("complete", wait);
  }

   async playTargetReached(wait = false) {
    return this.playSound("targetReached", wait);
  }

  async playNextSet(wait = false) {
    return this.playSound("nextSet", wait);
  }

  async playNextExercise(wait = false) {
    return this.playSound("nextExercise", wait);
  }

  async playNextSide(wait = false) {
    return this.playSound("nextSide", wait);
  }

  async playCountdownBeep(wait = false) {
    return this.playSound("beep", wait);
  }

  async playHalfWay(wait = false) {
    return this.playSound("halfWay", wait);
  }

  async playRest(wait = false) {
    return this.playSound("rest", wait);
  }

  async playRestBefore(wait = false) {
    return this.playSound("restBefore", wait);
  }

  async playReadySetGoSound(wait = false) {
    return this.playSound("readySetGo", wait);
  }

  // play sound helper method
  // private playSound(key: SoundKey, wait = false) {
  //   console.log(`playSound(${key},${wait})`);
  //   return wait ? this.enqueue(() => this.playAndWait(key)) : this.play(key);
  // }

  // play sound helper method
  private playSound(key: SoundKey, wait = false) {
    // console.log(`playSound(${key}, ${wait})`);

    if (wait) {
      return this.enqueue(() => this.playInternal(key, true));
    }

    return this.playInternal(key, false);
  }

  async playPhaseSound(
    phase: "eccentric" | "concentric" | "pauseEccentric" | "pauseConcentric",
    wait = false,
  ) {
    switch (phase) {
      case "eccentric":
        return this.playSound("eccentric", wait);

      case "concentric":
        return this.playSound("concentric", wait);

      default:
        return this.playSound("tick", wait);
    }
  }

  async playRestBeforeX(type: "rest-set" | "rest-exercise") {
    await this.playRestBefore(true);

    if (type === "rest-set") {
      await this.playNextSet(true);
    } else {
      await this.playNextExercise(true);
    }
  }

  async playBeforeNextX(type: "rest-set" | "rest-exercise") {
    await this.playStart(true);

    if (type === "rest-set") {
      await this.playNextSet(true);
    } else {
      await this.playNextExercise(true);
    }
  }

  // play and wait
  // private playQueued(key: SoundKey) {
  //   return this.enqueue(() => this.playAndWait(key));
  // }
  // // play immediately
  // private playImmediate(key: SoundKey) {
  //   return this.play(key);
  // }
}

export const soundManager = SoundManager.getInstance();
