/* =========================================================
   NEON ARCADE - DAILY QUESTS & 24H SEED ENGINE
   Deterministic daily quests shared by all players with live timer
   ========================================================= */

class DailyQuestEngine {
  constructor() {
    this.questPool = [
      { id: 'snake_score', title: 'Serpent Quantique', desc: 'Atteindre 100 pts à Neon Snake', game: 'snake', target: 100, reward: 80, xp: 150 },
      { id: 'space_score', title: 'Gardien Spatial', desc: 'Dépasser 1,500 pts à Space Void (Affronter le Titan)', game: 'space', target: 1500, reward: 120, xp: 250 },
      { id: 'racer_checkpoint', title: 'As de la Nitro', desc: 'Dépasser 1,200 pts à Cyber Drift', game: 'racer', target: 1200, reward: 100, xp: 200 },
      { id: 'stacker_lines', title: 'Architecte Néon', desc: 'Faire au moins 800 pts à Quantum Stacker', game: 'stacker', target: 800, reward: 90, xp: 180 },
      { id: 'slicer_combo', title: 'Lame Affûtée', desc: 'Trancher pour 600 pts à Neon Katana', game: 'slicer', target: 600, reward: 100, xp: 200 },
      { id: 'vortex_survive', title: 'Danse Orbitale', desc: 'Défendre le noyau jusqu\'à 600 pts à Orbital Vortex', game: 'vortex', target: 600, reward: 90, xp: 180 },
      { id: 'breakout_bricks', title: 'Démolisseur', desc: 'Atteindre 600 pts à Laser Breakout', game: 'breakout', target: 600, reward: 80, xp: 160 },
      { id: 'flap_gates', title: 'Franchisseur', desc: 'Passer 15 barrières à Cyber Flap', game: 'flap', target: 15, reward: 100, xp: 200 },
      { id: 'memory_synth', title: 'Cerveau Bionique', desc: 'Réussir la manche 6 à Quantum Matrix', game: 'memory', target: 60, reward: 110, xp: 220 },
      { id: 'aim_reflex', title: 'Oeil de Lynx', desc: 'Faire un score de 700 pts à Aim Overdrive', game: 'aim', target: 700, reward: 90, xp: 180 },
      { id: 'multi_games', title: 'Touche-à-tout', desc: 'Jouer à 4 jeux différents aujourd\'hui', game: 'any_multi', target: 4, reward: 150, xp: 300 },
      { id: 'high_combo', title: 'Combo Master', desc: 'Réaliser un combo x4 dans n\'importe quel jeu', game: 'any_combo', target: 4, reward: 100, xp: 200 }
    ];
  }

  // Get current calendar day formatted YYYY-MM-DD in Europe/Paris timezone
  getCurrentDayString() {
    const now = new Date();
    const parisDate = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(now);
    return parisDate; // e.g. "2026-11-05"
  }

  // PRNG from string seed
  pseudoRandom(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    return function() {
      hash = Math.sin(hash++) * 10000;
      return hash - Math.floor(hash);
    };
  }

  // Generate the exact 3 daily quests for today's date
  generateTodayQuests() {
    const today = this.getCurrentDayString();
    const rng = this.pseudoRandom(today);

    // Pick 3 unique quests deterministically
    const pool = [...this.questPool];
    const daily = [];
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(rng() * pool.length);
      const selected = pool.splice(idx, 1)[0];
      daily.push({
        ...selected,
        current: 0,
        done: false,
        date: today
      });
    }
    return { date: today, quests: daily };
  }

  // Seconds remaining until midnight CET
  getSecondsUntilMidnight() {
    const now = new Date();
    // Convert to Paris time
    const parisTimeString = now.toLocaleString('en-US', { timeZone: 'Europe/Paris' });
    const parisNow = new Date(parisTimeString);

    const midnight = new Date(parisNow);
    midnight.setHours(24, 0, 0, 0);

    return Math.max(0, Math.floor((midnight - parisNow) / 1000));
  }

  formatCountdown(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  }
}

window.dailyQuestEngine = new DailyQuestEngine();
