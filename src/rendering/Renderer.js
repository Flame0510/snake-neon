import { Config } from '../Config.js';

const { W, H, GRID, CELL } = Config;

const COMBO_COLORS = ['', '', '#ffdd44', '#ff8800', '#ff4422', '#ff00ff'];

/**
 * All Canvas 2D drawing lives here. States pass data in; this class
 * knows nothing about game logic. Keeps rendering and update concerns apart.
 */
export class Renderer {
  #ctx;
  #gridCanvas;   // OffscreenCanvas with static grid — drawn once, blitted every frame
  #crtScanlines; // OffscreenCanvas with pre-rendered CRT scanlines
  #crtGradient;  // cached radial vignette gradient

  constructor(canvas) {
    this.#ctx          = canvas.getContext('2d');
    canvas.width       = W;
    canvas.height      = H;

    this.#gridCanvas   = this.#buildGridCanvas();
    this.#crtScanlines = this.#buildCRTScanlines();
    this.#crtGradient  = this.#buildVignetteGradient();
  }

  get ctx() { return this.#ctx; }

  // ── Scene primitives ────────────────────────────────────────────────────

  clearCanvas() {
    this.#ctx.fillStyle = '#02020a';
    this.#ctx.fillRect(0, 0, W, H);
  }

  drawGrid() {
    this.#ctx.drawImage(this.#gridCanvas, 0, 0);
  }

  /** CRT scanlines + radial vignette — always drawn last over the scene. */
  drawCRT() {
    const ctx = this.#ctx;
    ctx.drawImage(this.#crtScanlines, 0, 0);
    ctx.fillStyle = this.#crtGradient;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Entities ────────────────────────────────────────────────────────────

  drawDrifts(drifts) {
    const ctx = this.#ctx;
    ctx.shadowBlur = 0;
    for (const d of drifts) {
      ctx.globalAlpha = d.alpha;
      ctx.fillStyle   = d.color;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawParticles(particles) { particles.forEach(p => p.draw(this.#ctx)); }
  drawFloats(floats)       { floats.forEach(f => f.draw(this.#ctx)); }

  drawBoostBorder(boostLeft) {
    if (boostLeft <= 0) return;
    const ctx = this.#ctx;
    const str = boostLeft / Config.BOOST_FRAMES;
    ctx.save();
    ctx.strokeStyle = `rgba(34,170,255,${(str * 0.75).toFixed(2)})`;
    ctx.lineWidth   = 8;
    ctx.shadowColor = '#22aaff';
    ctx.shadowBlur  = 30 * str;
    ctx.strokeRect(4, 4, W - 8, H - 8);
    ctx.restore();
  }

  drawSnake(snake, boosting) {
    const ctx = this.#ctx;
    const n   = snake.length;
    const [dx, dy] = snake.dir;

    for (let i = n - 1; i >= 0; i--) {
      const [sx, sy] = snake.segments[i];
      const t   = i / n;
      const alp = 1 - t * 0.55;
      const sz  = CELL - 5 - t * 3.5;
      const off = (CELL - sz) / 2;

      ctx.save();
      if (i === 0) {
        ctx.shadowColor = boosting ? '#22aaff' : '#00ff88';
        ctx.shadowBlur  = 22;
        ctx.fillStyle   = boosting ? '#44ccff' : '#00ff88';
      } else {
        const gv = boosting ? 130 + Math.floor(80 * alp) : Math.floor(200 * alp);
        const bv = boosting ? 255 : Math.floor(100 * alp);
        const rv = boosting ? Math.floor(30 * alp) : 0;
        ctx.shadowColor = boosting ? '#22aaff' : '#00ff88';
        ctx.shadowBlur  = 10 * alp;
        ctx.fillStyle   = `rgba(${rv},${gv},${bv},${alp.toFixed(2)})`;
      }
      ctx.beginPath();
      ctx.roundRect(sx * CELL + off, sy * CELL + off, sz, sz, sz * 0.28);
      ctx.fill();
      ctx.restore();

      if (i === 0) this.#drawEyes(ctx, sx, sy, dx, dy);
    }
  }

  drawFoods(foods, frame) {
    const ctx = this.#ctx;
    foods.forEach(f => {
      const { color, glow, label, shape } = f.type;
      const cx  = f.x * CELL + CELL / 2;
      const cy  = f.y * CELL + CELL / 2;
      const p   = Math.sin(frame * 0.09 + f.age * 0.04) * 0.25 + 0.75;
      const rad = (CELL / 2 - 5) * p;

      ctx.save();
      ctx.shadowColor = glow;
      ctx.shadowBlur  = 18 * p;
      ctx.fillStyle   = color;

      if (shape === 'diamond') {
        ctx.beginPath();
        ctx.moveTo(cx, cy - rad); ctx.lineTo(cx + rad, cy);
        ctx.lineTo(cx, cy + rad); ctx.lineTo(cx - rad, cy);
        ctx.closePath();
      } else {
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      }
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle  = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(cx - rad * 0.22, cy - rad * 0.22, rad * 0.2, 0, Math.PI * 2);
      ctx.fill();

      if (label) {
        ctx.shadowColor  = '#fff';
        ctx.shadowBlur   = 4;
        ctx.fillStyle    = '#fff';
        ctx.font         = `bold ${Math.floor(rad * 1.1)}px "Courier New"`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, cx, cy);
      }
      ctx.restore();
    });
  }

  // ── HUD ─────────────────────────────────────────────────────────────────

  drawHUD(game) {
    const ctx = this.#ctx;
    ctx.save();
    ctx.textBaseline = 'top';

    ctx.font        = 'bold 18px "Courier New"';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur  = 14;
    ctx.fillStyle   = '#00ff88';
    ctx.textAlign   = 'left';
    ctx.fillText(`${game.score}`, 10, 10);

    ctx.font       = '11px "Courier New"';
    ctx.shadowBlur = 0;
    ctx.fillStyle  = 'rgba(255,255,255,0.28)';
    ctx.fillText(`BEST ${game.highScore}`, 10, 34);
    ctx.fillText(`LEN  ${game.snake.length}`, 10, 48);

    ctx.textAlign  = 'right';
    ctx.fillText(this.#fmtTime(game.elapsedMs), W - 10, 10);

    this.#drawComboIndicator(ctx, game);
    this.#drawBoostBar(ctx, game.boostLeft);

    ctx.restore();
  }

  // ── Overlays ─────────────────────────────────────────────────────────────

  drawMenuBgSnake(segments) {
    const ctx = this.#ctx;
    const n   = segments.length;
    for (let i = n - 1; i >= 0; i--) {
      const [sx, sy] = segments[i];
      const t   = i / n;
      const alp = (1 - t * 0.7) * 0.3;
      const sz  = CELL - 6 - t * 3;
      const off = (CELL - sz) / 2;
      ctx.save();
      ctx.globalAlpha = alp;
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur  = 14;
      ctx.fillStyle   = '#00ff88';
      ctx.beginPath();
      ctx.roundRect(sx * CELL + off, sy * CELL + off, sz, sz, sz * 0.28);
      ctx.fill();
      ctx.restore();
    }
  }

  drawMenuOverlay(game) {
    const ctx = this.#ctx;
    const p   = Math.sin(game.frame * 0.04) * 0.5 + 0.5;

    ctx.fillStyle = 'rgba(2,2,10,0.70)';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    ctx.font        = 'bold 68px "Courier New"';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur  = 30 + p * 15;
    ctx.fillStyle   = '#00ff88';
    ctx.fillText('SNAKE', W / 2, H / 2 - 100);

    ctx.font        = 'bold 32px "Courier New"';
    ctx.shadowBlur  = 14 + p * 6;
    ctx.fillStyle   = '#aaffcc';
    ctx.fillText('N E O N', W / 2, H / 2 - 40);

    ctx.font        = `${Math.floor(14 + p * 2)}px "Courier New"`;
    ctx.shadowBlur  = 0;
    ctx.fillStyle   = `rgba(255,255,255,${(0.5 + p * 0.3).toFixed(2)})`;
    ctx.fillText('▶  SPAZIO o TAP per iniziare', W / 2, H / 2 + 38);

    this.#drawFoodLegend(ctx);

    ctx.textAlign = 'center'; ctx.font = '10px "Courier New"';
    ctx.fillStyle = 'rgba(255,215,0,0.38)';
    ctx.fillText('★ Mangia in sequenza rapida per il COMBO!', W / 2, H / 2 + 210);

    if (game.highScore > 0) {
      ctx.font      = '12px "Courier New"';
      ctx.fillStyle = 'rgba(255,215,0,0.48)';
      ctx.fillText(`★ RECORD: ${game.highScore}`, W / 2, H - 22);
    }
    ctx.restore();
  }

  drawPauseOverlay() {
    const ctx = this.#ctx;
    ctx.fillStyle = 'rgba(2,2,10,0.76)';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font        = 'bold 52px "Courier New"';
    ctx.shadowColor = '#ffdd00';
    ctx.shadowBlur  = 24;
    ctx.fillStyle   = '#ffdd00';
    ctx.fillText('PAUSA', W / 2, H / 2 - 20);
    ctx.font        = '13px "Courier New"';
    ctx.shadowBlur  = 0;
    ctx.fillStyle   = 'rgba(255,255,255,0.4)';
    ctx.fillText('SPAZIO · P  per continuare', W / 2, H / 2 + 36);
    ctx.restore();
  }

  drawGameOverOverlay(game) {
    const ctx = this.#ctx;
    const p   = Math.sin(game.frame * 0.06) * 0.3 + 0.7;

    ctx.fillStyle = 'rgba(2,2,10,0.84)';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    ctx.font        = 'bold 62px "Courier New"';
    ctx.shadowColor = '#ff2244';
    ctx.shadowBlur  = 28 + p * 12;
    ctx.fillStyle   = '#ff2244';
    ctx.fillText('GAME OVER', W / 2, H / 2 - 105);

    ctx.font        = 'bold 26px "Courier New"';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur  = 8;
    ctx.fillStyle   = '#fff';
    ctx.fillText(`SCORE  ${game.score}`, W / 2, H / 2 - 38);

    if (game.isNewRecord) {
      ctx.font        = 'bold 17px "Courier New"';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur  = 15 + p * 8;
      ctx.fillStyle   = '#ffd700';
      ctx.fillText('★  NUOVO RECORD!  ★', W / 2, H / 2 + 8);
    } else if (game.highScore > 0) {
      ctx.font        = '12px "Courier New"';
      ctx.shadowBlur  = 0;
      ctx.fillStyle   = 'rgba(255,215,0,0.42)';
      ctx.fillText(`RECORD: ${game.highScore}`, W / 2, H / 2 + 8);
    }

    ctx.font      = '11px "Courier New"';
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    ctx.fillText(
      `TEMPO ${this.#fmtTime(game.elapsedMs)}  ·  MAX ${game.snake.maxLength} SEGMENTI`,
      W / 2, H / 2 + 44,
    );

    ctx.font      = `${Math.floor(12 + p)}px "Courier New"`;
    ctx.fillStyle = `rgba(255,255,255,${(0.4 + p * 0.2).toFixed(2)})`;
    ctx.fillText('▶  SPAZIO o TAP per ripartire', W / 2, H / 2 + 85);

    ctx.restore();
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  #buildGridCanvas() {
    const oc  = new OffscreenCanvas(W, H);
    const ctx = oc.getContext('2d');
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    for (let i = 0; i <= GRID; i++) {
      ctx.moveTo(i * CELL, 0);    ctx.lineTo(i * CELL, H);
      ctx.moveTo(0, i * CELL);    ctx.lineTo(W, i * CELL);
    }
    ctx.stroke();
    return oc;
  }

  #buildCRTScanlines() {
    const oc  = new OffscreenCanvas(W, H);
    const ctx = oc.getContext('2d');
    ctx.fillStyle   = '#000';
    ctx.globalAlpha = 0.045;
    for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
    return oc;
  }

  #buildVignetteGradient() {
    const grad = this.#ctx.createRadialGradient(W / 2, H / 2, H * 0.22, W / 2, H / 2, H * 0.82);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.58)');
    return grad;
  }

  #drawEyes(ctx, sx, sy, dx, dy) {
    const perp = [-dy, dx];
    const cx   = sx * CELL + CELL / 2;
    const cy   = sy * CELL + CELL / 2;
    ctx.fillStyle = '#02020a';
    [1, -1].forEach(side => {
      ctx.beginPath();
      ctx.arc(cx + dx * 5 + perp[0] * 5 * side, cy + dy * 5 + perp[1] * 5 * side, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  #drawComboIndicator(ctx, game) {
    if (game.combo < 2 || game.comboTimer >= Config.COMBO_WINDOW) return;
    const pulse = Math.sin(game.frame * 0.18) * 0.25 + 0.75;
    const cc    = COMBO_COLORS[Math.min(game.combo, 5)];
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.font         = `bold ${Math.floor(13 * pulse)}px "Courier New"`;
    ctx.shadowColor  = cc;
    ctx.shadowBlur   = 12 * pulse;
    ctx.fillStyle    = cc;
    ctx.fillText(`× ${game.combo} COMBO`, W / 2, 10);

    const bw = 70, bh = 3, bx = W / 2 - bw / 2, by = 28;
    ctx.shadowBlur = 0;
    ctx.fillStyle  = 'rgba(255,255,255,0.1)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.shadowColor = cc; ctx.shadowBlur = 4; ctx.fillStyle = cc;
    ctx.fillRect(bx, by, bw * (1 - game.comboTimer / Config.COMBO_WINDOW), bh);
  }

  #drawBoostBar(ctx, boostLeft) {
    if (boostLeft <= 0) return;
    const bw = 80, bh = 5, bx = W / 2 - bw / 2, by = 36;
    ctx.shadowBlur = 0;
    ctx.fillStyle  = 'rgba(34,170,255,0.18)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.shadowColor = '#22aaff'; ctx.shadowBlur = 6; ctx.fillStyle = '#22aaff';
    ctx.fillRect(bx, by, bw * (boostLeft / Config.BOOST_FRAMES), bh);
    ctx.shadowBlur   = 0;
    ctx.font         = '10px "Courier New"';
    ctx.fillStyle    = 'rgba(34,170,255,0.7)';
    ctx.textAlign    = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('⚡ BOOST', W / 2, by + 8);
  }

  #drawFoodLegend(ctx) {
    const items = [
      { color: '#00ff88', label: 'Normale  +1 pt' },
      { color: '#ffd700', label: 'Bonus    +5 pt' },
      { color: '#22aaff', label: 'Speed ⚡ +2 pt' },
      { color: '#cc44ff', label: 'Shrink ✂ taglia la coda +3 pt' },
    ];
    let ly = H / 2 + 88;
    items.forEach(({ color, label }) => {
      const lx = W / 2 - 130;
      ctx.shadowColor = color; ctx.shadowBlur = 8; ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(lx, ly, 5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,0.42)';
      ctx.textAlign  = 'left'; ctx.font = '11px "Courier New"';
      ctx.fillText(label, lx + 14, ly);
      ly += 20;
    });
  }

  #fmtTime(ms) {
    const s = Math.floor(Math.max(0, ms) / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }
}
