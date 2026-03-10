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
      const tick = await Audio.Sound.createAsync(
        require("../../assets/sounds/tick.wav"),
      );
      const ready = await Audio.Sound.createAsync(
        require("../../assets/sounds/get-ready.wav"),
      );
      const go = await Audio.Sound.createAsync(
        require("../../assets/sounds/go.mp3"),
      );
      const beep = await Audio.Sound.createAsync(
        require("../../assets/sounds/beep.mp3"),
      );
      const beepUp = await Audio.Sound.createAsync(
        require("../../assets/sounds/beep-up.mp3"),
      );
      const beepDown = await Audio.Sound.createAsync(
        require("../../assets/sounds/beep-down.mp3"),
      );

      const readySetGo = await Audio.Sound.createAsync(
        require("../../assets/sounds/ready-set-go.mp3"),
      );

      this.tickSound = tick.sound;
      this.readySound = ready.sound;
      this.goSound = go.sound;
      this.countdownBeep = beep.sound;
      this.readySetGoSound = readySetGo.sound;

      this.eccentricSound = beepDown.sound; // eccentric = down
      this.concentricSound = beepUp.sound; // concentric = up
      this.pauseSound = tick.sound; // use tick for pauses

      this.soundsLoaded = true;
    } catch (err) {
      console.warn("SoundManager load error", err);
    }
  }

  setEnabled(value: boolean) {
    this.enabled = value;
  }

private async play(sound: Audio.Sound | null, waitForFinish = false) {
  if (!this.enabled || !sound) return;

  try {
    await sound.replayAsync();

    if (waitForFinish) {
      return new Promise<void>((resolve) => {
        const subscription = sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;

          if (status.didJustFinish) {
            sound.setOnPlaybackStatusUpdate(null);
            resolve();
          }
        });
      });
    }
  } catch {}
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

  async unload() {
    await this.tickSound?.unloadAsync();
    await this.readySound?.unloadAsync();
    await this.goSound?.unloadAsync();
    await this.eccentricSound?.unloadAsync();
    await this.concentricSound?.unloadAsync();
    await this.pauseSound?.unloadAsync();
    await this.countdownBeep?.unloadAsync();
    await this.readySetGoSound?.unloadAsync();

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
