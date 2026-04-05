export class Projectile {
    constructor(x, y, angle, speed, damage, color = '#ff3c3c', isTorpedo = false) {
        this.x = x; this.y = y; this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
        this.life = isTorpedo ? 150 : 100; this.damage = damage; this.color = isTorpedo ? '#00eaff' : color;
        this.isTorpedo = isTorpedo;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        this.life--;
    }
    draw(ctx, camera) {
        // Viewport cull
        if (this.x < camera.x - 12 || this.x > camera.x + camera.viewW + 12 ||
            this.y < camera.y - 12 || this.y > camera.y + camera.viewH + 12) return;

        // Parse color for glow halo (add alpha)
        const halo = this.color.startsWith('#')
            ? `${this.color}40`  // hex + alpha suffix hack (works for 6-char hex)
            : this.color.replace(')', ', 0.25)').replace('rgb', 'rgba');

        // Fake glow halo
        const glowSize = this.isTorpedo ? 24 : 10;
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Bright core
        const coreSize = this.isTorpedo ? 7 : 4;
        ctx.fillStyle = this.isTorpedo ? '#ffffff' : this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, coreSize, 0, Math.PI * 2);
        ctx.fill();

        // Secondary Torpedo Outline
        if (this.isTorpedo) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, coreSize + 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }
}
