/* =========================================================
   NEON ARCADE - 100% REAL PLAYERS LEADERBOARD
   Zero mock bots / Zero fake celebrities.
   Only real players, real high scores & real duel challengers.
   Syncs in real-time across tabs via BroadcastChannel.
   ========================================================= */

class LeaderboardSystem {
  constructor() {
    this.storageKey = 'NEON_ARCADE_REAL_LEADERBOARD_V2';
    this.selectedGame = 'all';
    this.data = this.load();

    // Cross-tab real-time sync for real players
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel('neon_arcade_leaderboard_channel');
        this.channel.onmessage = (event) => {
          if (event.data && event.data.type === 'NEW_REAL_SCORE') {
            this.handleRemoteScore(event.data.payload);
          }
        };
      } catch (e) {
        this.channel = null;
      }
    }
  }

  load() {
    const defaultData = {
      all: {},
      space: {},
      racer: {},
      stacker: {},
      slicer: {},
      snake: {},
      breakout: {},
      flap: {},
      memory: {},
      aim: {},
      vortex: {}
    };

    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return Object.assign(defaultData, parsed);
        }
      }
    } catch (e) {
      console.warn("Could not load real leaderboard", e);
    }
    return defaultData;
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.warn("Could not save real leaderboard", e);
    }
  }

  // Record a real player's score
  recordRealScore(gameKey, score, playerName, region, avatar, broadcast = true) {
    if (!playerName || !score || score <= 0) return;
    if (!this.data[gameKey]) this.data[gameKey] = {};

    const cleanName = playerName.trim();
    const existing = this.data[gameKey][cleanName];

    // Only update if score is better or first time
    if (!existing || score > existing.score) {
      const entry = {
        name: cleanName,
        region: region || 'France',
        avatar: avatar || '⚡',
        score: score,
        updatedAt: Date.now()
      };
      this.data[gameKey][cleanName] = entry;
      this.save();

      // Broadcast to other open windows / tabs
      if (broadcast && this.channel) {
        try {
          this.channel.postMessage({
            type: 'NEW_REAL_SCORE',
            payload: { gameKey, entry }
          });
        } catch (e) {}
      }

      // Re-render if currently viewing this game
      if (this.selectedGame === gameKey || this.selectedGame === 'all') {
        this.render(this.selectedGame);
      }
    }
  }

  handleRemoteScore(payload) {
    if (!payload || !payload.gameKey || !payload.entry) return;
    const { gameKey, entry } = payload;
    if (!this.data[gameKey]) this.data[gameKey] = {};
    const existing = this.data[gameKey][entry.name];
    if (!existing || entry.score > existing.score) {
      this.data[gameKey][entry.name] = entry;
      this.save();
      this.render(this.selectedGame);
    }
  }

  updatePlayerProfile(oldName, newName, newRegion, newAvatar) {
    // If the active player changes their pseudo or region in the profile modal
    if (!oldName || !newName) return;
    Object.keys(this.data).forEach(gk => {
      if (this.data[gk] && this.data[gk][oldName]) {
        const score = this.data[gk][oldName].score;
        delete this.data[gk][oldName];
        this.data[gk][newName] = {
          name: newName,
          region: newRegion,
          avatar: newAvatar,
          score: score,
          updatedAt: Date.now()
        };
      }
    });
    this.save();
    this.render(this.selectedGame);
  }

  // Get current player score for selected leaderboard
  getPlayerScore(gameKey) {
    if (!window.arcadeState) return 0;
    if (gameKey === 'all') {
      return window.arcadeState.getTotalScore();
    }
    return window.arcadeState.data.highScores[gameKey] || 0;
  }

  // Get ranked list of REAL players
  getRankings(gameKey = 'all') {
    const pScore = this.getPlayerScore(gameKey);
    const pName = window.arcadeState ? (window.arcadeState.data.pseudo || 'Pilote Néon') : 'Pilote Néon';
    const pRegion = window.arcadeState ? (window.arcadeState.data.region || 'France') : 'France';
    const pAvatar = window.arcadeState ? (window.arcadeState.data.avatar || '⚡') : '⚡';

    // Collect all real entries registered in localStorage
    const entriesMap = Object.assign({}, this.data[gameKey] || {});

    // Ensure the current active player's latest session score is reflected
    if (pScore > 0) {
      entriesMap[pName] = {
        name: pName,
        region: pRegion,
        avatar: pAvatar,
        score: Math.max(pScore, entriesMap[pName] ? entriesMap[pName].score : 0),
        isPlayer: true
      };
    }

    const list = Object.values(entriesMap);

    // Sort descending strictly by real score
    list.sort((a, b) => b.score - a.score);

    // Assign real ranks
    return list.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
      isPlayer: entry.name === pName
    }));
  }

  render(gameKey = 'all') {
    this.selectedGame = gameKey;
    const container = document.getElementById('leaderboard-list');
    if (!container) return;
    container.innerHTML = '';

    const rankings = this.getRankings(gameKey);

    if (rankings.length === 0) {
      // Zero real scores recorded yet
      container.innerHTML = `
        <div class="lb-empty-notice">
          <div class="lb-empty-icon">🎮</div>
          <div class="lb-empty-title">AUCUN SCORE ENREGISTRÉ POUR L'INSTANT</div>
          <p style="margin-top: 6px; color: var(--text-muted); font-size: 0.95rem;">
            Ce classement affiche uniquement les <strong>vrais scores des vrais joueurs</strong> (aucun faux bot).
          </p>
          <p style="margin-top: 4px; color: var(--neon-cyan); font-weight: 600;">
            Jouez une partie pour inscrire le tout premier record officiel !
          </p>
        </div>
      `;
      return;
    }

    // Render real players
    rankings.forEach(item => {
      const row = document.createElement('div');
      row.className = `leaderboard-row ${item.isPlayer ? 'player-row' : ''}`;

      const rankBadge = item.rank === 1 ? '🥇' : (item.rank === 2 ? '🥈' : (item.rank === 3 ? '🥉' : `#${item.rank}`));

      row.innerHTML = `
        <div class="lb-rank">${rankBadge}</div>
        <div class="lb-avatar">${item.avatar || '⚡'}</div>
        <div class="lb-name">
          ${item.name} ${item.isPlayer ? '<span class="player-tag">VOUS</span>' : ''}
          <div class="lb-region">${item.region}</div>
        </div>
        <div class="lb-score">${item.score.toLocaleString('fr-FR')} PTS</div>
      `;

      container.appendChild(row);
    });

    // If there is only 1 real player (the local user), show an encouraging notice explaining how to invite friends
    if (rankings.length === 1) {
      const singleNotice = document.createElement('div');
      singleNotice.className = 'lb-single-player-notice';
      singleNotice.innerHTML = `
        <div class="lb-notice-icon">⚔</div>
        <div class="lb-notice-content">
          <strong>VOUS ÊTES ACTUELLEMENT SEUL SUR CE CLASSEMENT (N°1 DE FRANCE !)</strong>
          <p>Tous les faux profils ont été définitivement supprimés. Pour ajouter vos amis ici, cliquez sur <strong>« ⚔ DÉFIER UN POTE »</strong> en fin de partie et envoyez-leur le lien sur Discord ou WhatsApp !</p>
        </div>
      `;
      container.appendChild(singleNotice);
    }
  }
}

window.leaderboardSystem = new LeaderboardSystem();
