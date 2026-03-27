export class Projectile {
    constructor(x, y, angle, speed, damage, color = '#ff3c3c') {
        this.x = x; this.y = y; this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
        this.life = 100; this.damage = damage; this.color = color;
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
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
        ctx.fill();

        // Bright core
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}
