/* =========================================================
   GAME 4: CYBER FLAP (QUANTUM LEAP)
   Cyberpunk Drone Runner with Laser Gates & Near-Miss Combos
   ========================================================= */

class FlapGame {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.onScore = null;
    this.onGameOver = null;
    this.particles = new ParticleSystem();

    this.drone = {
      x: 140,
      y: 250,
      vy: 0,
      gravity: 0.38,
      jumpForce: -7.5,
      radius: 14,
      rotation: 0
    };

    this.gates = [];
    this.coins = [];
    this.cityBuildings = [];
    this.gateTimer = 0;
    this.gateInterval = 100; // frames
    this.speed = 3.2;

    this.score = 0;
    this.combo = 1;
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

    // Generate parallax city skyline
    this.cityBuildings = [];
    for (let x = 0; x < this.canvas.width + 100; x += 35) {
      this.cityBuildings.push({
        x: x,
        width: Math.random() * 30 + 25,
        height: Math.random() * 180 + 80,
        color: Math.random() > 0.5 ? 'rgba(255, 0, 127, 0.08)' : 'rgba(0, 240, 255, 0.08)'
      });
    }

    this.reset();

    // Mouse click or touch anywhere on canvas to flap
    this.canvas.onpointerdown = () => {
      if (!this.running || this.paused) return;
      this.jump();
    };
  }

  reset() {
    this.drone.y = 220;
    this.drone.vy = 0;
    this.drone.rotation = 0;
    this.shield = window.cyberShop ? window.cyberShop.hasPerk('perk_shield') : false;
    this.gates = [];
    this.coins = [];
    this.gateTimer = 0;
    this.score = 0;
    this.combo = 1;
    this.particles.reset();
  }

  start() {
    this.reset();
    this.running = true;
    this.paused = false;
    this.jump();
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
      this.canvas.onpointerdown = null;
    }
    if (this.loopId) cancelAnimationFrame(this.loopId);
  }

  handleKey(e) {
    if (e.type === 'keydown' && (e.key === ' ' || e.key === 'Spacebar' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'z' || e.key === 'Z' || e.key === 'Enter')) {
      this.jump();
    }
  }

  handleTouch(action) {
    this.jump();
  }

  jump() {
    if (!this.running || this.paused) return;
    this.drone.vy = this.drone.jumpForce;

    // Thruster spark burst with skin color
    const droneColor = window.cyberShop ? window.cyberShop.getPlayerColor('#00f0ff') : '#00f0ff';
    this.particles.burst(this.drone.x - 10, this.drone.y, droneColor, 8, 3);
    if (window.soundEngine) window.soundEngine.playBounce();
  }

  spawnGate() {
    const gap = 145; // Gate opening height
    const topHeight = Math.random() * (this.canvas.height - gap - 120) + 60;
    const bottomY = topHeight + gap;

    this.gates.push({
      x: this.canvas.width + 20,
      width: 44,
      topHeight: topHeight,
      bottomY: bottomY,
      passed: false
    });

    // Spawn bonus cyber coin in the gap
    this.coins.push({
      x: this.canvas.width + 20 + 22,
      y: topHeight + gap / 2,
      radius: 9,
      collected: false
    });
  }

  update() {
    // Drone physics
    this.drone.vy += this.drone.gravity;
    this.drone.y += this.drone.vy;
    this.drone.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, this.drone.vy * 0.08));

    // Ceiling & Floor collision
    if (this.drone.y - this.drone.radius <= 0 || this.drone.y + this.drone.radius >= this.canvas.height) {
      if (this.shield) {
        this.shield = false;
        this.drone.vy = (this.drone.y <= 50) ? 4.5 : -5.5;
        this.drone.y = Math.max(this.drone.radius + 6, Math.min(this.canvas.height - this.drone.radius - 6, this.drone.y));
        this.particles.shake(12, 6);
        this.particles.burst(this.drone.x, this.drone.y, '#00ff88', 25, 5);
        this.particles.addFloatingText('🛡 CHOC ABSORBÉ !', this.drone.x, this.drone.y - 25, '#00ff88', 20);
        if (window.soundEngine) window.soundEngine.playBounce();
      } else {
        this.gameOver();
        return;
      }
    }

    // City scroll
    this.cityBuildings.forEach(b => {
      b.x -= 0.6;
      if (b.x + b.width < 0) {
        b.x = this.canvas.width;
        b.height = Math.random() * 180 + 80;
      }
    });

    // Gate spawner
    this.gateTimer++;
    if (this.gateTimer >= this.gateInterval) {
      this.gateTimer = 0;
      this.spawnGate();
    }

    // Update gates
    for (let i = this.gates.length - 1; i >= 0; i--) {
      const g = this.gates[i];
      g.x -= this.speed;

      // Gate collision check
      const dX = this.drone.x;
      const dY = this.drone.y;
      const r = this.drone.radius - 2;

      const hitTop = (dX + r > g.x && dX - r < g.x + g.width && dY - r < g.topHeight);
      const hitBottom = (dX + r > g.x && dX - r < g.x + g.width && dY + r > g.bottomY);

      if (hitTop || hitBottom) {
        if (this.shield) {
          this.shield = false;
          this.drone.vy = -4.5;
          g.x = this.drone.x - g.width - 15; // knock gate backwards
          this.particles.shake(14, 7);
          this.particles.burst(this.drone.x, this.drone.y, '#00ff88', 30, 6);
          this.particles.addFloatingText('🛡 BOUCLIER QUANTUM UTILISÉ !', this.drone.x, this.drone.y - 30, '#00ff88', 22);
          if (window.soundEngine) window.soundEngine.playBounce();
        } else {
          this.gameOver();
          return;
        }
      }

      // Successfully passed gate?
      if (!g.passed && g.x + g.width < this.drone.x) {
        g.passed = true;
        this.score += 1;
        this.onScore(this.score);
        if (window.challengeEngine && window.challengeEngine.isGameChallenge('flap')) {
          window.challengeEngine.checkProgress(this.score, this.particles, this.canvas.width, this.canvas.height);
        }

        // Near-miss risk bonus check
        const distToTop = (dY - r) - g.topHeight;
        const distToBottom = g.bottomY - (dY + r);
        if (distToTop < 18 || distToBottom < 18) {
          this.score += 3;
          this.onScore(this.score);
          this.particles.burst(this.drone.x, this.drone.y, '#ffe600', 16, 4);
          this.particles.addFloatingText('PROXIMITÉ RISQUÉE +3 !', this.drone.x, this.drone.y - 25, '#ffe600', 18);
          if (window.soundEngine) window.soundEngine.playPowerup();
        } else {
          this.particles.addFloatingText('+1', this.drone.x, this.drone.y - 20, '#00f0ff');
          if (window.soundEngine) window.soundEngine.playCoin();
        }
      }

      if (g.x + g.width < -30) {
        this.gates.splice(i, 1);
      }
    }

    // Shop Perk: Magnet attraction for cyber coins
    const hasMagnet = window.cyberShop && window.cyberShop.hasPerk('perk_magnet');

    // Update cyber coins
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      c.x -= this.speed;

      if (hasMagnet && !c.collected) {
        const dist = Math.hypot(c.x - this.drone.x, c.y - this.drone.y);
        if (dist < 160) {
          c.x += (this.drone.x - c.x) * 0.12;
          c.y += (this.drone.y - c.y) * 0.12;
          if (Math.random() < 0.25) {
            this.particles.burst(c.x, c.y, '#ffe600', 1, 1);
          }
        }
      }

      if (!c.collected && Math.hypot(c.x - this.drone.x, c.y - this.drone.y) < this.drone.radius + c.radius) {
        c.collected = true;
        this.score += 5;
        this.onScore(this.score);
        this.particles.burst(c.x, c.y, '#ffe600', 20, 4);
        this.particles.addFloatingText('+5 ORB', c.x, c.y, '#ffe600');
        if (window.soundEngine) window.soundEngine.playCoin();
      }

      if (c.x < -20 || c.collected) {
        this.coins.splice(i, 1);
      }
    }
  }

  gameOver() {
    this.running = false;
    this.particles.shake(20, 10);
    this.particles.burst(this.drone.x, this.drone.y, '#ff3366', 40, 7);
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

    // Deep synth background
    ctx.fillStyle = '#07091a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw background city skyline
    this.cityBuildings.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, this.canvas.height - b.height, b.width, b.height);
    });

    // Draw laser gates
    this.gates.forEach(g => {
      ctx.save();
      // Top gate
      ctx.fillStyle = 'rgba(255, 0, 127, 0.2)';
      ctx.strokeStyle = '#ff007f';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = 15;
      ctx.fillRect(g.x, 0, g.width, g.topHeight);
      ctx.strokeRect(g.x, 0, g.width, g.topHeight);

      // Bottom gate
      ctx.fillRect(g.x, g.bottomY, g.width, this.canvas.height - g.bottomY);
      ctx.strokeRect(g.x, g.bottomY, g.width, this.canvas.height - g.bottomY);

      // Laser emitters
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(g.x - 2, g.topHeight - 6, g.width + 4, 6);
      ctx.fillRect(g.x - 2, g.bottomY, g.width + 4, 6);
      ctx.restore();
    });

    // Draw coins
    this.coins.forEach(c => {
      if (c.collected) return;
      ctx.save();
      ctx.fillStyle = '#ffe600';
      ctx.shadowColor = '#ffe600';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('◆', c.x, c.y);
      ctx.restore();
    });

    // Draw Cyber Drone with equipped skin color
    const droneColor = window.cyberShop ? window.cyberShop.getPlayerColor('#00f0ff') : '#00f0ff';
    ctx.save();
    ctx.translate(this.drone.x, this.drone.y);
    ctx.rotate(this.drone.rotation);

    // Glowing drone body
    ctx.fillStyle = droneColor;
    ctx.shadowColor = droneColor;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(0, 0, this.drone.radius, 0, Math.PI * 2);
    ctx.fill();

    // Eye visor
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fillRect(4, -4, 7, 8);

    // Wings
    ctx.fillStyle = '#ff007f';
    ctx.fillRect(-12, -16, 6, 32);

    // Quantum Shield sphere
    if (this.shield) {
      ctx.strokeStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 16;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, this.drone.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // Shield HUD indicator
    if (this.shield) {
      ctx.save();
      ctx.font = 'bold 13px Orbitron, sans-serif';
      ctx.fillStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 8;
      ctx.fillText('🛡 BOUCLIER ACTIF', 20, 36);
      ctx.restore();
    }

    // Particles and float text
    this.particles.draw(ctx);

    ctx.restore();
  }
}

window.FlapGame = FlapGame;
