/* =========================================================
   NEON ARCADE - VIRAL PEER-TO-PEER CHALLENGE ENGINE
   1-Click Duel URLs: "?duel=space&target=2500&by=Alex&region=75+-+Paris"
   ========================================================= */

class ChallengeEngine {
  constructor() {
    this.activeChallenge = null;
    this.hasCelebrated = false;
    this.checkUrlParams();
  }

  checkUrlParams() {
    try {
      const params = new URLSearchParams(window.location.search);
      const duelGame = params.get('duel');
      const targetScore = parseInt(params.get('target'), 10);
      const challengerName = params.get('by') || 'Un Pilote Inconnu';
      const challengerRegion = params.get('region') || 'France';

      if (duelGame && !isNaN(targetScore) && targetScore > 0) {
        this.activeChallenge = {
          game: duelGame,
          target: targetScore,
          challenger: challengerName,
          region: challengerRegion,
          beaten: false
        };

        // Register the real challenger into the real leaderboard
        if (window.leaderboardSystem) {
          window.leaderboardSystem.recordRealScore(
            duelGame,
            targetScore,
            challengerName,
            challengerRegion,
            '⚔',
            true
          );
        }
      }
    } catch (e) {
      console.warn("Could not parse challenge URL", e);
    }
  }

  hasChallenge() {
    return this.activeChallenge !== null;
  }

  isGameChallenge(gameKey) {
    return this.activeChallenge && this.activeChallenge.game === gameKey;
  }

  showChallengeModal(onAccept) {
    if (!this.activeChallenge) return;

    const modal = document.getElementById('challenge-modal');
    const titleEl = document.getElementById('challenge-modal-title');
    const descEl = document.getElementById('challenge-modal-desc');
    const targetEl = document.getElementById('challenge-modal-target');
    const acceptBtn = document.getElementById('btn-accept-challenge');
    const declineBtn = document.getElementById('btn-decline-challenge');

    if (!modal) return;

    const gameNames = {
      snake: 'Neon Snake',
      space: 'Space Void (Titan)',
      racer: 'Cyber Drift',
      stacker: 'Quantum Stacker',
      slicer: 'Neon Katana',
      vortex: 'Orbital Vortex',
      breakout: 'Laser Breakout',
      flap: 'Cyber Flap',
      memory: 'Quantum Matrix',
      aim: 'Aim Overdrive'
    };

    const gName = gameNames[this.activeChallenge.game] || this.activeChallenge.game;

    if (titleEl) titleEl.textContent = `🚨 DÉFI REÇU DE ${this.activeChallenge.challenger.toUpperCase()} !`;
    if (descEl) descEl.textContent = `${this.activeChallenge.challenger} (${this.activeChallenge.region}) vous met au défi de battre son record sur ${gName} !`;
    if (targetEl) targetEl.textContent = `${this.activeChallenge.target.toLocaleString('fr-FR')} PTS`;

    modal.classList.add('active');
    if (window.soundEngine) {
      window.soundEngine.resume();
      window.soundEngine.playPowerup();
      window.soundEngine.announce('CHALLENGE RECEIVED ! ACCEPT DUEL !');
    }

    if (acceptBtn) {
      acceptBtn.onclick = () => {
        modal.classList.remove('active');
        if (onAccept) onAccept(this.activeChallenge.game);
      };
    }

    if (declineBtn) {
      declineBtn.onclick = () => {
        modal.classList.remove('active');
        this.activeChallenge = null;
        // Clean URL without reloading
        window.history.replaceState({}, document.title, window.location.pathname);
      };
    }
  }

  // Call during game loop to check if player surpassed friend's score
  checkProgress(score, particles, canvasWidth, canvasHeight) {
    if (!this.activeChallenge || this.activeChallenge.beaten) return;

    if (score >= this.activeChallenge.target && !this.hasCelebrated) {
      this.hasCelebrated = true;
      this.activeChallenge.beaten = true;

      // Massive Victory Celebration!
      if (particles) {
        particles.confetti(canvasWidth, canvasHeight);
        particles.shake(30, 15);
        particles.addFloatingText(`🏆 DÉFI BATTU ! TU AS ÉCRASÉ ${this.activeChallenge.challenger.toUpperCase()} !`, canvasWidth / 2, 220, '#ffe600', 26);
      }

      if (window.arcadeState) {
        window.arcadeState.data.coins = (window.arcadeState.data.coins || 0) + 150;
        window.arcadeState.save();
        window.arcadeState.updateUI();
        window.arcadeState.triggerToast('⚔ DÉFI REMPORTÉ !', `Tu as battu ${this.activeChallenge.challenger} ! (+150 🪙 bonus)`, '👑');
      }

      if (window.soundEngine) {
        window.soundEngine.playPowerup();
        window.soundEngine.announce('CHALLENGE WON ! YOU ARE THE CHAMPION !');
      }
    }
  }

  // Generate shareable URL to challenge a friend
  shareChallenge(gameKey, score) {
    const pseudo = window.arcadeState ? window.arcadeState.data.pseudo : 'Pilote_Néon';
    const region = window.arcadeState ? window.arcadeState.data.region : '75 - Paris';

    const baseUrl = window.location.origin + window.location.pathname;
    const challengeUrl = `${baseUrl}?duel=${gameKey}&target=${score}&by=${encodeURIComponent(pseudo)}&region=${encodeURIComponent(region)}`;

    const shareText = `⚡ Je te défie de battre mes ${score.toLocaleString('fr-FR')} PTS sur ${gameKey.toUpperCase()} dans Neon Arcade ! Clique ici pour relever le défi :`;

    if (navigator.share) {
      navigator.share({
        title: '⚡ Défi Neon Arcade Ultra',
        text: shareText,
        url: challengeUrl
      }).catch(() => {
        this.copyToClipboard(challengeUrl);
      });
    } else {
      this.copyToClipboard(challengeUrl);
    }
  }

  copyToClipboard(url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        if (window.arcadeState) {
          window.arcadeState.triggerToast('🔗 LIEN DE DÉFI COPIÉ !', 'Envoie-le à tes potes sur Discord, X ou WhatsApp !', '⚔');
        }
        if (window.soundEngine) window.soundEngine.playPowerup();
      }).catch(() => {
        this.fallbackPrompt(url);
      });
    } else {
      this.fallbackPrompt(url);
    }
  }

  fallbackPrompt(url) {
    prompt('Copie ce lien pour défier tes potes sur Discord ou WhatsApp :', url);
  }
}

window.challengeEngine = new ChallengeEngine();
