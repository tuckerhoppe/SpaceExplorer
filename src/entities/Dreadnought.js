import { Utils } from '../utils.js';
import { Projectile } from './Projectile.js';

const AGGRO_RANGE = 1500;
const ATTACK_RANGE = 900;
const FIRE_RATE = 280;
const MAX_SPEED = 1.0;
const ACCEL = 0.04;
const HULL_COLOR = '#440066';
const ACCENT_COLOR = '#ff00ff';

export class Dreadnought {
    constructor(x, y, difficulty = 1.0, color = ACCENT_COLOR) {
        this.x = x; this.y = y;
        this.radius = 60;
        this.maxHealth = 500 * difficulty;
        this.health = this.maxHealth;
        this.damage = 30 * difficulty;
        this.color = color;
        const angle = Utils.rand(0, Math.PI * 2);
        this.vx = Math.cos(angle) * 0.2;
        this.vy = Math.sin(angle) * 0.2;
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
            
            // Dreadnoughts turn very slowly
            this.angle += Math.sign(da) * Math.min(Math.abs(da), 0.015);

            if (d > 400) {
                this.vx += Math.cos(this.angle) * ACCEL;
                this.vy += Math.sin(this.angle) * ACCEL;
            }

            // Triple-barrel salvo
            const aimError = Math.abs(da);
            if (d < ATTACK_RANGE && aimError < 0.2 &&
                this._frame - this.lastFireFrame > FIRE_RATE) {
                this.lastFireFrame = this._frame;
                
                const offsets = [-0.15, 0, 0.15];
                offsets.forEach(offset => {
                    game.enemyProjectiles.push(new Projectile(
                        this.x + Math.cos(this.angle) * this.radius,
                        this.y + Math.sin(this.angle) * this.radius,
                        this.angle + offset, 7, this.damage, this.color
                    ));
                });
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
            const minDist = this.radius + (other.radius || 15) + 30; // dreadnoughts need a lot of space
            if (dist < minDist && dist > 0) {
                const angle = Utils.ang(other.x, other.y, this.x, this.y);
                const pushForce = (minDist - dist) * 0.03; // dreadnoughts have high inertia, push slowly
                this.vx += Math.cos(angle) * pushForce;
                this.vy += Math.sin(angle) * pushForce;
            }
        }

        const speed = Math.hypot(this.vx, this.vy);
        if (speed > MAX_SPEED) {
            this.vx = (this.vx / speed) * MAX_SPEED;
            this.vy = (this.vy / speed) * MAX_SPEED;
        }
        this.vx *= 0.99; this.vy *= 0.99;
        this.x += this.vx; this.y += this.vy;
    }

    _drift() {
        this.angle += 0.001;
        this.x += this.vx; this.y += this.vy;
    }

    draw(ctx, camera) {
        if (this.x + this.radius * 2 < camera.x || this.x - this.radius * 2 > camera.x + camera.viewW ||
            this.y + this.radius * 2 < camera.y || this.y - this.radius * 2 > camera.y + camera.viewH) return;

        const r = this.radius;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Main hull — Giant Triangle
        ctx.fillStyle = '#0f001a';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(r * 1.2, 0); // Front
        ctx.lineTo(-r * 0.8, -r); // Back left
        ctx.lineTo(-r * 0.4, 0); // Back center notch
        ctx.lineTo(-r * 0.8, r); // Back right
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Internal armor plates
        ctx.strokeStyle = '#2a0044';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(r * 0.6, 0);
        ctx.lineTo(-r * 0.4, -r * 0.5);
        ctx.moveTo(r * 0.6, 0);
        ctx.lineTo(-r * 0.4, r * 0.5);
        ctx.stroke();

        // Glowing weapon ports
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        
        // Front cannon
        ctx.fillRect(r * 1.0, -4, 15, 8);
        
        // Side cannons
        ctx.fillRect(0, -r * 0.6, 12, 6);
        ctx.fillRect(0, r * 0.6 - 6, 12, 6);

        // Core glow
        const glowSize = r * 0.3 * (0.8 + 0.2 * Math.sin(this._frame * 0.05));
        ctx.beginPath();
        ctx.arc(-r * 0.2, 0, glowSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Health bar (always shown)
        const barW = r * 4;
        const filled = (this.health / this.maxHealth) * barW;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(this.x - barW / 2, this.y - r - 20, barW, 8);
        
        const gradient = ctx.createLinearGradient(this.x - barW / 2, 0, this.x + barW / 2, 0);
        gradient.addColorStop(0, '#440066');
        gradient.addColorStop(1, '#ff00ff');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x - barW / 2, this.y - r - 20, filled, 8);
        
        // Label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('DREADNOUGHT', this.x, this.y - r - 30);
    }
}
