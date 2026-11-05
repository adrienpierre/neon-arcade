/* =========================================================
   NEON ARCADE - AMBIENT DYNAMIC BACKGROUND CANVAS
   Perspective Cyber Grid, Shooting Stars & Neon Nodes
   ========================================================= */

(function() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // Starfield & interactive nodes
  const stars = [];
  const starCount = 60;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.4 + 0.1,
      alpha: Math.random() * 0.7 + 0.3
    });
  }

  let gridOffset = 0;

  function render() {
    ctx.clearRect(0, 0, width, height);

    // Deep gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#04050e');
    grad.addColorStop(0.65, '#0b0d24');
    grad.addColorStop(1, '#1b0933');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle horizon glow
    const horizonY = height * 0.75;
    const glowGrad = ctx.createRadialGradient(
      width / 2, horizonY, 5,
      width / 2, horizonY, width * 0.7
    );
    glowGrad.addColorStop(0, 'rgba(255, 0, 127, 0.25)');
    glowGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.1)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw cyber stars
    stars.forEach(s => {
      s.y -= s.speed;
      if (s.y < 0) {
        s.y = height;
        s.x = Math.random() * width;
      }
      ctx.fillStyle = `rgba(0, 240, 255, ${s.alpha})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Perspective 3D Grid on the floor
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.lineWidth = 1;

    // Horizon line
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(width, horizonY);
    ctx.stroke();

    // Perspective vanishing lines
    const vanishX = width / 2;
    const numVanishingLines = 24;
    for (let i = -numVanishingLines; i <= numVanishingLines; i++) {
      const bottomX = vanishX + i * (width / 16);
      ctx.beginPath();
      ctx.moveTo(vanishX, horizonY);
      ctx.lineTo(bottomX, height);
      ctx.stroke();
    }

    // Moving horizontal grid lines
    gridOffset = (gridOffset + 0.6) % 30;
    for (let y = horizonY; y < height; y += 3 + Math.pow((y - horizonY) / 14, 1.4)) {
      const currentY = y + (gridOffset * (y - horizonY) / (height - horizonY));
      if (currentY <= height) {
        const lineAlpha = ((currentY - horizonY) / (height - horizonY)) * 0.25;
        ctx.strokeStyle = `rgba(255, 0, 127, ${lineAlpha})`;
        ctx.beginPath();
        ctx.moveTo(0, currentY);
        ctx.lineTo(width, currentY);
        ctx.stroke();
      }
    }
    ctx.restore();

    requestAnimationFrame(render);
  }

  render();
})();
