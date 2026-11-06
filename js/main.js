/* =========================================================
   NEON ARCADE - MAIN CONTROLLER & APPLICATION HUB V3
   10 Games Registry, Shop Integration, Scorecard & PWA
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  // Register Service Worker for offline PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW reg error:', err));
  }

  // 10 Full Games Registry
  const GAMES = {
    snake: {
      name: 'Neon Snake',
      category: 'retro',
      tag: 'Classique Cyber',
      description: 'Pilotez un serpent de néon survolté ! Téléportez-vous dans les vortex quantiques et activez le turbo dash 2X !',
      controls: 'PC: Flèches / ZQSD • Espace Turbo | Mobile: Glisser / D-Pad • ⚡ Turbo',
      instance: new SnakeGame()
    },
    space: {
      name: 'Space Void',
      category: 'action',
      tag: 'Shooter Titan Boss',
      description: 'Annihilez les hordes cybernétiques et survivez au redoutable Titan Mothership à tirs radiaux !',
      controls: 'PC: Souris / Flèches / ZQSD • Espace Tir | Mobile: Glisser / Boutons • ⚡ Auto-Tir',
      instance: new SpaceGame()
    },
    racer: {
      name: 'Cyber Drift',
      category: 'action',
      tag: 'OutRun Pseudo-3D',
      description: 'Course rétro-synthwave à pleine vitesse ! Slalomez entre les véhicules, déclenchez la nitro et passez les checkpoints !',
      controls: 'PC: Flèches / ZQSD (▲ Accélère) • Espace Nitro | Mobile: Glisser / ◀ ▶ ▲ ⚡',
      instance: new RacerGame()
    },
    slicer: {
      name: 'Neon Katana',
      category: 'action',
      tag: 'Cyber Slicer',
      description: 'Tranchez les cristaux de données en plein vol d\'un coup de katana plasma ! Évitez les bombes EMP instables.',
      controls: 'PC: Clic & Glisser la souris | Mobile: Balayage tactile du sabre',
      instance: new SlicerGame()
    },
    vortex: {
      name: 'Orbital Vortex',
      category: 'reflexe',
      tag: 'Survie 360°',
      description: 'Défendez le noyau gravitationnel à 360° en faisant pivoter votre bouclier contre les ondes polygonales entrantes !',
      controls: 'PC: Suivi Souris 360° / Flèches | Mobile: Tactile 360° / Boutons ◀ ▶',
      instance: new VortexGame()
    },
    stacker: {
      name: 'Quantum Stacker',
      category: 'retro',
      tag: 'Tetris Néon',
      description: 'Empilez les tétrominos holographiques, projetez la pièce fantôme et déclenchez des Quantum Tetris à 4 lignes !',
      controls: 'PC: Flèches / ZQSD • Espace Drop • C/Shift Réserve | Mobile: Balayer ou D-Pad • 🔄 ⚡ 📦',
      instance: new StackerGame()
    },
    breakout: {
      name: 'Laser Breakout',
      category: 'retro',
      tag: 'Arkanoid Néon',
      description: 'Détruisez les briques holographiques, débloquez le paddle laser et déclenchez des chaînes de multi-billes !',
      controls: 'PC: Souris / Flèches • Espace Lancer/Laser | Mobile: Glisser Paddle / Boutons • ⚡',
      instance: new BreakoutGame()
    },
    flap: {
      name: 'Cyber Flap',
      category: 'reflexe',
      tag: 'Runner Anti-Gravité',
      description: 'Guidez votre drone quantum entre les barrières laser mortelles en frôlant les parois pour des combos risqués.',
      controls: 'PC: Espace / Clic / Flèche Haut | Mobile: Toucher écran ou bouton géant 🚀',
      instance: new FlapGame()
    },
    memory: {
      name: 'Quantum Matrix',
      category: 'reflexe',
      tag: 'Mémoire Synthwave',
      description: 'Mémorisez et reproduisez la partition lumineuse et harmonique. Escalade de tempo et sons analogiques 80s.',
      controls: 'PC: Touches 1,2,3,4 ou ZQSD / Flèches | Mobile: Taper directement sur les pads',
      instance: new MemoryGame()
    },
    aim: {
      name: 'Aim Overdrive',
      category: 'action',
      tag: 'Test Réflexe',
      description: 'Visez et détruisez les cibles cybernétiques avant qu\'elles ne disparaissent. Évitez absolument les pièges crânes !',
      controls: 'PC: Souris / Viseur + Clic ou Espace | Mobile: Toucher directement les cibles',
      instance: new AimGame()
    }
  };

  let currentGameKey = null;
  let currentGame = null;
  let isGameRunning = false;
  let isGamePaused = false;
  let lastScore = 0;

  // DOM Elements
  const gameModal = document.getElementById('game-modal');
  const gameCanvas = document.getElementById('game-canvas');
  const arenaTitle = document.getElementById('arena-game-name');
  const arenaControlsHint = document.getElementById('arena-controls-hint');
  const arenaCurrentScore = document.getElementById('arena-current-score');
  const arenaBestScore = document.getElementById('arena-best-score');

  const overlayScreen = document.getElementById('arena-overlay');
  const overlayBadge = document.getElementById('overlay-badge');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayFinalScore = document.getElementById('overlay-final-score');
  const overlayBestScore = document.getElementById('overlay-best-score');
  const overlayBtnRestart = document.getElementById('btn-overlay-restart');
  const overlayBtnResume = document.getElementById('btn-overlay-resume');
  const overlayBtnChallenge = document.getElementById('btn-overlay-challenge');
  const overlayBtnShare = document.getElementById('btn-overlay-share');
  const overlayBtnExit = document.getElementById('btn-overlay-exit');

  const btnCloseArena = document.getElementById('btn-close-arena');
  const btnPauseArena = document.getElementById('btn-pause-arena');

  // Header buttons
  const btnToggleSound = document.getElementById('btn-toggle-sound');
  const btnToggleMusic = document.getElementById('btn-toggle-music');
  const btnNextTrack = document.getElementById('btn-next-track');
  const btnToggleCRT = document.getElementById('btn-toggle-crt');
  const btnTrophies = document.getElementById('btn-trophies');
  const btnOpenShop = document.getElementById('btn-open-shop');
  const btnThemeSelect = document.getElementById('theme-selector');

  // Modals
  const trophiesModal = document.getElementById('trophies-modal');
  const btnCloseTrophies = document.getElementById('btn-close-trophies');
  const trophiesList = document.getElementById('trophies-list');

  const shopModal = document.getElementById('shop-modal');
  const btnCloseShop = document.getElementById('btn-close-shop');

  const scorecardModal = document.getElementById('scorecard-modal');
  const btnCloseScorecard = document.getElementById('btn-close-scorecard');

  const profileModal = document.getElementById('profile-modal');
  const profileModalTitle = document.getElementById('profile-modal-title');
  const profileModalBadge = document.getElementById('profile-modal-badge');
  const profileInputError = document.getElementById('profile-input-error');
  const btnOpenProfile = document.getElementById('btn-open-profile');
  const btnCloseProfile = document.getElementById('btn-close-profile');
  const btnSaveProfile = document.getElementById('btn-save-profile');
  const inputPseudo = document.getElementById('input-profile-pseudo');
  const selectRegion = document.getElementById('input-profile-region');
  const avatarOptions = document.querySelectorAll('#avatar-selector .avatar-opt');
  let selectedAvatar = '⚡';
  let pendingProfileCallback = null;

  // --- Mandatory / Custom Profile Modal Function ---
  function openProfileModal(isMandatory = false, onComplete = null) {
    inputPseudo.value = window.arcadeState.data.pseudo || '';
    if (window.arcadeState.data.region) {
      selectRegion.value = window.arcadeState.data.region;
    }
    selectedAvatar = window.arcadeState.data.avatar || '⚡';

    avatarOptions.forEach(opt => {
      opt.classList.toggle('active', opt.getAttribute('data-avatar') === selectedAvatar);
    });

    if (profileInputError) {
      profileInputError.style.display = 'none';
      profileInputError.textContent = '';
    }
    inputPseudo.classList.remove('input-error');

    if (isMandatory) {
      profileModal.classList.add('active', 'mandatory-profile');
      if (profileModalTitle) profileModalTitle.textContent = '⚡ CRÉATION DU PILOTE NÉON';
      if (profileModalBadge) profileModalBadge.style.display = 'block';
      if (btnCloseProfile) btnCloseProfile.style.display = 'none';
      btnSaveProfile.textContent = 'VALIDER ET COMMENCER À JOUER ▶';
    } else {
      profileModal.classList.remove('mandatory-profile');
      profileModal.classList.add('active');
      if (profileModalTitle) profileModalTitle.textContent = '👤 MODIFIER MON PROFIL';
      if (profileModalBadge) profileModalBadge.style.display = 'none';
      if (btnCloseProfile) btnCloseProfile.style.display = 'flex';
      btnSaveProfile.textContent = 'ENREGISTRER MON PROFIL';
    }

    pendingProfileCallback = onComplete;
    setTimeout(() => inputPseudo.focus(), 250);
  }

  // --- Profile Modal Wiring ---
  if (btnOpenProfile) {
    btnOpenProfile.addEventListener('click', () => {
      openProfileModal(false);
      if (window.soundEngine) window.soundEngine.playClick();
    });
  }

  avatarOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      avatarOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      selectedAvatar = opt.getAttribute('data-avatar');
      if (window.soundEngine) window.soundEngine.playClick();
    });
  });

  if (btnSaveProfile) {
    btnSaveProfile.addEventListener('click', () => {
      const pseudo = inputPseudo.value.trim();
      if (!pseudo || pseudo.length < 2) {
        inputPseudo.classList.add('input-error');
        if (profileInputError) {
          profileInputError.textContent = '❌ Veuillez entrer un pseudo d\'au moins 2 caractères !';
          profileInputError.style.display = 'block';
        }
        if (window.soundEngine) window.soundEngine.playBounce();
        inputPseudo.focus();
        return;
      }

      const region = selectRegion.value;
      window.arcadeState.setProfile(pseudo, region, selectedAvatar);
      profileModal.classList.remove('active', 'mandatory-profile');
      if (btnCloseProfile) btnCloseProfile.style.display = 'flex';

      if (window.soundEngine) {
        window.soundEngine.playPowerup();
        window.soundEngine.announce('PILOT PROFILE SAVED !');
      }

      if (pendingProfileCallback) {
        const cb = pendingProfileCallback;
        pendingProfileCallback = null;
        cb();
      }
    });
  }

  inputPseudo.addEventListener('input', () => {
    if (inputPseudo.value.trim().length >= 2) {
      inputPseudo.classList.remove('input-error');
      if (profileInputError) profileInputError.style.display = 'none';
    }
  });

  inputPseudo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      btnSaveProfile.click();
    }
  });

  if (btnCloseProfile) {
    btnCloseProfile.addEventListener('click', () => {
      if (!window.arcadeState.data.hasCreatedProfile) return;
      profileModal.classList.remove('active');
    });
  }

  if (profileModal) {
    profileModal.addEventListener('click', (e) => {
      if (e.target === profileModal) {
        if (!window.arcadeState.data.hasCreatedProfile) return;
        profileModal.classList.remove('active');
      }
    });
  }

  // --- Leaderboard Filter Wiring ---
  const leaderboardGameFilter = document.getElementById('leaderboard-game-filter');
  if (leaderboardGameFilter) {
    leaderboardGameFilter.addEventListener('change', (e) => {
      if (window.leaderboardSystem) {
        window.leaderboardSystem.render(e.target.value);
      }
      if (window.soundEngine) window.soundEngine.playClick();
    });
  }

  // --- Initialize UI & State ---
  window.arcadeState.updateUI();
  if (window.cyberShop) window.cyberShop.updateCoinsDisplay();

  // Sync real player high scores to the real leaderboard
  if (window.leaderboardSystem && window.arcadeState) {
    const p = window.arcadeState.data;
    if (p && p.highScores) {
      Object.entries(p.highScores).forEach(([gKey, sc]) => {
        if (sc > 0) {
          window.leaderboardSystem.recordRealScore(gKey, sc, p.pseudo, p.region, p.avatar, false);
        }
      });
      const total = window.arcadeState.getTotalScore();
      if (total > 0) {
        window.leaderboardSystem.recordRealScore('all', total, p.pseudo, p.region, p.avatar, false);
      }
    }
    window.leaderboardSystem.render();
  }

  // Initialize Live News Ticker & Retro Attract Mode
  if (window.liveNewsTicker) window.liveNewsTicker.init();
  if (window.attractMode) window.attractMode.init();

  // Check for incoming friend duel challenge (?duel=...)
  if (window.challengeEngine && window.challengeEngine.hasChallenge()) {
    setTimeout(() => {
      window.challengeEngine.showChallengeModal((gameKey) => {
        if (!window.arcadeState.data.hasCreatedProfile) {
          openProfileModal(true, () => openGameArena(gameKey));
        } else {
          openGameArena(gameKey);
        }
      });
    }, 600);
  }

  // Mandatory Profile Check on Startup
  if (!window.arcadeState.data.hasCreatedProfile) {
    setTimeout(() => {
      openProfileModal(true);
    }, 350);
  }

  // Draw animated card canvas previews for all 10 games
  initCardPreviews();

  // --- Category Filters ---
  const filterBtns = document.querySelectorAll('.category-bar .tab-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-cat');

      document.querySelectorAll('.game-card').forEach(card => {
        const gameCat = card.getAttribute('data-category');
        if (cat === 'all' || gameCat === cat) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
      if (window.soundEngine) window.soundEngine.playClick();
    });
  });

  // --- Launch Game from Card ---
  document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
      const gameKey = card.getAttribute('data-game');
      if (!window.arcadeState.data.hasCreatedProfile) {
        openProfileModal(true, () => openGameArena(gameKey));
        return;
      }
      openGameArena(gameKey);
    });
  });

  function openGameArena(key) {
    const gameDef = GAMES[key];
    if (!gameDef) return;

    if (window.soundEngine) {
      window.soundEngine.resume();
      window.soundEngine.playClick();
    }

    currentGameKey = key;
    currentGame = gameDef.instance;
    window.activeGameInstance = currentGame; // for Gamepad API

    arenaTitle.textContent = gameDef.name;
    let hint = gameDef.controls;
    if (window.cyberShop && window.cyberShop.hasPerk('perk_bullet_time') && (key === 'space' || key === 'slicer' || key === 'aim')) {
      hint += ' • [B] / ⚡ Matrix Slow-Mo';
    }
    arenaControlsHint.textContent = hint;
    arenaCurrentScore.textContent = '0';
    arenaBestScore.textContent = window.arcadeState.data.highScores[key] || 0;

    gameModal.classList.add('active');
    overlayScreen.classList.remove('active');

    const touchGamepad = document.getElementById('touch-gamepad');
    if (touchGamepad) {
      touchGamepad.setAttribute('data-game', key);
    }

    // Init & Start game instance
    currentGame.init(
      gameCanvas,
      (score) => {
        lastScore = score;
        arenaCurrentScore.textContent = score;
      },
      (finalScore) => {
        lastScore = finalScore;
        handleGameOver(finalScore);
      }
    );

    currentGame.start();
    isGameRunning = true;
    isGamePaused = false;
  }

  function handleGameOver(score) {
    isGameRunning = false;
    const result = window.arcadeState.recordGamePlay(currentGameKey, score);
    if (window.cyberShop) window.cyberShop.updateCoinsDisplay();

    overlayScreen.classList.add('active');
    overlayBadge.className = 'overlay-status-badge gameover';
    overlayBadge.textContent = 'FIN DE PARTIE';
    overlayTitle.textContent = result.isNewHigh ? 'NOUVEAU RECORD !' : 'BIEN JOUÉ !';
    overlayFinalScore.textContent = score;
    overlayBestScore.textContent = window.arcadeState.data.highScores[currentGameKey];

    overlayBtnResume.style.display = 'none';
    overlayBtnRestart.style.display = 'flex';

    if (result.isNewHigh) {
      window.arcadeState.triggerToast('⭐ RECORD BATTU !', `${GAMES[currentGameKey].name} : ${score} pts ! (+${result.earnedCoins} 🪙)`, '🔥');
      if (window.liveNewsTicker) {
        const pseudo = window.arcadeState.data.pseudo || 'Pilote_Néon';
        const region = window.arcadeState.data.region || 'France';
        window.liveNewsTicker.pushEvent(`🔥 [${region}] ${pseudo} explose le record de ${GAMES[currentGameKey].name} avec ${score.toLocaleString('fr-FR')} PTS !`);
      }
    }
  }

  function pauseGame() {
    if (!isGameRunning || isGamePaused) return;
    isGamePaused = true;
    currentGame.pause();

    overlayScreen.classList.add('active');
    overlayBadge.className = 'overlay-status-badge paused';
    overlayBadge.textContent = 'PAUSE';
    overlayTitle.textContent = 'JEU EN PAUSE';
    overlayFinalScore.textContent = arenaCurrentScore.textContent;
    overlayBestScore.textContent = window.arcadeState.data.highScores[currentGameKey];

    overlayBtnResume.style.display = 'flex';
    overlayBtnRestart.style.display = 'flex';
  }

  function resumeGame() {
    if (!isGamePaused) return;
    isGamePaused = false;
    overlayScreen.classList.remove('active');
    currentGame.resume();
  }

  function exitGame() {
    if (currentGame) {
      currentGame.stop();
    }
    // Clean up pointer listeners on canvas to guarantee clean state
    gameCanvas.onpointermove = null;
    gameCanvas.onpointerdown = null;
    gameCanvas.onpointerup = null;

    window.activeGameInstance = null;
    isGameRunning = false;
    isGamePaused = false;
    gameModal.classList.remove('active');
    overlayScreen.classList.remove('active');
    const touchGamepad = document.getElementById('touch-gamepad');
    if (touchGamepad) {
      touchGamepad.removeAttribute('data-game');
    }
    window.arcadeState.updateUI();
  }

  btnCloseArena.addEventListener('click', exitGame);
  btnPauseArena.addEventListener('click', pauseGame);
  overlayBtnResume.addEventListener('click', resumeGame);
  overlayBtnRestart.addEventListener('click', () => {
    overlayScreen.classList.remove('active');
    arenaCurrentScore.textContent = '0';
    currentGame.start();
    isGameRunning = true;
    isGamePaused = false;
  });
  if (overlayBtnChallenge) {
    overlayBtnChallenge.addEventListener('click', () => {
      if (window.challengeEngine && currentGameKey) {
        window.challengeEngine.shareChallenge(currentGameKey, lastScore);
      }
    });
  }
  overlayBtnShare.addEventListener('click', () => {
    if (window.scoreCardGenerator) {
      window.scoreCardGenerator.showModal(GAMES[currentGameKey].name, lastScore);
    }
  });
  overlayBtnExit.addEventListener('click', exitGame);

  // Global Keybindings & Window Blur Protection
  window.addEventListener('blur', () => {
    if (currentGame && currentGame.keys) {
      currentGame.keys = {};
    }
    if (currentGameKey === 'snake' && currentGame) {
      currentGame.isTurbo = false;
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && profileModal && profileModal.classList.contains('mandatory-profile')) {
      e.preventDefault();
      return;
    }

    if (!isGameRunning) return;

    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
      if (isGamePaused) {
        resumeGame();
      } else {
        pauseGame();
      }
      return;
    }

    if (!isGamePaused && currentGame) {
      currentGame.handleKey(e);
    }
  });

  window.addEventListener('keyup', (e) => {
    if (isGameRunning && !isGamePaused && currentGame) {
      currentGame.handleKey(e);
    }
  });

  // Touch on-screen virtual buttons with ergonomic touch handling & haptics
  let touchHoldInterval = null;
  const triggerTouch = (action) => {
    if (isGameRunning && !isGamePaused && currentGame) {
      currentGame.handleTouch(action);
      if (navigator.vibrate) {
        try { navigator.vibrate(10); } catch(e) {}
      }
    }
  };

  document.querySelectorAll('.touch-btn').forEach(btn => {
    const action = btn.getAttribute('data-action');

    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      triggerTouch(action);

      // Turbo hold for Snake
      if (action === 'action' && currentGameKey === 'snake' && currentGame) {
        currentGame.handleTouch('turbo_start');
      }

      // Repeat directional movements AND auto-fire while held
      const shouldRepeat = action === 'left' || action === 'right' || action === 'up' || action === 'down' ||
                           (action === 'action' && (currentGameKey === 'space' || currentGameKey === 'breakout'));
      if (shouldRepeat) {
        if (touchHoldInterval) clearInterval(touchHoldInterval);
        touchHoldInterval = setInterval(() => {
          triggerTouch(action);
        }, 70);
      }
    });

    const stopHold = () => {
      if (touchHoldInterval) {
        clearInterval(touchHoldInterval);
        touchHoldInterval = null;
      }
      if (action === 'action' && currentGameKey === 'snake' && currentGame) {
        currentGame.handleTouch('turbo_end');
      }
    };

    btn.addEventListener('pointerup', stopHold);
    btn.addEventListener('pointercancel', stopHold);
    btn.addEventListener('pointerleave', stopHold);
  });

  // Direct Mobile Canvas Drag, Swipe & Tap Gestures (Silky Smooth Native Mobile Feel!)
  let isTouchingCanvas = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  const getCanvasCoords = (touch) => {
    const rect = gameCanvas.getBoundingClientRect();
    const scaleX = gameCanvas.width / rect.width;
    const scaleY = gameCanvas.height / rect.height;
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY
    };
  };

  gameCanvas.addEventListener('touchstart', (e) => {
    if (!isGameRunning || isGamePaused || !currentGame) return;
    if (e.touches.length > 0) {
      isTouchingCanvas = true;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = performance.now();

      const coords = getCanvasCoords(e.touches[0]);
      if (currentGame.handleDrag) {
        currentGame.handleDrag(coords.x, coords.y);
      }
      if (currentGameKey === 'flap') {
        currentGame.handleTouch('action');
      }
    }
  }, { passive: false });

  gameCanvas.addEventListener('touchmove', (e) => {
    if (!isGameRunning || isGamePaused || !currentGame) return;
    if (e.touches.length > 0 && isTouchingCanvas) {
      const coords = getCanvasCoords(e.touches[0]);
      if (currentGame.handleDrag) {
        currentGame.handleDrag(coords.x, coords.y);
      }

      // Real-time instantaneous swipe detection for Snake & Tetris
      if (currentGameKey === 'snake' || currentGameKey === 'stacker') {
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        const swipeThreshold = 20;

        if (absX > swipeThreshold || absY > swipeThreshold) {
          if (absX > absY) {
            currentGame.handleTouch(dx > 0 ? 'right' : 'left');
          } else {
            currentGame.handleTouch(dy > 0 ? 'down' : 'up');
          }
          // Reset anchor to allow chained continuous swiping
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      }

      // Prevent pull-to-refresh & screen scrolling during gameplay
      if (e.cancelable) e.preventDefault();
    }
  }, { passive: false });

  gameCanvas.addEventListener('touchend', (e) => {
    if (!isGameRunning || isGamePaused || !currentGame) return;
    isTouchingCanvas = false;
    if (e.changedTouches.length > 0) {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const dt = performance.now() - touchStartTime;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (absX > 25 || absY > 25) {
        // Fallback swipe on release
        if (absX > absY) {
          currentGame.handleTouch(dx > 0 ? 'right' : 'left');
        } else {
          currentGame.handleTouch(dy > 0 ? 'down' : 'up');
        }
      } else if (dt < 300) {
        // Quick tap
        if (currentGameKey !== 'slicer' && currentGameKey !== 'aim' && currentGameKey !== 'memory') {
          currentGame.handleTouch('action');
        }
      }
    }
  }, { passive: true });

  gameCanvas.addEventListener('touchcancel', () => {
    isTouchingCanvas = false;
  });

  // --- Audio Toggles ---
  btnToggleSound.addEventListener('click', () => {
    const muted = window.soundEngine.toggleMute();
    btnToggleSound.textContent = muted ? '🔇' : '🔊';
    btnToggleSound.classList.toggle('active', !muted);
  });

  btnToggleMusic.addEventListener('click', () => {
    const playing = window.soundEngine.toggleMusic();
    btnToggleMusic.classList.toggle('active', playing);
  });

  if (btnNextTrack) {
    btnNextTrack.addEventListener('click', () => {
      const trackName = window.soundEngine.nextTrack();
      window.arcadeState.triggerToast('🎵 JUKEBOX SYNTH', `Piste : ${trackName}`, '📻');
    });
  }

  // --- CRT Scanlines Toggle ---
  btnToggleCRT.addEventListener('click', () => {
    const active = window.arcadeState.toggleCRT();
    btnToggleCRT.classList.toggle('active', active);
    if (window.soundEngine) window.soundEngine.playClick();
  });

  // --- Themes ---
  if (btnThemeSelect) {
    btnThemeSelect.addEventListener('change', (e) => {
      window.arcadeState.setTheme(e.target.value);
      if (window.soundEngine) window.soundEngine.playClick();
    });
  }

  // --- Shop Modal ---
  if (btnOpenShop) {
    btnOpenShop.addEventListener('click', () => {
      if (window.cyberShop) window.cyberShop.renderShop();
      shopModal.classList.add('active');
      if (window.soundEngine) window.soundEngine.playClick();
    });
  }

  if (btnCloseShop) {
    btnCloseShop.addEventListener('click', () => {
      shopModal.classList.remove('active');
    });
  }

  if (shopModal) {
    shopModal.addEventListener('click', (e) => {
      if (e.target === shopModal) shopModal.classList.remove('active');
    });
  }

  // --- Scorecard Modal ---
  if (btnCloseScorecard) {
    btnCloseScorecard.addEventListener('click', () => {
      scorecardModal.classList.remove('active');
    });
  }

  if (scorecardModal) {
    scorecardModal.addEventListener('click', (e) => {
      if (e.target === scorecardModal) scorecardModal.classList.remove('active');
    });
  }

  // --- Trophies Modal ---
  btnTrophies.addEventListener('click', () => {
    renderTrophiesList();
    trophiesModal.classList.add('active');
    if (window.soundEngine) window.soundEngine.playClick();
  });

  btnCloseTrophies.addEventListener('click', () => {
    trophiesModal.classList.remove('active');
  });

  trophiesModal.addEventListener('click', (e) => {
    if (e.target === trophiesModal) trophiesModal.classList.remove('active');
  });

  function renderTrophiesList() {
    trophiesList.innerHTML = '';
    const unlocked = window.arcadeState.data.unlockedAchievements;

    window.arcadeState.achievementsList.forEach(ach => {
      const isDone = unlocked.includes(ach.id);
      const card = document.createElement('div');
      card.className = `achievement-card ${isDone ? 'unlocked' : ''}`;
      card.innerHTML = `
        <div class="achievement-icon">${ach.icon}</div>
        <div class="achievement-details">
          <div class="achievement-name">${ach.name} ${isDone ? '✔ DÉBLOQUÉ' : ''}</div>
          <div class="achievement-desc">${ach.desc}</div>
        </div>
        <div class="achievement-xp">+${ach.xp} XP</div>
      `;
      trophiesList.appendChild(card);
    });
  }

  // --- Dynamic Animated Card Previews for ALL 10 Games ---
  function initCardPreviews() {
    document.querySelectorAll('.card-canvas-preview').forEach(canvas => {
      const ctx = canvas.getContext('2d');
      const gameType = canvas.getAttribute('data-preview');
      canvas.width = 380;
      canvas.height = 190;

      let tick = Math.random() * 100;
      function animatePreview() {
        tick += 0.04;
        ctx.fillStyle = '#0a0d20';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 25) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }

        if (gameType === 'snake') {
          ctx.strokeStyle = '#00f0ff';
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 12;
          ctx.lineWidth = 12;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(60, 100 + Math.sin(tick) * 25);
          ctx.lineTo(160, 100 + Math.sin(tick + 1) * 25);
          ctx.lineTo(260, 100 + Math.sin(tick + 2) * 25);
          ctx.stroke();

          ctx.fillStyle = '#ff007f';
          ctx.shadowColor = '#ff007f';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(310, 100, 10, 0, Math.PI * 2);
          ctx.fill();
        } else if (gameType === 'space') {
          const shipX = canvas.width / 2 + Math.sin(tick) * 60;
          ctx.fillStyle = '#00f0ff';
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.moveTo(shipX, 120);
          ctx.lineTo(shipX + 16, 150);
          ctx.lineTo(shipX - 16, 150);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#ffe600';
          ctx.fillRect(shipX - 10, 70 + (Math.sin(tick * 3) * 20), 4, 18);
          ctx.fillRect(shipX + 6, 70 + (Math.sin(tick * 3) * 20), 4, 18);

          ctx.fillStyle = '#ff007f';
          ctx.shadowColor = '#ff007f';
          ctx.fillRect(canvas.width / 2 - 40, 25, 80, 28);
        } else if (gameType === 'breakout') {
          const colors = ['#ff007f', '#00f0ff', '#ffe600'];
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 6; c++) {
              ctx.fillStyle = colors[r % colors.length];
              ctx.fillRect(25 + c * 55, 20 + r * 18, 48, 12);
            }
          }
          const bx = 190 + Math.cos(tick) * 60;
          const by = 120 + Math.sin(tick) * 30;
          ctx.fillStyle = '#fff';
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(bx, by, 7, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#00f0ff';
          ctx.fillRect(140 + Math.sin(tick) * 50, 165, 80, 10);
        } else if (gameType === 'flap') {
          const dy = 95 + Math.sin(tick * 2) * 25;
          ctx.fillStyle = '#00f0ff';
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(100, dy, 14, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ff007f';
          ctx.shadowColor = '#ff007f';
          ctx.shadowBlur = 15;
          ctx.fillRect(250, 0, 30, 60);
          ctx.fillRect(250, 130, 30, 60);
        } else if (gameType === 'memory') {
          const pads = ['#00f0ff', '#ff007f', '#ffe600', '#00ff88'];
          const activePad = Math.floor(Math.abs(Math.sin(tick * 1.5)) * 4);
          const coords = [
            [130, 40], [210, 40],
            [130, 105], [210, 105]
          ];
          coords.forEach((coord, i) => {
            ctx.fillStyle = i === activePad ? pads[i] : 'rgba(255, 255, 255, 0.1)';
            ctx.strokeStyle = pads[i];
            ctx.lineWidth = 2;
            ctx.strokeRect(coord[0], coord[1], 60, 50);
            ctx.fillRect(coord[0], coord[1], 60, 50);
          });
        } else if (gameType === 'aim') {
          const tx = 190 + Math.sin(tick) * 50;
          const ty = 95 + Math.cos(tick) * 30;
          ctx.fillStyle = '#00f0ff';
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(tx, ty, 20, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffe600';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(tx, ty, 20 + Math.abs(Math.sin(tick * 3)) * 25, 0, Math.PI * 2);
          ctx.stroke();
        } else if (gameType === 'racer') {
          ctx.fillStyle = '#ff007f';
          ctx.beginPath();
          ctx.arc(190, 80, 40, 0, Math.PI, true);
          ctx.fill();

          ctx.fillStyle = '#12163b';
          ctx.beginPath();
          ctx.moveTo(190, 80);
          ctx.lineTo(60, 190);
          ctx.lineTo(320, 190);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#00f0ff';
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 15;
          ctx.fillRect(170 + Math.sin(tick * 2) * 30, 150, 40, 20);
        } else if (gameType === 'vortex') {
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(190, 95, 55, tick, tick + 1.2);
          ctx.stroke();

          ctx.fillStyle = '#ff007f';
          ctx.shadowColor = '#ff007f';
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(190, 95, 14, 0, Math.PI * 2);
          ctx.fill();
        } else if (gameType === 'slicer') {
          const sx = 190 + Math.sin(tick * 2) * 80;
          const sy = 95 + Math.cos(tick * 2) * 45;

          ctx.strokeStyle = '#00f0ff';
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 18;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(sx - 40, sy - 30);
          ctx.lineTo(sx + 40, sy + 30);
          ctx.stroke();

          ctx.fillStyle = '#ffe600';
          ctx.shadowColor = '#ffe600';
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(sx - 15, sy, 12, 0, Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(sx + 15, sy, 12, Math.PI, Math.PI * 2);
          ctx.fill();
        } else if (gameType === 'stacker') {
          // Tetris Blocks preview
          const colors = ['#00f0ff', '#ff007f', '#ffe600', '#00ff88'];
          for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 5; c++) {
              if ((r + c) % 2 === 0) {
                ctx.fillStyle = colors[(r + c) % colors.length];
                ctx.fillRect(140 + c * 20, 70 + r * 20, 18, 18);
              }
            }
          }
          // Falling T-block
          ctx.fillStyle = '#9d4edd';
          ctx.shadowColor = '#9d4edd';
          ctx.shadowBlur = 15;
          const dy = 30 + Math.sin(tick * 2) * 15;
          ctx.fillRect(180, dy, 20, 20);
          ctx.fillRect(160, dy + 20, 60, 20);
        }

        requestAnimationFrame(animatePreview);
      }
      animatePreview();
    });
  }
});
