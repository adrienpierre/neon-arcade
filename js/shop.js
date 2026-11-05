/* =========================================================
   NEON ARCADE - REAL CYBER SHOP & GAMEPLAY PERKS ENGINE
   Actual functional upgrades, magnets, overshields & RGB skins
   ========================================================= */

class CyberShop {
  constructor() {
    this.storageKey = 'NEON_ARCADE_SHOP_SYSTEM_V2';

    // 1. VISUAL SKINS (Changes colors & trails dynamically across all 10 games)
    this.skins = [
      {
        id: 'cyan',
        name: 'Plasma Cyan',
        category: 'skin',
        price: 0,
        color: '#00f0ff',
        type: 'solid',
        desc: 'L\'apparence officielle originale de l\'Arcade.'
      },
      {
        id: 'magenta',
        name: 'Magenta Neon',
        category: 'skin',
        price: 150,
        color: '#ff007f',
        type: 'solid',
        desc: 'Éclats rose fluo des nuits tokyoïtes.'
      },
      {
        id: 'emerald',
        name: 'Toxic Emerald',
        category: 'skin',
        price: 250,
        color: '#00ff88',
        type: 'solid',
        desc: 'Lueur radioactive vert hacker intense.'
      },
      {
        id: 'solar',
        name: 'Flamme Solaire Or',
        category: 'skin',
        price: 450,
        color: '#ffe600',
        type: 'gold',
        desc: 'Aura dorée étincelante avec étincelles royales.'
      },
      {
        id: 'rainbow',
        name: 'Prisme Chromatique RGB',
        category: 'skin',
        price: 750,
        color: 'rainbow',
        type: 'rainbow',
        desc: 'Cycle de couleurs arc-en-ciel en temps réel sur vos tirs et traînées !'
      },
      {
        id: 'void',
        name: 'Nébuleuse du Néant',
        category: 'skin',
        price: 1000,
        color: '#9d4edd',
        type: 'void',
        desc: 'Aura gravitationnelle violette cosmique avec poussière stellaire.'
      }
    ];

    // 2. REAL GAMEPLAY PERKS & POWERS (Actively modify game mechanics!)
    this.perks = [
      {
        id: 'perk_shield',
        name: 'Bouclier Quantum de Départ',
        category: 'perk',
        price: 350,
        icon: '🛡',
        desc: 'COMMENCEZ CHAQUE PARTIE avec 1 Bouclier Plasma ou 1 Vie supplémentaire (Space Void, Snake, Cyber Drift, Flap, Katana, Breakout, Vortex, Aim) !'
      },
      {
        id: 'perk_magnet',
        name: 'Aimant Magnétique d\'Orbes',
        category: 'perk',
        price: 450,
        icon: '🧲',
        desc: 'ATTIRE AUTOMATIQUEMENT les orbes, pièces et bonus proches vers vous (Snake, Flap, Space Void, Breakout) !'
      },
      {
        id: 'perk_double_coins',
        name: 'Doubleur Cyber Crédits 2X',
        category: 'perk',
        price: 550,
        icon: '🪙',
        desc: 'DOUBLE TOUS LES CRÉDITS gagnés à la fin de chaque partie à vie !'
      },
      {
        id: 'perk_nitro_boost',
        name: 'Nitro Suralimentée +50%',
        category: 'perk',
        price: 500,
        icon: '⚡',
        desc: 'La Nitro dure 50% PLUS LONGTEMPS dans Cyber Drift et le Turbo Dash de Snake passe en multiplicateur 3X !'
      },
      {
        id: 'perk_bullet_time',
        name: 'Ralentisseur Temporel Matrix',
        category: 'perk',
        price: 800,
        icon: '⏱',
        desc: 'Ralentit le flux temporel de 60% pendant 3.5s avec la touche [B] ou le bouton tactile (Space Void, Katana, Aim) !'
      }
    ];

    this.data = this.load();
    this.rainbowHue = 0;
  }

  load() {
    const defaultData = {
      equippedSkin: 'cyan',
      unlockedItems: ['cyan']
    };
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          if (!Array.isArray(parsed.unlockedItems)) parsed.unlockedItems = ['cyan'];
          return Object.assign(defaultData, parsed);
        }
      }
    } catch (e) {
      console.warn("Could not load shop", e);
    }
    return defaultData;
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.warn("Could not save shop", e);
    }
  }

  hasPerk(perkId) {
    if (!this.data || !Array.isArray(this.data.unlockedItems)) return false;
    return this.data.unlockedItems.includes(perkId);
  }

  isSkinEquipped(skinId) {
    return this.data && this.data.equippedSkin === skinId;
  }

  // Returns dynamic color based on equipped skin (supports rainbow RGB cycle!)
  getPlayerColor(defaultFallback = '#00f0ff') {
    const equipped = (this.data && this.data.equippedSkin) ? this.data.equippedSkin : 'cyan';
    const skin = this.skins.find(s => s.id === equipped);
    if (!skin) return defaultFallback;

    if (skin.type === 'rainbow') {
      this.rainbowHue = (this.rainbowHue + 1.2) % 360;
      return `hsl(${this.rainbowHue}, 100%, 55%)`;
    }
    return skin.color || defaultFallback;
  }

  getCoins() {
    return window.arcadeState ? (window.arcadeState.data.coins || 0) : 0;
  }

  updateCoinsDisplay() {
    const currentCoins = this.getCoins();
    const coinsHeaderEl = document.getElementById('shop-modal-coins');
    if (coinsHeaderEl) coinsHeaderEl.textContent = `${currentCoins} 🪙`;
    const coinsEl = document.getElementById('user-coins-val');
    if (coinsEl) coinsEl.textContent = currentCoins;
  }

  buyOrEquip(item) {
    if (!this.data || !Array.isArray(this.data.unlockedItems)) {
      this.data = { equippedSkin: 'cyan', unlockedItems: ['cyan'] };
    }
    const isOwned = this.data.unlockedItems.includes(item.id);

    if (isOwned) {
      if (item.category === 'skin') {
        this.data.equippedSkin = item.id;
        this.save();
        this.renderShop();
        if (window.soundEngine) window.soundEngine.playPowerup();
        if (window.arcadeState) {
          window.arcadeState.triggerToast('🎨 APPARENCE ÉQUIPÉE !', `${item.name} est maintenant active dans tous les jeux !`, '✨');
        }
      } else {
        if (window.arcadeState) {
          window.arcadeState.triggerToast('⚡ AMÉLIORATION ACTIVE', `${item.name} est déjà active de façon permanente !`, '✔');
        }
      }
      return;
    }

    // Purchase
    const coins = this.getCoins();
    if (coins >= item.price) {
      window.arcadeState.data.coins -= item.price;
      window.arcadeState.save();

      this.data.unlockedItems.push(item.id);
      if (item.category === 'skin') {
        this.data.equippedSkin = item.id;
      }
      this.save();

      this.renderShop();
      if (window.arcadeState) {
        window.arcadeState.updateUI();
        window.arcadeState.triggerToast('🛒 ACHAT CONFIRMÉ !', `${item.name} débloqué avec succès !`, '🎉');
      }
      if (window.soundEngine) {
        window.soundEngine.playPowerup();
        window.soundEngine.announce('UPGRADE UNLOCKED !');
      }
    } else {
      if (window.soundEngine) window.soundEngine.playBounce();
      if (window.arcadeState) {
        window.arcadeState.triggerToast('🪙 CRÉDITS INSUFFISANTS', `Il vous manque ${item.price - coins} Cyber Crédits ! Jouez pour en gagner.`, '❌');
      }
    }
  }

  renderShop() {
    const container = document.getElementById('shop-items-grid');
    if (!container) return;
    container.innerHTML = '';

    const currentCoins = this.getCoins();
    const coinsHeaderEl = document.getElementById('shop-modal-coins');
    if (coinsHeaderEl) coinsHeaderEl.textContent = `${currentCoins} 🪙`;

    // Render Section: Skins Visuels
    const skinHeader = document.createElement('div');
    skinHeader.className = 'shop-section-heading';
    skinHeader.innerHTML = `<span>🎨 APPARENCES NÉON DYNAMIQUES (Modifie les 10 jeux)</span>`;
    container.appendChild(skinHeader);

    this.skins.forEach(skin => {
      container.appendChild(this.createCard(skin));
    });

    // Render Section: Gameplay Perks
    const perkHeader = document.createElement('div');
    perkHeader.className = 'shop-section-heading';
    perkHeader.innerHTML = `<span>⚡ AMÉLIORATIONS DE GAMEPLAY (Perks Réels en Jeu)</span>`;
    container.appendChild(perkHeader);

    this.perks.forEach(perk => {
      container.appendChild(this.createCard(perk));
    });
  }

  createCard(item) {
    if (!this.data || !Array.isArray(this.data.unlockedItems)) {
      this.data = { equippedSkin: 'cyan', unlockedItems: ['cyan'] };
    }
    const isOwned = this.data.unlockedItems.includes(item.id);
    const isEquipped = item.category === 'skin' && this.data.equippedSkin === item.id;

    const card = document.createElement('div');
    card.className = `shop-item-card ${isEquipped ? 'equipped' : (isOwned ? 'owned' : '')}`;

    let iconDisplay = '';
    if (item.category === 'skin') {
      const previewBg = item.type === 'rainbow'
        ? 'linear-gradient(135deg, #ff007f, #ffe600, #00f0ff, #9d4edd)'
        : (item.type === 'gold'
          ? 'radial-gradient(circle, #ffe600 20%, #ff7b00 80%)'
          : `radial-gradient(circle, ${item.color} 20%, rgba(0,0,0,0.8) 80%)`);
      iconDisplay = `<div class="shop-item-preview" style="background: ${previewBg}; box-shadow: 0 0 22px ${item.color === 'rainbow' ? '#00f0ff' : item.color}; font-size: 1.8rem;">⚡</div>`;
    } else {
      iconDisplay = `<div class="shop-item-preview" style="background: rgba(255, 255, 255, 0.08); border: 1px solid var(--accent); font-size: 2rem;">${item.icon}</div>`;
    }

    let btnText = '';
    if (isEquipped) {
      btnText = '✔ ACTIF';
    } else if (isOwned) {
      btnText = item.category === 'skin' ? 'ÉQUIPER' : '✔ DÉBLOQUÉ';
    } else {
      btnText = `ACHETER (${item.price} 🪙)`;
    }

    card.innerHTML = `
      ${iconDisplay}
      <div class="shop-item-info">
        <div class="shop-item-title">${item.name}</div>
        <div class="shop-item-desc">${item.desc}</div>
      </div>
      <button class="shop-buy-btn ${isEquipped ? 'active' : (isOwned && item.category === 'perk' ? 'permanent' : '')}">
        ${btnText}
      </button>
    `;

    card.querySelector('.shop-buy-btn').addEventListener('click', () => {
      this.buyOrEquip(item);
    });

    return card;
  }
}

window.cyberShop = new CyberShop();
