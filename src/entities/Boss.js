import { Utils } from '../utils.js';
import { Projectile } from './Projectile.js';

const AGGRO_RANGE = 2000;
const ATTACK_RANGE = 1200;
const MAX_SPEED = 1.2;
const ACCEL = 0.05;

export class Boss {
    constructor(x, y, id, name, difficulty = 1.0) {
        this.x = x;
        this.y = y;
        this.id = id;
        this.name = name;
        this.radius = 80;
        
        // Stats scaled by difficulty
        this.maxHealth = 5000 * difficulty;
        this.health = this.maxHealth;
        this.damage = 15 * difficulty; // Phaser damage
        this.torpedoDamage = 60 * difficulty;
        
        this.color = '#ff4444'; // Imperial Crimson
        this.accent = '#ffd700'; // Imperial Gold
        
        const angle = Utils.rand(0, Math.PI * 2);
        this.vx = Math.cos(angle) * 0.2;
        this.vy = Math.sin(angle) * 0.2;
        this.angle = angle;
        
        this.lastFireFrame = 0;
        this.lastTorpedoFrame = 0;
        this._frame = 0;
        this.phase = 1; // 1: 100-60%, 2: 60-30%, 3: 30-0%
    }

    update(game) {
        this._frame++;
        const player = game.player;
        if (!player) return;

        const d = Utils.dist(this.x, this.y, player.x, player.y);

        // Update phase based on health
        const healthPct = this.health / this.maxHealth;
        if (healthPct > 0.6) this.phase = 1;
        else if (healthPct > 0.3) this.phase = 2;
        else this.phase = 3;

        if (player.health <= 0) {
            this._drift();
            return;
        }

        if (d < AGGRO_RANGE) {
            // 1. COMPLEX TRACKING & ROTATION
            const targetAngle = Utils.ang(this.x, this.y, player.x, player.y);
            let da = targetAngle - this.angle;
            while (da > Math.PI) da -= Math.PI * 2;
            while (da < -Math.PI) da += Math.PI * 2;

            // Turn speed increases in later phases
            const turnSpeed = this.phase === 3 ? 0.035 : (this.phase === 2 ? 0.025 : 0.015);
            this.angle += Math.sign(da) * Math.min(Math.abs(da), turnSpeed);

            // 2. DYNAMIC MOVEMENT (Strafe & Orbit)
            const idealDist = this.phase === 3 ? 400 : 700;
            const orbitDir = (this.id.charCodeAt(0) % 2 === 0) ? 1 : -1; // Consistent per-instance direction
            
            // Forward/Backward component
            let accelX = 0;
            let accelY = 0;

            if (d > idealDist + 200) {
                accelX += Math.cos(this.angle) * ACCEL;
                accelY += Math.sin(this.angle) * ACCEL;
            } else if (d < idealDist - 200) {
                accelX -= Math.cos(this.angle) * ACCEL * 0.8;
                accelY -= Math.sin(this.angle) * ACCEL * 0.8;
            }

            // Strafe/Orbit component
            const strafeIntensity = this.phase === 3 ? 1.5 : 1.0;
            const orbitAngle = this.angle + (Math.PI / 2) * orbitDir;
            accelX += Math.cos(orbitAngle) * ACCEL * strafeIntensity;
            accelY += Math.sin(orbitAngle) * ACCEL * strafeIntensity;

            // Random erratic jitter in Phase 3
            if (this.phase === 3 && this._frame % 60 < 20) {
                const jitter = Utils.rand(0, Math.PI * 2);
                accelX += Math.cos(jitter) * ACCEL * 2;
                accelY += Math.sin(jitter) * ACCEL * 2;
            }

            this.vx += accelX;
            this.vy += accelY;

            // --- WEAPONS SYSTEMS ---
            const aimError = Math.abs(da);
            
            // 1. PRIMARY FRONTAL SALVO (Heavy)
            const fireRate = this.phase === 3 ? 60 : (this.phase === 2 ? 90 : 120);
            if (d < ATTACK_RANGE && aimError < 0.4 && this._frame - this.lastFireFrame > fireRate) {
                this.lastFireFrame = this._frame;
                
                const offsets = [-0.15, 0, 0.15];
                offsets.forEach(off => {
                    game.enemyProjectiles.push(new Projectile(
                        this.x + Math.cos(this.angle) * this.radius,
                        this.y + Math.sin(this.angle) * this.radius,
                        this.angle + off, 10, this.damage, this.color
                    ));
                });
            }
            
            // 2. SIDE SUPPRESSION TURRETS (Continuous)
            // Fires much faster than primary but with lower damage
            const suppressionRate = this.phase === 3 ? 30 : 45;
            if (d < ATTACK_RANGE && this._frame % suppressionRate === 0) {
                // Left & Right batteries
                const sideAngle1 = this.angle + Math.PI / 2;
                const sideAngle2 = this.angle - Math.PI / 2;
                
                game.enemyProjectiles.push(new Projectile(this.x, this.y, sideAngle1, 8, this.damage * 0.4, this.color));
                game.enemyProjectiles.push(new Projectile(this.x, this.y, sideAngle2, 8, this.damage * 0.4, this.color));
            }

            // 3. TORPEDO SYSTEMS (Phases 2 & 3)
            const torpedoRate = this.phase === 3 ? 180 : 300;
            if (this.phase >= 2 && d < ATTACK_RANGE && this._frame - this.lastTorpedoFrame > torpedoRate) {
                this.lastTorpedoFrame = this._frame;
                
                const torpAngle = Utils.ang(this.x, this.y, player.x, player.y);
                game.enemyProjectiles.push(new Projectile(this.x, this.y, torpAngle, 6, this.torpedoDamage, '#00eaff', true));
            }
        } else {
            this._drift();
        }

        // Clamp speed
        const speed = Math.hypot(this.vx, this.vy);
        const maxSpd = this.phase === 3 ? MAX_SPEED * 2.2 : MAX_SPEED * 1.5;
        if (speed > maxSpd) {
            this.vx = (this.vx / speed) * maxSpd;
            this.vy = (this.vy / speed) * maxSpd;
        }
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.x += this.vx;
        this.y += this.vy;
    }

    _drift() {
        this.angle += 0.001;
        this.x += this.vx;
        this.y += this.vy;
    }

    draw(ctx, camera) {
        if (this.x + this.radius * 2 < camera.x || this.x - this.radius * 2 > camera.x + camera.viewW ||
            this.y + this.radius * 2 < camera.y || this.y - this.radius * 2 > camera.y + camera.viewH) return;

        const r = this.radius;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // --- Imperial Flagship Silhouette ---
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        // Base Hull (Broad, menacing)
        ctx.fillStyle = '#0a0005';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 5;
        
        ctx.beginPath();
        ctx.moveTo(r * 1.4, 0); // Nose
        ctx.lineTo(r * 0.6, -r * 0.5);
        ctx.lineTo(-r * 0.8, -r * 1.2); // Wing tip back left
        ctx.lineTo(-r * 0.4, -r * 0.3);
        ctx.lineTo(-r * 1.2, 0); // Back center
        ctx.lineTo(-r * 0.4, r * 0.3);
        ctx.lineTo(-r * 0.8, r * 1.2); // Wing tip back right
        ctx.lineTo(r * 0.6, r * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Decorative Gold Trimming
        ctx.strokeStyle = this.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(r * 1.1, 0);
        ctx.lineTo(0, -r * 0.4);
        ctx.lineTo(-r * 0.6, 0);
        ctx.lineTo(0, r * 0.4);
        ctx.closePath();
        ctx.stroke();

        // Bridge Dome
        ctx.fillStyle = '#1a0000';
        ctx.beginPath();
        ctx.arc(-r * 0.2, 0, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Glowing Engine Banks (back centers)
        const engineGlow = 0.7 + 0.3 * Math.sin(this._frame * 0.1);
        ctx.fillStyle = this.phase === 3 ? '#ff8800' : this.color;
        ctx.globalAlpha = engineGlow;
        ctx.beginPath();
        ctx.arc(-r * 0.8, -r * 0.3, r * 0.2, 0, Math.PI * 2);
        ctx.arc(-r * 0.8, r * 0.3, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Weapon Batteries
        ctx.fillStyle = '#333';
        // Frontal Battery
        ctx.fillRect(r * 1.2, -6, 20, 12);
        // Side Batteries
        ctx.fillRect(0, -r * 0.6, 15, 30);
        ctx.fillRect(0, r * 0.6 - 30, 15, 30);

        ctx.restore();
    }
}
