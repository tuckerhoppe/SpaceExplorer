export class Particle {
    constructor() {
        this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
        this.color = '#fff'; this.life = 0; this.maxLife = 1;
    }

    reset(x, y, vx, vy, color, life) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.color = color; this.life = life; this.maxLife = life;
        return this;
    }

    // Object pool — avoids constant GC churn during explosions
    static _pool = [];
    static get(x, y, vx, vy, color, life) {
        return (Particle._pool.pop() || new Particle()).reset(x, y, vx, vy, color, life);
    }
    release() {
        Particle._pool.push(this);
    }

    update() {
        this.x += this.vx; this.y += this.vy;
        this.life -= 1;
    }

    draw(ctx, camera) {
        // Viewport cull — particles have radius ~3
        if (this.x < camera.x - 6 || this.x > camera.x + camera.viewW + 6 ||
            this.y < camera.y - 6 || this.y > camera.y + camera.viewH + 6) return;

        ctx.fillStyle = this.color;
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}
