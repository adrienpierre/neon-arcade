/* =========================================================
   GAME 9: NEON KATANA (CYBER SLICER)
   Fruit Ninja Style Plasma Blade Slicer with Physics Halves
   ========================================================= */

class SlicerGame {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.onScore = null;
    this.onGameOver = null;
    this.particles = new ParticleSystem();

    this.bladeTrail = [];
    this.isMouseDown = false;

    this.targets = [];
    this.halves = [];
    this.spawnTimer = 0;
    this.spawnInterval = 55;

    this.score = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
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

    // Pointer events for swipe slicing
    this.canvas.onpointerdown = (e) => {
      this.isMouseDown = true;
      this.addBladePoint(e);
    };

    this.canvas.onpointermove = (e) => {
      if (this.isMouseDown) {
        this.addBladePoint(e);
        this.checkSliceCollisions();
      }
    };

    this.canvas.onpointerup = () => {
      this.isMouseDown = false;
    };

    this.reset();
  }

  addBladePoint(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
    this.bladeTrail.push({ x: x, y: y, life: 10 });
  }

  reset() {
    this.bladeTrail = [];
    this.targets = [];
    this.halves = [];
    this.score = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.shield = window.cyberShop ? window.cyberShop.hasPerk('perk_shield') : false;
    this.lives = this.shield ? 4 : 3;
    this.bulletTime = 0;
    this.particles.reset();
  }

  start() {
    this.reset();
    this.running = true;
    this.paused = false;
    if (window.soundEngine) window.soundEngine.announce('SLASH !');
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
    if (e.type === 'keydown' && (e.key === 'b' || e.key === 'B')) {
      this.triggerBulletTime();
    }
  }

  handleTouch(action) {
    if (action === 'action') {
      this.triggerBulletTime();
    }
  }

  triggerBulletTime() {
    if (window.cyberShop && window.cyberShop.hasPerk('perk_bullet_time') && this.bulletTime <= 0) {
      this.bulletTime = 180;
      this.particles.shake(12, 5);
      this.particles.addFloatingText('⏱ MATRIX BULLET TIME !', this.canvas.width / 2, 220, '#00ff88', 26);
      if (window.soundEngine) window.soundEngine.playPowerup();
    }
  }

  spawnTargetGroup() {
    const count = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < count; i++) {
      const isBomb = Math.random() < 0.22;
      const isGold = !isBomb && Math.random() < 0.25;

      const x = Math.random() * (this.canvas.width - 240) + 120;
      const vx = (this.canvas.width / 2 - x) * 0.018 + (Math.random() - 0.5) * 3;
      const vy = -(Math.random() * 4 + 11.5);

      this.targets.push({
        x: x,
        y: this.canvas.height + 20,
        vx: vx,
        vy: vy,
        radius: isGold ? 22 : 26,
        isBomb: isBomb,
        isGold: isGold,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.1,
        color: isBomb ? '#ff3366' : (isGold ? '#ffe600' : '#00f0ff')
      });
    }
  }

  checkSliceCollisions() {
    if (this.bladeTrail.length < 2) return;
    const p1 = this.bladeTrail[this.bladeTrail.length - 2];
    const p2 = this.bladeTrail[this.bladeTrail.length - 1];

    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      // Distance from circle to line segment
      const dist = this.distToSegment(t, p1, p2);

      if (dist <= t.radius) {
        // Sliced!
        this.targets.splice(i, 1);

        if (t.isBomb) {
          if (this.shield) {
            this.shield = false;
            this.particles.shake(16, 8);
            this.particles.burst(t.x, t.y, '#00ff88', 35, 6);
            this.particles.addFloatingText('🛡 BOMBE ABSORBÉE PAR LE BOUCLIER !', t.x, t.y, '#00ff88', 22);
            if (window.soundEngine) window.soundEngine.playBounce();
          } else {
            // Detonated bomb!
            this.lives--;
            this.particles.shake(25, 14);
            this.particles.burst(t.x, t.y, '#ff3366', 45, 8);
            this.particles.addFloatingText('BOMBE EMP ! -1 VIE', t.x, t.y, '#ff3366', 22);
            if (window.soundEngine) {
              window.soundEngine.playExplosion(true);
              window.soundEngine.announce('BOOM !');
            }

            if (this.lives <= 0) {
              this.gameOver();
              return;
            }
          }
        } else {
          // Slice target in half!
          this.comboCount++;
          this.comboTimer = 25; // frames to chain combo

          let pts = t.isGold ? 60 : 25;
          if (this.comboCount >= 3) {
            pts *= 2;
          }

          this.score += pts;
          this.onScore(this.score);
          if (window.challengeEngine && window.challengeEngine.isGameChallenge('slicer')) {
            window.challengeEngine.checkProgress(this.score, this.particles, this.canvas.width, this.canvas.height);
          }

          // Spawn two separating halves
          this.halves.push({
            x: t.x - 8,
            y: t.y,
            vx: -3,
            vy: t.vy * 0.6,
            radius: t.radius * 0.8,
            color: t.color,
            rotation: t.rotation,
            rotSpeed: -0.15,
            alpha: 1
          });
          this.halves.push({
            x: t.x + 8,
            y: t.y,
            vx: 3,
            vy: t.vy * 0.6,
            radius: t.radius * 0.8,
            color: t.color,
            rotation: t.rotation,
            rotSpeed: 0.15,
            alpha: 1
          });

          this.particles.burst(t.x, t.y, t.color, 25, 6);
          this.particles.addFloatingText(`+${pts}`, t.x, t.y, t.color, 20);

          if (window.soundEngine) {
            window.soundEngine.playSlash();
          }
        }
      }
    }
  }

  distToSegment(p, v, w) {
    const l2 = Math.hypot(v.x - w.x, v.y - w.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  }

  update() {
    const timeScale = (this.bulletTime > 0) ? 0.38 : 1.0;
    if (this.bulletTime > 0) this.bulletTime--;

    // Blade trail decay
    for (let i = this.bladeTrail.length - 1; i >= 0; i--) {
      this.bladeTrail[i].life--;
      if (this.bladeTrail[i].life <= 0) {
        this.bladeTrail.splice(i, 1);
      }
    }

    // Combo timer
    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboTimer <= 0) {
        if (this.comboCount >= 3) {
          this.particles.addFloatingText(`COMBO TRANCHEUR x${this.comboCount} !`, this.canvas.width / 2, 200, '#ffe600', 26);
          if (window.soundEngine) window.soundEngine.announce('COMBO !');
        }
        this.comboCount = 0;
      }
    }

    // Target spawner
    this.spawnTimer += timeScale;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnTargetGroup();
    }

    // Update targets (affected by Matrix slow-motion!)
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      t.x += t.vx * timeScale;
      t.y += t.vy * timeScale;
      t.vy += 0.32 * timeScale; // Gravity
      t.rotation += t.rotSpeed * timeScale;

      // Missed non-bomb falling off screen
      if (t.y > this.canvas.height + 40 && t.vy > 0) {
        if (!t.isBomb) {
          if (this.shield) {
            this.shield = false;
            this.particles.shake(12, 5);
            this.particles.burst(t.x, this.canvas.height - 20, '#00ff88', 25, 4);
            this.particles.addFloatingText('🛡 CHUTE ABSORBÉE !', t.x, this.canvas.height - 20, '#00ff88', 18);
            if (window.soundEngine) window.soundEngine.playBounce();
          } else {
            this.lives--;
            this.particles.shake(10, 5);
            this.particles.addFloatingText('RATÉ !', t.x, this.canvas.height - 20, '#ff3366');
            if (window.soundEngine) window.soundEngine.playBounce();

            if (this.lives <= 0) {
              this.gameOver();
              return;
            }
          }
        }
        this.targets.splice(i, 1);
      }
    }

    // Update halves
    for (let i = this.halves.length - 1; i >= 0; i--) {
      const h = this.halves[i];
      h.x += h.vx * timeScale;
      h.y += h.vy * timeScale;
      h.vy += 0.35 * timeScale;
      h.rotation += h.rotSpeed * timeScale;
      h.alpha -= 0.02;

      if (h.alpha <= 0 || h.y > this.canvas.height + 30) {
        this.halves.splice(i, 1);
      }
    }
  }

  gameOver() {
    this.running = false;
    this.particles.shake(25, 12);
    if (window.soundEngine) {
      window.soundEngine.playGameOver();
      window.soundEngine.announce('GAME OVER !');
    }
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

    // Deep Dojo background
    ctx.fillStyle = '#07081b';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Subtle Japanese cyber bamboo / grid pillars
    ctx.fillStyle = 'rgba(255, 0, 127, 0.05)';
    for (let x = 60; x < this.canvas.width; x += 120) {
      ctx.fillRect(x, 0, 4, this.canvas.height);
    }

    // Draw Targets
    this.targets.forEach(t => {
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.rotation);

      ctx.fillStyle = t.color;
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 18;

      if (t.isBomb) {
        ctx.beginPath();
        ctx.arc(0, 0, t.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☠', 0, 0);
      } else if (t.isGold) {
        // Star crystal
        ctx.fillRect(-t.radius / 2, -t.radius / 2, t.radius, t.radius);
      } else {
        // Data core sphere
        ctx.beginPath();
        ctx.arc(0, 0, t.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
    });

    // Draw Sliced Halves
    this.halves.forEach(h => {
      ctx.save();
      ctx.globalAlpha = h.alpha;
      ctx.translate(h.x, h.y);
      ctx.rotate(h.rotation);
      ctx.fillStyle = h.color;
      ctx.shadowColor = h.color;
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.arc(0, 0, h.radius, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // Draw Glowing Plasma Katana Trail with equipped skin color
    const bladeColor = window.cyberShop ? window.cyberShop.getPlayerColor('#00f0ff') : '#00f0ff';
    if (this.bladeTrail.length >= 2) {
      ctx.save();
      ctx.shadowColor = bladeColor;
      ctx.shadowBlur = 22;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 1; i < this.bladeTrail.length; i++) {
        const p1 = this.bladeTrail[i - 1];
        const p2 = this.bladeTrail[i];
        const width = (p2.life / 10) * 9;

        ctx.strokeStyle = bladeColor;
        ctx.globalAlpha = p2.life / 10;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // White razor core
        ctx.strokeStyle = '#ffffff';
        ctx.globalAlpha = (p2.life / 10) * 0.9;
        ctx.lineWidth = width * 0.35;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Matrix Bullet Time active visual tint
    if (this.bulletTime > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 255, 136, 0.08)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.font = 'bold 14px Orbitron, sans-serif';
      ctx.fillStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 10;
      ctx.fillText(`⏱ MATRIX SLOW-MO: ${Math.ceil(this.bulletTime / 60)}s`, this.canvas.width / 2 - 80, 32);
      ctx.restore();
    }

    // Top HUD
    ctx.save();
    ctx.font = 'bold 15px Orbitron, sans-serif';
    ctx.fillStyle = '#ff3366';
    ctx.fillText(`VIES: ${'❤ '.repeat(this.lives)}`, 20, 32);

    if (this.shield) {
      ctx.fillStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 8;
      ctx.fillText('🛡 BOUCLIER ACTIF', 150, 32);
    }

    if (this.comboCount >= 2) {
      ctx.fillStyle = '#ffe600';
      ctx.fillText(`TRANCHES: ${this.comboCount} !`, this.canvas.width - 160, 32);
    }
    ctx.restore();

    if (this.comboCount >= 2) {
      ctx.fillStyle = '#ffe600';
      ctx.fillText(`TRANCHES: ${this.comboCount} !`, this.canvas.width - 160, 32);
    }
    ctx.restore();

    // Particles and float text
    this.particles.draw(ctx);

    ctx.restore();
  }
}

window.SlicerGame = SlicerGame;
