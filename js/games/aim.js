/* =========================================================
   GAME 6: AIM OVERDRIVE (REFLEX HUNTER)
   Precision & Reflex Trainer with Shrinking Targets & Combos
   ========================================================= */

class AimGame {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.onScore = null;
    this.onGameOver = null;
    this.particles = new ParticleSystem();

    this.targets = [];
    this.spawnTimer = 0;
    this.spawnRate = 45; // frames

    this.mousePos = { x: 350, y: 250 };
    this.score = 0;
    this.streak = 0;
    this.lives = 3;

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

    this.canvas.onpointermove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos.x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      this.mousePos.y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
    };

    this.canvas.onpointerdown = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
      this.handleClick(x, y);
    };

    this.reset();
  }

  reset() {
    this.targets = [];
    this.spawnTimer = 0;
    this.score = 0;
    this.streak = 0;
    const hasShield = window.cyberShop ? window.cyberShop.hasPerk('perk_shield') : false;
    this.lives = hasShield ? 4 : 3;
    this.particles.reset();
  }

  start() {
    this.reset();
    this.running = true;
    this.paused = false;
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
  }

  handleKey(e) {
    if (e.type !== 'keydown') return;
    if (e.key === ' ' || e.key === 'Spacebar') {
      if (e.repeat) return;
      this.handleClick(this.mousePos.x, this.mousePos.y);
    }
  }

  handleTouch(action) {
    // Handled directly via pointerdown
  }

  spawnTarget() {
    const isBomb = Math.random() < 0.18;
    const isGold = !isBomb && Math.random() < 0.2;

    const radius = isGold ? 24 : 30;
    const padding = 60;
    const x = Math.random() * (this.canvas.width - padding * 2) + padding;
    const y = Math.random() * (this.canvas.height - padding * 2) + padding;

    this.targets.push({
      x: x,
      y: y,
      baseRadius: radius,
      timer: 1.0, // starts at 1, shrinks to 0
      decay: isGold ? 0.016 : 0.012,
      isBomb: isBomb,
      isGold: isGold
    });
  }

  handleClick(x, y) {
    if (!this.running || this.paused) return;

    let hit = false;
    this.particles.burst(x, y, '#00f0ff', 6, 2);

    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      const dist = Math.hypot(t.x - x, t.y - y);

      if (dist <= t.baseRadius) {
        hit = true;
        this.targets.splice(i, 1);

        if (t.isBomb) {
          // Clicked a bomb!
          this.lives--;
          this.streak = 0;
          this.particles.shake(20, 10);
          this.particles.burst(t.x, t.y, '#ff3366', 35, 6);
          this.particles.addFloatingText('PIÈGE BOUM ! -1 VIE', t.x, t.y, '#ff3366', 22);
          if (window.soundEngine) window.soundEngine.playExplosion(true);

          if (this.lives <= 0) {
            this.gameOver();
            return;
          }
        } else {
          // Success hit
          this.streak++;
          let pts = 30;
          let rating = 'BON';
          let pColor = '#00f0ff';

          // Accuracy based on shrinking ring timing
          if (t.timer < 0.35) {
            pts = 80;
            rating = 'PARFAIT !';
            pColor = '#ffe600';
          } else if (t.timer < 0.65) {
            pts = 50;
            rating = 'SUPER !';
            pColor = '#00ff88';
          }

          if (t.isGold) {
            pts *= 2;
            rating = 'ORB CYBER 2X !';
            pColor = '#ffe600';
          }

          // Streak multiplier
          if (this.streak >= 5) {
            pts += this.streak * 5;
          }

          this.score += pts;
          this.onScore(this.score);

          if (window.challengeEngine) {
            window.challengeEngine.checkProgress(this.score, this.particles, this.canvas.width, this.canvas.height);
          }

          this.particles.burst(t.x, t.y, pColor, 20, 4);
          this.particles.addFloatingText(`${rating} +${pts}`, t.x, t.y, pColor, 20);
          if (window.soundEngine) window.soundEngine.playCoin();
        }
        break;
      }
    }

    if (!hit) {
      this.streak = 0;
    }
  }

  update() {
    this.spawnTimer++;
    if (this.spawnTimer >= this.spawnRate) {
      this.spawnTimer = 0;
      this.spawnTarget();
    }

    // Update targets countdown
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      t.timer -= t.decay;

      if (t.timer <= 0) {
        // Expired target
        if (!t.isBomb) {
          // Missed valid target
          this.lives--;
          this.streak = 0;
          this.particles.shake(10, 5);
          this.particles.addFloatingText('RATÉ !', t.x, t.y, '#ff3366');
          if (window.soundEngine) window.soundEngine.playBounce();

          if (this.lives <= 0) {
            this.gameOver();
            return;
          }
        }
        this.targets.splice(i, 1);
      }
    }
  }

  gameOver() {
    this.running = false;
    this.particles.shake(20, 10);
    if (window.soundEngine) window.soundEngine.playGameOver();
    setTimeout(() => {
      this.onGameOver(this.score);
    }, 700);
  }

  loop() {
    if (!this.running || this.paused) return;

    this.update();
    this.particles.update();
    this.draw();

    this.loopId = requestAnimationFrame(() => this.loop());
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.particles.shakeX, this.particles.shakeY);

    // Dark grid background
    ctx.fillStyle = '#060714';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Targets
    this.targets.forEach(t => {
      ctx.save();
      const color = t.isBomb ? '#ff3366' : (t.isGold ? '#ffe600' : '#00f0ff');

      // Inner target disc
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.baseRadius, 0, Math.PI * 2);
      ctx.fill();

      // Icon / Center mark
      ctx.fillStyle = '#000';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.isBomb ? '☠' : (t.isGold ? '★' : '🎯'), t.x, t.y);

      // Shrinking outer ring
      const ringRadius = t.baseRadius + (t.baseRadius * 1.5 * t.timer);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(t.x, t.y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    });

    // Custom Reticle with equipped skin color
    const reticleColor = window.cyberShop ? window.cyberShop.getPlayerColor('#00f0ff') : '#00f0ff';
    ctx.save();
    ctx.strokeStyle = reticleColor;
    ctx.shadowColor = reticleColor;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 1.8;

    // Crosshairs
    ctx.beginPath();
    ctx.arc(this.mousePos.x, this.mousePos.y, 14, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.mousePos.x - 20, this.mousePos.y);
    ctx.lineTo(this.mousePos.x - 6, this.mousePos.y);
    ctx.moveTo(this.mousePos.x + 6, this.mousePos.y);
    ctx.lineTo(this.mousePos.x + 20, this.mousePos.y);
    ctx.moveTo(this.mousePos.x, this.mousePos.y - 20);
    ctx.lineTo(this.mousePos.x, this.mousePos.y - 6);
    ctx.moveTo(this.mousePos.x, this.mousePos.y + 6);
    ctx.lineTo(this.mousePos.x, this.mousePos.y + 20);
    ctx.stroke();
    ctx.restore();

    // Top status (Lives & Streak)
    ctx.save();
    ctx.font = 'bold 14px Orbitron, sans-serif';
    ctx.fillStyle = '#ff3366';
    ctx.fillText(`VIES: ${'❤ '.repeat(this.lives)}`, 20, 30);

    if (this.streak >= 3) {
      ctx.fillStyle = '#ffe600';
      ctx.fillText(`STREAK: x${this.streak} !`, this.canvas.width - 160, 30);
    }
    ctx.restore();

    // Particles and float text
    this.particles.draw(ctx);

    ctx.restore();
  }
}

window.AimGame = AimGame;
