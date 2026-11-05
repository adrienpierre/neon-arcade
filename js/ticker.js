/* =========================================================
   NEON ARCADE - LIVE REGIONAL NEWS TICKER (FRANCE)
   Real arcade live announcements, French tips & player updates
   Zero fake streamer bots.
   ========================================================= */

class LiveNewsTicker {
  constructor() {
    this.newsItems = [
      "🔴 [Direct France] Le classement est 100% réel : aucun bot, que des vrais joueurs !",
      "⚔ [Défis 1-Clic] Cliquez sur « DÉFIER UN POTE » à la fin d'une partie pour affronter vos amis !",
      "🏎 [Cyber Drift] Slalomez entre les bolides et frôlez les camions pour empocher +60 PTS !",
      "👾 [Space Void] Affrontez le Boss Titan et survivez à ses 3 phases de tirs radiaux !",
      "🪙 [Cyber Locker] Débloquez le Prisme Chromatique RGB et le Bouclier Quantum !",
      "🥖 [Secret Arcade] Le code Konami classique débloque un trophée secret dans l'arcade !",
      "🧱 [Laser Breakout] Déclenchez le Multiball x12 et pulvérisez les rangées de briques !",
      "🕹 [Manettes USB] Branchez votre manette Xbox ou PlayStation pour piloter à 60 FPS !",
      "🏆 [Records] Chaque record personnel battu est instantanément diffusé en direct ici !"
    ];
    this.currentIndex = 0;
    this.intervalId = null;
  }

  init() {
    this.tickerTextEl = document.getElementById('ticker-marquee-text');
    if (!this.tickerTextEl) return;

    this.render();
    this.startCycle();
  }

  render() {
    if (!this.tickerTextEl) return;
    this.tickerTextEl.textContent = this.newsItems[this.currentIndex];
  }

  startCycle() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.newsItems.length;
      if (this.tickerTextEl) {
        this.tickerTextEl.style.opacity = '0';
        setTimeout(() => {
          this.render();
          this.tickerTextEl.style.opacity = '1';
        }, 300);
      }
    }, 6000);
  }

  // Push immediate custom live news (e.g. when local player beats high score or challenge)
  pushEvent(text) {
    this.newsItems.unshift(text);
    this.currentIndex = 0;
    if (this.tickerTextEl) {
      this.tickerTextEl.style.opacity = '0';
      setTimeout(() => {
        this.render();
        this.tickerTextEl.style.opacity = '1';
      }, 200);
    }
  }
}

window.liveNewsTicker = new LiveNewsTicker();
