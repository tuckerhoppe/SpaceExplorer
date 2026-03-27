import { Utils } from '../utils.js';
import { Particle } from './Particle.js';

export class TutorialShip {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.vx = 0; this.vy = 0;
        this.radius = 16;
        this.angle = 0;
        this.color = '#ffffff';
        this.accentColor = '#00f0ff';
        this._tick = 0;

        // Wingman Waypoint System
        this.followAngle = Math.random() * Math.PI * 2;
        this.followDist = 320;
        this.orbitSpeed = 0.003;

        // Base physics
        this.baseMaxSpeed = 5.5;
        this.baseAccel = 0.12;
        this.turnRate = 0.08;
        this.friction = 0.96;
    }

    update(game) {
        this._tick++;
        const player = game.player;
        if (!player) return;

        // 1. Orbiting Waypoint Logic (Targets the "Max Distance" boundary)
        this.followAngle += this.orbitSpeed;
        const targetX = player.x + Math.cos(this.followAngle) * this.followDist;
        const targetY = player.y + Math.sin(this.followAngle) * this.followDist;

        const distToPlayer = Utils.dist(this.x, this.y, player.x, player.y);
        const angleToTarget = Utils.ang(this.x, this.y, targetX, targetY);
        const angleToPlayer = Utils.ang(this.x, this.y, player.x, player.y);

        // 2. Dynamic Catch-up Logic
        let currentMaxSpeed = this.baseMaxSpeed;
        let currentAccel = this.baseAccel;
        let isBoosting = false;

        if (distToPlayer > 500) {
            isBoosting = true;
            // Scale based on how far we are (maxing out at 1200m)
            const severity = Math.min(1.0, (distToPlayer - 500) / 800);
            currentMaxSpeed = this.baseMaxSpeed + (severity * 18.0); // Up to 23.5
            currentAccel = this.baseAccel + (severity * 0.5);       // Up to 0.62
        }

        // 3. Lazy Wingman Thrust Logic (Safe Zone: 120m to 300m)
        let desiredAngle = this.angle;
        let thrusting = false;

        if (distToPlayer > 300) {
            // Far away: Move towards waypoint
            desiredAngle = angleToTarget;
            thrusting = true;
        } else if (distToPlayer < 120) {
            // Too close: Move towards waypoint (which pulls him away from player)
            desiredAngle = angleToTarget;
            thrusting = true;
        } else {
            // Lazy Zone: Just face player and drift naturally
            desiredAngle = angleToPlayer;
            thrusting = false;
        }

        // 4. Smooth Rotation towards desired angle
        let da = desiredAngle - this.angle;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        this.angle += Math.sign(da) * Math.min(Math.abs(da), this.turnRate);

        // 5. Apply Thrust if needed and somewhat aimed
        if (thrusting) {
            let daThrust = desiredAngle - this.angle;
            while (daThrust > Math.PI) daThrust -= Math.PI * 2;
            while (daThrust < -Math.PI) daThrust += Math.PI * 2;

            if (Math.abs(daThrust) < 0.8) {
                this.vx += Math.cos(this.angle) * currentAccel;
                this.vy += Math.sin(this.angle) * currentAccel;
            }
        }

        // 6. Engine Particles (Visual feedback)
        if (thrusting) {
            const chance = isBoosting ? 0.8 : 0.4;
            if (Math.random() < chance) {
                const pAngle = this.angle + Math.PI + Utils.rand(-0.2, 0.2);
                game.particles.push(Particle.get(
                    this.x - Math.cos(this.angle) * 10,
                    this.y - Math.sin(this.angle) * 10,
                    Math.cos(pAngle) * Utils.rand(2, isBoosting ? 8 : 4),
                    Math.sin(pAngle) * Utils.rand(2, isBoosting ? 8 : 4),
                    this.accentColor, Utils.randInt(8, 20)
                ));
            }
        }

        // 7. Physics Application (Independent of player velocity lock)
        const currentSpeed = Math.hypot(this.vx, this.vy);
        if (currentSpeed > currentMaxSpeed) {
            this.vx = (this.vx / currentSpeed) * currentMaxSpeed;
            this.vy = (this.vy / currentSpeed) * currentMaxSpeed;
        }
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx;
        this.y += this.vy;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Subtle hover
        const hover = Math.sin(this._tick * 0.04) * 3;
        ctx.translate(0, hover);

        ctx.rotate(this.angle);

        // Ship Body (Sleek Interceptor style)
        ctx.fillStyle = '#1a2a4a';
        ctx.strokeStyle = this.accentColor;
        ctx.lineWidth = 2;

        // Main hull
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(-10, -12);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-10, 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cockpit
        ctx.fillStyle = this.accentColor;
        ctx.beginPath();
        ctx.ellipse(2, 0, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wings/Fins
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-2, -8);
        ctx.lineTo(-12, -18);
        ctx.moveTo(-2, 8);
        ctx.lineTo(-12, 18);
        ctx.stroke();

        // Engine glow
        const glow = 5 + Math.sin(this._tick * 0.2) * 3;
        ctx.shadowBlur = glow;
        ctx.shadowColor = this.accentColor;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-8, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
