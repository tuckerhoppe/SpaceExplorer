import { Utils } from '../utils.js';

export class ScienceMiniGame {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.needleAngle = 0;
        this.needleSpeed = 0.05; // radians per frame
        
        this.successZoneStart = 0;
        this.successZoneWidth = 0.6; // ~34 degrees
        this.greatZoneWidth = 0.15; // ~8.5 degrees
        
        this.stellarObject = null;
        this.result = null; // 'great', 'good', 'miss', or null
        this.resultTimer = 0;
        
        this.radius = 80;
    }

    start(stellarObject) {
        if (this.active) return;
        
        this.active = true;
        this.stellarObject = stellarObject;
        this.result = null;
        this.resultTimer = 0;
        this.needleAngle = Math.random() * Math.PI * 2;
        
        // Randomize success zone position
        this.successZoneStart = Math.random() * Math.PI * 2;
        
        // Adjust speed based on maybe some difficulty?
        // Let's keep it constant for now but slightly randomized
        this.needleSpeed = Utils.rand(0.04, 0.07);
    }

    stop() {
        this.active = false;
        this.stellarObject = null;
    }

    update() {
        if (this.result) {
            this.resultTimer++;
            if (this.resultTimer > 60) { // Show result for 1 second
                this.result = null;
                this.resultTimer = 0;
                // If the object still has science, keep playing?
                // For now, let's stop and let the SectorManager re-trigger or wait
                // Actually, let's stop but the caller can decide to restart
            }
            return;
        }

        if (!this.active) return;

        this.needleAngle = (this.needleAngle + this.needleSpeed) % (Math.PI * 2);
    }

    checkHit() {
        if (!this.active || this.result) return null;

        const normalizedNeedle = (this.needleAngle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const zoneStart = (this.successZoneStart % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const zoneEnd = (zoneStart + this.successZoneWidth) % (Math.PI * 2);

        let isGood = false;
        if (zoneStart < zoneEnd) {
            isGood = normalizedNeedle >= zoneStart && normalizedNeedle <= zoneEnd;
        } else {
            isGood = normalizedNeedle >= zoneStart || normalizedNeedle <= zoneEnd;
        }

        if (isGood) {
            const greatStart = (zoneStart + (this.successZoneWidth / 2) - (this.greatZoneWidth / 2)) % (Math.PI * 2);
            const greatEnd = (greatStart + this.greatZoneWidth) % (Math.PI * 2);
            
            let isGreat = false;
            if (greatStart < greatEnd) {
                isGreat = normalizedNeedle >= greatStart && normalizedNeedle <= greatEnd;
            } else {
                isGreat = normalizedNeedle >= greatStart || normalizedNeedle <= greatEnd;
            }

            this.result = isGreat ? 'great' : 'good';
        } else {
            this.result = 'miss';
        }

        this.resultTimer = 0;
        return this.result;
    }

    draw(ctx, canvasWidth, canvasHeight) {
        if (!this.active && !this.result) return;

        const x = canvasWidth / 2;
        const y = canvasHeight / 2 + 150; // Offset from center to be above dock bar

        ctx.save();
        ctx.translate(x, y);

        // Draw background circle
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 20, 40, 0.8)';
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
        ctx.lineWidth = 4;
        ctx.fill();
        ctx.stroke();

        // Draw success zone
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, this.successZoneStart, this.successZoneStart + this.successZoneWidth);
        ctx.strokeStyle = 'rgba(80, 220, 120, 0.6)';
        ctx.lineWidth = 12;
        ctx.stroke();

        // Draw great zone
        const greatStart = (this.successZoneStart + (this.successZoneWidth / 2) - (this.greatZoneWidth / 2));
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, greatStart, greatStart + this.greatZoneWidth);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 12;
        ctx.stroke();

        // Draw needle
        if (!this.result || this.resultTimer % 10 < 5) { // Blink slightly on result
            ctx.save();
            ctx.rotate(this.needleAngle);
            ctx.beginPath();
            ctx.moveTo(this.radius - 15, 0);
            ctx.lineTo(this.radius + 15, 0);
            ctx.strokeStyle = this.result === 'miss' ? '#ff3c3c' : '#00f0ff';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Needle tip
            ctx.beginPath();
            ctx.moveTo(this.radius + 15, 0);
            ctx.lineTo(this.radius + 5, -5);
            ctx.lineTo(this.radius + 5, 5);
            ctx.closePath();
            ctx.fillStyle = this.result === 'miss' ? '#ff3c3c' : '#00f0ff';
            ctx.fill();
            ctx.restore();
        }

        // Draw result text
        if (this.result) {
            ctx.font = 'bold 24px Orbitron';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            let color = '#50dc78';
            let text = 'GOOD';
            if (this.result === 'great') {
                color = '#fff';
                text = 'GREAT!!';
                ctx.shadowColor = '#00f0ff';
                ctx.shadowBlur = 15;
            } else if (this.result === 'miss') {
                color = '#ff3c3c';
                text = 'MISS';
            }
            ctx.fillStyle = color;
            ctx.fillText(text, 0, 0);
        } else {
            // Hint text
            ctx.font = '12px Inter';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.textAlign = 'center';
            ctx.fillText('PRESS [SPACE]', 0, 0);
            ctx.fillText('SKILL CHECK', 0, 15);
        }

        ctx.restore();
    }
}
