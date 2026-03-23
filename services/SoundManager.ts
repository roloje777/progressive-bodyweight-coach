// app/services/SoundManager.ts
import { createAudioPlayer } from "expo-audio";

type Player = Awaited<ReturnType<typeof createAudioPlayer>>;


class SoundManager {
  private static instance: SoundManager;

  private tickSound: Player | null = null;
  private readySound: Player | null = null;
  private goSound: Player | null = null;
  private countdownBeep: Player | null = null;
  private readySetGoSound: Player | null = null;

  private eccentricSound: Player | null = null;
  private concentricSound: Player | null = null;
  private pauseSound: Player | null = null;

  private nextSetSound: Player | null = null;
  private nextExerciseSound: Player | null = null;
  private halfWaySound: Player | null = null;

  private soundsLoaded = false;
  private enabled = true;


  

  private constructor() {}

  static getInstance() {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  async loadSounds() {
    if (this.soundsLoaded) return;

    try {
      // ✅ expo-audio uses createAudioPlayer (NOT Audio.*)

      this.tickSound = await createAudioPlayer(
        require("../assets/sounds/tick.wav")
      );

      this.readySound = await createAudioPlayer(
        require("../assets/sounds/get-ready.wav")
      );

      this.goSound = await createAudioPlayer(
        require("../assets/sounds/go.mp3")
      );

      this.nextSetSound = await createAudioPlayer(
        require("../assets/sounds/next-set.mp3")
      );

      this.nextExerciseSound = await createAudioPlayer(
        require("../assets/sounds/next-exercise.mp3")
      );

      this.countdownBeep = await createAudioPlayer(
        require("../assets/sounds/beep.mp3")
      );

      this.concentricSound = await createAudioPlayer(
        require("../assets/sounds/beep-up.mp3")
      );

      this.eccentricSound = await createAudioPlayer(
        require("../assets/sounds/beep-down.mp3")
      );

      this.readySetGoSound = await createAudioPlayer(
        require("../assets/sounds/ready-set-go.mp3")
      );
        this.halfWaySound = await createAudioPlayer(
        require("../assets/sounds/half-way-keep-going.mp3")
      );

      this.pauseSound = this.tickSound;

      this.soundsLoaded = true;
      console.log("✅ Sounds loaded (expo-audio)");
    } catch (err) {
      console.warn("SoundManager load error", err);
    }
  }

  setEnabled(value: boolean) {
    this.enabled = value;
  }

  private async play(player: Player | null) {
    console.log("🔊 play()", {
      hasSound: !!player,
      enabled: this.enabled,
      loaded: this.soundsLoaded,
    });

    if (!this.enabled || !player) {
      console.log("⛔ blocked");
      return;
    }

    try {
      // 🔥 IMPORTANT: expo-audio needs manual reset
      await player.seekTo(0);
      await player.play();
    } catch (err) {
      console.log("❌ play error", err);
    }
  }

  async playTick() {
    await this.play(this.tickSound);
  }

  async playGetReady() {
    await this.play(this.readySound);
  }

  async playGo() {
    await this.play(this.goSound);
  }

  async playNextSet() {
    await this.play(this.nextSetSound);
  }

  async playNextExercise() {
    await this.play(this.nextExerciseSound);
  }

  async playCountdownBeep() {
    await this.play(this.countdownBeep);
  }
  async playHalfWay(){
    await this.play(this.halfWaySound);
  }

private READY_SET_GO_DURATION = 7000; // adjust to your actual audio length

async playReadySetGoSound() {
  if (!this.enabled || !this.readySetGoSound) return;

  try {
    await this.readySetGoSound.seekTo(0);
    await this.readySetGoSound.play();

    // ⏳ block until finished
    await new Promise((resolve) =>
      setTimeout(resolve, this.READY_SET_GO_DURATION)
    );
  } catch (err) {
    console.log("❌ ready-set-go error", err);
  }
}

  async playPhaseSound(
    phase: "eccentric" | "concentric" | "pauseEccentric" | "pauseConcentric"
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

  async unload() {
    // ⚠️ expo-audio uses release(), not unloadAsync()
    await this.tickSound?.release();
    await this.readySound?.release();
    await this.goSound?.release();
    await this.concentricSound?.release();
    await this.eccentricSound?.release();
    await this.countdownBeep?.release();
    await this.readySetGoSound?.release();
    await this.nextSetSound?.release();
    await this.nextExerciseSound?.release();
    await this.halfWaySound?.release();

    this.soundsLoaded = false;
  }
}

export const soundManager = SoundManager.getInstance();