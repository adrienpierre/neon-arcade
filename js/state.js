/* =========================================================
   NEON ARCADE - GLOBAL STATE, STATS & DAILY 24H RESET V5
   True date-based seeded daily quests, French profiles & haptics
   ========================================================= */

class ArcadeState {
  constructor() {
    this.storageKey = 'NEON_ARCADE_SAVE_V5';
    this.achievementsList = [
      { id: 'first_play', name: 'Nouveau Challenger', desc: 'Joue ta première partie dans l\'arcade', icon: '🎮', xp: 100 },
      { id: 'snake_50', name: 'Cyber Serpent', desc: 'Atteins 50 points dans Neon Snake', icon: '🐍', xp: 200 },
      { id: 'snake_120', name: 'Ouroboros Légendaire', desc: 'Atteins 120 points dans Neon Snake', icon: '👑', xp: 400 },
      { id: 'space_1000', name: 'Gardien Galactique', desc: 'Fais plus de 1,000 points dans Space Void', icon: '🚀', xp: 250 },
      { id: 'space_boss', name: 'Tueur de Titan', desc: 'Annihile le Titan Cybernétique dans Space Void', icon: '👾', xp: 500 },
      { id: 'breakout_500', name: 'Briseur de Prisme', desc: 'Atteins 500 points dans Laser Breakout', icon: '🧱', xp: 250 },
      { id: 'flap_15', name: 'Franchisseur Quantum', desc: 'Passe 15 portes laser dans Cyber Flap', icon: '🛸', xp: 250 },
      { id: 'memory_7', name: 'Synapse Surcadencée', desc: 'Réussis le niveau 7 dans Quantum Matrix', icon: '🧠', xp: 300 },
      { id: 'aim_25', name: 'Réflexes Cybernétiques', desc: 'Élimine 25 cibles dans Aim Overdrive', icon: '🎯', xp: 250 },
      { id: 'racer_1000', name: 'Pilote de l\'Asphalte', desc: 'Atteins 1,000 points dans Cyber Drift', icon: '🏎', xp: 300 },
      { id: 'vortex_800', name: 'Maître du Vortex', desc: 'Atteins 800 points dans Orbital Vortex', icon: '🌀', xp: 350 },
      { id: 'slicer_500', name: 'Lame Cybernétique', desc: 'Atteins 500 points dans Neon Katana', icon: '⚔', xp: 300 },
      { id: 'stacker_1000', name: 'Architecte Quantique', desc: 'Atteins 1,000 points dans Quantum Stacker', icon: '🟦', xp: 350 },
      { id: 'konami_god', name: 'Légende de la Baguette', desc: 'Code Konami secret activé ! Un vrai gamer français.', icon: '🥖', xp: 1000 },
      { id: 'arcade_god', name: 'Dieu de l\'Arcade', desc: 'Atteins le niveau 5 de joueur', icon: '⭐', xp: 1000 },
      { id: 'all_rounder', name: 'Maître Suprême', desc: 'Joue aux 10 jeux de l\'arcade au moins une fois', icon: '🏆', xp: 800 }
    ];

    this.data = this.load();
    this.syncDailyQuests();
    this.startCountdownTimer();
    this.initKonamiCode();
  }

  load() {
    const defaultData = {
      xp: 0,
      coins: 200,
      pseudo: '',
      region: 'Île-de-France (Paris - 75)',
      avatar: '⚡',
      hasCreatedProfile: false,
      highScores: {
        snake: 0, space: 0, breakout: 0, flap: 0, memory: 0,
        aim: 0, racer: 0, vortex: 0, slicer: 0, stacker: 0
      },
      gamesPlayed: {
        snake: 0, space: 0, breakout: 0, flap: 0, memory: 0,
        aim: 0, racer: 0, vortex: 0, slicer: 0, stacker: 0
      },
      questDate: '',
      dailyQuests: [],
      unlockedAchievements: [],
      activeTheme: 'default',
      crtEnabled: false
    };

    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        const data = Object.assign(defaultData, parsed);
        data.highScores = Object.assign({
          snake: 0, space: 0, breakout: 0, flap: 0, memory: 0,
          aim: 0, racer: 0, vortex: 0, slicer: 0, stacker: 0
        }, parsed.highScores || {});
        data.gamesPlayed = Object.assign({
          snake: 0, space: 0, breakout: 0, flap: 0, memory: 0,
          aim: 0, racer: 0, vortex: 0, slicer: 0, stacker: 0
        }, parsed.gamesPlayed || {});
        if (!Array.isArray(data.unlockedAchievements)) data.unlockedAchievements = [];

        // Check if player has created a true personalized profile
        if (parsed.pseudo && parsed.pseudo !== 'Pilote Néon' && parsed.pseudo.trim().length >= 2) {
          data.hasCreatedProfile = parsed.hasCreatedProfile !== undefined ? parsed.hasCreatedProfile : true;
        } else {
          data.hasCreatedProfile = false;
        }

        return data;
      }
    } catch (e) {
      console.warn("Could not load from localStorage", e);
    }
    return defaultData;
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.warn("Could not save to localStorage", e);
    }
  }

  // Sync daily quests with real calendar day in France (Europe/Paris)
  syncDailyQuests() {
    if (!window.dailyQuestEngine) return;
    const today = window.dailyQuestEngine.getCurrentDayString();

    if (this.data.questDate !== today || !this.data.dailyQuests || this.data.dailyQuests.length === 0) {
      // New calendar day! Generate deterministic quests for today
      const generated = window.dailyQuestEngine.generateTodayQuests();
      this.data.questDate = today;
      this.data.dailyQuests = generated.quests;
      this.save();
    }
  }

  startCountdownTimer() {
    const updateCountdown = () => {
      const el = document.getElementById('daily-countdown');
      if (el && window.dailyQuestEngine) {
        const secs = window.dailyQuestEngine.getSecondsUntilMidnight();
        el.textContent = window.dailyQuestEngine.formatCountdown(secs);

        // If midnight reached, re-sync quests
        if (secs <= 0) {
          this.syncDailyQuests();
          this.renderDailyQuests();
        }
      }
    };

    setInterval(updateCountdown, 1000);
    setTimeout(updateCountdown, 50);
  }

  setProfile(pseudo, region, avatar) {
    const oldPseudo = this.data.pseudo;
    if (pseudo) this.data.pseudo = pseudo.trim();
    if (region) this.data.region = region;
    if (avatar) this.data.avatar = avatar;
    this.data.hasCreatedProfile = true;
    this.save();
    this.updateUI();
    if (window.leaderboardSystem) {
      window.leaderboardSystem.updatePlayerProfile(oldPseudo, this.data.pseudo, this.data.region, this.data.avatar);
      if (this.getTotalScore() > 0) {
        window.leaderboardSystem.recordRealScore('all', this.getTotalScore(), this.data.pseudo, this.data.region, this.data.avatar, true);
      }
    }
    this.triggerToast('👤 PROFIL VALIDÉ !', `Bienvenue ${this.data.pseudo} (${this.data.region}) !`, '👑');
  }

  getTotalScore() {
    return Object.values(this.data.highScores).reduce((a, b) => a + b, 0);
  }

  getLevel() {
    return Math.floor(this.data.xp / 400) + 1;
  }

  getXPProgress() {
    const currentLvlXP = this.data.xp % 400;
    const percent = Math.min(100, Math.floor((currentLvlXP / 400) * 100));
    return { current: currentLvlXP, max: 400, percent };
  }

  addXP(amount) {
    const oldLevel = this.getLevel();
    this.data.xp += amount;
    const newLevel = this.getLevel();

    if (newLevel > oldLevel) {
      this.triggerToast('🚀 NIVEAU SUPÉRIEUR !', `Tu es maintenant Niveau ${newLevel} !`);
      if (window.soundEngine) {
        window.soundEngine.playPowerup();
        window.soundEngine.announce(`LEVEL ${newLevel} !`);
      }
      if (newLevel >= 5) {
        this.unlock('arcade_god');
      }
    }
    this.save();
    this.updateUI();
  }

  unlock(id) {
    if (!this.data.unlockedAchievements.includes(id)) {
      this.data.unlockedAchievements.push(id);
      const ach = this.achievementsList.find(a => a.id === id);
      if (ach) {
        this.triggerToast(`🏆 SUCCÈS : ${ach.name}`, `${ach.desc} (+${ach.xp} XP)`);
        this.addXP(ach.xp);
        if (window.soundEngine) {
          window.soundEngine.playPowerup();
          window.soundEngine.announce('ACHIEVEMENT UNLOCKED !');
        }
      }
    }
  }

  recordGamePlay(gameId, score) {
    this.syncDailyQuests();

    if (!this.data.gamesPlayed[gameId]) {
      this.data.gamesPlayed[gameId] = 0;
    }
    this.data.gamesPlayed[gameId]++;

    const earnedXP = Math.max(15, Math.floor(score / 5));
    let earnedCoins = Math.max(8, Math.floor(score / 15));

    // Shop Perk: Double Cyber Credits 2X
    if (window.cyberShop && window.cyberShop.hasPerk('perk_double_coins')) {
      earnedCoins *= 2;
    }

    this.data.coins = (this.data.coins || 0) + earnedCoins;
    this.addXP(earnedXP);

    let isNewHigh = false;
    if (score > (this.data.highScores[gameId] || 0)) {
      this.data.highScores[gameId] = score;
      isNewHigh = true;

      // Register real high score in the real leaderboard
      if (window.leaderboardSystem) {
        window.leaderboardSystem.recordRealScore(
          gameId,
          score,
          this.data.pseudo,
          this.data.region,
          this.data.avatar,
          true
        );
        window.leaderboardSystem.recordRealScore(
          'all',
          this.getTotalScore(),
          this.data.pseudo,
          this.data.region,
          this.data.avatar,
          true
        );
      }
    }

    // Advance daily quests
    this.checkDailyQuests(gameId, score);

    // Check Achievements
    this.checkAchievements(gameId, score);

    // Haptic vibration feedback
    if (navigator.vibrate) {
      navigator.vibrate([40, 30, 60]);
    }

    this.save();
    this.updateUI();
    return { isNewHigh, earnedXP, earnedCoins };
  }

  checkDailyQuests(gameId, score) {
    if (!this.data.dailyQuests) return;

    this.data.dailyQuests.forEach(q => {
      if (q.done) return;

      if (q.game === gameId) {
        q.current = Math.max(q.current, score);
        if (q.current >= q.target) {
          q.done = true;
          this.completeQuest(q);
        }
      } else if (q.game === 'any_multi') {
        const playedCount = Object.values(this.data.gamesPlayed).filter(c => c > 0).length;
        q.current = Math.min(q.target, playedCount);
        if (q.current >= q.target) {
          q.done = true;
          this.completeQuest(q);
        }
      }
    });
  }

  completeQuest(quest) {
    this.data.coins = (this.data.coins || 0) + quest.reward;
    this.addXP(quest.xp);
    this.triggerToast('🎯 MISSION QUOTIDIENNE ACCOMPLIE !', `${quest.title} (+${quest.reward} 🪙, +${quest.xp} XP)`, '✨');
    if (window.soundEngine) {
      window.soundEngine.playPowerup();
      window.soundEngine.announce('DAILY MISSION COMPLETED !');
    }
  }

  checkAchievements(gameId, score) {
    this.unlock('first_play');

    if (gameId === 'snake') {
      if (score >= 50) this.unlock('snake_50');
      if (score >= 120) this.unlock('snake_120');
    } else if (gameId === 'space') {
      if (score >= 1000) this.unlock('space_1000');
      if (score >= 2500) this.unlock('space_boss');
    } else if (gameId === 'breakout') {
      if (score >= 500) this.unlock('breakout_500');
    } else if (gameId === 'flap') {
      if (score >= 15) this.unlock('flap_15');
    } else if (gameId === 'memory') {
      if (score >= 7) this.unlock('memory_7');
    } else if (gameId === 'aim') {
      if (score >= 25) this.unlock('aim_25');
    } else if (gameId === 'racer') {
      if (score >= 1000) this.unlock('racer_1000');
    } else if (gameId === 'vortex') {
      if (score >= 800) this.unlock('vortex_800');
    } else if (gameId === 'slicer') {
      if (score >= 500) this.unlock('slicer_500');
    } else if (gameId === 'stacker') {
      if (score >= 1000) this.unlock('stacker_1000');
    }

    const allPlayed = Object.keys(this.data.highScores).every(k => (this.data.gamesPlayed[k] || 0) > 0);
    if (allPlayed) {
      this.unlock('all_rounder');
    }
  }

  // Secret Konami Code Easter Egg
  initKonamiCode() {
    const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let index = 0;

    window.addEventListener('keydown', (e) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === code[index] || e.key === code[index]) {
        index++;
        if (index === code.length) {
          index = 0;
          this.triggerKonamiEasterEgg();
        }
      } else {
        index = 0;
      }
    });
  }

  triggerKonamiEasterEgg() {
    this.unlock('konami_god');
    this.data.coins = (this.data.coins || 0) + 1000;
    this.setTheme('gold');
    this.save();
    this.updateUI();

    this.triggerToast('🥖 SECRET : CODE KONAMI ACTIVÉ !', '+1,000 CRÉDITS & THÈME OR DÉVERROUILLÉ !', '👑');
    if (window.soundEngine) {
      window.soundEngine.playPowerup();
      window.soundEngine.announce('KONAMI CODE ACTIVATED ! VOUS ETES UNE LEGENDE !');
    }
  }

  triggerToast(title, message, icon = '🏆') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 400);
    }, 4500);
  }

  setTheme(themeName) {
    this.data.activeTheme = themeName;
    document.body.setAttribute('data-theme', themeName);
    this.save();
  }

  toggleCRT() {
    this.data.crtEnabled = !this.data.crtEnabled;
    if (this.data.crtEnabled) {
      document.body.classList.add('crt-active');
    } else {
      document.body.classList.remove('crt-active');
    }
    this.save();
    return this.data.crtEnabled;
  }

  updateUI() {
    const lvlEl = document.getElementById('user-level-val');
    if (lvlEl) lvlEl.textContent = this.getLevel();

    const xpEl = document.getElementById('user-xp-val');
    const xpProgress = this.getXPProgress();
    if (xpEl) xpEl.textContent = `${xpProgress.current} / ${xpProgress.max} XP`;

    const xpFillEl = document.getElementById('user-xp-fill');
    if (xpFillEl) xpFillEl.style.width = `${xpProgress.percent}%`;

    const coinsEl = document.getElementById('user-coins-val');
    if (coinsEl) coinsEl.textContent = this.data.coins || 0;

    const pseudoEl = document.getElementById('header-player-pseudo');
    if (pseudoEl) {
      pseudoEl.textContent = (this.data.hasCreatedProfile && this.data.pseudo) ? this.data.pseudo : '⚡ Créer Profil';
    }

    Object.keys(this.data.highScores).forEach(key => {
      const cardEl = document.getElementById(`high-${key}`);
      if (cardEl) {
        cardEl.textContent = this.data.highScores[key];
      }
      const footerEl = document.getElementById(`high-${key}-footer`);
      if (footerEl) {
        footerEl.textContent = this.data.highScores[key];
      }
    });

    const achCountEl = document.getElementById('achievements-count');
    if (achCountEl) {
      achCountEl.textContent = `${this.data.unlockedAchievements.length} / ${this.achievementsList.length}`;
    }

    this.renderDailyQuests();

    if (window.leaderboardSystem) {
      const filterSelect = document.getElementById('leaderboard-game-filter');
      const game = filterSelect ? filterSelect.value : 'all';
      window.leaderboardSystem.render(game);
    }
  }

  renderDailyQuests() {
    const container = document.getElementById('daily-quests-container');
    if (!container || !this.data.dailyQuests) return;
    container.innerHTML = '';

    this.data.dailyQuests.forEach(q => {
      const item = document.createElement('div');
      item.className = `quest-item ${q.done ? 'completed' : ''}`;
      const percent = Math.min(100, Math.floor((q.current / q.target) * 100));

      item.innerHTML = `
        <div class="quest-check">${q.done ? '✔' : '○'}</div>
        <div class="quest-details">
          <div class="quest-text"><strong>${q.title}</strong> — ${q.desc}</div>
          <div class="quest-progress-bar"><div class="quest-progress-fill" style="width: ${percent}%"></div></div>
        </div>
        <div class="quest-reward">+${q.reward} 🪙</div>
      `;
      container.appendChild(item);
    });
  }
}

window.arcadeState = new ArcadeState();
