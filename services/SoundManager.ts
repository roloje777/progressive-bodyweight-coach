import { AudioPlayer, createAudioPlayer } from "expo-audio";

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
  | "complete";

class SoundManager {
  private static instance: SoundManager;

  private enabled = true;
  private soundsLoaded = false;

  private players: Partial<Record<SoundKey, Player>> = {};

  private playQueue: Promise<void> = Promise.resolve(); // a queue

  private readonly sources: Record<SoundKey, any> = {
    tick: require("../assets/sounds/tick.wav"),
    ready: require("../assets/sounds/get-ready.wav"),
    go: require("../assets/sounds/go.mp3"),
    stop: require("../assets/sounds/stop.mp3"),
    nextSet: require("../assets/sounds/next-set.mp3"),
    nextExercise: require("../assets/sounds/next-exercise.mp3"),
    nextSide: require("../assets/sounds/next-side.mp3"),
    beep: require("../assets/sounds/beep.mp3"),
    concentric: require("../assets/sounds/beep-up.mp3"),
    eccentric: require("../assets/sounds/beep-down.mp3"),
    readySetGo: require("../assets/sounds/ready-set-go.mp3"),
    halfWay: require("../assets/sounds/half-way-keep-going.mp3"),
    rest: require("../assets/sounds/rest.mp3"),
    restBefore: require("../assets/sounds/rest-before.mp3"),
    start: require("../assets/sounds/start.mp3"),
    complete: require("../assets/sounds/workout-complete.mp3"),
  };

  private constructor() {}

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
    if (this.soundsLoaded) {
      return;
    }

    this.players = {};

    try {
      for (const key of Object.keys(this.sources) as SoundKey[]) {
        const player = createAudioPlayer(this.sources[key]);
        player.volume = 1;
        this.players[key] = player;
      }

      this.soundsLoaded = true;

      console.log("✅ Sounds loaded (expo-audio)");
    } catch (err) {
      console.warn("❌ SoundManager load error", err);
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
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
  // play and play-and-wait
 private async playInternal(
    key: SoundKey,
    wait: boolean
) {
    const player = this.getPlayer(key);

    player.seekTo(0);
    player.play();

    if (!wait) {
        return;
    }

    await new Promise<void>((resolve) => {

        const subscription =
            player.addListener(
                "playbackStatusUpdate",
                (status) => {

                    if (status.didJustFinish) {
                        subscription.remove();
                        resolve();
                    }
                }
            );
    });
}
  // Unload
  async unload() {
    for (const key of Object.keys(this.players) as SoundKey[]) {
      try {
        this.players[key]?.release();
      } catch {}
    }

    this.players = {};
    this.soundsLoaded = false;
    this.playQueue = Promise.resolve();

    console.log("🧹 Sounds released");
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
    console.log(`playSound(${key}, ${wait})`);

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
