import { Utils } from '../utils.js';

/**
 * Asteroid — region-aware scaled version.
 *
 * regionLevel (1–12) drives:
 *  - radius range (larger each level, staggeringly huge at 12)
 *  - health (harder to destroy at higher levels)
 *  - gem value (teal=1, red=2, purple=5)
 *  - gem color
 *
 * The "size" param (1–3) is still used for on-death splitting and
 * as a within-tier size multiplier, giving natural variance.
 */
export class Asteroid {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} size      1 | 2 | 3  (small / medium / large within the tier)
     * @param {number} regionLevel  1–12; defaults to 1
     */
    constructor(x, y, size, regionLevel = 1) {
        this.x = x;
        this.y = y;
        this.size = size;           // used for splitting
        this.regionLevel = regionLevel;

        // ── Radius ──────────────────────────────────────────────
        // Base radius per level: grows from ~15 at L1 to ~240 at L12
        // Each level the *range* shifts up so there's overlap/variation.
        const BASE_MIN = 12;
        const BASE_MAX = 20;
        const SCALE = 1.28;

        // Visual size levels off after level 5
        let effectiveLevel = regionLevel;
        if (regionLevel > 5) {
            // Growth slows down significantly after L5 to prevent asteroids from becoming screen-filling
            effectiveLevel = 5 + (regionLevel - 5) * 0.2;
        }

        const levelMult = Math.pow(SCALE, effectiveLevel - 1);
        const minR = BASE_MIN * levelMult * size;
        const maxR = BASE_MAX * levelMult * size;
        this.radius = Utils.rand(minR, maxR);

        // ── Health ──────────────────────────────────────────────
        // HP scales steeply so high-level asteroids truly require many shots
        this.health = size * 20 * Math.pow(1.6, regionLevel - 1);

        // ── Gem value & color ────────────────────────────────────
        // Level 1-2: teal (value 1)
        // Level 3-5: red  (value 2)
        // Level 6+:  purple (value 5)
        if (regionLevel >= 6) {
            this.gemValue = 5;
            this.gemColor = '#cc44ff'; // purple
        } else if (regionLevel >= 3) {
            this.gemValue = 2;
            this.gemColor = '#ff4444'; // red
        } else {
            this.gemValue = 1;
            this.gemColor = '#00ffd0'; // teal (default)
        }

        // ── Movement ─────────────────────────────────────────────
        this.angle = Utils.rand(0, Math.PI * 2);
        const speed = Utils.rand(0.3, 1.5) / Math.max(size, 1);
        this.vx = Math.cos(this.angle) * speed;
        this.vy = Math.sin(this.angle) * speed;
        this.rotSpeed = Utils.rand(-0.015, 0.015);
        this.rotation = 0;

        // ── Shape ────────────────────────────────────────────────
        this.vertices = [];
        const numPts = Utils.randInt(6, 11);
        for (let i = 0; i < numPts; i++) {
            this.vertices.push(Utils.rand(0.65, 1.15));
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotSpeed;
    }

    draw(ctx, camera) {
        // Viewport cull
        if (this.x + this.radius < camera.x || this.x - this.radius > camera.x + camera.viewW ||
            this.y + this.radius < camera.y || this.y - this.radius > camera.y + camera.viewH) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Tint the stroke/fill slightly based on gem color tier for visual identity
        let strokeColor = '#aaa';
        let fillColor = '#111';
        if (this.regionLevel >= 6) {
            strokeColor = '#9933cc';
            fillColor = '#1a0a22';
        } else if (this.regionLevel >= 3) {
            strokeColor = '#cc3333';
            fillColor = '#1a0808';
        }

        ctx.strokeStyle = strokeColor;
        ctx.fillStyle = fillColor;
        ctx.lineWidth = Math.max(1.5, this.regionLevel * 0.3);

        ctx.beginPath();
        for (let i = 0; i < this.vertices.length; i++) {
            const a = (i / this.vertices.length) * Math.PI * 2;
            const r = this.radius * this.vertices[i];
            const px = Math.cos(a) * r;
            const py = Math.sin(a) * r;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}
