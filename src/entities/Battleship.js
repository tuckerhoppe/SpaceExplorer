import { Utils } from '../utils.js';
import { Projectile } from './Projectile.js';

const AGGRO_RANGE = 1200;  // battleships have a longer sight range
const ATTACK_RANGE = 700;
const FIRE_RATE = 220;   // slow fire rate
const MAX_SPEED = 1.6;   // big and slow
const ACCEL = 0.06;
const HULL_COLOR = '#cc2200';
const ACCENT_COLOR = '#ff4400';

export class Battleship {
    constructor(x, y, difficulty = 1.0, color = ACCENT_COLOR) {
        this.x = x; this.y = y;
        this.radius = 30;       // large collision/cull radius
        this.health = 150 * difficulty;
        this.maxHealth = 150 * difficulty;
        this.damage = 20 * difficulty;       // per shot
        this.color = color;
        const angle = Utils.rand(0, Math.PI * 2);
        this.vx = Math.cos(angle) * Utils.rand(0.3, 0.8);
        this.vy = Math.sin(angle) * Utils.rand(0.3, 0.8);
        this.angle = angle;
        this.lastFireFrame = 0;
        this._frame = 0;
    }

    update(game) {
        this._frame++;
        const px = game.player.x, py = game.player.y;
        const d = Utils.dist(this.x, this.y, px, py);

        if (game.player.health <= 0) { this._drift(); return; }

        if (d < AGGRO_RANGE) {
            const targetAngle = Utils.ang(this.x, this.y, px, py);
            let da = targetAngle - this.angle;
            while (da > Math.PI) da -= Math.PI * 2;
            while (da < -Math.PI) da += Math.PI * 2;
            // Battleships turn slower
            this.angle += Math.sign(da) * Math.min(Math.abs(da), 0.03);

            if (d > 300) {
                this.vx += Math.cos(this.angle) * ACCEL;
                this.vy += Math.sin(this.angle) * ACCEL;
            }

            // Two-barrel salvo — fire two shots close together
            const aimError = Math.abs(da);
            if (d < ATTACK_RANGE && aimError < 0.25 &&
                this._frame - this.lastFireFrame > FIRE_RATE) {
                this.lastFireFrame = this._frame;
                const spread = 0.08;
                game.enemyProjectiles.push(new Projectile(
                    this.x + Math.cos(this.angle) * this.radius,
                    this.y + Math.sin(this.angle) * this.radius,
                    this.angle - spread, 6, this.damage, this.color
                ));
                game.enemyProjectiles.push(new Projectile(
                    this.x + Math.cos(this.angle) * this.radius,
                    this.y + Math.sin(this.angle) * this.radius,
                    this.angle + spread, 6, this.damage, this.color
                ));
            }
        } else {
            this._drift();
        }

        // --- SEPARATION ---
        // Pushes away from other ships to avoid ugly stacking/overlapping
        const nearbyShips = [...game.enemies, ...game.battleships, ...game.dreadnoughts];
        for (const other of nearbyShips) {
            if (other === this) continue;
            const dist = Utils.dist(this.x, this.y, other.x, other.y);
            const minDist = this.radius + (other.radius || 15) + 20; // more personal space for big ships
            if (dist < minDist && dist > 0) {
                const angle = Utils.ang(other.x, other.y, this.x, this.y);
                const pushForce = (minDist - dist) * 0.05;
                this.vx += Math.cos(angle) * pushForce;
                this.vy += Math.sin(angle) * pushForce;
            }
        }

        const speed = Math.hypot(this.vx, this.vy);
        if (speed > MAX_SPEED) {
            this.vx = (this.vx / speed) * MAX_SPEED;
            this.vy = (this.vy / speed) * MAX_SPEED;
        }
        this.vx *= 0.98; this.vy *= 0.98;
        this.x += this.vx; this.y += this.vy;
    }

    _drift() {
        this.angle += 0.003;
        this.x += this.vx; this.y += this.vy;
    }

    draw(ctx, camera) {
        if (this.x + this.radius * 2 < camera.x || this.x - this.radius * 2 > camera.x + camera.viewW ||
            this.y + this.radius * 2 < camera.y || this.y - this.radius * 2 > camera.y + camera.viewH) return;

        const r = this.radius;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Main hull — thick rectangular body
        ctx.fillStyle = '#1a0500';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(r * 0.6, -r * 0.5);
        ctx.lineTo(-r * 0.8, -r * 0.6);
        ctx.lineTo(-r, -r * 0.3);
        ctx.lineTo(-r, r * 0.3);
        ctx.lineTo(-r * 0.8, r * 0.6);
        ctx.lineTo(r * 0.6, r * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cannon barrels
        ctx.fillStyle = this.color;
        ctx.fillRect(r * 0.5, -r * 0.35, r * 0.7, r * 0.12);
        ctx.fillRect(r * 0.5, r * 0.23, r * 0.7, r * 0.12);

        // Engine glow
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.7 + 0.3 * Math.sin(this._frame * 0.08);
        ctx.beginPath();
        ctx.arc(-r * 0.75, 0, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.restore();

        // Health bar (always shown for battleships — they're formidable)
        const barW = r * 3;
        const filled = (this.health / this.maxHealth) * barW;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(this.x - barW / 2, this.y - r - 12, barW, 5);
        ctx.fillStyle = this.health > 75 ? '#cc2200' : '#ff6600';
        ctx.fillRect(this.x - barW / 2, this.y - r - 12, filled, 5);
    }
}
