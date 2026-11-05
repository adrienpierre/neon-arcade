/* =========================================================
   NEON ARCADE - CYBER SCORECARD & VIRAL SOCIAL SHARING
   Generates PNG badges & pre-formatted Twitter/Discord links
   ========================================================= */

class ScoreCardGenerator {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 640;
    this.canvas.height = 360;
    this.ctx = this.canvas.getContext('2d');
    this.currentGame = '';
    this.currentScore = 0;
  }

  generate(gameName, score) {
    this.currentGame = gameName;
    this.currentScore = score;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#060714');
    bgGrad.addColorStop(0.5, '#13082a');
    bgGrad.addColorStop(1, '#080d26');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Glowing Cyber Border
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 20;
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, w - 32, h - 32);

    // Header Tag
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 10;
    ctx.font = 'bold 13px Orbitron, sans-serif';
    ctx.fillText('⚡ CARTE DE RECORD OFFICIELLE | NEON ARCADE ULTRA', 36, 48);

    // Game Title
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 15;
    ctx.font = '900 28px Orbitron, sans-serif';
    ctx.fillText(gameName.toUpperCase(), 36, 95);

    // Huge Score display
    ctx.fillStyle = '#ffe600';
    ctx.shadowColor = '#ffe600';
    ctx.shadowBlur = 25;
    ctx.font = '900 54px Orbitron, sans-serif';
    ctx.fillText(`${score} PTS`, 36, 175);

    // Player Status & Level
    const level = window.arcadeState ? window.arcadeState.getLevel() : 1;
    const trophies = window.arcadeState ? window.arcadeState.data.unlockedAchievements.length : 0;

    ctx.fillStyle = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.font = 'bold 16px Orbitron, sans-serif';
    ctx.fillText(`PILOTE : NIVEAU ${level}  •  TROPHÉES : ${trophies} / 16`, 36, 230);

    // Hologram Grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let x = 460; x < w - 40; x += 15) {
      ctx.beginPath();
      ctx.moveTo(x, 70);
      ctx.lineTo(x, 260);
      ctx.stroke();
    }

    // Rank S+
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(530, 165, 45, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('S+', 530, 174);
    ctx.textAlign = 'left';

    // Footer timestamp
    ctx.font = '11px monospace';
    ctx.fillStyle = '#8892b0';
    ctx.shadowBlur = 0;
    ctx.fillText(`GÉNÉRÉ LE ${new Date().toLocaleDateString('fr-FR')} • NEON ARCADE ULTRA`, 36, 315);

    return this.canvas.toDataURL('image/png');
  }

  shareTwitter() {
    const text = encodeURIComponent(`⚡ J'ai explosé le record sur NEON ARCADE ! 🎮\n\nJeu : ${this.currentGame}\nScore : ${this.currentScore} PTS !\n\nQui peut me battre en France ? 🔥\n#NeonArcade #Gaming #IndieGame`);
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(url, '_blank');
  }

  shareDiscord() {
    const text = `🎮 **NEON ARCADE ULTRA - RECORD ÉTABLI !**\n⚡ **Jeu :** \`${this.currentGame}\`\n🔥 **Score :** **${this.currentScore} PTS** (Rang S+)\n🏆 **Niveau :** ${window.arcadeState.getLevel()}\n*Peux-tu me détrôner du classement français ?*`;
    navigator.clipboard.writeText(text).then(() => {
      if (window.arcadeState) {
        window.arcadeState.triggerToast('📋 COPIÉ POUR DISCORD !', 'Le texte est prêt à être collé dans ton serveur Discord !', '🚀');
      }
    });
  }

  showModal(gameName, score) {
    const dataUrl = this.generate(gameName, score);
    const modal = document.getElementById('scorecard-modal');
    const img = document.getElementById('scorecard-preview-img');
    const dlBtn = document.getElementById('btn-download-scorecard');
    const twitterBtn = document.getElementById('btn-share-twitter');
    const discordBtn = document.getElementById('btn-share-discord');

    if (img) img.src = dataUrl;
    if (dlBtn) dlBtn.href = dataUrl;

    if (twitterBtn) {
      twitterBtn.onclick = () => this.shareTwitter();
    }
    if (discordBtn) {
      discordBtn.onclick = () => this.shareDiscord();
    }

    if (modal) modal.classList.add('active');

    if (window.soundEngine) {
      window.soundEngine.playPowerup();
      window.soundEngine.announce('SHARE YOUR SCORE !');
    }
  }
}

window.scoreCardGenerator = new ScoreCardGenerator();
