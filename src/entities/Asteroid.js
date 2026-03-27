import { Utils } from '../utils.js';

export class Asteroid {
    constructor(x, y, size) {
        this.x = x; this.y = y;
        this.size = size; // 1, 2, 3
        this.radius = size * 15 + Utils.rand(0, 10);
        this.health = size * 20;
        this.angle = Utils.rand(0, Math.PI * 2);
        const speed = Utils.rand(0.5, 2) / size;
        this.vx = Math.cos(this.angle) * speed;
        this.vy = Math.sin(this.angle) * speed;
        this.rotSpeed = Utils.rand(-0.02, 0.02);
        this.rotation = 0;

        this.vertices = [];
        const numPts = Utils.randInt(6, 10);
        for (let i = 0; i < numPts; i++) {
            this.vertices.push(Utils.rand(0.7, 1.1));
        }
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        this.rotation += this.rotSpeed;
    }
    draw(ctx, camera) {
        // Viewport cull — use radius as bounding check
        if (this.x + this.radius < camera.x || this.x - this.radius > camera.x + camera.viewW ||
            this.y + this.radius < camera.y || this.y - this.radius > camera.y + camera.viewH) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.strokeStyle = '#aaa';
        ctx.fillStyle = '#111';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < this.vertices.length; i++) {
            const a = (i / this.vertices.length) * Math.PI * 2;
            const r = this.radius * this.vertices[i];
            const px = Math.cos(a) * r;
            const py = Math.sin(a) * r;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.restore();
    }
}
