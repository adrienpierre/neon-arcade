/* =========================================================
   NEON ARCADE - SYNTHESIZER & AUDIO ENGINE V2 (Web Audio API)
   Procedural 8-bit / Synthwave SFX, Synth Jukebox & Announcer
   ========================================================= */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.musicEnabled = false;
    this.musicPlaying = false;
    this.musicTimer = null;
    this.currentTrack = 0;
    this.currentStep = 0;
    this.bpm = 128;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.initialized = false;
    this.speechEnabled = true;

    // Track presets
    this.tracks = [
      { name: 'Cyber Horizon', bpm: 126, bass: [110, 110, 110, 110, 87.31, 87.31, 98, 98], arps: [440, 554.37, 659.25, 880, 659.25, 554.37] },
      { name: 'Neon Outrun', bpm: 138, bass: [130.81, 130.81, 146.83, 146.83, 116.54, 116.54, 130.81, 130.81], arps: [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25] },
      { name: 'Midnight Drift', bpm: 118, bass: [73.42, 73.42, 82.41, 82.41, 65.41, 65.41, 73.42, 73.42], arps: [293.66, 369.99, 440, 587.33, 440, 369.99] }
    ];
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Channels
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.initialized = true;
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  // --- Voice / Robotic Announcer ---
  announce(phrase) {
    if (this.isMuted || !this.speechEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.lang = 'fr-FR';
      utterance.pitch = 0.82; // Cyber robotic deep pitch
      utterance.rate = 1.18;
      utterance.volume = 0.95;

      const voices = window.speechSynthesis.getVoices();
      const frVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('fr'));
      if (frVoice) utterance.voice = frVoice;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // ignore
    }
  }

  // --- Sound Effects ---

  playClick() {
    if (this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.05);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  playCoin() {
    if (this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const notes = [987.77, 1318.51, 1567.98]; // Arp
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.2, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.12);
    });
  }

  playLaser() {
    if (this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playSlash() {
    if (this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.09);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  playTurbo() {
    if (this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.3);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  playKlaxon() {
    if (this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, now + i * 0.25);
      osc.frequency.setValueAtTime(600, now + i * 0.25 + 0.12);

      gain.gain.setValueAtTime(0.3, now + i * 0.25);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.25 + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.25);
      osc.stop(now + i * 0.25 + 0.24);
    }
  }

  playExplosion(heavy = false) {
    if (this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const duration = heavy ? 0.6 : 0.28;

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(heavy ? 500 : 900, now);
    filter.frequency.exponentialRampToValueAtTime(50, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(heavy ? 0.45 : 0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + duration);
  }

  playBounce() {
    if (this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(460, now + 0.06);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  playPowerup() {
    if (this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const chord = [330, 440, 554.37, 659.25, 880];
    chord.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);

      gain.gain.setValueAtTime(0.18, now + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.2);
    });
  }

  playGameOver() {
    if (this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const notes = [440, 415.3, 392, 349.23, 220];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.22, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.25);
    });
  }

  playNote(frequency, duration = 0.3) {
    if (this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, now);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + duration);
  }

  // --- Procedural Synthwave Jukebox ---
  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  nextTrack() {
    this.currentTrack = (this.currentTrack + 1) % this.tracks.length;
    if (this.musicPlaying) {
      this.stopMusic();
      this.startMusic();
    }
    return this.tracks[this.currentTrack].name;
  }

  startMusic() {
    this.resume();
    if (this.musicPlaying) return;
    this.musicPlaying = true;
    this.currentStep = 0;

    const track = this.tracks[this.currentTrack];
    const stepInterval = (60 / track.bpm) / 4 * 1000;

    this.musicTimer = setInterval(() => {
      if (!this.musicPlaying || this.isMuted) return;
      const now = this.ctx.currentTime;

      // Bass note on quarter beats
      if (this.currentStep % 4 === 0) {
        const bassIdx = Math.floor(this.currentStep / 4) % track.bass.length;
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = 'sawtooth';
        bOsc.frequency.setValueAtTime(track.bass[bassIdx], now);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(260, now);

        bGain.gain.setValueAtTime(0.26, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        bOsc.connect(filter);
        filter.connect(bGain);
        bGain.connect(this.musicGain);

        bOsc.start(now);
        bOsc.stop(now + 0.22);
      }

      // Arpeggio on every 16th note
      const arpFreq = track.arps[this.currentStep % track.arps.length];
      const aOsc = this.ctx.createOscillator();
      const aGain = this.ctx.createGain();
      aOsc.type = 'sine';
      aOsc.frequency.setValueAtTime(arpFreq, now);

      aGain.gain.setValueAtTime(0.065, now);
      aGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      aOsc.connect(aGain);
      aGain.connect(this.musicGain);
      aOsc.start(now);
      aOsc.stop(now + 0.09);

      this.currentStep = (this.currentStep + 1) % 32;
    }, stepInterval);
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

// Global instance
window.soundEngine = new SoundEngine();
