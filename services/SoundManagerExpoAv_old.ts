// app/services/SoundManagerExpoAv.ts
import { Audio } from "expo-av";

type Sound = Audio.Sound;

class SoundManagerExpoAv {
  private static instance: SoundManagerExpoAv;

  private tickSound: Sound | null = null;
  private readySound: Sound | null = null;
  private goSound: Sound | null = null;
  private stopSound: Sound | null = null;
  private countdownBeep: Sound | null = null;
  private readySetGoSound: Sound | null = null;

  private eccentricSound: Sound | null = null;
  private concentricSound: Sound | null = null;
  private pauseSound: Sound | null = null;

  private nextSetSound: Sound | null = null;
  private nextExerciseSound: Sound | null = null;
  private nextSideSound: Sound | null = null;
  private halfWaySound: Sound | null = null;
  private restSound: Sound | null = null;
  private restBeforeSound: Sound | null = null;
  private startSound: Sound | null = null;
  private workoutCompleteSound: Sound | null = null;

  private soundsLoaded = false;
  private enabled = true;

  

  private constructor() {}

  static getInstance() {
    if (!SoundManagerExpoAv.instance) {
      SoundManagerExpoAv.instance = new SoundManagerExpoAv();
    }
    return SoundManagerExpoAv.instance;
  }

  private async createSound(source: any): Promise<Sound> {
    const { sound } = await Audio.Sound.createAsync(source);
    return sound;
  }

  async loadSounds() {
    if (this.soundsLoaded) return;

    try {
      this.tickSound = await this.createSound(
        require("../assets/sounds/tick.wav"),
      );

      this.readySound = await this.createSound(
        require("../assets/sounds/get-ready.wav"),
      );

      this.goSound = await this.createSound(require("../assets/sounds/go.mp3"));

      this.stopSound = await this.createSound(
        require("../assets/sounds/stop.mp3"),
      );

      this.nextSetSound = await this.createSound(
        require("../assets/sounds/next-set.mp3"),
      );

      this.nextExerciseSound = await this.createSound(
        require("../assets/sounds/next-exercise.mp3"),
      );

      this.nextSideSound = await this.createSound(
        require("../assets/sounds/next-side.mp3"),
      );

      this.countdownBeep = await this.createSound(
        require("../assets/sounds/beep.mp3"),
      );

      this.concentricSound = await this.createSound(
        require("../assets/sounds/beep-up.mp3"),
      );

      this.eccentricSound = await this.createSound(
        require("../assets/sounds/beep-down.mp3"),
      );

      this.readySetGoSound = await this.createSound(
        require("../assets/sounds/ready-set-go.mp3"),
      );

      this.halfWaySound = await this.createSound(
        require("../assets/sounds/half-way-keep-going.mp3"),
      );
      this.restSound = await this.createSound(
        require("../assets/sounds/rest.mp3"),
      );
      this.restBeforeSound = await this.createSound(
        require("../assets/sounds/rest-before.mp3"),
      );

      this.startSound = await this.createSound(
        require("../assets/sounds/start.mp3"),
      );

      this.workoutCompleteSound = await this.createSound(
        require("../assets/sounds/workout-complete.mp3"),
      );

      this.pauseSound = this.tickSound;

      this.soundsLoaded = true;
      console.log("✅ Sounds loaded (expo-av)");
    } catch (err) {
      console.warn("SoundManagerExpoAv load error", err);
    }
  }

  setEnabled(value: boolean) {
    this.enabled = value;
  }

  private isPlaying = false;

 private async play(sound: Sound | null) {
  if (!this.enabled || !sound || this.isPlaying) return;

  this.isPlaying = true;

  try {
    const status = await sound.getStatusAsync();

    // ✅ FIX #4 — HANDLE UNLOADED SOUND HERE
    if (!status.isLoaded) {
      console.log("🔄 Sound was unloaded, skipping play");
      return;
    }

    await sound.replayAsync();
  } catch (err) {
    console.log("❌ play error", err);
  } finally {
    this.isPlaying = false;
  }
}

  private async playAndWait(sound: Sound | null): Promise<void> {
    // return; //temp
    if (!this.enabled || !sound) return;

    try {
      return await new Promise<void>(async (resolve, reject) => {
        try {
          // await sound.setPositionAsync(0);

          sound.setOnPlaybackStatusUpdate((status) => {
            if (!status.isLoaded) return;

            if (status.didJustFinish) {
              sound.setOnPlaybackStatusUpdate(null); // cleanup
              resolve();
            }
          });

          await sound.replayAsync();
        } catch (err) {
          console.log("❌ playAndWait inner error:", err);
          reject(err);
        }
      });
    } catch (err) {
      console.log("❌ playAndWait error:", err);
    }
  }

  async playRest(wait: boolean = false) {
    if (wait) await this.playAndWait(this.restSound);
    else await this.play(this.restSound);
  }

  async playRestBefore(wait: boolean = false) {
    if (wait) await this.playAndWait(this.restBeforeSound);
    else await this.play(this.restBeforeSound);
  }

  async playTick(wait: boolean = false) {
    if (wait) await this.playAndWait(this.tickSound);
    else await this.play(this.tickSound);
  }

  async playGetReady(wait: boolean = false) {
    if (wait) await this.playAndWait(this.readySound);
    else await this.play(this.readySound);
  }

  async playGo(wait: boolean = false) {
    if (wait) await this.playAndWait(this.goSound);
    else await this.play(this.goSound);
  }

  async playStart(wait: boolean = false) {
    if (wait) await this.playAndWait(this.startSound);
    else await this.play(this.startSound);
  }
  async playStop(wait: boolean = false) {
    if (wait) await this.playAndWait(this.stopSound);
    else await this.play(this.stopSound);
  }

  async playWorkoutComplete(wait: boolean = false) {
    if (wait) await this.playAndWait(this.workoutCompleteSound);
    else await this.play(this.workoutCompleteSound);
  }

  async playNextSet(wait: boolean = false) {
    if (wait) await this.playAndWait(this.nextSetSound);
    else await this.play(this.nextSetSound);
  }

  async playNextExercise(wait: boolean = false) {
    if (wait) await this.playAndWait(this.nextExerciseSound);
    else await this.play(this.nextExerciseSound);
  }

  async playNextSide(wait: boolean = false) {
    if (wait) await this.playAndWait(this.nextSideSound);
    else await this.play(this.nextSideSound);
  }

  async playCountdownBeep(wait: boolean = false) {
    if (wait) await this.playAndWait(this.countdownBeep);
    else await this.play(this.countdownBeep);
  }

  async playHalfWay(wait: boolean = false) {
    if (wait) await this.playAndWait(this.halfWaySound);
    else await this.play(this.halfWaySound);
  }

  async playReadySetGoSound(wait: boolean = false) {
    if (wait) {
      await this.playAndWait(this.readySetGoSound);
    } else {
      await this.play(this.readySetGoSound);
    }
  }

  async playPhaseSound(
    phase: "eccentric" | "concentric" | "pauseEccentric" | "pauseConcentric",
  ) {
    switch (phase) {
      case "eccentric":
        await this.play(this.eccentricSound);
        break;
      case "concentric":
        await this.play(this.concentricSound);
        break;
      default:
        await this.play(this.pauseSound);
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

  async unload() {
    try {
      await this.tickSound?.unloadAsync();
      await this.readySound?.unloadAsync();
      await this.goSound?.unloadAsync();
      await this.stopSound?.unloadAsync();
      await this.concentricSound?.unloadAsync();
      await this.eccentricSound?.unloadAsync();
      await this.countdownBeep?.unloadAsync();
      await this.readySetGoSound?.unloadAsync();
      await this.nextSetSound?.unloadAsync();
      await this.nextExerciseSound?.unloadAsync();
      await this.nextSideSound?.unloadAsync();
      await this.halfWaySound?.unloadAsync();
      await this.restSound?.unloadAsync();
      await this.startSound?.unloadAsync();

      this.soundsLoaded = false;
      console.log("🧹 Sounds unloaded (expo-av)");
    } catch (err) {
      console.warn("Unload error", err);
    }
  }
}

export const soundManager = SoundManagerExpoAv.getInstance();
