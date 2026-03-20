// app/services/SoundManager.ts
import { Audio } from "expo-av";

class SoundManager {
  private static instance: SoundManager;

  private tickSound: Audio.Sound | null = null;
  private readySound: Audio.Sound | null = null;
  private goSound: Audio.Sound | null = null;
  private countdownBeep: Audio.Sound | null = null;
  private readySetGoSound: Audio.Sound | null = null;

  // New sounds for tempo phases
  private eccentricSound: Audio.Sound | null = null;
  private concentricSound: Audio.Sound | null = null;
  private pauseSound: Audio.Sound | null = null;

  private nextSetSound: Audio.Sound | null = null;
  private nextExerciseSound: Audio.Sound | null = null;

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

    
      // 🔥 REQUIRED for sound to work properly
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: 1,
        shouldDuckAndroid: true,
        interruptionModeAndroid: 1,
        playThroughEarpieceAndroid: false,
      });      
      const tick = await Audio.Sound.createAsync(
        require("../assets/sounds/tick.wav"),
      );
      const ready = await Audio.Sound.createAsync(
        require("../assets/sounds/get-ready.wav"),
      );
      const go = await Audio.Sound.createAsync(
        require("../assets/sounds/go.mp3"),
      );
      const nextSet = await Audio.Sound.createAsync(
        require("../assets/sounds/next-set.mp3"),
      );
      const nextExercise = await Audio.Sound.createAsync(
        require("../assets/sounds/next-exercise.mp3"),
      );
      const beep = await Audio.Sound.createAsync(
        require("../assets/sounds/beep.mp3"),
      );
      const beepUp = await Audio.Sound.createAsync(
        require("../assets/sounds/beep-up.mp3"),
      );
      const beepDown = await Audio.Sound.createAsync(
        require("../assets/sounds/beep-down.mp3"),
      );

      const readySetGo = await Audio.Sound.createAsync(
        require("../assets/sounds/ready-set-go.mp3"),
      );

      this.tickSound = tick.sound;
      this.readySound = ready.sound;
      this.goSound = go.sound;
      this.countdownBeep = beep.sound;
      this.readySetGoSound = readySetGo.sound;

      this.eccentricSound = beepDown.sound; // eccentric = down
      this.concentricSound = beepUp.sound; // concentric = up
      this.pauseSound = tick.sound; // use tick for pauses

      this.nextSetSound = nextSet.sound;
      this.nextExerciseSound = nextExercise.sound;

      this.soundsLoaded = true;
        console.log("✅ Sounds loaded");
    } catch (err) {
      console.warn("SoundManager load error", err);
    }
  }

  setEnabled(value: boolean) {
    this.enabled = value;
  }

  private async play(sound: Audio.Sound | null, waitForFinish = false) {
    console.log("🔊 play() called", {
      hasSound: sound !== null,
      enabled: this.enabled,
      loaded: this.soundsLoaded,
    });

    if (!this.enabled || !sound) {
      console.log("⛔ Sound blocked");
      return;
    }

    try {
      console.log("▶️ Replaying sound...");
      await sound.replayAsync();

      if (waitForFinish) {
        return new Promise<void>((resolve) => {
          sound.setOnPlaybackStatusUpdate((status) => {
            if (!status.isLoaded) return;

            if (status.didJustFinish) {
              console.log("✅ Sound finished");
              sound.setOnPlaybackStatusUpdate(null);
              resolve();
            }
          });
        });
      }
    } catch (err) {
      console.log("❌ Sound play error", err);
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

  // New method for tempo phases
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
      case "pauseEccentric":
      case "pauseConcentric":
        await this.play(this.pauseSound);
        break;
    }
  }

  async playReadySetGoSound() {
    await this.play(this.readySetGoSound, true);
  }

  async playNextSet() {
    await this.play(this.nextSetSound);
  }

  async playNextExercise() {
    await this.play(this.nextExerciseSound);
  }

  async unload() {
    await this.tickSound?.unloadAsync();
    await this.readySound?.unloadAsync();
    await this.goSound?.unloadAsync();
    await this.eccentricSound?.unloadAsync();
    await this.concentricSound?.unloadAsync();
    await this.pauseSound?.unloadAsync();
    await this.countdownBeep?.unloadAsync();
    await this.readySetGoSound?.unloadAsync();
    await this.nextSetSound?.unloadAsync();
    await this.nextExerciseSound?.unloadAsync();

    this.soundsLoaded = false;
  }

  async playDoubleTick() {
    await this.playTick();
    setTimeout(() => {
      this.playTick();
    }, 120);
  }
  async playCountdownBeep() {
    await this.play(this.countdownBeep);
  }
}

export const soundManager = SoundManager.getInstance();
