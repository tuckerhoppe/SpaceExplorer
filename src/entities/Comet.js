import { Utils } from '../utils.js';

export class Comet {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} regionLevel (1-12)
     */
    constructor(x, y, regionLevel = 1) {
        this.x = x;
        this.y = y;
        this.regionLevel = regionLevel;
        this.radius = Utils.rand(16, 22);
        this.health = 300 * Math.pow(1.4, regionLevel - 1); // Very high health
        this.maxHealth = this.health;
        this.destroyed = false;

        // High velocity travel
        this.angle = Utils.rand(0, Math.PI * 2);
        this.speed = Utils.rand(4.5, 7.0); // 4x speed of asteroids
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;

        // Rotation independent of movement
        this.rotation = 0;
        this.rotSpeed = Utils.rand(-0.02, 0.02);

        // Procedurally jagged asteroid-like shape
        this.vertices = [];
        const numPts = Utils.randInt(7, 11);
        for (let i = 0; i < numPts; i++) {
            this.vertices.push(Utils.rand(0.75, 1.15));
        }

        // Gem drops: worth 5 times the regional value
        let baseValue = 1;
        if (regionLevel >= 6) {
            baseValue = 5;
            this.gemColor = '#cc44ff';
        } else if (regionLevel >= 3) {
            baseValue = 2;
            this.gemColor = '#ff4444';
        } else {
            baseValue = 1;
            this.gemColor = '#00ffd0';
        }
        this.gemValue = baseValue * 5; // 5x worth!
        this.gemCount = Utils.randInt(5, 8); // Drops a small cluster of these high-value gems

        // Tail particle effect interval
        this.trailTimer = 0;
    }

    bounceOff(otherX, otherY, otherRadius) {
        const dx = this.x - otherX;
        const dy = this.y - otherY;
        const dist = Math.hypot(dx, dy);
        const minDist = otherRadius + this.radius;

        if (dist < minDist && dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;

            // Dot product of velocity and collision normal
            const dot = this.vx * nx + this.vy * ny;
            if (dot < 0) {
                // Subtle / dampened reflection (1 + restitution) where restitution = 0.35
                const bounceCoeff = 1.35;
                this.vx -= bounceCoeff * dot * nx;
                this.vy -= bounceCoeff * dot * ny;

                // Push comet out of overlap
                const overlap = minDist - dist;
                this.x += nx * overlap;
                this.y += ny * overlap;
            }
            return true;
        }
        return false;
    }

    update(game) {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotSpeed;

        // Trickle spawn glowing tail particles behind the comet's travel direction
        this.trailTimer++;
        if (this.trailTimer % 2 === 0) {
            const angleOfTravel = Math.atan2(this.vy, this.vx);
            const backX = this.x - Math.cos(angleOfTravel) * this.radius;
            const backY = this.y - Math.sin(angleOfTravel) * this.radius;
            
            // Spawn standard particle slightly drifting backward
            const spreadAngle = angleOfTravel + Math.PI + Utils.rand(-0.2, 0.2);
            const particleSpeed = Utils.rand(1, 3);
            
            // Access game particles array directly
            if (game && game.particles) {
                const ParticleClass = game.particles[0]?.constructor;
                if (ParticleClass && ParticleClass.get) {
                    game.particles.push(ParticleClass.get(
                        backX, backY, 
                        Math.cos(spreadAngle) * particleSpeed, Math.sin(spreadAngle) * particleSpeed,
                        '#c6f1ff', Utils.randInt(15, 30)
                    ));
                }
            }
        }
    }

    draw(ctx, camera) {
        const checkRadius = this.radius * 4.0; // larger for tail visualization
        if (this.x + checkRadius < camera.x || this.x - checkRadius > camera.x + camera.viewW ||
            this.y + checkRadius < camera.y || this.y - checkRadius > camera.y + camera.viewH) return;

        // Draw the tail facing opposite the travel direction
        ctx.save();
        ctx.translate(this.x, this.y);
        const travelAngle = Math.atan2(this.vy, this.vx);
        ctx.rotate(travelAngle);

        // Glowing ice wedge tail pointing backwards
        const grad = ctx.createLinearGradient(0, 0, -this.radius * 3.5, 0);
        grad.addColorStop(0, 'rgba(0, 220, 255, 0.7)');
        grad.addColorStop(0.3, 'rgba(0, 180, 255, 0.3)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, -this.radius * 0.7);
        ctx.lineTo(-this.radius * 3.5, 0);
        ctx.lineTo(0, this.radius * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Draw the core rotating independently
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00f0ff';
        
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#8de6ff';
        ctx.lineWidth = 2.5;

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
