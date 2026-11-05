/* =========================================================
   GAME 7: CYBER DRIFT (NEON HIGHWAY) - HITBOX & 3D FIXED
   Accurate Z-plane collision, 4 lanes, near-miss bonuses & depth sorting
   ========================================================= */

class RacerGame {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.onScore = null;
    this.onGameOver = null;
    this.particles = new ParticleSystem();

    this.player = {
      x: 0, // -1 (left edge) to 1 (right edge)
      speed: 0,
      maxSpeed: 180,
      accel: 0.8,
      boost: 0,
      invulnerable: 0
    };

    this.roadSegments = [];
    this.segmentLength = 200;
    this.roadWidth = 2000;
    this.cameraHeight = 1000;
    this.cameraDepth = 0.84;
    this.drawDistance = 160;

    // Player sits at distance 1000 in front of camera (corresponds to Y=460 on screen)
    this.playerZ = 1000;

    this.position = 0;
    this.traffic = [];
    this.keys = {};
    this.timeLeft = 45;
    this.score = 0;
    this.distance = 0;

    this.running = false;
    this.paused = false;
    this.loopId = null;
    this.lastTime = 0;
  }

  init(canvas, onScore, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScore = onScore;
    this.onGameOver = onGameOver;

    this.canvas.width = 700;
    this.canvas.height = 500;

    this.buildRoad();
    this.reset();
  }

  buildRoad() {
    this.roadSegments = [];
    const totalSegments = 1200;
    for (let i = 0; i < totalSegments; i++) {
      let curve = 0;
      if (i > 100 && i < 300) curve = 2.2;
      if (i > 400 && i < 600) curve = -2.8;
      if (i > 700 && i < 950) curve = 3.2;

      this.roadSegments.push({
        index: i,
        p1: { world: { z: i * this.segmentLength }, camera: {}, screen: {} },
        p2: { world: { z: (i + 1) * this.segmentLength }, camera: {}, screen: {} },
        curve: curve,
        color: Math.floor(i / 3) % 2 ? { road: '#0d102a', grass: '#050614', rumble: '#00f0ff', lane: '#ffffff' }
                                    : { road: '#12163b', grass: '#080a1c', rumble: '#ff007f', lane: 'transparent' }
      });
    }
  }

  respawnCar(car, targetZ) {
    // 7 lanes across the road including center (0.0) to prevent straight-line idling
    const lanes = [-0.70, -0.45, -0.20, 0.0, 0.20, 0.45, 0.70];
    const colors = ['#ffe600', '#00ff88', '#ff007f', '#9d4edd', '#00f0ff', '#ff5500', '#ff00aa', '#00e5ff'];

    // Balanced proportions: 65% classic cyber cars, 18% weavers, 10% trucks, 7% hazard barriers
    const roll = Math.random();
    let type = 'car';
    if (roll < 0.65) type = 'car';
    else if (roll < 0.83) type = 'weaver';
    else if (roll < 0.93) type = 'truck';
    else type = 'barrier';

    const chosenLane = lanes[Math.floor(Math.random() * lanes.length)];
    const jitter = (Math.random() - 0.5) * 0.04;
    const finalLane = Math.max(-0.80, Math.min(0.80, chosenLane + jitter));

    car.type = type;
    car.color = colors[Math.floor(Math.random() * colors.length)];
    car.z = targetZ;
    car.baseOffset = finalLane;
    car.offset = finalLane;
    car.seed = Math.random() * 20;
    car.hitCooldown = 0;
    car.nearMissed = false;

    if (type === 'truck') {
      car.speed = 42 + Math.random() * 12;
      car.hitbox = 0.23; // slightly wider than car
    } else if (type === 'barrier') {
      car.speed = 0; // stationary hazard
      car.hitbox = 0.18;
    } else if (type === 'weaver') {
      car.speed = 60 + Math.random() * 18;
      car.hitbox = 0.16;
    } else {
      car.speed = 52 + Math.random() * 28;
      car.hitbox = 0.16;
    }
  }

  reset() {
    this.position = 0;
    this.player.x = 0;
    this.player.speed = 0;
    this.player.boost = 0;
    this.player.invulnerable = 0;
    this.player.shield = window.cyberShop ? window.cyberShop.hasPerk('perk_shield') : false;
    this.timeLeft = 45;
    this.score = 0;
    this.distance = 0;
    this.gameTick = 0;
    this.particles.reset();

    // 38 obstacles: perfectly balanced spacing (no 5s dead zones, no wall of cars)
    this.traffic = [];
    let spawnZ = 1800;
    for (let i = 0; i < 38; i++) {
      const car = {};
      spawnZ += 750 + Math.random() * 350;
      this.respawnCar(car, spawnZ);
      this.traffic.push(car);
    }
  }

  start() {
    this.reset();
    this.running = true;
    this.paused = false;
    this.lastTime = performance.now();
    if (window.soundEngine) window.soundEngine.announce('DRIVE !');
    this.loop();
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
    this.lastTime = performance.now();
    this.loop();
  }

  stop() {
    this.running = false;
    if (this.loopId) cancelAnimationFrame(this.loopId);
  }

  handleKey(e) {
    if (e.type === 'keydown') {
      this.keys[e.key] = true;
      if ((e.key === ' ' || e.key === 'Shift') && this.player.boost <= 0) {
        this.triggerTurbo();
      }
    } else if (e.type === 'keyup') {
      this.keys[e.key] = false;
    }
  }

  handleTouch(action) {
    if (action === 'left') this.player.x = Math.max(-0.95, this.player.x - 0.16);
    if (action === 'right') this.player.x = Math.min(0.95, this.player.x + 0.16);
    if (action === 'up') this.player.speed = Math.min(this.player.maxSpeed, this.player.speed + 15);
    if (action === 'down') this.player.speed = Math.max(0, this.player.speed - 20);
    if (action === 'action') this.triggerTurbo();
  }

  triggerTurbo() {
    if (this.player.boost > 0) return;
    const hasNitro = window.cyberShop && window.cyberShop.hasPerk('perk_nitro_boost');
    this.player.boost = hasNitro ? 180 : 120; // 50% longer boost perk!
    const bColor = hasNitro ? '#ffe600' : '#00f0ff';
    this.particles.burst(this.canvas.width / 2, this.canvas.height - 50, bColor, 35, 9);
    this.particles.addFloatingText(hasNitro ? '⚡ NITRO SURALIMENTÉE +50% !' : 'TURBO NITROUS !', this.canvas.width / 2, 320, bColor, 24);
    if (window.soundEngine) {
      window.soundEngine.playTurbo();
      window.soundEngine.announce('NITRO !');
    }
  }

  project(p, cameraX, cameraY, cameraZ) {
    p.camera.x = (p.world.x || 0) - cameraX;
    p.camera.y = (p.world.y || 0) - cameraY;
    p.camera.z = p.world.z - cameraZ;
    p.screen.scale = this.cameraDepth / Math.max(0.01, p.camera.z);
    p.screen.x = Math.round((this.canvas.width / 2) + (p.screen.scale * p.camera.x * this.canvas.width / 2));
    p.screen.y = Math.round((this.canvas.height / 2) - (p.screen.scale * p.camera.y * this.canvas.height / 2));
    p.screen.w = Math.round(p.screen.scale * this.roadWidth * this.canvas.width / 2);
  }

  update(dt) {
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.gameOver();
      return;
    }

    if (this.player.invulnerable > 0) {
      this.player.invulnerable--;
    }

    // Accelerate / Brake
    const targetMax = this.player.boost > 0 ? 250 : this.player.maxSpeed;
    if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W'] || this.keys['z'] || this.keys['Z']) {
      this.player.speed = Math.min(targetMax, this.player.speed + this.player.accel);
    } else if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
      this.player.speed = Math.max(0, this.player.speed - 2.0);
    } else {
      this.player.speed = Math.max(0, this.player.speed - 0.5);
    }

    if (this.player.boost > 0) {
      this.player.boost--;
      this.player.speed = Math.min(260, this.player.speed + 1.2);
    }

    // Steering
    const speedRatio = this.player.speed / this.player.maxSpeed;
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A'] || this.keys['q'] || this.keys['Q']) {
      this.player.x -= 0.035 * speedRatio;
    }
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
      this.player.x += 0.035 * speedRatio;
    }

    // Off-road penalty
    if (Math.abs(this.player.x) > 0.95 && this.player.speed > 50) {
      this.player.speed = Math.max(40, this.player.speed - 1.5);
      this.particles.burst(this.canvas.width / 2 + (this.player.x * 120), this.canvas.height - 40, '#ff007f', 2, 2);
    }

    // Move along track
    this.position += this.player.speed * 2.5;
    const maxTrack = this.roadSegments.length * this.segmentLength;
    if (this.position >= maxTrack) {
      this.position -= maxTrack;
      // Adjust all traffic coordinates by -maxTrack so relative distances stay seamless
      for (let i = 0; i < this.traffic.length; i++) {
        this.traffic[i].z -= maxTrack;
      }
      this.timeLeft += 20; // Checkpoint!
      this.score += 500;
      this.particles.confetti(this.canvas.width, this.canvas.height);
      this.particles.addFloatingText('CHECKPOINT ! +20 SEC', this.canvas.width / 2, 220, '#ffe600', 24);
      if (window.soundEngine) {
        window.soundEngine.playPowerup();
        window.soundEngine.announce('CHECKPOINT !');
      }
    }

    // Distance & Score
    this.distance += this.player.speed * dt;
    this.score += Math.floor(this.player.speed * 0.1);
    this.onScore(this.score);

    if (window.challengeEngine && window.challengeEngine.isGameChallenge('racer')) {
      window.challengeEngine.checkProgress(this.score, this.particles, this.canvas.width, this.canvas.height);
    }

    this.gameTick++;

    // =========================================================
    // CONTINUOUS TRAFFIC UPDATE, AI WEAVING & 3D HITBOX
    // =========================================================
    for (let i = 0; i < this.traffic.length; i++) {
      const car = this.traffic[i];
      car.z += car.speed * 2;

      // Dynamic AI weaving behavior (smooth oscillation)
      if (car.type === 'weaver') {
        car.offset = car.baseOffset + Math.sin(this.gameTick * 0.03 + car.seed) * 0.20;
        car.offset = Math.max(-0.80, Math.min(0.80, car.offset));
      }

      // Check if car was overtaken and passed behind the camera
      // Player is at this.position + this.playerZ (playerZ = 1000)
      if (car.z < this.position + 600) {
        // Recycle to the front of the traffic queue ahead with balanced spacing!
        let maxZ = this.position + 2000;
        for (let j = 0; j < this.traffic.length; j++) {
          if (this.traffic[j].z > maxZ) maxZ = this.traffic[j].z;
        }
        this.respawnCar(car, maxZ + 750 + Math.random() * 350);
        continue;
      }

      if (car.hitCooldown > 0) car.hitCooldown--;

      // Relative Z distance from camera to car
      const relZ = car.z - this.position;

      // The player car sits at exactly playerZ = 1000 in front of the camera
      // Check if this car is in the exact Z-slice of the player (between 860 and 1140)
      const inZRange = relZ >= 860 && relZ <= 1140;

      if (inZRange) {
        const lateralDist = Math.abs(this.player.x - car.offset);
        const hitboxThreshold = car.hitbox || 0.17;

        // Precise car width collision threshold
        if (lateralDist < hitboxThreshold && this.player.invulnerable <= 0 && car.hitCooldown <= 0) {
          if (this.player.shield) {
            // Quantum Overshield deflecting collision!
            this.player.shield = false;
            this.player.invulnerable = 60;
            car.hitCooldown = 60;
            this.particles.shake(12, 6);
            this.particles.burst(this.canvas.width / 2, this.canvas.height - 70, '#00ff88', 35, 7);
            this.particles.addFloatingText('🛡 CHOC DÉVIÉ PAR LE BOUCLIER !', this.canvas.width / 2, 300, '#00ff88', 22);
            if (window.soundEngine) window.soundEngine.playBounce();
          } else {
            // REAL COLLISION
            this.player.speed = Math.max(25, this.player.speed * 0.35);
            this.player.boost = 0;
            this.player.invulnerable = 45; // 0.75s invulnerability blink
            car.hitCooldown = 60;

            this.particles.shake(18, 9);
            this.particles.burst(this.canvas.width / 2, this.canvas.height - 70, '#ff3366', 25, 5);
            this.particles.addFloatingText('COLLISION !', this.canvas.width / 2, 300, '#ff3366', 20);

            if (navigator.vibrate) navigator.vibrate([60, 40, 80]);
            if (window.soundEngine) window.soundEngine.playExplosion();
          }
        } else if (lateralDist >= hitboxThreshold && lateralDist < hitboxThreshold + 0.14 && !car.nearMissed) {
          // NEAR MISS REWARD (Slalom bonus!)
          car.nearMissed = true;
          this.score += 60;
          this.onScore(this.score);
          this.particles.burst(this.canvas.width / 2 + (car.offset - this.player.x) * 100, this.canvas.height - 60, '#ffe600', 10, 3);
          this.particles.addFloatingText('FRÔLEMENT +60 !', this.canvas.width / 2, 340, '#ffe600', 18);
          if (window.soundEngine) window.soundEngine.playCoin();
        }
      }
    }
  }

  gameOver() {
    this.running = false;
    this.particles.shake(25, 12);
    if (window.soundEngine) {
      window.soundEngine.playGameOver();
      window.soundEngine.announce('TIME OVER !');
    }
    setTimeout(() => {
      this.onGameOver(this.score);
    }, 700);
  }

  loop() {
    if (!this.running || this.paused) return;

    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.update(dt);
    this.particles.update();
    this.draw();

    this.loopId = requestAnimationFrame(() => this.loop());
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.particles.shakeX, this.particles.shakeY);

    // Deep synthwave sky & sun with dynamic biomes
    const biome = Math.floor(this.distance / 1500) % 3;
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.canvas.height / 2);
    if (biome === 0) {
      skyGrad.addColorStop(0, '#060718');
      skyGrad.addColorStop(0.6, '#18072c');
      skyGrad.addColorStop(1, '#ff007f');
    } else if (biome === 1) {
      skyGrad.addColorStop(0, '#02030a');
      skyGrad.addColorStop(0.6, '#06132b');
      skyGrad.addColorStop(1, '#00f0ff');
    } else {
      skyGrad.addColorStop(0, '#040d08');
      skyGrad.addColorStop(0.6, '#082918');
      skyGrad.addColorStop(1, '#00ff88');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height / 2);

    // Giant Synthwave Celestial Orb
    ctx.save();
    const sunY = this.canvas.height / 2 - 10;
    const sunGrad = ctx.createRadialGradient(this.canvas.width / 2, sunY, 10, this.canvas.width / 2, sunY, 80);
    if (biome === 0) {
      sunGrad.addColorStop(0, '#ffe600');
      sunGrad.addColorStop(0.6, '#ff007f');
      sunGrad.addColorStop(1, 'rgba(255, 0, 127, 0)');
    } else if (biome === 1) {
      sunGrad.addColorStop(0, '#ffffff');
      sunGrad.addColorStop(0.6, '#00f0ff');
      sunGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
    } else {
      sunGrad.addColorStop(0, '#ffe600');
      sunGrad.addColorStop(0.6, '#00ff88');
      sunGrad.addColorStop(1, 'rgba(0, 255, 136, 0)');
    }
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(this.canvas.width / 2, sunY, 80, 0, Math.PI, true);
    ctx.fill();
    ctx.restore();

    // Ground base
    ctx.fillStyle = '#050614';
    ctx.fillRect(0, this.canvas.height / 2, this.canvas.width, this.canvas.height / 2);

    // Render 3D Road
    const baseSegment = Math.floor(this.position / this.segmentLength);
    let dx = 0;
    let cameraX = this.player.x * this.roadWidth;

    for (let n = this.drawDistance; n > 0; n--) {
      const segIndex = (baseSegment + n) % this.roadSegments.length;
      const segment = this.roadSegments[segIndex];

      dx += segment.curve;
      this.project(segment.p1, cameraX - dx, this.cameraHeight, this.position);
      this.project(segment.p2, cameraX - dx - segment.curve, this.cameraHeight, this.position);

      if (segment.p1.camera.z <= this.cameraDepth || segment.p2.screen.y >= segment.p1.screen.y) continue;

      // Grass
      ctx.fillStyle = segment.color.grass;
      ctx.fillRect(0, segment.p2.screen.y, this.canvas.width, segment.p1.screen.y - segment.p2.screen.y);

      // Road
      ctx.fillStyle = segment.color.road;
      ctx.beginPath();
      ctx.moveTo(segment.p1.screen.x - segment.p1.screen.w, segment.p1.screen.y);
      ctx.lineTo(segment.p1.screen.x + segment.p1.screen.w, segment.p1.screen.y);
      ctx.lineTo(segment.p2.screen.x + segment.p2.screen.w, segment.p2.screen.y);
      ctx.lineTo(segment.p2.screen.x - segment.p2.screen.w, segment.p2.screen.y);
      ctx.closePath();
      ctx.fill();

      // Rumble
      const r1 = segment.p1.screen.w / 12;
      const r2 = segment.p2.screen.w / 12;
      ctx.fillStyle = segment.color.rumble;
      ctx.beginPath();
      ctx.moveTo(segment.p1.screen.x - segment.p1.screen.w - r1, segment.p1.screen.y);
      ctx.lineTo(segment.p1.screen.x - segment.p1.screen.w, segment.p1.screen.y);
      ctx.lineTo(segment.p2.screen.x - segment.p2.screen.w, segment.p2.screen.y);
      ctx.lineTo(segment.p2.screen.x - segment.p2.screen.w - r2, segment.p2.screen.y);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(segment.p1.screen.x + segment.p1.screen.w, segment.p1.screen.y);
      ctx.lineTo(segment.p1.screen.x + segment.p1.screen.w + r1, segment.p1.screen.y);
      ctx.lineTo(segment.p2.screen.x + segment.p2.screen.w + r2, segment.p2.screen.y);
      ctx.lineTo(segment.p2.screen.x + segment.p2.screen.w, segment.p2.screen.y);
      ctx.fill();

      // Neon Overpass Arches
      if (segIndex % 60 === 0 && segment.p1.screen.y < this.canvas.height - 20) {
        ctx.save();
        ctx.strokeStyle = biome === 1 ? '#00f0ff' : (biome === 2 ? '#00ff88' : '#ff007f');
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 15;
        ctx.lineWidth = Math.max(2, Math.round(segment.p1.screen.w * 0.05));
        ctx.beginPath();
        const archTopY = segment.p1.screen.y - segment.p1.screen.w * 0.7;
        ctx.moveTo(segment.p1.screen.x - segment.p1.screen.w * 1.1, segment.p1.screen.y);
        ctx.lineTo(segment.p1.screen.x - segment.p1.screen.w * 0.9, archTopY);
        ctx.lineTo(segment.p1.screen.x + segment.p1.screen.w * 0.9, archTopY);
        ctx.lineTo(segment.p1.screen.x + segment.p1.screen.w * 1.1, segment.p1.screen.y);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Draw Traffic Cars sorted by depth (furthest to nearest)
    const sortedTraffic = this.traffic
      .map(car => ({ ...car, relZ: car.z - this.position }))
      .filter(c => c.relZ > 400 && c.relZ < this.drawDistance * this.segmentLength)
      .sort((a, b) => b.relZ - a.relZ);

    sortedTraffic.forEach(car => {
      const scale = this.cameraDepth / car.relZ;
      const screenX = Math.round((this.canvas.width / 2) + (scale * (car.offset * this.roadWidth - cameraX) * this.canvas.width / 2));
      const screenY = Math.round((this.canvas.height / 2) + (scale * this.cameraHeight * this.canvas.height / 2));

      ctx.save();

      if (car.type === 'truck') {
        // Heavy Cyber Container Hauler (wide roadblock)
        const carW = Math.round(scale * 175 * this.canvas.width / 2);
        const carH = Math.round(carW * 0.72);

        // Trailer Body
        ctx.fillStyle = '#0a0f1d';
        ctx.strokeStyle = car.color;
        ctx.lineWidth = Math.max(1, Math.round(carW * 0.04));
        ctx.shadowColor = car.color;
        ctx.shadowBlur = 12;
        ctx.fillRect(screenX - carW / 2, screenY - carH, carW, carH);
        ctx.strokeRect(screenX - carW / 2, screenY - carH, carW, carH);

        // Flashing amber/red roof emergency strobes
        const strobeColor = (Math.floor(this.gameTick / 8) % 2 === 0) ? '#ffe600' : '#ff0033';
        ctx.fillStyle = strobeColor;
        ctx.shadowColor = strobeColor;
        ctx.shadowBlur = 10;
        ctx.fillRect(screenX - carW * 0.45, screenY - carH - carH * 0.16, carW * 0.25, carH * 0.16);
        ctx.fillRect(screenX + carW * 0.20, screenY - carH - carH * 0.16, carW * 0.25, carH * 0.16);

        // Broad Red Laser Taillight Bar
        ctx.fillStyle = '#ff0033';
        ctx.shadowColor = '#ff0033';
        ctx.shadowBlur = 10;
        ctx.fillRect(screenX - carW * 0.45, screenY - carH * 0.22, carW * 0.9, carH * 0.18);
      } else if (car.type === 'barrier') {
        // Stationary EMP Hazard Roadblock
        const barW = Math.round(scale * 140 * this.canvas.width / 2);
        const barH = Math.round(barW * 0.55);

        // Hazard Barrier Frame
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#ffe600';
        ctx.lineWidth = Math.max(2, Math.round(barW * 0.05));
        ctx.shadowColor = '#ffe600';
        ctx.shadowBlur = 14;
        ctx.fillRect(screenX - barW / 2, screenY - barH, barW, barH);
        ctx.strokeRect(screenX - barW / 2, screenY - barH, barW, barH);

        // Diagonal Hazard stripes (Yellow/Black)
        ctx.fillStyle = '#ffe600';
        for (let s = -barW * 0.4; s < barW * 0.4; s += barW * 0.22) {
          ctx.beginPath();
          ctx.moveTo(screenX + s, screenY);
          ctx.lineTo(screenX + s + barW * 0.1, screenY - barH);
          ctx.lineTo(screenX + s + barW * 0.18, screenY - barH);
          ctx.lineTo(screenX + s + barW * 0.08, screenY);
          ctx.closePath();
          ctx.fill();
        }

        // Flashing Red Alert Beacon on top
        const beaconOn = (Math.floor(this.gameTick / 6) % 2 === 0);
        ctx.fillStyle = beaconOn ? '#ff0055' : '#880022';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = beaconOn ? 18 : 4;
        ctx.beginPath();
        ctx.arc(screenX, screenY - barH - barH * 0.18, barW * 0.12, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Standard Cyber Car or Weaver
        const carW = Math.round(scale * 120 * this.canvas.width / 2);
        const carH = Math.round(carW * 0.52);

        ctx.fillStyle = car.color;
        ctx.shadowColor = car.color;
        ctx.shadowBlur = 12;
        ctx.fillRect(screenX - carW / 2, screenY - carH, carW, carH);

        // Rear window tint
        ctx.fillStyle = '#0a0d1e';
        ctx.fillRect(screenX - carW * 0.32, screenY - carH * 0.88, carW * 0.64, carH * 0.42);

        // Red taillights
        ctx.fillStyle = '#ff0033';
        ctx.shadowColor = '#ff0033';
        ctx.shadowBlur = 8;
        ctx.fillRect(screenX - carW * 0.44, screenY - carH * 0.44, carW * 0.24, carH * 0.34);
        ctx.fillRect(screenX + carW * 0.20, screenY - carH * 0.44, carW * 0.24, carH * 0.34);

        // Blinking amber turn indicator if Weaver
        if (car.type === 'weaver') {
          const driftDir = Math.cos(this.gameTick * 0.04 + car.seed);
          const blinkOn = (Math.floor(this.gameTick / 6) % 2 === 0);
          if (blinkOn) {
            ctx.fillStyle = '#ffaa00';
            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur = 10;
            if (driftDir > 0) {
              ctx.fillRect(screenX + carW * 0.34, screenY - carH * 0.72, carW * 0.14, carH * 0.25);
            } else {
              ctx.fillRect(screenX - carW * 0.48, screenY - carH * 0.72, carW * 0.14, carH * 0.25);
            }
          }
        }
      }

      ctx.restore();
    });

    // Speed lines on Boost
    if (this.player.boost > 0) {
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 20; i++) {
        const lx = Math.random() * this.canvas.width;
        const ly = Math.random() * this.canvas.height;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx + (lx - this.canvas.width / 2) * 0.4, ly + 40);
        ctx.stroke();
      }
    }

    // Draw Player Cyber Car
    // Blink if invulnerable
    if (this.player.invulnerable <= 0 || Math.floor(this.player.invulnerable / 4) % 2 === 0) {
      ctx.save();
      const carX = this.canvas.width / 2;
      const carY = this.canvas.height - 40;
      const carWidth = 90;
      const carHeight = 44;

      // Thruster exhaust flames
      if (this.player.speed > 20) {
        ctx.fillStyle = this.player.boost > 0 ? '#00f0ff' : '#ff007f';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 15;
        ctx.fillRect(carX - 28, carY + 4, 12, 14 + Math.random() * 10);
        ctx.fillRect(carX + 16, carY + 4, 12, 14 + Math.random() * 10);
      }

      // Cyber Car Chassis with equipped skin color
      const carColor = window.cyberShop ? window.cyberShop.getPlayerColor('#00f0ff') : '#00f0ff';
      ctx.fillStyle = carColor;
      ctx.shadowColor = carColor;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(carX - carWidth / 2, carY);
      ctx.lineTo(carX - carWidth * 0.35, carY - carHeight);
      ctx.lineTo(carX + carWidth * 0.35, carY - carHeight);
      ctx.lineTo(carX + carWidth / 2, carY);
      ctx.closePath();
      ctx.fill();

      // Windshield
      ctx.fillStyle = '#060714';
      ctx.fillRect(carX - carWidth * 0.25, carY - carHeight + 6, carWidth * 0.5, carHeight * 0.45);

      // Taillight bar
      ctx.fillStyle = '#ff007f';
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = 15;
      ctx.fillRect(carX - carWidth * 0.42, carY - 8, carWidth * 0.84, 6);

      // Quantum Shield sphere around car
      if (this.player.shield) {
        ctx.strokeStyle = '#00ff88';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 18;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(carX, carY - carHeight / 2, carWidth * 0.65, carHeight * 0.8, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Dashboard HUD: Speedometer & Chrono & Shield
    ctx.save();
    ctx.font = 'bold 16px Orbitron, sans-serif';
    ctx.fillStyle = '#ffe600';
    ctx.fillText(`CHRONO: ${Math.max(0, Math.ceil(this.timeLeft))}s`, 20, 36);

    if (this.player.shield) {
      ctx.fillStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 10;
      ctx.fillText('🛡 BOUCLIER ACTIF', this.canvas.width / 2 - 80, 36);
    }

    ctx.fillStyle = this.player.boost > 0 ? '#00f0ff' : '#fff';
    ctx.fillText(`VITESSE: ${Math.round(this.player.speed)} KM/H`, this.canvas.width - 200, 36);
    ctx.restore();

    this.particles.draw(ctx);
    ctx.restore();
  }
}

window.RacerGame = RacerGame;
