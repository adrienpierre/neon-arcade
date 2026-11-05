/* =========================================================
   NEON ARCADE - NATIVE GAMEPAD / CONTROLLER ENGINE
   Plug-and-play support for Xbox, PS4/PS5 & Arcade Sticks
   ========================================================= */

class GamepadController {
  constructor() {
    this.connected = false;
    this.gamepadIndex = null;
    this.lastButtons = {};
    this.lastAxes = { x: 0, y: 0 };
    this.threshold = 0.35;

    window.addEventListener('gamepadconnected', (e) => this.onConnected(e));
    window.addEventListener('gamepaddisconnected', (e) => this.onDisconnected(e));

    this.poll();
  }

  onConnected(e) {
    this.connected = true;
    this.gamepadIndex = e.gamepad.index;
    if (window.arcadeState) {
      window.arcadeState.triggerToast('🎮 MANETTE CONNECTÉE !', `${e.gamepad.id.substring(0, 24)}... Prête à jouer !`, '🕹');
    }
    if (window.soundEngine) {
      window.soundEngine.playPowerup();
      window.soundEngine.announce('CONTROLLER CONNECTED !');
    }
  }

  onDisconnected(e) {
    if (this.gamepadIndex === e.gamepad.index) {
      this.connected = false;
      this.gamepadIndex = null;
      if (window.arcadeState) {
        window.arcadeState.triggerToast('🎮 MANETTE DÉCONNECTÉE', 'Retour aux commandes clavier.', '🔌');
      }
    }
  }

  poll() {
    if (this.connected && this.gamepadIndex !== null) {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[this.gamepadIndex];

      if (gp) {
        this.processInput(gp);
      }
    }
    requestAnimationFrame(() => this.poll());
  }

  processInput(gp) {
    // Only dispatch to active game
    if (!window.activeGameInstance) return;
    const game = window.activeGameInstance;

    // D-Pad and Axes
    const axisX = gp.axes[0] || 0;
    const axisY = gp.axes[1] || 0;

    const btnLeft = gp.buttons[14]?.pressed || axisX < -this.threshold;
    const btnRight = gp.buttons[15]?.pressed || axisX > this.threshold;
    const btnUp = gp.buttons[12]?.pressed || axisY < -this.threshold;
    const btnDown = gp.buttons[13]?.pressed || axisY > this.threshold;

    // Action buttons (A / X / Trigger)
    const btnAction = gp.buttons[0]?.pressed || gp.buttons[2]?.pressed || gp.buttons[7]?.pressed;
    const btnPause = gp.buttons[9]?.pressed; // Start / Options

    // Dispatch synthetic key/touch events
    if (btnLeft && !this.lastButtons.left) {
      if (game.handleTouch) game.handleTouch('left');
      if (game.handleKey) game.handleKey({ key: 'ArrowLeft', type: 'keydown' });
    }
    if (btnRight && !this.lastButtons.right) {
      if (game.handleTouch) game.handleTouch('right');
      if (game.handleKey) game.handleKey({ key: 'ArrowRight', type: 'keydown' });
    }
    if (btnUp && !this.lastButtons.up) {
      if (game.handleTouch) game.handleTouch('up');
      if (game.handleKey) game.handleKey({ key: 'ArrowUp', type: 'keydown' });
    }
    if (btnDown && !this.lastButtons.down) {
      if (game.handleTouch) game.handleTouch('down');
      if (game.handleKey) game.handleKey({ key: 'ArrowDown', type: 'keydown' });
    }
    if (btnAction && !this.lastButtons.action) {
      if (game.handleTouch) game.handleTouch('action');
      if (game.handleKey) game.handleKey({ key: ' ', type: 'keydown' });
    }

    if (btnPause && !this.lastButtons.pause) {
      const pauseBtn = document.getElementById('btn-pause-arena');
      if (pauseBtn) pauseBtn.click();
    }

    this.lastButtons = {
      left: btnLeft,
      right: btnRight,
      up: btnUp,
      down: btnDown,
      action: btnAction,
      pause: btnPause
    };
  }
}

window.gamepadController = new GamepadController();
