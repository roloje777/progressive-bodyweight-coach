// app/services/SoundManager.ts

import { Audio } from "expo-av";

class SoundManager {
  private static instance: SoundManager;

  private tickSound: Audio.Sound | null = null;
  private readySound: Audio.Sound | null = null;
  private goSound: Audio.Sound | null = null;

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
        require("../../assets/sounds/tick.wav")
      );

      const ready = await Audio.Sound.createAsync(
        require("../../assets/sounds/get-ready.wav")
      );

      const go = await Audio.Sound.createAsync(
        require("../../assets/sounds/go.wav")
      );

      this.tickSound = tick.sound;
      this.readySound = ready.sound;
      this.goSound = go.sound;

      this.soundsLoaded = true;
    } catch (err) {
      console.warn("SoundManager load error", err);
    }
  }

  setEnabled(value: boolean) {
    this.enabled = value;
  }

  private async play(sound: Audio.Sound | null) {
    if (!this.enabled || !sound) return;

    try {
      await sound.replayAsync();
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

  async unload() {
    await this.tickSound?.unloadAsync();
    await this.readySound?.unloadAsync();
    await this.goSound?.unloadAsync();

    this.soundsLoaded = false;
  }
}

export const soundManager = SoundManager.getInstance();