/* =========================================================
   NEON ARCADE - PARTICLE & JUICE SYSTEM
   Sparks, Screen Shake, Confetti & Floating Floating Text
   ========================================================= */

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatTexts = [];
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.shakeX = 0;
    this.shakeY = 0;
  }

  reset() {
    this.particles = [];
    this.floatTexts = [];
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.shakeX = 0;
    this.shakeY = 0;
  }

  // Trigger screen shake
  shake(duration = 10, intensity = 6) {
    this.shakeDuration = duration;
    this.shakeIntensity = intensity;
  }

  // Spawn spark burst
  burst(x, y, color = '#00f0ff', count = 20, speed = 4) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = (Math.random() * 0.8 + 0.2) * speed;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        size: Math.random() * 3 + 2,
        color: color,
        alpha: 1,
        life: 1,
        decay: Math.random() * 0.03 + 0.02,
        gravity: 0.05
      });
    }
  }

  // Spawn confetti for wins/highscores
  confetti(width, height) {
    const colors = ['#00f0ff', '#ff007f', '#ffe600', '#00ff88', '#9d4edd'];
    for (let i = 0; i < 70; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: -10,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 1,
        decay: Math.random() * 0.01 + 0.005,
        gravity: 0.08,
        isConfetti: true,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2
      });
    }
  }

  // Floating score or combo text
  addFloatingText(text, x, y, color = '#ffe600', fontSize = 18) {
    this.floatTexts.push({
      text: text,
      x: x,
      y: y,
      vy: -1.5,
      alpha: 1,
      color: color,
      fontSize: fontSize,
      life: 1,
      decay: 0.02
    });
  }

  update() {
    // Screen shake update
    if (this.shakeDuration > 0) {
      this.shakeDuration--;
      this.shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.life -= p.decay;
      p.alpha = Math.max(0, p.life);

      if (p.isConfetti) {
        p.rotation += p.rotSpeed;
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update float texts
    for (let i = this.floatTexts.length - 1; i >= 0; i--) {
      const ft = this.floatTexts[i];
      ft.y += ft.vy;
      ft.life -= ft.decay;
      ft.alpha = Math.max(0, ft.life);

      if (ft.life <= 0) {
        this.floatTexts.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    ctx.save();

    // Draw particles
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;

      if (p.isConfetti) {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // Draw float texts
    this.floatTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.font = `bold ${ft.fontSize}px 'Orbitron', monospace, sans-serif`;
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 10;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    ctx.restore();
  }
}

window.ParticleSystem = ParticleSystem;
