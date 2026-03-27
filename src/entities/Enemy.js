import { Utils } from '../utils.js';
import { Projectile } from './Projectile.js';

const AGGRO_RANGE = 900;  // start tracking player
const ATTACK_RANGE = 500;  // start firing
const FIRE_RATE = 140;  // frames between shots
const MAX_SPEED = 3.5;
const ACCEL = 0.12;
const ENEMY_COLOR = '#ff6a00';

export class Enemy {
    constructor(x, y, difficulty = 1.0, guardTarget = null, color = ENEMY_COLOR) {
        this.x = x; this.y = y;
        this.radius = 14;
        this.maxHealth = 30 * difficulty;
        this.health = this.maxHealth;
        this.damage = 8 * difficulty;
        this.guardTarget = guardTarget;
        this.color = color;
        const angle = Utils.rand(0, Math.PI * 2);
        this.vx = Math.cos(angle) * Utils.rand(0.5, 1.5);
        this.vy = Math.sin(angle) * Utils.rand(0.5, 1.5);
        this.angle = angle;
        this.lastFireFrame = 0;
        this._frame = 0;
    }

    update(game) {
        this._frame++;
        const px = game.player.x, py = game.player.y;
        const d = Utils.dist(this.x, this.y, px, py);

        if (game.player.health <= 0) {
            // Player dead — just drift
            this._drift();
            return;
        }

        if (this.guardTarget) {
            const distToGuardTarget = Utils.dist(px, py, this.guardTarget.x, this.guardTarget.y);
            // If the player is way out of the parasite's area, stop chasing player and return to post
            if (distToGuardTarget > 1200) {
                const gx = this.guardTarget.x;
                const gy = this.guardTarget.y;
                const guardDist = Utils.dist(this.x, this.y, gx, gy);

                if (guardDist > 300) {
                    // Fly back to guardTarget
                    const targetAngle = Utils.ang(this.x, this.y, gx, gy);
                    let da = targetAngle - this.angle;
                    while (da > Math.PI) da -= Math.PI * 2;
                    while (da < -Math.PI) da += Math.PI * 2;
                    this.angle += Math.sign(da) * Math.min(Math.abs(da), 0.06);

                    this.vx += Math.cos(this.angle) * ACCEL;
                    this.vy += Math.sin(this.angle) * ACCEL;
                } else {
                    this._drift();
                }

                // Clamp speed and move
                const speed = Math.hypot(this.vx, this.vy);
                if (speed > MAX_SPEED) {
                    this.vx = (this.vx / speed) * MAX_SPEED;
                    this.vy = (this.vy / speed) * MAX_SPEED;
                }
                this.vx *= 0.97; this.vy *= 0.97;
                this.x += this.vx; this.y += this.vy;
                return; // Skip player aggro block entirely
            }
        }

        if (d < AGGRO_RANGE) {
            // Rotate toward player
            const targetAngle = Utils.ang(this.x, this.y, px, py);
            let da = targetAngle - this.angle;
            // Normalise to [-π, π]
            while (da > Math.PI) da -= Math.PI * 2;
            while (da < -Math.PI) da += Math.PI * 2;
            this.angle += Math.sign(da) * Math.min(Math.abs(da), 0.06);

            // Thrust if not too close (keep some firing distance)
            if (d > 200) {
                this.vx += Math.cos(this.angle) * ACCEL;
                this.vy += Math.sin(this.angle) * ACCEL;
            } else {
                // Back off slightly when very close
                this.vx -= Math.cos(this.angle) * ACCEL * 0.5;
                this.vy -= Math.sin(this.angle) * ACCEL * 0.5;
            }

            // Fire when within attack range and roughly aimed at player
            const aimError = Math.abs(da);
            if (d < ATTACK_RANGE && aimError < 0.3 &&
                this._frame - this.lastFireFrame > FIRE_RATE) {
                this.lastFireFrame = this._frame;
                game.enemyProjectiles.push(new Projectile(
                    this.x + Math.cos(this.angle) * this.radius,
                    this.y + Math.sin(this.angle) * this.radius,
                    this.angle, 8, this.damage, this.color
                ));
            }
        } else {
            this._drift();
        }

        // --- SEPARATION ---
        // Pushes away from other enemies to avoid ugly stacking/overlapping
        const nearbyShips = [...game.enemies, ...game.battleships, ...game.dreadnoughts];
        for (const other of nearbyShips) {
            if (other === this) continue;
            const dist = Utils.dist(this.x, this.y, other.x, other.y);
            const minDist = this.radius + (other.radius || 15) + 15; // padding for visual comfort
            if (dist < minDist && dist > 0) {
                const angle = Utils.ang(other.x, other.y, this.x, this.y);
                const pushForce = (minDist - dist) * 0.08;
                this.vx += Math.cos(angle) * pushForce;
                this.vy += Math.sin(angle) * pushForce;
            }
        }

        // Clamp speed
        const speed = Math.hypot(this.vx, this.vy);
        if (speed > MAX_SPEED) {
            this.vx = (this.vx / speed) * MAX_SPEED;
            this.vy = (this.vy / speed) * MAX_SPEED;
        }

        this.vx *= 0.97; this.vy *= 0.97;
        this.x += this.vx; this.y += this.vy;
    }

    _drift() {
        // Slow patrol rotation while out of aggro range
        this.angle += 0.005;
        this.x += this.vx; this.y += this.vy;
    }

    draw(ctx, camera) {
        // Viewport cull
        if (this.x + this.radius < camera.x || this.x - this.radius > camera.x + camera.viewW ||
            this.y + this.radius < camera.y || this.y - this.radius > camera.y + camera.viewH) return;

        const r = this.radius;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Body — angular fighter shape (mirror of player but sharper/more hostile)
        ctx.fillStyle = '#1a0800';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(-r * 0.7, -r * 0.9);
        ctx.lineTo(-r * 0.3, 0);
        ctx.lineTo(-r * 0.7, r * 0.9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Engine core glow (small orange dot at back)
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(-r * 0.2, 0, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.restore();

        // Health bar (only when damaged)
        if (this.health < this.maxHealth) {
            const barW = r * 2.5;
            const filled = (this.health / this.maxHealth) * barW;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(this.x - barW / 2, this.y - r - 10, barW, 4);
            ctx.fillStyle = this.health > (this.maxHealth / 2) ? '#ff9500' : '#ff3c3c';
            ctx.fillRect(this.x - barW / 2, this.y - r - 10, filled, 4);
        }
    }
}
