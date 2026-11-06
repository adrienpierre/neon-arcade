/* =========================================================
   GAME 2: SPACE VOID DEFENDER (GALAXY BLASTER) V2
   Fast-paced Neon Shmup with MEGA BOSS BATTLES & Powerups
   ========================================================= */

class SpaceGame {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.onScore = null;
    this.onGameOver = null;
    this.particles = new ParticleSystem();

    this.player = {
      x: 350,
      y: 440,
      width: 32,
      height: 32,
      speed: 7,
      shield: false,
      tripleShot: 0
    };

    this.keys = {};
    this.lasers = [];
    this.enemies = [];
    this.enemyLasers = [];
    this.powerups = [];
    this.stars = [];

    // Boss Battle State
    this.boss = null;
    this.bossAlert = 0;
    this.nextBossScore = 1800;

    this.score = 0;
    this.wave = 1;
    this.lastWave = 1;
    this.gameTime = 0;
    this.lastShotTime = 0;
    this.fireRate = 180;
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

    this.stars = [];
    for (let i = 0; i < 50; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        speed: Math.random() * 2 + 1,
        size: Math.random() * 2 + 1
      });
    }

    // Mouse movement for PC ship positioning & firing
    this.canvas.onpointermove = (e) => {
      if (!this.running || this.paused) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      this.player.x = Math.max(20, Math.min(this.canvas.width - 20, x));
    };

    this.canvas.onpointerdown = () => {
      if (!this.running || this.paused) return;
      this.shoot();
    };

    this.reset();
  }

  reset() {
    this.player.x = this.canvas.width / 2;
    this.player.y = this.canvas.height - 60;
    // Shop Perk: Starting Quantum Overshield
    this.player.shield = window.cyberShop ? window.cyberShop.hasPerk('perk_shield') : false;
    this.player.tripleShot = 0;
    this.bulletTime = 0;

    this.lasers = [];
    this.enemies = [];
    this.enemyLasers = [];
    this.powerups = [];
    this.boss = null;
    this.bossAlert = 0;
    this.nextBossScore = 1800;
    this.score = 0;
    this.wave = 1;
    this.lastWave = 1;
    this.gameTime = 0;
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
    if (this.canvas) {
      this.canvas.onpointermove = null;
      this.canvas.onpointerdown = null;
    }
    if (this.loopId) cancelAnimationFrame(this.loopId);
  }

  handleKey(e) {
    if (e.type === 'keydown') {
      this.keys[e.key] = true;
      if (e.key === ' ' || e.key === 'Spacebar') {
        this.shoot();
      }
      if ((e.key === 'b' || e.key === 'B') && window.cyberShop && window.cyberShop.hasPerk('perk_bullet_time') && this.bulletTime <= 0) {
        this.bulletTime = 180; // 3 seconds Matrix slow motion
        this.particles.shake(10, 4);
        this.particles.addFloatingText('⏱ MATRIX BULLET TIME !', this.player.x, this.player.y - 40, '#00ff88', 24);
        if (window.soundEngine) window.soundEngine.playPowerup();
      }
    } else if (e.type === 'keyup') {
      this.keys[e.key] = false;
    }
  }

  handleTouch(action) {
    if (action === 'left') this.player.x = Math.max(20, this.player.x - 30);
    if (action === 'right') this.player.x = Math.min(this.canvas.width - 20, this.player.x + 30);
    if (action === 'up' || action === 'action') this.shoot();
    if (action === 'hold' || action === 'bullet') {
      if (window.cyberShop && window.cyberShop.hasPerk('perk_bullet_time') && this.bulletTime <= 0) {
        this.bulletTime = 180;
        this.particles.shake(10, 4);
        this.particles.addFloatingText('⏱ MATRIX BULLET TIME !', this.player.x, this.player.y - 40, '#00ff88', 24);
        if (window.soundEngine) window.soundEngine.playPowerup();
      }
    }
  }

  handleDrag(x, y) {
    if (!this.running || this.paused) return;
    this.player.x = Math.max(20, Math.min(this.canvas.width - 20, x));
    this.shoot();
  }

  shoot() {
    const now = performance.now();
    if (now - this.lastShotTime < this.fireRate) return;
    this.lastShotTime = now;

    if (this.player.tripleShot > 0) {
      this.lasers.push({ x: this.player.x - 12, y: this.player.y, vx: -2.5, vy: -10 });
      this.lasers.push({ x: this.player.x, y: this.player.y - 6, vx: 0, vy: -10 });
      this.lasers.push({ x: this.player.x + 12, y: this.player.y, vx: 2.5, vy: -10 });
      this.player.tripleShot--;
    } else {
      this.lasers.push({ x: this.player.x, y: this.player.y - 6, vx: 0, vy: -10 });
    }

    if (window.soundEngine) window.soundEngine.playLaser();
  }

  spawnBoss() {
    this.boss = {
      x: this.canvas.width / 2,
      y: -100,
      targetY: 90,
      width: 180,
      height: 80,
      hp: 45,
      maxHp: 45,
      vx: 2.2,
      attackTimer: 0,
      phase: 1
    };
    this.bossAlert = 100;
    this.particles.shake(25, 8);
    if (window.soundEngine) {
      window.soundEngine.playKlaxon();
      window.soundEngine.announce('ALERTE ! TITAN CYBERNÉTIQUE DÉTECTÉ !');
    }
  }

  spawnEnemy() {
    if (this.boss) return; // Don't spawn normal hordes during boss

    // Progressive enemy types according to current wave
    let types = ['drone'];
    if (this.wave === 2) {
      types = ['drone', 'drone', 'drone', 'cruiser'];
    } else if (this.wave === 3) {
      types = ['drone', 'drone', 'cruiser', 'meteor'];
    } else if (this.wave >= 4) {
      types = ['drone', 'cruiser', 'cruiser', 'meteor'];
    }

    const chosenType = types[Math.floor(Math.random() * types.length)];
    const x = Math.random() * (this.canvas.width - 60) + 30;

    let hp = 1;
    // Base speed scales smoothly with wave
    const baseSpeed = 1.3 + Math.min(2.0, (this.wave - 1) * 0.25);
    let speed = baseSpeed + Math.random() * 0.7;
    let size = 24;

    if (chosenType === 'cruiser') {
      hp = 3;
      speed = Math.max(1.0, baseSpeed * 0.75);
      size = 32;
    } else if (chosenType === 'meteor') {
      hp = 2;
      speed = Math.min(4.2, baseSpeed * 1.5);
      size = 28;
    }

    this.enemies.push({
      x: x,
      y: -30,
      vx: (Math.random() - 0.5) * (1.0 + this.wave * 0.15),
      speed: speed,
      type: chosenType,
      hp: hp,
      size: size,
      shootTimer: Math.random() * 60 + (this.wave === 2 ? 140 : 100)
    });
  }

  update() {
    const timeScale = (this.bulletTime > 0) ? 0.35 : 1.0;
    if (this.bulletTime > 0) this.bulletTime--;
    this.gameTime++;

    if (window.challengeEngine && window.challengeEngine.isGameChallenge('space')) {
      window.challengeEngine.checkProgress(this.score, this.particles, this.canvas.width, this.canvas.height);
    }

    // Dynamic wave progression over time and score
    if (!this.boss) {
      const timeWave = Math.floor(this.gameTime / 950);
      const scoreWave = Math.floor(this.score / 500);
      this.wave = Math.max(1, 1 + Math.max(timeWave, scoreWave));

      if (this.wave > this.lastWave) {
        this.lastWave = this.wave;
        const waveTitles = {
          2: 'ESCADRILLE EN APPROCHE',
          3: 'CHAMP DE MÉTÉORES & CROISEURS',
          4: 'ZONE DE COMBAT INTENSE',
          5: 'SURCHARGE COSMIQUE'
        };
        const title = waveTitles[this.wave] || `SECTEUR ${this.wave}`;
        this.particles.shake(12, 5);
        this.particles.addFloatingText(`⚡ VAGUE ${this.wave} : ${title}`, this.canvas.width / 2, 220, '#00f0ff', 24);
        if (window.soundEngine) window.soundEngine.playPowerup();
      }
    }

    // Controls (Arrow keys + WASD + ZQSD)
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A'] || this.keys['q'] || this.keys['Q']) {
      this.player.x -= this.player.speed;
    }
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
      this.player.x += this.player.speed;
    }
    if (this.keys[' '] || this.keys['Spacebar']) {
      this.shoot();
    }

    this.player.x = Math.max(20, Math.min(this.canvas.width - 20, this.player.x));

    const pColor = window.cyberShop ? window.cyberShop.getPlayerColor('#00f0ff') : '#00f0ff';

    // Thruster sparks
    if (Math.random() < 0.6) {
      this.particles.particles.push({
        x: this.player.x + (Math.random() - 0.5) * 8,
        y: this.player.y + 16,
        vx: (Math.random() - 0.5) * 1.5,
        vy: Math.random() * 3 + 2,
        size: Math.random() * 3 + 1,
        color: pColor,
        alpha: 1,
        life: 0.6,
        decay: 0.05,
        gravity: 0
      });
    }

    // Stars scrolling
    this.stars.forEach(s => {
      s.y += s.speed * (this.bulletTime > 0 ? 0.5 : 1.0);
      if (s.y > this.canvas.height) {
        s.y = 0;
        s.x = Math.random() * this.canvas.width;
      }
    });

    // Check Boss Spawn trigger
    if (!this.boss && this.score >= this.nextBossScore) {
      // Clear small enemies with a flash so battle is 1-on-1
      this.enemies.forEach(e => {
        this.particles.burst(e.x, e.y, '#00f0ff', 12, 3);
      });
      this.enemies = [];
      this.enemyLasers = [];

      // Pre-boss supply drops
      this.powerups.push({ x: this.canvas.width / 2 - 40, y: 140, type: 'shield', vy: 1.5 });
      this.powerups.push({ x: this.canvas.width / 2 + 40, y: 140, type: 'triple', vy: 1.5 });

      this.spawnBoss();
      this.nextBossScore += 2500;
    }

    if (this.bossAlert > 0) this.bossAlert--;

    // Update Boss
    if (this.boss) {
      if (this.boss.y < this.boss.targetY) {
        this.boss.y += 1.5 * timeScale;
      } else {
        this.boss.x += this.boss.vx * timeScale;
        if (this.boss.x < 120 || this.boss.x > this.canvas.width - 120) {
          this.boss.vx *= -1;
        }

        // Check Phase Transitions
        if (this.boss.hp <= 25 && this.boss.phase === 1) {
          this.boss.phase = 2;
          this.boss.vx = 3.2;
          this.particles.shake(25, 12);
          this.particles.addFloatingText('⚠ TITAN PHASE 2 : FUREUR QUANTIQUE !', this.boss.x, this.boss.y - 30, '#ff007f', 24);
          if (window.soundEngine) {
            window.soundEngine.playKlaxon();
            window.soundEngine.announce('ALERTE ! TITAN PHASE DEUX !');
          }
        } else if (this.boss.hp <= 10 && this.boss.phase === 2) {
          this.boss.phase = 3;
          this.boss.vx = 4.2;
          this.particles.shake(35, 16);
          this.particles.addFloatingText('🔥 SURCHARGE CRITIQUE DU NOYAU !', this.boss.x, this.boss.y - 30, '#ffe600', 26);
          if (window.soundEngine) {
            window.soundEngine.playExplosion(true);
            window.soundEngine.announce('SURCHARGE CRITIQUE DU TITAN !');
          }
        }

        // Boss attacks based on Phase
        this.boss.attackTimer += timeScale;
        const attackInterval = this.boss.phase === 3 ? 20 : (this.boss.phase === 2 ? 30 : 42);
        if (Math.floor(this.boss.attackTimer) % attackInterval === 0 && Math.random() < 0.35) {
          if (this.boss.phase === 1) {
            // 3-way spread at readable speed
            [-2.8, 0, 2.8].forEach(angleVx => {
              this.enemyLasers.push({
                x: this.boss.x + angleVx * 10,
                y: this.boss.y + 35,
                vx: angleVx * timeScale,
                vy: 3.8 * timeScale
              });
            });
          } else if (this.boss.phase === 2) {
            // 4-way spread leaving center gap for dodging!
            [-3.8, -1.4, 1.4, 3.8].forEach(angleVx => {
              this.enemyLasers.push({
                x: this.boss.x + angleVx * 12,
                y: this.boss.y + 35,
                vx: angleVx * timeScale,
                vy: 4.4 * timeScale
              });
            });
          } else if (this.boss.phase === 3) {
            // Radial spiral rage burst
            [-5, -3, -1, 1, 3, 5].forEach(angleVx => {
              this.enemyLasers.push({
                x: this.boss.x + (Math.random() - 0.5) * 40,
                y: this.boss.y + 35,
                vx: angleVx * timeScale,
                vy: (4.4 + Math.random() * 1.5) * timeScale
              });
            });
          }
        }
      }

      // Collide player lasers with Boss
      for (let j = this.lasers.length - 1; j >= 0; j--) {
        const l = this.lasers[j];
        if (l.x >= this.boss.x - this.boss.width / 2 && l.x <= this.boss.x + this.boss.width / 2 &&
            l.y >= this.boss.y - this.boss.height / 2 && l.y <= this.boss.y + this.boss.height / 2) {
          this.lasers.splice(j, 1);
          this.boss.hp--;
          this.particles.burst(l.x, l.y, this.boss.phase === 3 ? '#ffe600' : '#ff007f', 6, 3);

          if (this.boss.hp <= 0) {
            // Boss Defeated!
            this.score += 1000;
            this.onScore(this.score);
            this.particles.confetti(this.canvas.width, this.canvas.height);
            this.particles.shake(35, 16);
            this.particles.addFloatingText('TITAN ANNIHILÉ ! +1000 PTS', this.boss.x, this.boss.y, '#ffe600', 28);
            if (window.soundEngine) {
              window.soundEngine.playExplosion(true);
              window.soundEngine.announce('TITAN DÉTRUIT ! VICTOIRE SUPRÊME !');
            }
            if (window.liveNewsTicker) {
              const pName = window.arcadeState ? window.arcadeState.data.pseudo : 'Un Pilote';
              const pReg = window.arcadeState ? window.arcadeState.data.region : 'France';
              window.liveNewsTicker.pushEvent(`👑 [${pReg}] ${pName} vient de terrasser le Titan Cybernétique !`);
            }
            this.boss = null;
            break;
          }
        }
      }
    }

    // Spawn normal enemies with progressive count and spawn rate
    const maxEnemies = Math.min(10, 3 + Math.floor(this.wave * 1.4));
    const spawnRate = Math.min(0.042, 0.015 + this.wave * 0.005) * timeScale;
    if (!this.boss && Math.random() < spawnRate && this.enemies.length < maxEnemies) {
      this.spawnEnemy();
    }

    // Update player lasers (unaffected by bullet time slow-mo!)
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      l.x += l.vx || 0;
      l.y += l.vy;
      if (l.y < -10 || l.x < 0 || l.x > this.canvas.width) {
        this.lasers.splice(i, 1);
      }
    }

    // Update enemy lasers (affected by bullet time!)
    for (let i = this.enemyLasers.length - 1; i >= 0; i--) {
      const el = this.enemyLasers[i];
      el.x += (el.vx || 0) * timeScale;
      el.y += el.vy * timeScale;

      // Fair hurtbox (12px core radius)
      if (Math.hypot(el.x - this.player.x, el.y - this.player.y) < 12) {
        this.enemyLasers.splice(i, 1);
        if (this.player.shield) {
          this.player.shield = false;
          this.particles.burst(this.player.x, this.player.y, '#00ff88', 25, 4);
          this.particles.addFloatingText('BOUCLIER BRISÉ', this.player.x, this.player.y - 20, '#00ff88');
          if (window.soundEngine) window.soundEngine.playBounce();
        } else {
          this.gameOver();
          return;
        }
        continue;
      }

      if (el.y > this.canvas.height + 10) {
        this.enemyLasers.splice(i, 1);
      }
    }

    // Update normal enemies (affected by bullet time!)
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.y += e.speed * timeScale;
      e.x += e.vx * timeScale;
      if (e.x < 20 || e.x > this.canvas.width - 20) e.vx *= -1;

      if (e.type === 'cruiser') {
        e.shootTimer -= timeScale;
        if (e.shootTimer <= 0) {
          e.shootTimer = Math.max(90, 150 - this.wave * 10);
          const laserVy = Math.min(5.0, 3.4 + this.wave * 0.3);
          this.enemyLasers.push({ x: e.x, y: e.y + e.size / 2, vy: laserVy });
        }
      }

      for (let j = this.lasers.length - 1; j >= 0; j--) {
        const l = this.lasers[j];
        if (Math.hypot(l.x - e.x, l.y - e.y) < e.size / 2 + 6) {
          this.lasers.splice(j, 1);
          e.hp--;
          this.particles.burst(l.x, l.y, pColor, 6, 2);

          if (e.hp <= 0) {
            const pts = e.type === 'cruiser' ? 150 : (e.type === 'meteor' ? 80 : 50);
            this.score += pts;
            this.onScore(this.score);

            const hitColor = e.type === 'cruiser' ? '#ff007f' : (e.type === 'meteor' ? '#ff7b00' : '#ffe600');
            this.particles.burst(e.x, e.y, hitColor, 25, 5);
            this.particles.shake(6, 4);
            this.particles.addFloatingText(`+${pts}`, e.x, e.y, hitColor);
            if (window.soundEngine) window.soundEngine.playExplosion(e.type === 'cruiser');

            // Generous drop rate in early waves
            const pDropRate = this.wave === 1 ? 0.32 : (this.wave === 2 ? 0.26 : 0.20);
            if (Math.random() < pDropRate) {
              const pTypes = ['triple', 'shield', 'bomb'];
              this.powerups.push({
                x: e.x,
                y: e.y,
                type: pTypes[Math.floor(Math.random() * pTypes.length)],
                vy: 2
              });
            }

            this.enemies.splice(i, 1);
            break;
          }
        }
      }

      // Fair ship collision (core body radius)
      if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < e.size / 2 + 8) {
        if (this.player.shield) {
          this.player.shield = false;
          this.enemies.splice(i, 1);
          this.particles.burst(this.player.x, this.player.y, '#00ff88', 30, 5);
          this.particles.addFloatingText('BOUCLIER ACTIF !', this.player.x, this.player.y - 20, '#00ff88');
          if (window.soundEngine) window.soundEngine.playExplosion();
        } else {
          this.gameOver();
          return;
        }
      }

      if (e && e.y > this.canvas.height + 30) {
        this.enemies.splice(i, 1);
      }
    }

    // Shop Perk: Magnet attraction for powerups
    const hasMagnet = window.cyberShop && window.cyberShop.hasPerk('perk_magnet');

    // Update powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.y += p.vy;

      if (hasMagnet) {
        const dist = Math.hypot(p.x - this.player.x, p.y - this.player.y);
        if (dist < 220) {
          p.x += (this.player.x - p.x) * 0.08;
          p.y += (this.player.y - p.y) * 0.08;
          if (Math.random() < 0.25) {
            this.particles.burst(p.x, p.y, '#00f0ff', 1, 1);
          }
        }
      }

      if (Math.hypot(p.x - this.player.x, p.y - this.player.y) < 26) {
        if (p.type === 'triple') {
          this.player.tripleShot += 40;
          this.particles.addFloatingText('TRIPLE TIR X40 !', p.x, p.y, '#00f0ff', 20);
        } else if (p.type === 'shield') {
          this.player.shield = true;
          this.particles.addFloatingText('BOUCLIER DE PLASMA !', p.x, p.y, '#00ff88', 20);
        } else if (p.type === 'bomb') {
          this.enemies.forEach(e => {
            this.score += 50;
            this.particles.burst(e.x, e.y, '#ff007f', 20, 6);
          });
          this.enemies = [];
          if (this.boss) this.boss.hp -= 10;
          this.particles.shake(20, 10);
          this.particles.addFloatingText('BOMBE EMP !', this.player.x, 250, '#ff007f', 24);
          this.onScore(this.score);
        }

        this.particles.burst(p.x, p.y, '#ffe600', 25, 4);
        if (window.soundEngine) window.soundEngine.playPowerup();
        this.powerups.splice(i, 1);
        continue;
      }

      if (p.y > this.canvas.height + 20) {
        this.powerups.splice(i, 1);
      }
    }
  }

  gameOver() {
    this.running = false;
    this.particles.shake(25, 12);
    this.particles.burst(this.player.x, this.player.y, '#ff3366', 60, 8);
    if (window.soundEngine) {
      window.soundEngine.playGameOver();
      window.soundEngine.announce('MISSION FAILED !');
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

    ctx.fillStyle = '#060714';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Stars
    ctx.fillStyle = '#fff';
    this.stars.forEach(s => {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Boss Warning Banner
    if (this.bossAlert > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 0, 80, 0.2)';
      ctx.fillRect(0, 180, this.canvas.width, 70);
      ctx.font = '900 24px Orbitron, sans-serif';
      ctx.fillStyle = '#ff0055';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 20;
      ctx.textAlign = 'center';
      ctx.fillText('⚠ ALERTE : TITAN CYBERNÉTIQUE ⚠', this.canvas.width / 2, 225);
      ctx.restore();
    }

    // Draw Boss
    if (this.boss) {
      ctx.save();
      ctx.translate(this.boss.x, this.boss.y);

      // Boss Health Bar & Phase Label
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(-this.boss.width / 2, -this.boss.height / 2 - 20, this.boss.width, 10);
      
      const barColor = this.boss.phase === 3 ? '#ffe600' : (this.boss.phase === 2 ? '#ff0055' : '#00f0ff');
      ctx.fillStyle = barColor;
      ctx.shadowColor = barColor;
      ctx.shadowBlur = 12;
      const hpWidth = (this.boss.hp / this.boss.maxHp) * this.boss.width;
      ctx.fillRect(-this.boss.width / 2, -this.boss.height / 2 - 20, hpWidth, 10);

      // Phase Text
      ctx.font = 'bold 9px Orbitron, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.textAlign = 'center';
      const phaseLabel = this.boss.phase === 3 ? '🔥 PHASE 3 : SURCHARGE' : (this.boss.phase === 2 ? '⚡ PHASE 2 : FUREUR' : 'TITAN PHASE 1');
      ctx.fillText(phaseLabel, 0, -this.boss.height / 2 - 24);

      // Boss Body (Dynamic per phase)
      const hullColor = this.boss.phase === 3 ? '#2a040d' : (this.boss.phase === 2 ? '#280720' : '#1e052d');
      const strokeColor = this.boss.phase === 3 ? '#ffe600' : (this.boss.phase === 2 ? '#ff0055' : '#ff007f');
      ctx.fillStyle = hullColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = this.boss.phase === 3 ? 4 : 3;
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = this.boss.phase === 3 ? 30 : 20;
      ctx.strokeRect(-this.boss.width / 2, -this.boss.height / 2, this.boss.width, this.boss.height);
      ctx.fillRect(-this.boss.width / 2, -this.boss.height / 2, this.boss.width, this.boss.height);

      // Glowing Eye Core
      const eyeColor = this.boss.phase === 3 ? (Math.random() > 0.5 ? '#ffffff' : '#ff0055') : (this.boss.phase === 2 ? '#ffe600' : '#00f0ff');
      ctx.fillStyle = eyeColor;
      ctx.shadowColor = eyeColor;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, this.boss.phase === 3 ? 22 : 18, 0, Math.PI * 2);
      ctx.fill();

      // Wing Turrets
      ctx.fillStyle = strokeColor;
      ctx.fillRect(-this.boss.width / 2 - 10, -10, 12, 24);
      ctx.fillRect(this.boss.width / 2 - 2, -10, 12, 24);
      ctx.restore();
    }

    // Lasers
    const pColor = window.cyberShop ? window.cyberShop.getPlayerColor('#00f0ff') : '#00f0ff';
    ctx.save();
    ctx.fillStyle = pColor;
    ctx.shadowColor = pColor;
    ctx.shadowBlur = 14;
    this.lasers.forEach(l => {
      ctx.fillRect(l.x - 2, l.y - 8, 4, 16);
    });
    ctx.restore();

    // Enemy lasers
    ctx.save();
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 10;
    this.enemyLasers.forEach(el => {
      ctx.fillRect(el.x - 2, el.y, 4, 12);
    });
    ctx.restore();

    // Enemies
    this.enemies.forEach(e => {
      ctx.save();
      ctx.translate(e.x, e.y);

      if (e.type === 'drone') {
        ctx.fillStyle = '#ffe600';
        ctx.shadowColor = '#ffe600';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(0, e.size / 2);
        ctx.lineTo(-e.size / 2, -e.size / 2);
        ctx.lineTo(e.size / 2, -e.size / 2);
        ctx.closePath();
        ctx.fill();
      } else if (e.type === 'cruiser') {
        ctx.fillStyle = '#ff007f';
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 15;
        ctx.fillRect(-e.size / 2, -e.size / 3, e.size, e.size * 0.7);
        ctx.fillRect(-e.size * 0.8, -e.size / 6, e.size * 1.6, e.size / 4);
      } else if (e.type === 'meteor') {
        ctx.fillStyle = '#ff7b00';
        ctx.shadowColor = '#ff7b00';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, e.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // Power-ups
    this.powerups.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      const color = p.type === 'triple' ? '#00f0ff' : (p.type === 'shield' ? '#00ff88' : '#ff007f');
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = p.type === 'triple' ? '3X' : (p.type === 'shield' ? '🛡' : '💣');
      ctx.fillText(label, 0, 0);
      ctx.restore();
    });

    // Player Ship with equipped skin color
    ctx.save();
    ctx.translate(this.player.x, this.player.y);
    ctx.fillStyle = pColor;
    ctx.shadowColor = pColor;
    ctx.shadowBlur = 20;

    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(16, 14);
    ctx.lineTo(0, 8);
    ctx.lineTo(-16, 14);
    ctx.closePath();
    ctx.fill();

    // White cockpit visor
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(4, 2);
    ctx.lineTo(-4, 2);
    ctx.closePath();
    ctx.fill();

    if (this.player.shield) {
      ctx.strokeStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 16;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // Matrix Bullet Time active visual effect
    if (this.bulletTime > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 255, 136, 0.08)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.font = 'bold 14px Orbitron, sans-serif';
      ctx.fillStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 10;
      ctx.fillText(`⏱ MATRIX SLOW-MO: ${Math.ceil(this.bulletTime / 60)}s`, this.canvas.width - 240, 30);
      ctx.restore();
    }

    // Retro Space HUD
    ctx.save();
    ctx.font = 'bold 13px Orbitron, sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.fillText(`VAGUE: ${this.wave}`, 20, 30);
    ctx.fillText(`SCORE: ${this.score}`, 125, 30);
    if (this.player.shield) {
      ctx.fillStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      ctx.fillText('🛡 BOUCLIER', 260, 30);
    }
    if (this.player.tripleShot > 0) {
      ctx.fillStyle = '#ffe600';
      ctx.shadowColor = '#ffe600';
      ctx.fillText(`⚡ 3X: ${this.player.tripleShot}`, 390, 30);
    }
    ctx.restore();

    this.particles.draw(ctx);
    ctx.restore();
  }
}

window.SpaceGame = SpaceGame;
