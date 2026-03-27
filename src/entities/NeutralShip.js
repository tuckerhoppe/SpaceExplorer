import { Utils } from '../utils.js';
import { Projectile } from './Projectile.js';
import { NPC_MESSAGES } from '../data/messages.js';

const MAX_SPEED = 2.0;
const ACCEL = 0.08;
const FIRE_RATE = 120;
const AGGRO_RANGE = 700; // only activates if attacked

const HULL_COLOR = '#aaddcc';
const ACCENT_COLOR = '#55ffcc';

export class NeutralShip {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.radius = 12;
        this.health = 25;
        this.maxHealth = 25;
        this.wasAttacked = false;
        this.gemDropRate = 120; // frames between passive gem drops (while near player)
        const angle = Utils.rand(0, Math.PI * 2);
        this.vx = Math.cos(angle) * Utils.rand(0.5, 1.5);
        this.vy = Math.sin(angle) * Utils.rand(0.5, 1.5);
        this.angle = angle;
        this.lastFireFrame = 0;
        this.lastCommsFrame = -1200; // Allow first message right away
        this._frame = 0;
    }

    update(game) {
        this._frame++;
        const px = game.player.x, py = game.player.y;
        const d = Utils.dist(this.x, this.y, px, py);

        if (this.wasAttacked && game.player.health > 0) {
            // Hostile: same AI as fighter but slower
            const targetAngle = Utils.ang(this.x, this.y, px, py);
            let da = targetAngle - this.angle;
            while (da > Math.PI) da -= Math.PI * 2;
            while (da < -Math.PI) da += Math.PI * 2;
            this.angle += Math.sign(da) * Math.min(Math.abs(da), 0.07);

            if (d > 150) {
                this.vx += Math.cos(this.angle) * ACCEL;
                this.vy += Math.sin(this.angle) * ACCEL;
            }

            const aimError = Math.abs(da);
            if (d < AGGRO_RANGE && aimError < 0.35 &&
                this._frame - this.lastFireFrame > FIRE_RATE) {
                this.lastFireFrame = this._frame;
                game.enemyProjectiles.push(new Projectile(
                    this.x + Math.cos(this.angle) * this.radius,
                    this.y + Math.sin(this.angle) * this.radius,
                    this.angle, 7, 6, '#55ffcc'
                ));
            }
        } else {
            // Neutral: gentle wandering drift
            this.angle += 0.008;
            // Slightly steer away if player gets very close
            if (d < 200 && game.player.health > 0) {
                const awayAngle = Utils.ang(px, py, this.x, this.y);
                this.vx += Math.cos(awayAngle) * 0.05;
                this.vy += Math.sin(awayAngle) * 0.05;
            }

            // Passive gem drop: signal Game to spawn a gem at this ship's location
            if (this._frame % this.gemDropRate === 0 && d < 600) {
                game._neutralGemDrop = { x: this.x, y: this.y };
            }

            // Proximity Communications
            if (d < 350 && !this.wasAttacked && this._frame - this.lastCommsFrame > 900) {
                this.lastCommsFrame = this._frame;
                if (game.hud && typeof game.hud.addCommsMessage === 'function') {
                    const msgs = NPC_MESSAGES.neutral;
                    const msg = msgs[Math.floor(Math.random() * msgs.length)];
                    game.hud.addCommsMessage({ sender: "Neutral Trader", text: msg, entity: "neutral" });
                }
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

    draw(ctx, camera) {
        if (this.x + this.radius + 20 < camera.x || this.x - this.radius - 20 > camera.x + camera.viewW ||
            this.y + this.radius + 20 < camera.y || this.y - this.radius - 20 > camera.y + camera.viewH) return;

        const r = this.radius;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Body — rounded trader silhouette (less aggressive shape than fighter)
        ctx.fillStyle = this.wasAttacked ? '#0d1a14' : '#0d1616';
        ctx.strokeStyle = this.wasAttacked ? '#55ffcc' : HULL_COLOR;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(r * 0.3, -r * 0.7);
        ctx.lineTo(-r * 0.8, -r * 0.5);
        ctx.lineTo(-r * 0.5, 0);
        ctx.lineTo(-r * 0.8, r * 0.5);
        ctx.lineTo(r * 0.3, r * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Running lights — green for neutral, red when hostile
        const lightColor = this.wasAttacked ? '#ff3333' : '#33ff88';
        ctx.fillStyle = lightColor;
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(this._frame * 0.08);
        ctx.beginPath();
        ctx.arc(-r * 0.3, 0, r * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.restore();

        // Health bar only when damaged
        if (this.health < this.maxHealth) {
            const barW = r * 2.5;
            const filled = (this.health / this.maxHealth) * barW;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(this.x - barW / 2, this.y - r - 9, barW, 3);
            ctx.fillStyle = this.wasAttacked ? '#ff6600' : '#33ff88';
            ctx.fillRect(this.x - barW / 2, this.y - r - 9, filled, 3);
        }
    }
}

