/* =========================================================
   NEON ARCADE - REAL-TIME AUDIO VISUALIZER
   Renders reactive spectrum analyzer bars in header
   ========================================================= */

(function() {
  const canvas = document.getElementById('audio-visualizer-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width = 110;
  canvas.height = 28;

  const barCount = 12;
  const bars = Array.from({ length: barCount }, () => ({
    height: 3,
    targetHeight: 3,
    speed: 0.15
  }));

  function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isMusicOn = window.soundEngine && window.soundEngine.musicPlaying && !window.soundEngine.isMuted;
    const barWidth = 6;
    const gap = 3;

    for (let i = 0; i < barCount; i++) {
      const b = bars[i];
      if (isMusicOn) {
        // Dynamic simulated reactive heights
        if (Math.random() < 0.25) {
          b.targetHeight = Math.random() * (canvas.height - 4) + 4;
        }
      } else {
        b.targetHeight = 3;
      }

      b.height += (b.targetHeight - b.height) * 0.25;

      const x = i * (barWidth + gap);
      const y = canvas.height - b.height;

      // Draw glowing bar
      ctx.save();
      const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
      grad.addColorStop(0, '#00f0ff');
      grad.addColorStop(1, '#ff007f');
      ctx.fillStyle = grad;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 6;
      ctx.fillRect(x, y, barWidth, b.height);
      ctx.restore();
    }

    requestAnimationFrame(update);
  }

  update();
})();
