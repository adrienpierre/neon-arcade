/* =========================================================
   GAME 8: ORBITAL VORTEX (HEXAGON SURVIVAL & 360° PONG)
   Hypnotic 360-degree Orbital Deflector & Geometric Survival
   ========================================================= */

class VortexGame {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.onScore = null;
    this.onGameOver = null;
    this.particles = new ParticleSystem();

    this.centerX = 350;
    this.centerY = 250;
    this.orbitRadius = 140;

    this.shieldAngle = 0; // radians
    this.shieldArc = Math.PI / 3; // 60 degrees width
    this.coreRadius = 24;
    this.coreHealth = 3;

    this.projectiles = [];
    this.hexWaves = [];
    this.spawnTimer = 0;
    this.waveTimer = 0;

    this.score = 0;
    this.combo = 1;
    this.keys = {};

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
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;

    // Mouse / Touch 360 tracking
    this.canvas.onpointermove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
      this.shieldAngle = Math.atan2(y - this.centerY, x - this.centerX);
    };

    this.reset();
  }

  reset() {
    this.shieldAngle = 0;
    const hasShield = window.cyberShop ? window.cyberShop.hasPerk('perk_shield') : false;
    this.coreHealth = hasShield ? 4 : 3;
    this.projectiles = [];
    this.hexWaves = [];
    this.spawnTimer = 0;
    this.waveTimer = 0;
    this.score = 0;
    this.combo = 1;
    this.particles.reset();
  }

  start() {
    this.reset();
    this.running = true;
    this.paused = false;
    if (window.soundEngine) window.soundEngine.announce('DEFEND THE CORE !');
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
    if (this.canvas) {
      this.canvas.onpointermove = null;
      this.canvas.onpointerdown = null;
    }
    if (this.loopId) cancelAnimationFrame(this.loopId);
  }

  handleKey(e) {
    if (e.type === 'keydown') this.keys[e.key] = true;
    if (e.type === 'keyup') this.keys[e.key] = false;
  }

  handleTouch(action) {
    if (action === 'left') this.shieldAngle -= 0.35;
    if (action === 'right') this.shieldAngle += 0.35;
  }

  handleDrag(x, y) {
    if (!this.running || this.paused) return;
    this.shieldAngle = Math.atan2(y - this.centerY, x - this.centerX);
  }

  spawnOrb() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 340;
    const isSpecial = Math.random() < 0.25;

    this.projectiles.push({
      x: this.centerX + Math.cos(angle) * dist,
      y: this.centerY + Math.sin(angle) * dist,
      angle: angle,
      speed: 2.8 + Math.random() * 1.5,
      dist: dist,
      isSpecial: isSpecial,
      radius: isSpecial ? 8 : 6,
      color: isSpecial ? '#ffe600' : '#00f0ff'
    });
  }

  spawnHexWave() {
    // Collapsing polygonal barrier with one escape opening
    const openAngle = Math.random() * Math.PI * 2;
    this.hexWaves.push({
      radius: 360,
      openAngle: openAngle,
      gapSize: Math.PI / 2.5,
      speed: 2.2,
      color: '#ff007f'
    });
  }

  update() {
    // Keyboard rotation (Arrow keys + WASD + ZQSD)
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A'] || this.keys['q'] || this.keys['Q']) {
      this.shieldAngle -= 0.08;
    }
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
      this.shieldAngle += 0.08;
    }

    // Spawn orbs
    this.spawnTimer++;
    if (this.spawnTimer >= 35) {
      this.spawnTimer = 0;
      this.spawnOrb();
    }

    // Spawn Hex Wave
    this.waveTimer++;
    if (this.waveTimer >= 140) {
      this.waveTimer = 0;
      this.spawnHexWave();
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.dist -= p.speed;
      p.x = this.centerX + Math.cos(p.angle) * p.dist;
      p.y = this.centerY + Math.sin(p.angle) * p.dist;

      // Check Shield collision
      if (Math.abs(p.dist - this.orbitRadius) < 12) {
        // Normalize angle difference
        let angleDiff = p.angle - this.shieldAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        if (Math.abs(angleDiff) < this.shieldArc / 2) {
          // Deflected!
          const pts = (p.isSpecial ? 80 : 30) * this.combo;
          this.score += pts;
          this.combo = Math.min(8, this.combo + 1);
          this.onScore(this.score);

          if (window.challengeEngine) {
            window.challengeEngine.checkProgress(this.score, this.particles, this.canvas.width, this.canvas.height);
          }

          this.particles.burst(p.x, p.y, p.color, 18, 5);
          this.particles.addFloatingText(this.combo > 1 ? `+${pts} (x${this.combo})` : `+${pts}`, p.x, p.y, p.color);
          if (window.soundEngine) window.soundEngine.playBounce();

          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Check Core Impact
      if (p.dist <= this.coreRadius) {
        this.coreHealth--;
        this.combo = 1;
        this.particles.shake(18, 8);
        this.particles.burst(this.centerX, this.centerY, '#ff3366', 30, 6);
        this.particles.addFloatingText('NOYAU TOUCHÉ !', this.centerX, this.centerY - 30, '#ff3366', 20);
        if (window.soundEngine) window.soundEngine.playExplosion();

        this.projectiles.splice(i, 1);

        if (this.coreHealth <= 0) {
          this.gameOver();
          return;
        }
      }
    }

    // Update Hex Waves
    for (let i = this.hexWaves.length - 1; i >= 0; i--) {
      const hw = this.hexWaves[i];
      hw.radius -= hw.speed;

      // Hits shield or core?
      if (hw.radius <= this.orbitRadius + 4 && hw.radius >= this.orbitRadius - 6) {
        let diff = this.shieldAngle - hw.openAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        // If player shield isn't inside the gap, shockwave deflects
        if (Math.abs(diff) < hw.gapSize / 2) {
          // Passed through the gap safely!
          this.score += 100;
          this.onScore(this.score);
          this.particles.burst(this.centerX, this.centerY, '#00ff88', 25, 4);
          this.particles.addFloatingText('GAP PARFAIT +100 !', this.centerX, this.centerY - 30, '#00ff88', 20);
          if (window.soundEngine) window.soundEngine.playPowerup();
        }
      }

      if (hw.radius <= this.coreRadius) {
        this.hexWaves.splice(i, 1);
      }
    }
  }

  gameOver() {
    this.running = false;
    this.particles.shake(25, 12);
    this.particles.burst(this.centerX, this.centerY, '#ff3366', 60, 8);
    if (window.soundEngine) {
      window.soundEngine.playGameOver();
      window.soundEngine.announce('CORE DESTROYED !');
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

    // Deep vortex background
    ctx.fillStyle = '#060714';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Concentric orbit rings
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let r = 50; r <= 320; r += 45) {
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw Hex Waves
    this.hexWaves.forEach(hw => {
      ctx.save();
      ctx.strokeStyle = hw.color;
      ctx.shadowColor = hw.color;
      ctx.shadowBlur = 12;
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, hw.radius, hw.openAngle + hw.gapSize / 2, hw.openAngle - hw.gapSize / 2 + Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // Draw Orbiting Shield with equipped skin color
    const shieldColor = window.cyberShop ? window.cyberShop.getPlayerColor('#00f0ff') : '#00f0ff';
    ctx.save();
    ctx.strokeStyle = shieldColor;
    ctx.shadowColor = shieldColor;
    ctx.shadowBlur = 22;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.orbitRadius, this.shieldAngle - this.shieldArc / 2, this.shieldAngle + this.shieldArc / 2);
    ctx.stroke();
    ctx.restore();

    // Draw Singularity Core
    ctx.save();
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.coreRadius, 0, Math.PI * 2);
    ctx.fill();

    // Core Pulse Ring
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.coreRadius + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Draw Inward Projectiles
    this.projectiles.forEach(p => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Top HUD (Core HP & Combo)
    ctx.save();
    ctx.font = 'bold 15px Orbitron, sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(`ÉNERGIE NOYAU: ${'♦ '.repeat(this.coreHealth)}`, 20, 32);

    if (this.combo > 1) {
      ctx.fillStyle = '#ffe600';
      ctx.fillText(`COMBO x${this.combo} !`, this.canvas.width - 150, 32);
    }
    ctx.restore();

    // Particles and float text
    this.particles.draw(ctx);

    ctx.restore();
  }
}

window.VortexGame = VortexGame;
