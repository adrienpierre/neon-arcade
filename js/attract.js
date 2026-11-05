/* =========================================================
   NEON ARCADE - RETRO ARCADE ATTRACT MODE (DEMO ENGINE)
   Authentic 80s/90s Neo-Geo / Sega Arcade Idle Screen
   ========================================================= */

class AttractModeEngine {
  constructor() {
    this.idleTime = 0;
    this.idleThreshold = 25; // seconds before trigger
    this.isActive = false;
    this.timer = null;
    this.attractOverlay = null;

    this.initListeners();
  }

  init() {
    this.attractOverlay = document.getElementById('attract-mode-overlay');
    if (!this.attractOverlay) return;

    this.attractOverlay.addEventListener('click', () => this.dismiss());
    this.startTimer();
  }

  initListeners() {
    const resetIdle = () => {
      this.idleTime = 0;
      if (this.isActive) {
        this.dismiss();
      }
    };

    window.addEventListener('mousemove', resetIdle, { passive: true });
    window.addEventListener('keydown', resetIdle, { passive: true });
    window.addEventListener('pointerdown', resetIdle, { passive: true });
    window.addEventListener('touchstart', resetIdle, { passive: true });
  }

  startTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      // Don't trigger if a game is currently running in the modal
      if (window.activeGameInstance && window.activeGameInstance.running) {
        this.idleTime = 0;
        return;
      }

      this.idleTime++;
      if (this.idleTime >= this.idleThreshold && !this.isActive) {
        this.trigger();
      }
    }, 1000);
  }

  trigger() {
    if (!this.attractOverlay) return;
    this.isActive = true;
    this.attractOverlay.classList.add('active');

    if (window.soundEngine) {
      window.soundEngine.announce('INSERT COIN ! NEON ARCADE ULTRA !');
    }
  }

  dismiss() {
    if (!this.attractOverlay) return;
    this.isActive = false;
    this.idleTime = 0;
    this.attractOverlay.classList.remove('active');
  }
}

window.attractMode = new AttractModeEngine();
