/* =========================================================
   GAME 1: NEON SNAKE (CYBER SERPENT) V2
   Turbo Lightcycle Boost & Quantum Teleportation Wormholes
   ========================================================= */

class SnakeGame {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.onScore = null;
    this.onGameOver = null;
    this.particles = new ParticleSystem();

    this.gridSize = 20;
    this.tileCountX = 35;
    this.tileCountY = 25;

    this.snake = [];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.food = { x: 15, y: 12, type: 'normal' };
    this.bonusFood = null;
    this.portals = []; // { x1, y1, x2, y2 }

    this.score = 0;
    this.combo = 1;
    this.lastEatTime = 0;
    this.powerup = null;
    this.powerupTime = 0;
    this.isTurbo = false;

    this.speed = 95;
    this.running = false;
    this.paused = false;
    this.loopId = null;
    this.lastTick = 0;
  }

  init(canvas, onScore, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScore = onScore;
    this.onGameOver = onGameOver;

    this.canvas.width = 700;
    this.canvas.height = 500;
    this.tileCountX = this.canvas.width / this.gridSize;
    this.tileCountY = this.canvas.height / this.gridSize;

    this.reset();
  }

  reset() {
    this.snake = [
      { x: 10, y: 12 },
      { x: 9, y: 12 },
      { x: 8, y: 12 }
    ];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.score = 0;
    this.combo = 1;
    this.powerup = null;
    this.powerupTime = 0;
    this.isTurbo = false;
    this.bonusFood = null;
    this.shield = window.cyberShop ? window.cyberShop.hasPerk('perk_shield') : false;
    this.particles.reset();

    // Spawn Portals
    this.portals = [
      { x: 4, y: 4, targetX: 30, targetY: 20, color: '#00f0ff' },
      { x: 30, y: 20, targetX: 4, targetY: 4, color: '#ff7b00' }
    ];

    this.spawnFood();
  }

  start() {
    this.reset();
    this.running = true;
    this.paused = false;
    this.lastTick = performance.now();
    this.loop();
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
    this.lastTick = performance.now();
    this.loop();
  }

  stop() {
    this.running = false;
    this.isTurbo = false;
    if (this.canvas) {
      this.canvas.onpointerdown = null;
      this.canvas.onpointermove = null;
    }
    if (this.loopId) cancelAnimationFrame(this.loopId);
  }

  spawnFood() {
    let valid = false;
    while (!valid) {
      this.food = {
        x: Math.floor(Math.random() * this.tileCountX),
        y: Math.floor(Math.random() * this.tileCountY),
        type: 'normal'
      };
      valid = !this.snake.some(s => s.x === this.food.x && s.y === this.food.y) &&
              !this.portals.some(p => p.x === this.food.x && p.y === this.food.y);
    }

    if (Math.random() < 0.28 && !this.bonusFood) {
      let bValid = false;
      let bx, by;
      while (!bValid) {
        bx = Math.floor(Math.random() * this.tileCountX);
        by = Math.floor(Math.random() * this.tileCountY);
        bValid = !this.snake.some(s => s.x === bx && s.y === by) &&
                 !this.portals.some(p => p.x === bx && p.y === by);
      }
      this.bonusFood = {
        x: bx,
        y: by,
        type: Math.random() < 0.5 ? 'golden' : 'ghost',
        life: 220
      };
    }
  }

  handleKey(e) {
    if (e.type === 'keydown') {
      if (e.key === ' ' || e.key === 'Shift') {
        this.isTurbo = true;
      }
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
        case 'z':
        case 'Z':
          if (this.dir.y === 0) this.nextDir = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (this.dir.y === 0) this.nextDir = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
        case 'q':
        case 'Q':
          if (this.dir.x === 0) this.nextDir = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (this.dir.x === 0) this.nextDir = { x: 1, y: 0 };
          break;
      }
    } else if (e.type === 'keyup') {
      if (e.key === ' ' || e.key === 'Shift') {
        this.isTurbo = false;
      }
    }
  }

  handleTouch(action) {
    if (action === 'up' && this.dir.y === 0) this.nextDir = { x: 0, y: -1 };
    if (action === 'down' && this.dir.y === 0) this.nextDir = { x: 0, y: 1 };
    if (action === 'left' && this.dir.x === 0) this.nextDir = { x: -1, y: 0 };
    if (action === 'right' && this.dir.x === 0) this.nextDir = { x: 1, y: 0 };
    if (action === 'turbo_start') this.isTurbo = true;
    if (action === 'turbo_end') this.isTurbo = false;
    if (action === 'action' || action === 'turbo') this.isTurbo = !this.isTurbo;
    if (navigator.vibrate) {
      try { navigator.vibrate(8); } catch(e) {}
    }
  }

  update() {
    this.dir = this.nextDir;
    let head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };

    // Check Quantum Wormhole Portal
    for (let i = 0; i < this.portals.length; i++) {
      const p = this.portals[i];
      if (head.x === p.x && head.y === p.y) {
        head.x = p.targetX + this.dir.x;
        head.y = p.targetY + this.dir.y;
        this.particles.burst(p.targetX * this.gridSize, p.targetY * this.gridSize, p.color, 25, 5);
        this.particles.addFloatingText('TÉLÉPORTATION !', head.x * this.gridSize, head.y * this.gridSize, p.color);
        if (window.soundEngine) window.soundEngine.playPowerup();
        break;
      }
    }

    // Ghost or Wall collision
    if (this.powerup === 'ghost') {
      if (head.x < 0) head.x = this.tileCountX - 1;
      if (head.x >= this.tileCountX) head.x = 0;
      if (head.y < 0) head.y = this.tileCountY - 1;
      if (head.y >= this.tileCountY) head.y = 0;
    } else {
      if (head.x < 0 || head.x >= this.tileCountX || head.y < 0 || head.y >= this.tileCountY) {
        if (this.shield) {
          this.shield = false;
          head.x = Math.max(0, Math.min(this.tileCountX - 1, head.x));
          head.y = Math.max(0, Math.min(this.tileCountY - 1, head.y));
          this.particles.shake(12, 6);
          this.particles.burst(head.x * this.gridSize, head.y * this.gridSize, '#00ff88', 25, 4);
          this.particles.addFloatingText('🛡 CHOC ABSORBÉ !', head.x * this.gridSize, head.y * this.gridSize, '#00ff88', 20);
          if (window.soundEngine) window.soundEngine.playBounce();
        } else {
          this.gameOver();
          return;
        }
      }
    }

    // Self collision
    if (this.powerup !== 'ghost') {
      for (let i = 0; i < this.snake.length; i++) {
        if (this.snake[i].x === head.x && this.snake[i].y === head.y) {
          if (this.shield) {
            this.shield = false;
            this.snake = this.snake.slice(0, Math.max(3, this.snake.length - 3));
            this.particles.shake(12, 6);
            this.particles.burst(head.x * this.gridSize, head.y * this.gridSize, '#00ff88', 25, 4);
            this.particles.addFloatingText('🛡 BOUCLIER QUANTUM UTILISÉ !', head.x * this.gridSize, head.y * this.gridSize, '#00ff88', 20);
            if (window.soundEngine) window.soundEngine.playBounce();
            break;
          } else {
            this.gameOver();
            return;
          }
        }
      }
    }

    this.snake.unshift(head);

    // Shop Perk: Magnet attraction for food
    if (window.cyberShop && window.cyberShop.hasPerk('perk_magnet')) {
      const dx = head.x - this.food.x;
      const dy = head.y - this.food.y;
      if (Math.abs(dx) <= 3 && Math.abs(dy) <= 3) {
        if (Math.abs(dx) > Math.abs(dy)) {
          this.food.x += Math.sign(dx);
        } else {
          this.food.y += Math.sign(dy);
        }
        const fx = this.food.x * this.gridSize + this.gridSize / 2;
        const fy = this.food.y * this.gridSize + this.gridSize / 2;
        this.particles.burst(fx, fy, '#00f0ff', 2, 1);
      }
    }

    // Food collision
    let ate = false;
    const now = performance.now();
    if (head.x === this.food.x && head.y === this.food.y) {
      ate = true;
      if (now - this.lastEatTime < 3500) {
        this.combo = Math.min(5, this.combo + 1);
      } else {
        this.combo = 1;
      }
      this.lastEatTime = now;

      let pts = 10 * this.combo;
      if (this.isTurbo) {
        const hasNitro = window.cyberShop && window.cyberShop.hasPerk('perk_nitro_boost');
        pts *= hasNitro ? 3 : 2; // Nitro Perk triples turbo points!
      }
      this.score += pts;
      this.onScore(this.score);
      if (window.challengeEngine && window.challengeEngine.isGameChallenge('snake')) {
        window.challengeEngine.checkProgress(this.score, this.particles, this.canvas.width, this.canvas.height);
      }

      const px = head.x * this.gridSize + this.gridSize / 2;
      const py = head.y * this.gridSize + this.gridSize / 2;
      this.particles.burst(px, py, '#00f0ff', 15);
      const txt = this.isTurbo && window.cyberShop && window.cyberShop.hasPerk('perk_nitro_boost') ? `+${pts} (NITRO 3X!)` : (this.combo > 1 ? `+${pts} (x${this.combo})` : `+${pts}`);
      this.particles.addFloatingText(txt, px, py, '#00f0ff');
      if (window.soundEngine) window.soundEngine.playCoin();

      this.spawnFood();
    }

    // Bonus food collision
    if (this.bonusFood && head.x === this.bonusFood.x && head.y === this.bonusFood.y) {
      ate = true;
      const px = head.x * this.gridSize + this.gridSize / 2;
      const py = head.y * this.gridSize + this.gridSize / 2;

      if (this.bonusFood.type === 'golden') {
        const bonusPts = 75;
        this.score += bonusPts;
        this.particles.burst(px, py, '#ffe600', 30, 6);
        this.particles.addFloatingText(`ORB D'OR +${bonusPts}!`, px, py, '#ffe600', 22);
        if (window.soundEngine) window.soundEngine.playPowerup();
      } else if (this.bonusFood.type === 'ghost') {
        this.powerup = 'ghost';
        this.powerupTime = 70;
        this.particles.burst(px, py, '#ff007f', 30, 6);
        this.particles.addFloatingText('MODE FANTÔME ACTIF !', px, py, '#ff007f', 20);
        if (window.soundEngine) window.soundEngine.playPowerup();
      }

      this.onScore(this.score);
      this.bonusFood = null;
    }

    if (!ate) {
      this.snake.pop();
    }

    if (this.powerup) {
      this.powerupTime--;
      if (this.powerupTime <= 0) this.powerup = null;
    }
    if (this.bonusFood) {
      this.bonusFood.life--;
      if (this.bonusFood.life <= 0) this.bonusFood = null;
    }
  }

  gameOver() {
    this.running = false;
    this.particles.shake(18, 8);
    const head = this.snake[0];
    this.particles.burst(
      head.x * this.gridSize + this.gridSize / 2,
      head.y * this.gridSize + this.gridSize / 2,
      '#ff3366', 40, 7
    );
    if (window.soundEngine) window.soundEngine.playGameOver();
    setTimeout(() => {
      this.onGameOver(this.score);
    }, 700);
  }

  loop() {
    if (!this.running || this.paused) return;

    const now = performance.now();
    let currentSpeed = Math.max(50, this.speed - Math.floor(this.score / 30) * 3);
    if (this.isTurbo) currentSpeed = Math.floor(currentSpeed * 0.45); // 2x Turbo speed!

    if (now - this.lastTick >= currentSpeed) {
      this.update();
      this.lastTick = now;
    }

    this.particles.update();
    this.draw();

    this.loopId = requestAnimationFrame(() => this.loop());
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.particles.shakeX, this.particles.shakeY);

    ctx.fillStyle = '#080a1c';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Subtle cyber grid dots
    ctx.fillStyle = 'rgba(0, 240, 255, 0.05)';
    for (let x = 0; x < this.canvas.width; x += this.gridSize) {
      for (let y = 0; y < this.canvas.height; y += this.gridSize) {
        ctx.fillRect(x + this.gridSize / 2 - 1, y + this.gridSize / 2 - 1, 2, 2);
      }
    }

    // Draw Quantum Portals
    this.portals.forEach(p => {
      const px = p.x * this.gridSize + this.gridSize / 2;
      const py = p.y * this.gridSize + this.gridSize / 2;
      ctx.save();
      ctx.strokeStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 18;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px, py, this.gridSize / 2 + 2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🌀', px, py);
      ctx.restore();
    });

    // Draw normal food
    const fx = this.food.x * this.gridSize + this.gridSize / 2;
    const fy = this.food.y * this.gridSize + this.gridSize / 2;
    ctx.save();
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(fx, fy, this.gridSize / 2 - 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw bonus food
    if (this.bonusFood) {
      const bx = this.bonusFood.x * this.gridSize + this.gridSize / 2;
      const by = this.bonusFood.y * this.gridSize + this.gridSize / 2;
      const bColor = this.bonusFood.type === 'golden' ? '#ffe600' : '#ff007f';
      ctx.save();
      ctx.fillStyle = bColor;
      ctx.shadowColor = bColor;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(bx, by, this.gridSize / 2 - 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw snake body with equipped cyber skin
    const snakeColor = window.cyberShop ? window.cyberShop.getPlayerColor('#00f0ff') : '#00f0ff';

    for (let i = this.snake.length - 1; i >= 0; i--) {
      const seg = this.snake[i];
      const isHead = i === 0;
      const sx = seg.x * this.gridSize;
      const sy = seg.y * this.gridSize;

      ctx.save();
      if (this.isTurbo) {
        ctx.fillStyle = isHead ? '#ffffff' : '#ffe600';
        ctx.shadowColor = '#ffe600';
      } else if (this.powerup === 'ghost') {
        ctx.fillStyle = isHead ? '#ffffff' : 'rgba(255, 0, 127, 0.65)';
        ctx.shadowColor = '#ff007f';
      } else {
        ctx.fillStyle = isHead ? '#ffffff' : snakeColor;
        ctx.shadowColor = snakeColor;
      }
      ctx.shadowBlur = isHead ? 18 : 8;
      ctx.fillRect(sx + 2, sy + 2, this.gridSize - 4, this.gridSize - 4);

      // Quantum Shield aura around head
      if (isHead && this.shield) {
        ctx.strokeStyle = '#00ff88';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 14;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(sx + this.gridSize / 2, sy + this.gridSize / 2, this.gridSize * 0.9, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // HUD indicators: Turbo & Shield
    ctx.save();
    ctx.font = 'bold 13px Orbitron, sans-serif';
    if (this.isTurbo) {
      const hasNitro = window.cyberShop && window.cyberShop.hasPerk('perk_nitro_boost');
      ctx.fillStyle = '#ffe600';
      ctx.fillText(hasNitro ? '⚡ NITRO BOOST 3X !' : '⚡ TURBO LIGHTCYCLE 2X !', 20, 30);
    }
    if (this.shield) {
      ctx.fillStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 8;
      ctx.fillText('🛡 BOUCLIER QUANTUM ACTIF', this.canvas.width - 240, 30);
    }
    ctx.restore();

    this.particles.draw(ctx);
    ctx.restore();
  }
}

window.SnakeGame = SnakeGame;
