"use client";

class SoundEngine {
  constructor() {
    this.sounds = {};
    if (typeof window !== 'undefined') {
      this.sounds.whistle = new Audio('/sounds/whistle.mp3');
      this.sounds.goal = new Audio('/sounds/goal.mp3');
      
      // Seslerin seviyesini ayarla (çok gürültülü olmasın)
      this.sounds.whistle.volume = 0.5;
      this.sounds.goal.volume = 0.7;
      
      // Önceden yükle
      this.sounds.whistle.load();
      this.sounds.goal.load();
    }
  }

  playStartWhistle() {
    if (!this.sounds.whistle) return;
    this.sounds.whistle.currentTime = 0;
    this.sounds.whistle.play().catch(e => console.log('Audio play blocked:', e));
  }

  playHalfTimeWhistle() {
    if (!this.sounds.whistle) return;
    this.sounds.whistle.currentTime = 0;
    this.sounds.whistle.play().catch(e => console.log('Audio play blocked:', e));
  }

  playFullTimeWhistle() {
    if (!this.sounds.whistle) return;
    this.sounds.whistle.currentTime = 0;
    this.sounds.whistle.play().catch(e => console.log('Audio play blocked:', e));
  }

  playGoalSound() {
    if (!this.sounds.goal) return;
    this.sounds.goal.currentTime = 0;
    this.sounds.goal.play().catch(e => console.log('Audio play blocked:', e));
  }
}

// Singleton instance
let engineInstance = null;
export const getAudioEngine = () => {
  if (!engineInstance && typeof window !== 'undefined') {
    engineInstance = new SoundEngine();
  }
  return engineInstance;
};
