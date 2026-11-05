/* =========================================================
   GAME 10: QUANTUM STACKER (NEON TETRIS)
   Full 10x20 Matrix with Ghost Piece, Hard Drop & Combos
   ========================================================= */

class StackerGame {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.onScore = null;
    this.onGameOver = null;
    this.particles = new ParticleSystem();

    this.cols = 10;
    this.rows = 20;
    this.cellSize = 24;
    this.board = [];

    this.shapes = {
      I: { matrix: [[1, 1, 1, 1]], color: '#00f0ff' },
      J: { matrix: [[1, 0, 0], [1, 1, 1]], color: '#4361ee' },
      L: { matrix: [[0, 0, 1], [1, 1, 1]], color: '#ff7b00' },
      O: { matrix: [[1, 1], [1, 1]], color: '#ffe600' },
      S: { matrix: [[0, 1, 1], [1, 1, 0]], color: '#00ff88' },
      T: { matrix: [[0, 1, 0], [1, 1, 1]], color: '#9d4edd' },
      Z: { matrix: [[1, 1, 0], [0, 1, 1]], color: '#ff007f' }
    };

    this.current = null;
    this.next = null;
    this.hold = null;
    this.canHold = true;

    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = 0;

    this.dropCounter = 0;
    this.dropInterval = 45; // frames per step

    this.keys = {};
    this.running = false;
    this.paused = false;
    this.loopId = null;
  }

  init(canvas, onScore, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScore = onScore;
    this.onGameOver = onGameOver;

    this.canvas.width = 700;
    this.canvas.height = 500;

    this.reset();
  }

  reset() {
    this.board = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = 0;
    this.dropInterval = 45;
    this.dropCounter = 0;
    this.hold = null;
    this.canHold = true;
    this.particles.reset();

    this.next = this.randomPiece();
    this.spawnPiece();
  }

  start() {
    this.reset();
    this.running = true;
    this.paused = false;
    if (window.soundEngine) window.soundEngine.announce('STACK BLOCKS !');
    this.loop();
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
    this.loop();
  }

  stop() {
    this.running = false;
    if (this.loopId) cancelAnimationFrame(this.loopId);
  }

  randomPiece() {
    const keys = Object.keys(this.shapes);
    const key = keys[Math.floor(Math.random() * keys.length)];
    const shape = this.shapes[key];
    return {
      type: key,
      matrix: shape.matrix.map(row => [...row]),
      color: shape.color,
      x: 0,
      y: 0
    };
  }

  spawnPiece() {
    this.current = this.next;
    this.next = this.randomPiece();
    this.current.x = Math.floor((this.cols - this.current.matrix[0].length) / 2);
    this.current.y = 0;
    this.canHold = true;

    // Check game over upon spawn
    if (this.collides(this.current.matrix, this.current.x, this.current.y)) {
      this.gameOver();
    }
  }

  collides(matrix, px, py) {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) {
          const newX = px + c;
          const newY = py + r;

          if (newX < 0 || newX >= this.cols || newY >= this.rows) return true;
          if (newY >= 0 && this.board[newY][newX]) return true;
        }
      }
    }
    return false;
  }

  rotate(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        rotated[c][rows - 1 - r] = matrix[r][c];
      }
    }
    return rotated;
  }

  hardDrop() {
    if (!this.running || this.paused || !this.current) return;
    let dropDist = 0;
    while (!this.collides(this.current.matrix, this.current.x, this.current.y + 1)) {
      this.current.y++;
      dropDist++;
    }
    this.score += dropDist * 2;
    this.particles.shake(12, 5);
    if (window.soundEngine) window.soundEngine.playBounce();
    this.lockPiece();
  }

  holdPiece() {
    if (!this.canHold || !this.current) return;
    this.canHold = false;
    const currentType = this.current.type;

    if (!this.hold) {
      this.hold = this.shapes[currentType];
      this.hold.type = currentType;
      this.spawnPiece();
    } else {
      const prevHold = this.hold.type;
      this.hold = this.shapes[currentType];
      this.hold.type = currentType;

      this.current = {
        type: prevHold,
        matrix: this.shapes[prevHold].matrix.map(row => [...row]),
        color: this.shapes[prevHold].color,
        x: Math.floor((this.cols - this.shapes[prevHold].matrix[0].length) / 2),
        y: 0
      };
    }
    if (window.soundEngine) window.soundEngine.playClick();
  }

  lockPiece() {
    const m = this.current.matrix;
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m[r].length; c++) {
        if (m[r][c]) {
          const by = this.current.y + r;
          const bx = this.current.x + c;
          if (by >= 0) {
            this.board[by][bx] = this.current.color;
          }
        }
      }
    }

    this.checkLines();
    this.spawnPiece();
  }

  checkLines() {
    let cleared = 0;
    const boardOffsetX = (this.canvas.width - this.cols * this.cellSize) / 2;
    const boardOffsetY = (this.canvas.height - this.rows * this.cellSize) / 2;

    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.board[r].every(cell => cell !== 0)) {
        cleared++;
        this.board.splice(r, 1);
        this.board.unshift(Array(this.cols).fill(0));

        // Explosion effect on cleared row
        for (let c = 0; c < this.cols; c++) {
          const px = boardOffsetX + c * this.cellSize + this.cellSize / 2;
          const py = boardOffsetY + r * this.cellSize + this.cellSize / 2;
          this.particles.burst(px, py, '#00f0ff', 5, 3);
        }
        r++; // check same row index again
      }
    }

    if (cleared > 0) {
      this.combo++;
      this.lines += cleared;
      let pts = 0;
      let label = '';

      if (cleared === 1) { pts = 100; label = 'SIMPLE +100'; }
      else if (cleared === 2) { pts = 300; label = 'DOUBLE +300'; }
      else if (cleared === 3) { pts = 500; label = 'TRIPLE +500'; }
      else if (cleared === 4) { pts = 1000; label = '⚡ QUANTUM TETRIS +1000 !'; }

      pts *= this.level;
      if (this.combo > 1) pts += this.combo * 50;

      this.score += pts;
      this.onScore(this.score);

      if (window.challengeEngine) {
        window.challengeEngine.checkProgress(this.score, this.particles, this.canvas.width, this.canvas.height);
      }

      this.particles.shake(cleared * 4, cleared * 2);
      this.particles.addFloatingText(label, this.canvas.width / 2, 220, '#ffe600', cleared === 4 ? 26 : 20);

      if (cleared === 4) {
        this.particles.confetti(this.canvas.width, this.canvas.height);
        if (window.soundEngine) {
          window.soundEngine.playPowerup();
          window.soundEngine.announce('QUANTUM TETRIS !');
        }
      } else {
        if (window.soundEngine) window.soundEngine.playCoin();
      }

      // Level progression
      this.level = Math.floor(this.lines / 10) + 1;
      this.dropInterval = Math.max(12, 45 - this.level * 3);
    } else {
      this.combo = 0;
    }
  }

  handleKey(e) {
    if (!this.running || this.paused || !this.current) return;

    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
      case 'q':
      case 'Q':
        if (!this.collides(this.current.matrix, this.current.x - 1, this.current.y)) {
          this.current.x--;
          if (window.soundEngine) window.soundEngine.playClick();
        }
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        if (!this.collides(this.current.matrix, this.current.x + 1, this.current.y)) {
          this.current.x++;
          if (window.soundEngine) window.soundEngine.playClick();
        }
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        if (!this.collides(this.current.matrix, this.current.x, this.current.y + 1)) {
          this.current.y++;
          this.score += 1;
        }
        break;
      case 'ArrowUp':
      case 'w':
      case 'W':
      case 'z':
      case 'Z':
        const rot = this.rotate(this.current.matrix);
        if (!this.collides(rot, this.current.x, this.current.y)) {
          this.current.matrix = rot;
          if (window.soundEngine) window.soundEngine.playBounce();
        }
        break;
      case ' ':
        this.hardDrop();
        break;
      case 'c':
      case 'C':
      case 'Shift':
        this.holdPiece();
        break;
    }
  }

  handleTouch(action) {
    if (action === 'left' && !this.collides(this.current.matrix, this.current.x - 1, this.current.y)) this.current.x--;
    if (action === 'right' && !this.collides(this.current.matrix, this.current.x + 1, this.current.y)) this.current.x++;
    if (action === 'down' && !this.collides(this.current.matrix, this.current.x, this.current.y + 1)) this.current.y++;
    if (action === 'up') {
      const rot = this.rotate(this.current.matrix);
      if (!this.collides(rot, this.current.x, this.current.y)) this.current.matrix = rot;
    }
    if (action === 'action') this.hardDrop();
  }

  update() {
    this.dropCounter++;
    if (this.dropCounter >= this.dropInterval) {
      this.dropCounter = 0;
      if (!this.collides(this.current.matrix, this.current.x, this.current.y + 1)) {
        this.current.y++;
      } else {
        this.lockPiece();
      }
    }
  }

  gameOver() {
    this.running = false;
    this.particles.shake(25, 12);
    if (window.soundEngine) {
      window.soundEngine.playGameOver();
      window.soundEngine.announce('GAME OVER !');
    }
    setTimeout(() => {
      this.onGameOver(this.score);
    }, 700);
  }

  loop() {
    if (!this.running || this.paused) return;

    this.update();
    this.particles.update();
    this.draw();

    this.loopId = requestAnimationFrame(() => this.loop());
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.particles.shakeX, this.particles.shakeY);

    ctx.fillStyle = '#060714';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const boardW = this.cols * this.cellSize;
    const boardH = this.rows * this.cellSize;
    const ox = (this.canvas.width - boardW) / 2;
    const oy = (this.canvas.height - boardH) / 2;

    // Board Frame & Glass BG
    ctx.fillStyle = 'rgba(10, 14, 34, 0.85)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0, 240, 255, 0.4)';
    ctx.shadowBlur = 15;
    ctx.fillRect(ox, oy, boardW, boardH);
    ctx.strokeRect(ox, oy, boardW, boardH);

    // Board Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    for (let c = 1; c < this.cols; c++) {
      ctx.beginPath();
      ctx.moveTo(ox + c * this.cellSize, oy);
      ctx.lineTo(ox + c * this.cellSize, oy + boardH);
      ctx.stroke();
    }
    for (let r = 1; r < this.rows; r++) {
      ctx.beginPath();
      ctx.moveTo(ox, oy + r * this.cellSize);
      ctx.lineTo(ox + boardW, oy + r * this.cellSize);
      ctx.stroke();
    }

    // Draw Locked Blocks
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const color = this.board[r][c];
        if (color) {
          this.drawBlock(ctx, ox + c * this.cellSize, oy + r * this.cellSize, color);
        }
      }
    }

    // Draw Ghost Piece Projection
    if (this.current) {
      let ghostY = this.current.y;
      while (!this.collides(this.current.matrix, this.current.x, ghostY + 1)) {
        ghostY++;
      }

      ctx.save();
      const ghostColor = window.cyberShop ? window.cyberShop.getPlayerColor('rgba(255, 255, 255, 0.4)') : 'rgba(255, 255, 255, 0.4)';
      ctx.strokeStyle = ghostColor;
      ctx.shadowColor = ghostColor;
      ctx.shadowBlur = 8;
      ctx.lineWidth = 1.5;
      for (let r = 0; r < this.current.matrix.length; r++) {
        for (let c = 0; c < this.current.matrix[r].length; c++) {
          if (this.current.matrix[r][c]) {
            ctx.strokeRect(
              ox + (this.current.x + c) * this.cellSize + 2,
              oy + (ghostY + r) * this.cellSize + 2,
              this.cellSize - 4,
              this.cellSize - 4
            );
          }
        }
      }
      ctx.restore();

      // Draw Active Piece
      for (let r = 0; r < this.current.matrix.length; r++) {
        for (let c = 0; c < this.current.matrix[r].length; c++) {
          if (this.current.matrix[r][c]) {
            this.drawBlock(
              ctx,
              ox + (this.current.x + c) * this.cellSize,
              oy + (this.current.y + r) * this.cellSize,
              this.current.color
            );
          }
        }
      }
    }

    // Side Panels: Next Piece & Hold Piece
    this.drawSideBox(ctx, ox - 140, oy, 110, 100, 'HOLD (C)', this.hold);
    this.drawSideBox(ctx, ox + boardW + 30, oy, 110, 100, 'NEXT', this.next);

    // Stats HUD on right
    ctx.save();
    ctx.font = 'bold 14px Orbitron, sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(`LIGNES: ${this.lines}`, ox + boardW + 30, oy + 140);
    ctx.fillStyle = '#ffe600';
    ctx.fillText(`NIVEAU: ${this.level}`, ox + boardW + 30, oy + 175);
    ctx.restore();

    this.particles.draw(ctx);
    ctx.restore();
  }

  drawBlock(ctx, x, y, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(x + 2, y + 2, this.cellSize - 4, 3);
    ctx.restore();
  }

  drawSideBox(ctx, x, y, w, h, title, piece) {
    ctx.save();
    ctx.fillStyle = 'rgba(14, 18, 42, 0.8)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);

    ctx.font = 'bold 11px Orbitron, sans-serif';
    ctx.fillStyle = '#8892b0';
    ctx.textAlign = 'center';
    ctx.fillText(title, x + w / 2, y + 20);

    if (piece) {
      const m = piece.matrix;
      const pieceW = m[0].length * 16;
      const pieceH = m.length * 16;
      const startX = x + (w - pieceW) / 2;
      const startY = y + 35 + (h - 35 - pieceH) / 2;

      for (let r = 0; r < m.length; r++) {
        for (let c = 0; c < m[r].length; c++) {
          if (m[r][c]) {
            ctx.fillStyle = piece.color;
            ctx.shadowColor = piece.color;
            ctx.shadowBlur = 8;
            ctx.fillRect(startX + c * 16 + 1, startY + r * 16 + 1, 14, 14);
          }
        }
      }
    }
    ctx.restore();
  }
}

window.StackerGame = StackerGame;
