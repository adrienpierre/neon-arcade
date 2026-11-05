/* =========================================================
   GAME 3: LASER BREAKOUT (NEON ARKANOID)
   Multiballs, Explosive Bricks & Laser Paddle Cannon
   ========================================================= */

class BreakoutGame {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.onScore = null;
    this.onGameOver = null;
    this.particles = new ParticleSystem();

    this.paddle = {
      x: 350,
      y: 460,
      width: 100,
      height: 14,
      speed: 8,
      lasers: 0
    };

    this.balls = [];
    this.bricks = [];
    this.powerups = [];
    this.lasers = [];
    this.keys = {};

    this.score = 0;
    this.lives = 3;
    this.level = 1;
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

    this.reset();
  }

  reset() {
    this.paddle.x = this.canvas.width / 2;
    this.paddle.width = 100;
    this.paddle.lasers = 0;

    this.balls = [{
      x: this.canvas.width / 2,
      y: 440,
      vx: (Math.random() > 0.5 ? 4 : -4),
      vy: -5,
      radius: 6,
      trail: []
    }];

    this.score = 0;
    const hasShield = window.cyberShop ? window.cyberShop.hasPerk('perk_shield') : false;
    this.lives = hasShield ? 4 : 3;
    if (hasShield) {
      this.particles.addFloatingText('🛡 BOUCLIER QUANTUM: +1 VIE !', this.canvas.width / 2, 350, '#00ff88', 22);
    }
    this.level = 1;
    this.powerups = [];
    this.lasers = [];
    this.particles.reset();
    this.generateBricks();
  }

  generateBricks() {
    this.bricks = [];
    const rows = 5;
    const cols = 9;
    const padding = 8;
    const brickWidth = (this.canvas.width - (cols + 1) * padding) / cols;
    const brickHeight = 20;
    const colors = ['#ff007f', '#9d4edd', '#00f0ff', '#ffe600', '#00ff88'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = padding + c * (brickWidth + padding);
        const y = 60 + r * (brickHeight + padding);
        const isExplosive = Math.random() < 0.12;

        this.bricks.push({
          x: x,
          y: y,
          width: brickWidth,
          height: brickHeight,
          color: isExplosive ? '#ff3366' : colors[r % colors.length],
          hp: r === 0 ? 2 : 1,
          isExplosive: isExplosive
        });
      }
    }
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
    if (e.type === 'keydown') {
      this.keys[e.key] = true;
      if ((e.key === ' ' || e.key === 'Spacebar') && this.paddle.lasers > 0) {
        this.firePaddleLaser();
      }
    } else if (e.type === 'keyup') {
      this.keys[e.key] = false;
    }
  }

  handleTouch(action) {
    if (action === 'left') this.paddle.x = Math.max(this.paddle.width / 2, this.paddle.x - 35);
    if (action === 'right') this.paddle.x = Math.min(this.canvas.width - this.paddle.width / 2, this.paddle.x + 35);
    if ((action === 'action' || action === 'up') && this.paddle.lasers > 0) {
      this.firePaddleLaser();
    }
  }

  firePaddleLaser() {
    this.lasers.push({ x: this.paddle.x - this.paddle.width / 3, y: this.paddle.y - 10, vy: -9 });
    this.lasers.push({ x: this.paddle.x + this.paddle.width / 3, y: this.paddle.y - 10, vy: -9 });
    this.paddle.lasers -= 2;
    if (window.soundEngine) window.soundEngine.playLaser();
  }

  update() {
    // Paddle movement
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
      this.paddle.x -= this.paddle.speed;
    }
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
      this.paddle.x += this.paddle.speed;
    }

    // Keep paddle bounded
    this.paddle.x = Math.max(this.paddle.width / 2, Math.min(this.canvas.width - this.paddle.width / 2, this.paddle.x));

    // Update paddle lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      l.y += l.vy;

      // Hit brick?
      for (let j = this.bricks.length - 1; j >= 0; j--) {
        const b = this.bricks[j];
        if (l.x >= b.x && l.x <= b.x + b.width && l.y >= b.y && l.y <= b.y + b.height) {
          this.destroyBrick(j);
          this.lasers.splice(i, 1);
          break;
        }
      }

      if (l.y < 0) this.lasers.splice(i, 1);
    }

    // Update balls
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];

      // Trail
      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 6) ball.trail.shift();

      ball.x += ball.vx;
      ball.y += ball.vy;

      // Wall bounce
      if (ball.x - ball.radius <= 0) {
        ball.x = ball.radius;
        ball.vx = Math.abs(ball.vx);
        if (window.soundEngine) window.soundEngine.playBounce();
      } else if (ball.x + ball.radius >= this.canvas.width) {
        ball.x = this.canvas.width - ball.radius;
        ball.vx = -Math.abs(ball.vx);
        if (window.soundEngine) window.soundEngine.playBounce();
      }
      if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.vy = Math.abs(ball.vy);
        if (window.soundEngine) window.soundEngine.playBounce();
      }

      // Paddle collision
      const pLeft = this.paddle.x - this.paddle.width / 2;
      const pRight = this.paddle.x + this.paddle.width / 2;
      const pTop = this.paddle.y;
      const pBottom = this.paddle.y + this.paddle.height;

      if (ball.y + ball.radius >= pTop && ball.y - ball.radius <= pBottom &&
          ball.x >= pLeft && ball.x <= pRight && ball.vy > 0) {
        // Angle deflection based on hit position
        const hitOffset = (ball.x - this.paddle.x) / (this.paddle.width / 2);
        const speed = Math.hypot(ball.vx, ball.vy);
        ball.vx = hitOffset * 6.5;
        ball.vy = -Math.sqrt(Math.max(16, speed * speed - ball.vx * ball.vx));

        this.particles.burst(ball.x, pTop, '#00f0ff', 12, 3);
        if (window.soundEngine) window.soundEngine.playBounce();
      }

      // Brick collision
      for (let j = this.bricks.length - 1; j >= 0; j--) {
        const b = this.bricks[j];
        if (ball.x + ball.radius >= b.x && ball.x - ball.radius <= b.x + b.width &&
            ball.y + ball.radius >= b.y && ball.y - ball.radius <= b.y + b.height) {
          // Bounce ball
          ball.vy = -ball.vy;
          this.destroyBrick(j);
          break;
        }
      }

      // Ball fell off bottom
      if (ball.y - ball.radius > this.canvas.height) {
        this.balls.splice(i, 1);
      }
    }

    // Check if all balls lost
    if (this.balls.length === 0) {
      this.lives--;
      this.particles.shake(15, 6);
      if (window.soundEngine) window.soundEngine.playExplosion();

      if (this.lives <= 0) {
        this.gameOver();
        return;
      } else {
        // Respawn single ball
        this.balls.push({
          x: this.paddle.x,
          y: 440,
          vx: (Math.random() > 0.5 ? 4 : -4),
          vy: -5,
          radius: 6,
          trail: []
        });
      }
    }

    // Check level clear
    if (this.bricks.length === 0) {
      this.level++;
      this.score += 300;
      this.onScore(this.score);
      this.particles.confetti(this.canvas.width, this.canvas.height);
      this.particles.addFloatingText(`MANCHE ${this.level} ! +300 PTS`, this.canvas.width / 2, 200, '#ffe600', 24);
      if (window.soundEngine) window.soundEngine.playPowerup();
      this.generateBricks();
    }

    // Shop Perk: Magnet attraction for falling powerups
    const hasMagnet = window.cyberShop && window.cyberShop.hasPerk('perk_magnet');

    // Update powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.y += 2.5;

      if (hasMagnet && p.y > 140) {
        if (Math.abs(p.x - this.paddle.x) < 220) {
          p.x += (this.paddle.x - p.x) * 0.08;
          if (Math.random() < 0.2) {
            this.particles.burst(p.x, p.y, '#00f0ff', 1, 1);
          }
        }
      }

      // Paddle catch?
      const pLeft = this.paddle.x - this.paddle.width / 2;
      const pRight = this.paddle.x + this.paddle.width / 2;
      if (p.y >= this.paddle.y && p.y <= this.paddle.y + this.paddle.height &&
          p.x >= pLeft && p.x <= pRight) {

        if (p.type === 'multiball') {
          // Add 2 balls
          this.balls.push({
            x: this.paddle.x,
            y: this.paddle.y - 10,
            vx: -3.5,
            vy: -5,
            radius: 6,
            trail: []
          });
          this.balls.push({
            x: this.paddle.x,
            y: this.paddle.y - 10,
            vx: 3.5,
            vy: -5,
            radius: 6,
            trail: []
          });
          this.particles.addFloatingText('MULTI-BILLES !', p.x, p.y, '#00f0ff');
        } else if (p.type === 'wide') {
          this.paddle.width = Math.min(180, this.paddle.width + 40);
          this.particles.addFloatingText('PADDLE LARGE !', p.x, p.y, '#00ff88');
        } else if (p.type === 'laser') {
          this.paddle.lasers += 16;
          this.particles.addFloatingText('LASER CANNON X16 !', p.x, p.y, '#ff007f');
        }

        if (window.soundEngine) window.soundEngine.playPowerup();
        this.particles.burst(p.x, p.y, '#ffe600', 20, 4);
        this.powerups.splice(i, 1);
        continue;
      }

      if (p.y > this.canvas.height + 20) {
        this.powerups.splice(i, 1);
      }
    }
  }

  destroyBrick(idx) {
    const b = this.bricks[idx];
    b.hp--;

    if (b.hp <= 0) {
      const pts = b.isExplosive ? 35 : 20;
      this.score += pts;
      this.onScore(this.score);
      if (window.challengeEngine && window.challengeEngine.isGameChallenge('breakout')) {
        window.challengeEngine.checkProgress(this.score, this.particles, this.canvas.width, this.canvas.height);
      }

      this.particles.burst(b.x + b.width / 2, b.y + b.height / 2, b.color, 16, 4);
      if (window.soundEngine) window.soundEngine.playCoin();

      // Explosive brick chain reaction
      if (b.isExplosive) {
        this.particles.shake(12, 6);
        if (window.soundEngine) window.soundEngine.playExplosion();
        // Blow up adjacent bricks
        for (let k = this.bricks.length - 1; k >= 0; k--) {
          if (k !== idx) {
            const ob = this.bricks[k];
            if (Math.hypot((ob.x + ob.width / 2) - (b.x + b.width / 2), (ob.y + ob.height / 2) - (b.y + b.height / 2)) < 65) {
              this.score += 20;
              this.particles.burst(ob.x + ob.width / 2, ob.y + ob.height / 2, ob.color, 12, 4);
              this.bricks.splice(k, 1);
              if (k < idx) idx--;
            }
          }
        }
      }

      // Powerup drop chance (20%)
      if (Math.random() < 0.22) {
        const types = ['multiball', 'wide', 'laser'];
        this.powerups.push({
          x: b.x + b.width / 2,
          y: b.y + b.height / 2,
          type: types[Math.floor(Math.random() * types.length)]
        });
      }

      this.bricks.splice(idx, 1);
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

    // Deep canvas background
    ctx.fillStyle = '#060714';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw bricks
    this.bricks.forEach(b => {
      ctx.save();
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 10;
      ctx.fillRect(b.x, b.y, b.width, b.height);

      // Inner highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(b.x + 2, b.y + 2, b.width - 4, 3);
      ctx.restore();
    });

    // Draw paddle with equipped skin color
    const paddleColor = window.cyberShop ? window.cyberShop.getPlayerColor('#00f0ff') : '#00f0ff';
    ctx.save();
    const pLeft = this.paddle.x - this.paddle.width / 2;
    ctx.fillStyle = paddleColor;
    ctx.shadowColor = paddleColor;
    ctx.shadowBlur = 16;
    ctx.fillRect(pLeft, this.paddle.y, this.paddle.width, this.paddle.height);

    if (this.paddle.lasers > 0) {
      ctx.fillStyle = '#ff007f';
      ctx.fillRect(pLeft - 4, this.paddle.y - 4, 6, 8);
      ctx.fillRect(pLeft + this.paddle.width - 2, this.paddle.y - 4, 6, 8);
    }
    ctx.restore();

    // Draw paddle lasers
    ctx.save();
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 12;
    this.lasers.forEach(l => {
      ctx.fillRect(l.x - 2, l.y - 6, 4, 12);
    });
    ctx.restore();

    // Draw balls & trails
    this.balls.forEach(ball => {
      // Trail
      ball.trail.forEach((t, i) => {
        ctx.save();
        ctx.fillStyle = paddleColor;
        ctx.globalAlpha = i / 10;
        ctx.beginPath();
        ctx.arc(t.x, t.y, ball.radius * (i / ball.trail.length), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Ball head
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = paddleColor;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw falling powerups
    this.powerups.forEach(p => {
      ctx.save();
      const color = p.type === 'multiball' ? '#00f0ff' : (p.type === 'wide' ? '#00ff88' : '#ff007f');
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const symbol = p.type === 'multiball' ? '●●' : (p.type === 'wide' ? '↔' : '⚡');
      ctx.fillText(symbol, p.x, p.y);
      ctx.restore();
    });

    // Lives indicator
    ctx.save();
    ctx.font = 'bold 13px Orbitron, sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(`VIES: ${'❤ '.repeat(this.lives)}`, 20, 30);
    ctx.fillText(`MANCHE: ${this.level}`, this.canvas.width - 120, 30);
    ctx.restore();

    // Particles and float text
    this.particles.draw(ctx);

    ctx.restore();
  }
}

window.BreakoutGame = BreakoutGame;
