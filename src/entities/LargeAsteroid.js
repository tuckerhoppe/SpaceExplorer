import { Utils } from '../utils.js';

export class LargeAsteroid {
    constructor(def) {
        this.id = def.id;
        this.name = def.name;
        this.x = def.worldX;
        this.y = def.worldY;
        this.radius = def.radius;
        
        // Simple seedable random number generator based on name
        let seed = 0;
        for (let i = 0; i < def.name.length; i++) {
            seed = (seed << 5) - seed + def.name.charCodeAt(i);
            seed |= 0;
        }
        
        const seededRandom = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };
        
        this.rotation = seededRandom() * Math.PI * 2;
        // Deterministic slow rotation speed (mix of positive and negative)
        this.rotSpeed = (seededRandom() - 0.5) * 0.003; 
        
        // Generate a jagged outline matching small level 1 asteroids deterministically
        this.vertices = [];
        const numPts = 12 + Math.floor(seededRandom() * 8); // 12 to 19 points
        for (let i = 0; i < numPts; i++) {
            this.vertices.push(0.85 + seededRandom() * 0.3); // some variation
        }
    }

    update() {
        this.rotation += this.rotSpeed;
    }

    draw(ctx, camera) {
        // Viewport cull
        if (this.x + this.radius < camera.x || this.x - this.radius > camera.x + camera.viewW / camera.zoom ||
            this.y + this.radius < camera.y || this.y - this.radius > camera.y + camera.viewH / camera.zoom) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Design matches level 1 asteroids (#111 fill, #aaa stroke) but huge
        ctx.fillStyle = '#111111'; 
        ctx.strokeStyle = '#aaaaaa';
        ctx.lineWidth = 4;

        // Draw jagged body
        ctx.beginPath();
        const numPts = this.vertices.length;
        for (let i = 0; i < numPts; i++) {
            const angle = (i / numPts) * Math.PI * 2;
            const r = this.radius * this.vertices[i];
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}
