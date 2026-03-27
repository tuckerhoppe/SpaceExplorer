import { Utils } from '../utils.js';

export class Gem {
    constructor(x, y, value, isInfected = false) {
        this.x = x; this.y = y; this.value = value;
        this.isInfected = isInfected;
        this.vx = Utils.rand(-2, 2); this.vy = Utils.rand(-2, 2);
        this.life = 600;
        this.color = isInfected ? '#09ab29' : '#00ffd0'; // Blob green or teal
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
        const r = 6 + Math.sin(Date.now() * 0.005) * 2;

        // Fake glow: outer translucent ring
        ctx.fillStyle = this.isInfected ? `rgba(9, 171, 41, ${alpha * 0.2})` : `rgba(0, 255, 208, ${alpha * 0.2})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r + 5, 0, Math.PI * 2);
        ctx.fill();

        // Core gem dot
        ctx.fillStyle = this.isInfected ? `rgba(9, 171, 41, ${alpha})` : `rgba(0, 255, 208, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fill();
    }
}
