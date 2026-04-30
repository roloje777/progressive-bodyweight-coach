// app/services/SoundManagerExpoAv.ts
import { Audio } from "expo-av";

type Sound = Audio.Sound;
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

class SoundManagerExpoAv {
  private static instance: SoundManagerExpoAv;

  private sounds: Partial<Record<SoundKey, Sound>> = {};
  private soundsLoaded = false;
  private enabled = true;

  private constructor() {}

  static getInstance() {
    if (!SoundManagerExpoAv.instance) {
      SoundManagerExpoAv.instance = new SoundManagerExpoAv();
    }
    return SoundManagerExpoAv.instance;
  }

  // 🔊 Sources (single source of truth)
  private sources: Record<SoundKey, any> = {
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

  // 🔧 Create sound
  private async createSound(source: any): Promise<Sound> {
    const { sound } = await Audio.Sound.createAsync(source);
    return sound;
  }

  // 🔧 Load all sounds
  async loadSounds() {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    if (this.soundsLoaded) return;

    try {
      for (const key of Object.keys(this.sources) as SoundKey[]) {
        this.sounds[key] = await this.createSound(this.sources[key]);
      }

      this.soundsLoaded = true;
      console.log("✅ Sounds loaded (expo-av)");
    } catch (err) {
      console.warn("❌ Sound load error", err);
    }
  }

  setEnabled(value: boolean) {
    this.enabled = value;
  }

  // 🔁 Reload sound if Expo unloaded it
  private async reloadSound(key: SoundKey): Promise<Sound | null> {
    try {
      console.log("🔄 Reloading sound:", key);
      const { sound } = await Audio.Sound.createAsync(this.sources[key]);
      this.sounds[key] = sound;
      return sound;
    } catch (err) {
      console.log("❌ reload failed", err);
      return null;
    }
  }

  // ▶️ Core play (AUTO-RECOVERY BUILT-IN)
  private async play(key: SoundKey) {
    if (!this.enabled) return;

    let sound = this.sounds[key];
    if (!sound) return;

    try {
      const status = await sound.getStatusAsync();

      // ✅ FIX #4 — auto recover if unloaded
      if (!status.isLoaded) {
        const newSound = await this.reloadSound(key);
        if (!newSound) return;
        sound = newSound;
      }

      // 🔥 prevent overlap glitches
      await sound.stopAsync().catch(() => {});
      await sound.replayAsync();
    } catch (err) {
      console.log("❌ play error", err);
    }
  }

  // ⏱️ Play and wait
private async playAndWait(key: SoundKey): Promise<void> {
  if (!this.enabled) return;

  let sound = this.sounds[key];
  if (!sound) return;

  try {
    let status = await sound.getStatusAsync();

    // 🔄 Reload if needed
    if (!status.isLoaded) {
      const newSound = await this.reloadSound(key);
      if (!newSound) return;
      sound = newSound;
      status = await sound.getStatusAsync();
    }

    // 🔥 Reset + play
    await sound.stopAsync().catch(() => {});
    await sound.setPositionAsync(0);
    await sound.playAsync();

    // ⏱️ WAIT LOOP (robust)
    return await new Promise<void>((resolve) => {
      const interval = setInterval(async () => {
        const status = await sound!.getStatusAsync();

        if (!status.isLoaded) {
          clearInterval(interval);
          resolve();
          return;
        }

        if (!status.isPlaying) {
          clearInterval(interval);
          resolve();
        }
      }, 50); // fast polling, smooth UX
    });
  } catch (err) {
    console.log("❌ playAndWait error", err);
  }
}

  // 🔊 PUBLIC API

  async playTick(wait = false) {
    wait ? await this.playAndWait("tick") : await this.play("tick");
  }

  async playGetReady(wait = false) {
    wait ? await this.playAndWait("ready") : await this.play("ready");
  }

  async playGo(wait = false) {
    wait ? await this.playAndWait("go") : await this.play("go");
  }

  async playStart(wait = false) {
    wait ? await this.playAndWait("start") : await this.play("start");
  }

  async playStop(wait = false) {
    wait ? await this.playAndWait("stop") : await this.play("stop");
  }

  async playWorkoutComplete(wait = false) {
    wait ? await this.playAndWait("complete") : await this.play("complete");
  }

  async playNextSet(wait = false) {
    wait ? await this.playAndWait("nextSet") : await this.play("nextSet");
  }

  async playNextExercise(wait = false) {
    wait
      ? await this.playAndWait("nextExercise")
      : await this.play("nextExercise");
  }

  async playNextSide(wait = false) {
    wait ? await this.playAndWait("nextSide") : await this.play("nextSide");
  }

  async playCountdownBeep(wait = false) {
    wait ? await this.playAndWait("beep") : await this.play("beep");
  }

  async playHalfWay(wait = false) {
    wait ? await this.playAndWait("halfWay") : await this.play("halfWay");
  }

  async playRest(wait = false) {
    wait ? await this.playAndWait("rest") : await this.play("rest");
  }

  async playRestBefore(wait = false) {
    wait ? await this.playAndWait("restBefore") : await this.play("restBefore");
  }

  async playReadySetGoSound(wait = false) {
    wait ? await this.playAndWait("readySetGo") : await this.play("readySetGo");
  }

  async playPhaseSound(
    phase: "eccentric" | "concentric" | "pauseEccentric" | "pauseConcentric",
  ) {
    if (phase === "eccentric") return this.play("eccentric");
    if (phase === "concentric") return this.play("concentric");
    return this.play("tick");
  }

  async playRestBeforeX(type: "rest-set" | "rest-exercise") {
    await this.playRestBefore(true);
    type === "rest-set"
      ? await this.playNextSet(true)
      : await this.playNextExercise(true);
  }

  async playBeforeNextX(type: "rest-set" | "rest-exercise") {
    await this.playStart(true);
    type === "rest-set"
      ? await this.playNextSet(true)
      : await this.playNextExercise(true);
  }

  // 🧹 Cleanup
  async unload() {
    try {
      for (const key of Object.keys(this.sounds) as SoundKey[]) {
        await this.sounds[key]?.unloadAsync();
      }

      this.sounds = {};
      this.soundsLoaded = false;

      console.log("🧹 Sounds unloaded");
    } catch (err) {
      console.warn("Unload error", err);
    }
  }
}

export const soundManager = SoundManagerExpoAv.getInstance();
