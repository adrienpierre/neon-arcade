/* =========================================================
   GAME 5: QUANTUM MATRIX (CYBER SIMON / AUDIO-VISUAL MEMORY)
   Harmonic Synth Memory Challenge with Laser Pads
   ========================================================= */

class MemoryGame {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.onScore = null;
    this.onGameOver = null;
    this.particles = new ParticleSystem();

    this.pads = [
      { id: 0, key: '1 / Q', name: 'CYAN', color: '#00f0ff', freq: 329.63, x: 0, y: 0, active: 0 },
      { id: 1, key: '2 / W', name: 'MAGENTA', color: '#ff007f', freq: 440.00, x: 0, y: 0, active: 0 },
      { id: 2, key: '3 / A', name: 'GOLD', color: '#ffe600', freq: 554.37, x: 0, y: 0, active: 0 },
      { id: 3, key: '4 / S', name: 'EMERALD', color: '#00ff88', freq: 659.25, x: 0, y: 0, active: 0 }
    ];

    this.sequence = [];
    this.playerStep = 0;
    this.round = 0;
    this.score = 0;

    this.state = 'idle'; // 'playing_sequence', 'waiting_input', 'gameover'
    this.playbackIndex = 0;
    this.playbackTimer = null;

    this.running = false;
    this.paused = false;
    this.loopId = null;
  }

  init(canvas, onScore, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScore = onScore;
    this.onGameOver = onGameOver;

    this.canvas.width = 700;
    this.canvas.height = 500;

    // Pad layouts (4 large quadrant pads)
    const padSize = 180;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const gap = 20;

    this.pads[0].x = centerX - padSize - gap / 2;
    this.pads[0].y = centerY - padSize - gap / 2;
    this.pads[0].w = padSize;
    this.pads[0].h = padSize;

    this.pads[1].x = centerX + gap / 2;
    this.pads[1].y = centerY - padSize - gap / 2;
    this.pads[1].w = padSize;
    this.pads[1].h = padSize;

    this.pads[2].x = centerX - padSize - gap / 2;
    this.pads[2].y = centerY + gap / 2;
    this.pads[2].w = padSize;
    this.pads[2].h = padSize;

    this.pads[3].x = centerX + gap / 2;
    this.pads[3].y = centerY + gap / 2;
    this.pads[3].w = padSize;
    this.pads[3].h = padSize;

    this.canvas.onpointerdown = (e) => this.handlePointerDown(e);

    this.reset();
  }

  reset() {
    this.sequence = [];
    this.playerStep = 0;
    this.round = 0;
    this.score = 0;
    this.state = 'idle';
    this.particles.reset();
    this.pads.forEach(p => p.active = 0);
  }

  start() {
    this.reset();
    this.running = true;
    this.paused = false;
    this.nextRound();
    this.loop();
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
    this.loop();
  }

  stop() {
    this.running = false;
    if (this.loopId) cancelAnimationFrame(this.loopId);
    if (this.playbackTimer) clearTimeout(this.playbackTimer);
  }

  nextRound() {
    this.round++;
    this.playerStep = 0;
    this.state = 'playing_sequence';

    // Add random new step (0 to 3)
    this.sequence.push(Math.floor(Math.random() * 4));

    this.particles.addFloatingText(`MANCHE ${this.round}`, this.canvas.width / 2, 80, '#00f0ff', 24);

    // Playback sequence after short delay
    setTimeout(() => {
      this.playSequenceStep(0);
    }, 800);
  }

  playSequenceStep(index) {
    if (!this.running || this.paused) return;

    if (index >= this.sequence.length) {
      // Sequence done, player's turn!
      this.state = 'waiting_input';
      return;
    }

    const padId = this.sequence[index];
    this.activatePad(padId, false);

    const speed = Math.max(260, 500 - this.round * 20);
    this.playbackTimer = setTimeout(() => {
      this.playSequenceStep(index + 1);
    }, speed);
  }

  activatePad(padId, isPlayer = true) {
    const pad = this.pads[padId];
    pad.active = 12; // active frames

    if (window.soundEngine) {
      window.soundEngine.playNote(pad.freq, 0.25);
    }

    const cx = pad.x + pad.w / 2;
    const cy = pad.y + pad.h / 2;
    this.particles.burst(cx, cy, pad.color, 12, 3);
  }

  handlePointerDown(e) {
    if (!this.running || this.paused || this.state !== 'waiting_input') return;

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    for (let i = 0; i < this.pads.length; i++) {
      const p = this.pads[i];
      if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) {
        this.playerChoose(i);
        break;
      }
    }
  }

  handleKey(e) {
    if (!this.running || this.paused || this.state !== 'waiting_input') return;
    if (e.type !== 'keydown') return;

    if (e.key === '1' || e.key === 'q' || e.key === 'Q') this.playerChoose(0);
    if (e.key === '2' || e.key === 'w' || e.key === 'W') this.playerChoose(1);
    if (e.key === '3' || e.key === 'a' || e.key === 'A') this.playerChoose(2);
    if (e.key === '4' || e.key === 's' || e.key === 'S') this.playerChoose(3);
  }

  handleTouch(action) {
    // Touch D-pad maps to 4 pads
    if (!this.running || this.paused || this.state !== 'waiting_input') return;
    if (action === 'up') this.playerChoose(0);
    if (action === 'right') this.playerChoose(1);
    if (action === 'left') this.playerChoose(2);
    if (action === 'down') this.playerChoose(3);
  }

  playerChoose(padId) {
    this.activatePad(padId, true);

    if (padId === this.sequence[this.playerStep]) {
      // Correct!
      this.playerStep++;
      if (this.playerStep >= this.sequence.length) {
        // Round passed!
        this.score += this.round * 10;
        this.onScore(this.score);

        if (window.challengeEngine) {
          window.challengeEngine.checkProgress(this.score, this.particles, this.canvas.width, this.canvas.height);
        }
        this.particles.burst(this.canvas.width / 2, this.canvas.height / 2, '#ffe600', 25, 5);
        if (window.soundEngine) window.soundEngine.playPowerup();
        this.state = 'idle';

        setTimeout(() => {
          this.nextRound();
        }, 600);
      }
    } else {
      // Wrong pad - Game over
      this.gameOver();
    }
  }

  gameOver() {
    this.running = false;
    this.state = 'gameover';
    this.particles.shake(20, 10);
    if (window.soundEngine) window.soundEngine.playGameOver();
    setTimeout(() => {
      this.onGameOver(this.score);
    }, 700);
  }

  loop() {
    if (!this.running || this.paused) return;

    // Decay active pad states
    this.pads.forEach(p => {
      if (p.active > 0) p.active--;
    });

    this.particles.update();
    this.draw();

    this.loopId = requestAnimationFrame(() => this.loop());
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.particles.shakeX, this.particles.shakeY);

    // Dark matrix background
    ctx.fillStyle = '#060714';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Status Banner in center or top
    ctx.save();
    ctx.font = 'bold 15px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    if (this.state === 'playing_sequence') {
      ctx.fillStyle = '#ffe600';
      ctx.fillText('ÉCOUTE LA SÉQUENCE...', this.canvas.width / 2, 40);
    } else if (this.state === 'waiting_input') {
      ctx.fillStyle = '#00f0ff';
      ctx.fillText(`À TOI DE JOUER (${this.playerStep}/${this.sequence.length})`, this.canvas.width / 2, 40);
    }
    ctx.restore();

    // Draw 4 pads
    this.pads.forEach(p => {
      ctx.save();
      const isActive = p.active > 0;
      ctx.fillStyle = isActive ? p.color : 'rgba(255, 255, 255, 0.05)';
      ctx.strokeStyle = p.color;
      ctx.lineWidth = isActive ? 4 : 2;

      if (isActive) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 30;
      }

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(p.x, p.y, p.w, p.h, 16);
      } else {
        ctx.rect(p.x, p.y, p.w, p.h);
      }
      ctx.fill();
      ctx.stroke();

      // Pad labels
      ctx.fillStyle = isActive ? '#000' : p.color;
      ctx.font = 'bold 18px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.name, p.x + p.w / 2, p.y + p.h / 2 - 8);

      ctx.font = '12px monospace';
      ctx.fillText(p.key, p.x + p.w / 2, p.y + p.h / 2 + 18);
      ctx.restore();
    });

    // Particles and float text
    this.particles.draw(ctx);

    ctx.restore();
  }
}

window.MemoryGame = MemoryGame;
