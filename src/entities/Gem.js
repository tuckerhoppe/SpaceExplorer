import { Utils } from '../utils.js';

/**
 * Gem — collectible dropped by asteroids and enemies.
 *
 * @param {number} value     - gem worth; drives cargo weight (1, 2, or 5)
 * @param {boolean} isInfected
 * @param {string|null} color  - explicit hex color; if null, derived from value
 */
export class Gem {
    constructor(x, y, value = 1, isInfected = false, color = null) {
        this.x = x; this.y = y; this.value = value;
        this.isInfected = isInfected;
        this.vx = Utils.rand(-2, 2); this.vy = Utils.rand(-2, 2);
        this.life = 600;

        // Infected overrides everything
        if (isInfected) {
            this.color = '#09ab29';
        } else if (color) {
            this.color = color;
        } else {
            // Fallback value-based color
            if (value >= 5)      this.color = '#cc44ff'; // purple
            else if (value >= 2) this.color = '#ff4444'; // red
            else                 this.color = '#00ffd0'; // teal
        }
    }

    update() {
        this.vx *= 0.95; this.vy *= 0.95;
        this.x += this.vx; this.y += this.vy;
        this.life--;
    }

    draw(ctx, camera) {
        // Viewport cull
        if (this.x < camera.x - 20 || this.x > camera.x + camera.viewW + 20 ||
            this.y < camera.y - 20 || this.y > camera.y + camera.viewH + 20) return;

        const alpha = this.life > 100 ? 1 : this.life / 100;
        // Slightly larger for high-value gems so they're visually distinct
        const sizeMult = this.value >= 5 ? 1.5 : this.value >= 2 ? 1.2 : 1.0;
        const r = (6 + Math.sin(Date.now() * 0.005) * 2) * sizeMult;

        // Outer glow ring
        ctx.globalAlpha = alpha * 0.25;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r + 5, 0, Math.PI * 2);
        ctx.fill();

        // Core gem
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
    }
}
