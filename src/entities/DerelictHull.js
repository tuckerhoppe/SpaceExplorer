import { Utils } from '../utils.js';

export class DerelictHull {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} regionLevel (1-12)
     */
    constructor(x, y, regionLevel = 1) {
        this.x = x;
        this.y = y;
        this.regionLevel = regionLevel;
        this.radius = Utils.rand(55, 75); // Enlarged range for ship details
        this.health = 50 * Math.pow(1.5, regionLevel - 1);
        this.maxHealth = this.health;
        this.destroyed = false;

        // Randomized gem drop amount
        const isEmpty = Math.random() < 0.15; // lower empty rate for shiplike wrecks
        this.gemCount = isEmpty ? 0 : Utils.randInt(2, 6 + regionLevel * 2);
        
        // Gem value (higher levels drop purple gems, mid drops red, lower drops teal)
        if (regionLevel >= 6) {
            this.gemValue = 5;
            this.gemColor = '#cc44ff';
        } else if (regionLevel >= 3) {
            this.gemValue = 2;
            this.gemColor = '#ff4444';
        } else {
            this.gemValue = 1;
            this.gemColor = '#00ffd0';
        }

        // Drifting motion (very slow float)
        this.vx = Utils.rand(-0.2, 0.2);
        this.vy = Utils.rand(-0.2, 0.2);
        this.rotation = Utils.rand(0, Math.PI * 2);
        this.rotSpeed = Utils.rand(-0.004, 0.004);

        // Procedural Wreckage Details
        // We will define a basic spaceship shape that is "shattered"
        this.hullScale = this.radius * 0.9;
        
        // Pick a style of wreck: 0 = Split Fuselage, 1 = Wingless Frigate
        this.wreckStyle = Utils.randInt(0, 1);
        
        // Expose wiring inside the break line
        this.crackSeed = Utils.rand(0.3, 0.7);

        // Debris shards (broken wing chunks, engine cowling)
        this.shards = [];
        const numShards = Utils.randInt(2, 4);
        for (let i = 0; i < numShards; i++) {
            const shardAngle = Utils.rand(0, Math.PI * 2);
            const shardDist = this.radius * Utils.rand(1.1, 1.5);
            const shardSize = this.radius * Utils.rand(0.12, 0.25);
            
            const vertices = [];
            const pts = Utils.randInt(3, 4);
            for (let j = 0; j < pts; j++) {
                const a = (j / pts) * Math.PI * 2;
                vertices.push({
                    x: Math.cos(a) * shardSize * Utils.rand(0.6, 1.4),
                    y: Math.sin(a) * shardSize * Utils.rand(0.6, 1.4)
                });
            }

            this.shards.push({
                ox: Math.cos(shardAngle) * shardDist,
                oy: Math.sin(shardAngle) * shardDist,
                vertices,
                rot: Utils.rand(0, Math.PI * 2),
                rotSpeed: Utils.rand(-0.02, 0.02)
            });
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotSpeed;

        // Slow spin for floating shards relative to main body
        this.shards.forEach(shard => {
            shard.rot += shard.rotSpeed;
        });
    }

    draw(ctx, camera) {
        const checkRadius = this.radius * 1.8;
        if (this.x + checkRadius < camera.x || this.x - checkRadius > camera.x + camera.viewW ||
            this.y + checkRadius < camera.y || this.y - checkRadius > camera.y + camera.viewH) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Color theme: Rusty steel spaceship hulls
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = '#6d655f'; // Rusted grey metal border
        ctx.fillStyle = '#2d2724';   // Dark metallic interior

        if (this.wreckStyle === 0) {
            // WRECK STYLE 0: Split Fuselage
            // We draw the left half of a broken triangular fighter ship
            ctx.beginPath();
            ctx.moveTo(0, -this.hullScale * 0.8); // Cockpit tip
            ctx.lineTo(-this.hullScale * 0.4, -this.hullScale * 0.2); // Mid cockpit
            ctx.lineTo(-this.hullScale * 0.8, this.hullScale * 0.4); // Wing tip left
            ctx.lineTo(-this.hullScale * 0.3, this.hullScale * 0.3); // Mid hull
            ctx.lineTo(-this.hullScale * 0.2, this.hullScale * 0.7); // Engine left
            ctx.lineTo(0, this.hullScale * 0.5); // Break line center bottom
            
            // Jagged fracture line running through the center axis
            ctx.lineTo(-this.hullScale * 0.1, this.hullScale * 0.1);
            ctx.lineTo(this.hullScale * 0.05, -this.hullScale * 0.3);
            ctx.lineTo(0, -this.hullScale * 0.8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Exposed cockpit glass shard (half broken)
            ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
            ctx.beginPath();
            ctx.moveTo(0, -this.hullScale * 0.7);
            ctx.lineTo(-this.hullScale * 0.2, -this.hullScale * 0.4);
            ctx.lineTo(0, -this.hullScale * 0.2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Exposed circuitry along the central fracture line
            ctx.strokeStyle = '#ffb300';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, -this.hullScale * 0.5);
            ctx.lineTo(-this.hullScale * 0.08, -this.hullScale * 0.2);
            ctx.lineTo(this.hullScale * 0.02, 0);
            ctx.lineTo(-this.hullScale * 0.05, this.hullScale * 0.3);
            ctx.stroke();

        } else {
            // WRECK STYLE 1: Wingless/Broken Frigate
            // Longer cargo-ship shape with a blown-out cockpit/engine
            ctx.beginPath();
            ctx.moveTo(this.hullScale * 0.1, -this.hullScale * 0.8); // Front tip
            ctx.lineTo(-this.hullScale * 0.3, -this.hullScale * 0.7); // Left front corner
            ctx.lineTo(-this.hullScale * 0.3, this.hullScale * 0.5); // Left back corner
            ctx.lineTo(-this.hullScale * 0.15, this.hullScale * 0.8); // Left engine pod
            ctx.lineTo(this.hullScale * 0.15, this.hullScale * 0.8); // Right engine pod
            ctx.lineTo(this.hullScale * 0.3, this.hullScale * 0.5); // Right back corner
            
            // Giant jagged hull rupture on the right side of the ship
            ctx.lineTo(this.hullScale * 0.1, this.hullScale * 0.2);
            ctx.lineTo(this.hullScale * 0.3, -this.hullScale * 0.1);
            ctx.lineTo(this.hullScale * 0.05, -this.hullScale * 0.4);
            ctx.lineTo(this.hullScale * 0.1, -this.hullScale * 0.8);
            ctx.closePath();
            
            // Paint hull base
            ctx.fillStyle = '#2a2f35'; // Dark steel blue
            ctx.fill();
            ctx.stroke();

            // Draw engine exhaust nozzle (rusted/dead)
            ctx.fillStyle = '#423c37';
            ctx.fillRect(-this.hullScale * 0.1, this.hullScale * 0.8, this.hullScale * 0.2, this.hullScale * 0.12);
            ctx.strokeRect(-this.hullScale * 0.1, this.hullScale * 0.8, this.hullScale * 0.2, this.hullScale * 0.12);

            // Exposed inner bulkheads (hatching/stripes inside the rupture)
            ctx.strokeStyle = '#d84315'; // Glowing heated orange wiring
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(this.hullScale * 0.1, this.hullScale * 0.3);
            ctx.lineTo(this.hullScale * 0.25, this.hullScale * 0.05);
            ctx.moveTo(this.hullScale * 0.08, 0);
            ctx.lineTo(this.hullScale * 0.2, -this.hullScale * 0.25);
            ctx.stroke();
        }

        // Draw structural plating detailing lines on the hull
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(-this.hullScale * 0.2, -this.hullScale * 0.4);
        ctx.lineTo(-this.hullScale * 0.2, this.hullScale * 0.4);
        ctx.moveTo(-this.hullScale * 0.4, 0);
        ctx.lineTo(-this.hullScale * 0.1, 0);
        ctx.stroke();

        // 4. Draw orbiting ship shards/debris
        ctx.strokeStyle = '#6d655f';
        ctx.fillStyle = '#211d1a';
        ctx.lineWidth = 1.5;
        this.shards.forEach(shard => {
            ctx.save();
            ctx.translate(shard.ox, shard.oy);
            ctx.rotate(shard.rot);
            ctx.beginPath();
            shard.vertices.forEach((pt, idx) => {
                if (idx === 0) ctx.moveTo(pt.x, pt.y);
                else ctx.lineTo(pt.x, pt.y);
            });
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        });

        ctx.restore();
    }
}
