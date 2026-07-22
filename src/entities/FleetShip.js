import { SHIPS } from '../config.js';
import { Projectile } from './Projectile.js';
import { Utils } from '../utils.js';

export class FleetShip {
    constructor(game, shipIndex, x, y) {
        this.game = game;
        this.shipIndex = shipIndex;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        
        const player = this.game.player;
        const sConfig = SHIPS[shipIndex];
        this.radius = sConfig.shipRadius || 18;
        
        // Base health calculations:
        const playerHullUpgrade = player ? (player.stats.hull || 0) : 0;
        const shipHullBonus = sConfig.stats.hull || 0;
        this.maxHealth = 30 + ((playerHullUpgrade + shipHullBonus) * 30);
        this.health = this.maxHealth;
        
        // Firing configurations:
        const playerWeaponsUpgrade = player ? (player.stats.weapons || 0) : 0;
        const shipWeaponsBonus = sConfig.stats.weapons || 0;
        this.damage = 10 + ((playerWeaponsUpgrade + shipWeaponsBonus) * 5);
        // Visual/action improvement: escorts fire 3.5x faster to make them feel highly active in combat
        this.fireRate = Math.max(20, (250 - ((playerWeaponsUpgrade + shipWeaponsBonus) * 30)) / 3.5);
        this.lastFireFrame = 0;
        this._frame = 0;
    }

    update(px, py, tx, ty, leaderShip) {
        if (this.health <= 0) return;
        this._frame++;

        const dist = Math.hypot(tx - this.x, ty - this.y);
        const turnSpeed = 0.08;
        
        // Make escort max speed match player's current velocity (with a baseline of 6 so they can get in position when player is stopped)
        const player = this.game.player;
        const playerSpeed = player ? Math.hypot(player.vx, player.vy) : 0;
        const maxSpeed = Math.max(playerSpeed, 6);

        if (dist > 15) {
            const targetAngle = Utils.ang(this.x, this.y, tx, ty);
            let da = targetAngle - this.angle;
            while (da > Math.PI) da -= Math.PI * 2;
            while (da < -Math.PI) da += Math.PI * 2;

            // Turn towards target slot
            const catchUpFactor = dist > 250 ? 1.6 : 1.0;
            this.angle += Math.sign(da) * Math.min(Math.abs(da), turnSpeed * catchUpFactor);

            // Set velocity towards target slot
            const targetSpeed = Math.min(maxSpeed * catchUpFactor, dist * 0.08);
            this.vx += (Math.cos(targetAngle) * targetSpeed - this.vx) * 0.15;
            this.vy += (Math.sin(targetAngle) * targetSpeed - this.vy) * 0.15;
        } else {
            // Arrived at slot, match leader's velocity and angle smoothly
            this.angle += (leaderShip.angle - this.angle) * 0.15;
            this.vx += (leaderShip.vx - this.vx) * 0.2;
            this.vy += (leaderShip.vy - this.vy) * 0.2;
        }

        // Apply friction and move
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.x += this.vx;
        this.y += this.vy;

        // Combat behavior: scan for nearest enemy in range
        let nearestEnemy = null;
        let minDist = 800; // Attack range

        const checkEnemiesList = (list) => {
            for (const e of list) {
                if (e.health <= 0) continue;
                const d = Utils.dist(this.x, this.y, e.x, e.y);
                if (d < minDist) {
                    minDist = d;
                    nearestEnemy = e;
                }
            }
        };

        checkEnemiesList(this.game.enemies);
        checkEnemiesList(this.game.battleships);
        checkEnemiesList(this.game.dreadnoughts);
        checkEnemiesList(this.game.bosses);

        // Scan for active parasites/oppressors attached to stellar objects
        if (this.game.sectorManager && this.game.sectorManager.objects) {
            for (const obj of this.game.sectorManager.objects) {
                if (obj.parasite && obj.parasite.health > 0) {
                    const d = Utils.dist(this.x, this.y, obj.parasite.x, obj.parasite.y);
                    if (d < minDist) {
                        minDist = d;
                        nearestEnemy = obj.parasite;
                    }
                }
            }
        }

        if (nearestEnemy) {
            const targetAngle = Utils.ang(this.x, this.y, nearestEnemy.x, nearestEnemy.y);
            let da = targetAngle - this.angle;
            while (da > Math.PI) da -= Math.PI * 2;
            while (da < -Math.PI) da += Math.PI * 2;

            // Rotate towards enemy slightly while shooting
            this.angle += Math.sign(da) * Math.min(Math.abs(da), 0.06);

            // Fire 360-degrees (omni-directional) when reload is ready
            if (this._frame - this.lastFireFrame > this.fireRate) {
                this.lastFireFrame = this._frame;
                
                const hasDoubleLaser = player && player.tech && player.tech.fleet_double_laser;

                if (hasDoubleLaser) {
                    // Double parallel laser spread
                    const leftAngle = targetAngle - Math.PI / 2;
                    const rightAngle = targetAngle + Math.PI / 2;
                    const spread = 6;

                    // Left laser
                    this.game.projectiles.push(new Projectile(
                        this.x + Math.cos(targetAngle) * this.radius + Math.cos(leftAngle) * spread,
                        this.y + Math.sin(targetAngle) * this.radius + Math.sin(leftAngle) * spread,
                        targetAngle, 12, this.damage, '#00f0ff'
                    ));
                    // Right laser
                    this.game.projectiles.push(new Projectile(
                        this.x + Math.cos(targetAngle) * this.radius + Math.cos(rightAngle) * spread,
                        this.y + Math.sin(targetAngle) * this.radius + Math.sin(rightAngle) * spread,
                        targetAngle, 12, this.damage, '#00f0ff'
                    ));
                } else {
                    // Default: Single friendly laser
                    this.game.projectiles.push(new Projectile(
                        this.x + Math.cos(targetAngle) * this.radius,
                        this.y + Math.sin(targetAngle) * this.radius,
                        targetAngle, 12, this.damage, '#00f0ff'
                    ));
                }
            }
        }
    }

    draw(ctx, camera) {
        // Viewport cull
        if (this.x < camera.x - this.radius || this.x > camera.x + camera.viewW + this.radius ||
            this.y < camera.y - this.radius || this.y > camera.y + camera.viewH + this.radius) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Render shape
        const s = SHIPS[this.shipIndex];
        ctx.fillStyle = '#050b1e';
        ctx.strokeStyle = '#0055ff';
        ctx.lineWidth = 2;
        if (s && typeof s.drawShape === 'function') {
            s.drawShape(ctx, this.radius);
        }
        ctx.restore();

        // Draw small health bar if damaged
        if (this.health < this.maxHealth) {
            const barW = this.radius * 2;
            const barH = 3;
            const bx = this.x - this.radius;
            const by = this.y - this.radius - 8;

            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(bx, by, barW, barH);
            ctx.fillStyle = '#00ff88';
            ctx.fillRect(bx, by, barW * (this.health / this.maxHealth), barH);
            ctx.restore();
        }
    }
}
