import { Utils } from '../utils.js';

export class CargoTrain {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} regionLevel (1-12)
     */
    constructor(x, y, regionLevel = 1) {
        this.x = x;
        this.y = y;
        this.regionLevel = regionLevel;
        this.radius = 45; // Collision radius representing the train's center segment
        this.health = 150 * Math.pow(1.4, regionLevel - 1); // Quite tanky
        this.maxHealth = this.health;
        this.destroyed = false;

        // Linear movement (heading forward slowly)
        this.angle = Utils.rand(0, Math.PI * 2);
        this.speed = Utils.rand(0.6, 1.2);
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.rotation = this.angle; // Always faces movement direction

        // Drops: Double the asteroid gem maximum of the region
        // Asteroid max is ~12 * levelMult, so CargoTrain drops 20 to 30 * levelMult gems!
        const levelMult = Math.pow(1.2, regionLevel - 1);
        this.gemCount = Math.floor(Utils.randInt(20, 30) * levelMult);

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

        // Procedural variations (container colors)
        const colors = ['#4caf50', '#00bcd4', '#ffeb3b', '#9c27b0'];
        this.containerColor = colors[Utils.randInt(0, colors.length - 1)];
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    draw(ctx, camera) {
        // Larger check radius since the train is long
        const checkRadius = this.radius * 3.5;
        if (this.x + checkRadius < camera.x || this.x - checkRadius > camera.x + camera.viewW ||
            this.y + checkRadius < camera.y || this.y - checkRadius > camera.y + camera.viewH) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // We will draw the ship segments aligned along the local X-axis.
        // X = 0 is the center segment.
        // Cockpit locomotive: +45 offset (front)
        // Pod 1: 15 offset
        // Pod 2: -15 offset
        // Pod 3: -45 offset (back)

        ctx.lineWidth = 2.0;
        ctx.strokeStyle = '#555555';
        ctx.fillStyle = '#2a2a2a';

        // 1. Draw connection joints/lines between segments
        ctx.beginPath();
        ctx.moveTo(-60, 0);
        ctx.lineTo(60, 0);
        ctx.stroke();

        // Helper to draw a rectangular cargo pod
        const drawCargoPod = (cx) => {
            ctx.save();
            ctx.fillStyle = this.containerColor;
            ctx.strokeStyle = '#222222';
            ctx.lineWidth = 1.5;
            // Draw container box
            ctx.fillRect(cx - 12, -10, 24, 20);
            ctx.strokeRect(cx - 12, -10, 24, 20);
            
            // Draw shipping stripes/glowing lines on the cargo container
            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath();
            ctx.moveTo(cx - 6, -10);
            ctx.lineTo(cx - 6, 10);
            ctx.moveTo(cx + 6, -10);
            ctx.lineTo(cx + 6, 10);
            ctx.stroke();
            ctx.restore();
        };

        // Draw 3 cargo containers
        drawCargoPod(-40);
        drawCargoPod(-10);
        drawCargoPod(20);

        // 2. Draw Locomotive Front Cockpit (sleek cabin) at X = 50
        ctx.save();
        ctx.fillStyle = '#3a3a3a';
        ctx.strokeStyle = '#666666';
        ctx.beginPath();
        ctx.moveTo(35, -12);
        ctx.lineTo(55, -8);
        ctx.lineTo(62, 0);
        ctx.lineTo(55, 8);
        ctx.lineTo(35, 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw cockpit windshield (cyan glow)
        ctx.fillStyle = 'rgba(0, 240, 255, 0.6)';
        ctx.beginPath();
        ctx.moveTo(52, -6);
        ctx.lineTo(58, -3);
        ctx.lineTo(58, 3);
        ctx.lineTo(52, 6);
        ctx.closePath();
        ctx.fill();

        // Draw small thruster flame at the very back (X = -60)
        const flameLen = 8 + Math.sin(Date.now() * 0.05) * 4;
        ctx.fillStyle = 'rgba(255, 100, 0, 0.8)';
        ctx.beginPath();
        ctx.moveTo(-60, -5);
        ctx.lineTo(-60 - flameLen, 0);
        ctx.lineTo(-60, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.restore();
    }
}
