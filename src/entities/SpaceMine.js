import { Utils } from '../utils.js';

export class SpaceMine {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} regionLevel (1-12)
     */
    constructor(x, y, regionLevel = 1) {
        this.x = x;
        this.y = y;
        this.regionLevel = regionLevel;
        this.radius = Utils.rand(14, 18);
        this.health = 10; // Triggered easily by shots
        this.destroyed = false;

        // Slow spin
        this.rotation = Utils.rand(0, Math.PI * 2);
        this.rotSpeed = Utils.rand(-0.01, 0.01);

        // Warning core pulse animation timer
        this.pulseTime = Math.random() * 100;

        // Determine blast tier randomly: 0 = Small, 1 = Medium, 2 = Large
        const roll = Math.random();
        if (roll < 0.5) {
            this.blastTier = 'small';
            this.blastRadius = 130;
            this.blastDamage = 35;
        } else if (roll < 0.85) {
            this.blastTier = 'medium';
            this.blastRadius = 240;
            this.blastDamage = 75;
        } else {
            this.blastTier = 'large';
            this.blastRadius = 380;
            this.blastDamage = 130;
        }

        // Procedural Spike configuration
        this.numSpikes = Utils.randInt(6, 10);
        this.spikeLength = this.radius * 0.45;
    }

    update() {
        this.rotation += this.rotSpeed;
        this.pulseTime += 0.15;
    }

    draw(ctx, camera) {
        if (this.x + this.radius * 2 < camera.x || this.x - this.radius * 2 > camera.x + camera.viewW ||
            this.y + this.radius * 2 < camera.y || this.y - this.radius * 2 > camera.y + camera.viewH) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Styling: Dark, hazardous metallic iron casing
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = '#4e4c48'; // Dark charcoal border
        ctx.fillStyle = '#22201e';   // Industrial metallic fill

        // 1. Draw spikes extending from the center core
        for (let i = 0; i < this.numSpikes; i++) {
            const angle = (i / this.numSpikes) * Math.PI * 2;
            const sx = Math.cos(angle) * (this.radius + this.spikeLength);
            const sy = Math.sin(angle) * (this.radius + this.spikeLength);
            
            // Spike shaft
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * (this.radius * 0.8), Math.sin(angle) * (this.radius * 0.8));
            ctx.lineTo(sx, sy);
            ctx.stroke();

            // Spike tip cap
            ctx.fillStyle = '#ff3333';
            ctx.beginPath();
            ctx.arc(sx, sy, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#22201e';
        }

        // 2. Draw central spherical core body
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 3. Draw flashing hazardous red pulsing center indicator
        const pulse = Math.abs(Math.sin(this.pulseTime));
        const indicatorRadius = this.radius * 0.35;
        
        ctx.save();
        ctx.shadowBlur = 10 * pulse;
        ctx.shadowColor = '#ff0000';
        ctx.fillStyle = `rgba(255, 0, 0, ${0.4 + 0.6 * pulse})`;
        ctx.beginPath();
        ctx.arc(0, 0, indicatorRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.restore();
    }
}
