import { Utils } from '../utils.js';
import { Projectile } from './Projectile.js';

export class Parasite {
    constructor(parent, config, difficulty = 1.0) {
        this.parent = parent;  // The StellarObject this parasite is attached to
        this.type = typeof config === 'string' ? config : config.type; // support old and new formats
        this.numGuards = config.guards || 0;
        this.spawnedGuards = false;

        this.x = parent.x;
        this.y = parent.y;
        this.tick = 0;

        // Random offset from parent center
        const angle = Utils.rand(0, Math.PI * 2);
        const dist = Utils.rand(0, parent.radius * 0.5);
        this.offsetX = Math.cos(angle) * dist;
        this.offsetY = Math.sin(angle) * dist;

        this.bodyDamage = 0.5;

        if (this.type === 'blob') {
            this.maxHealth = 400 * difficulty;
            this.health = this.maxHealth;
            this.radius = 220; // Much larger
            this.color = '#32cd32'; // lime green
        } else if (this.type === 'oppressor') {
            this.maxHealth = 500 * difficulty;
            this.health = this.maxHealth;
            this.damage = 15 * difficulty; // Projectile damage
            this.bodyDamage = 0.5 * difficulty;
            this.radius = 70; // Larger station structure
            this.color = '#ff6a00'; // red/orange
            this.fireRate = 1200; // Faster firing rate
            this.lastFire = performance.now();
        } else if (this.type === 'stronghold') {
            this.maxHealth = 1500 * difficulty;
            this.health = this.maxHealth;
            this.damage = 25 * difficulty; // Projectile damage
            this.bodyDamage = 1.0 * difficulty;
            this.radius = 240; // Massive space station
            this.color = '#ff003c'; // Evil Red/Crimson
            this.fireRate = 1500; // Normal shot rate
            this.lastFire = performance.now();
            this.torpedoFireRate = 4500; // Torpedo rate
            this.lastTorpedoFire = performance.now() + Utils.rand(0, 2000); // offset initial shot
        }
    }

    update(game) {
        this.tick++;
        this.x = this.parent.x + this.offsetX;
        this.y = this.parent.y + this.offsetY;

        if (this.type === 'oppressor') {
            // Oppressor slowly rotates around the parent
            const orbitSpeed = 0.002;
            const cx = this.offsetX;
            const cy = this.offsetY;
            this.offsetX = cx * Math.cos(orbitSpeed) - cy * Math.sin(orbitSpeed);
            this.offsetY = cx * Math.sin(orbitSpeed) + cy * Math.cos(orbitSpeed);

            // Occasionally fire at player if nearby
            const dist = Utils.dist(this.x, this.y, game.player.x, game.player.y);
            if (dist < 1500) {
                const now = performance.now();
                if (now - this.lastFire > this.fireRate) {
                    this.lastFire = now;
                    const aimAngle = Utils.ang(this.x, this.y, game.player.x, game.player.y);
                    game.enemyProjectiles.push(new Projectile(
                        this.x, this.y, aimAngle, 6, this.damage, '#ff4400'
                    ));
                }
            }
        } else if (this.type === 'stronghold') {
            // Stronghold rotates slower than oppressor
            const orbitSpeed = 0.001;
            const cx = this.offsetX;
            const cy = this.offsetY;
            this.offsetX = cx * Math.cos(orbitSpeed) - cy * Math.sin(orbitSpeed);
            this.offsetY = cx * Math.sin(orbitSpeed) + cy * Math.cos(orbitSpeed);

            // Fire at player if nearby
            const dist = Utils.dist(this.x, this.y, game.player.x, game.player.y);
            if (dist < 1800) {
                const now = performance.now();
                // Normal shot
                if (now - this.lastFire > this.fireRate) {
                    this.lastFire = now;
                    const aimAngle = Utils.ang(this.x, this.y, game.player.x, game.player.y);
                    game.enemyProjectiles.push(new Projectile(
                        this.x, this.y, aimAngle, 6.5, this.damage, '#ff0055'
                    ));
                }
                // Torpedo shot
                if (now - this.lastTorpedoFire > this.torpedoFireRate) {
                    this.lastTorpedoFire = now;
                    const aimAngle = Utils.ang(this.x, this.y, game.player.x, game.player.y);
                    game.enemyProjectiles.push(new Projectile(
                        this.x, this.y, aimAngle, 3.5, this.damage * 2.5, '#00eaff', true
                    ));
                }
            }
        } else if (this.type === 'blob') {
            // Blob slowly undulates (handled in draw via tick)
        }
    }

    draw(ctx, camera) {
        if (this.x + this.radius < camera.x || this.x - this.radius > camera.x + camera.viewW ||
            this.y + this.radius < camera.y || this.y - this.radius > camera.y + camera.viewH) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Draw health bar
        const hpPct = Math.max(0, this.health / this.maxHealth);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(-this.radius, -this.radius - 15, this.radius * 2, 6);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(-this.radius, -this.radius - 15, this.radius * 2 * hpPct, 6);

        if (this.type === 'blob') {
            const scale = 1 + 0.1 * Math.sin(this.tick * 0.05);
            ctx.scale(scale, scale);

            ctx.fillStyle = this.color + 'aa';
            ctx.beginPath();
            // Draw a wobbly blob shape
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const r = this.radius * (0.8 + 0.2 * Math.sin(i * 2 + this.tick * 0.1));
                const px = Math.cos(angle) * r;
                const py = Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();

            // Core
            ctx.fillStyle = '#00ff00';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();

        } else if (this.type === 'oppressor') {
            // Draw a menacing orbital station
            ctx.rotate(this.tick * 0.015);

            // Central core
            ctx.fillStyle = '#1a0a0a';
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 4;

            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // 4 large station arms extending out
            const arms = 4;
            for (let i = 0; i < arms; i++) {
                ctx.save();
                ctx.rotate((i * Math.PI * 2) / arms);

                // Arm struts
                ctx.fillStyle = '#222';
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.radius * 0.4, -10);
                ctx.lineTo(this.radius, -15);
                ctx.lineTo(this.radius, 15);
                ctx.lineTo(this.radius * 0.4, 10);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Weapon pods at the end of arms
                ctx.fillStyle = '#441111';
                ctx.beginPath();
                ctx.arc(this.radius, 0, 18, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Red glowing centers on pods
                ctx.fillStyle = '#ff2200';
                ctx.beginPath();
                ctx.arc(this.radius, 0, 8, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            }

            // Central glowing eye (Sauron-esque)
            const eyeSize = this.radius * 0.3 + 5 * Math.sin(this.tick * 0.1);
            ctx.fillStyle = '#ff3300';
            ctx.beginPath();
            ctx.ellipse(0, 0, eyeSize, eyeSize * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();

            const pupilSize = eyeSize * 0.3;
            ctx.fillStyle = '#fffc00';
            ctx.beginPath();
            ctx.arc(0, 0, pupilSize, 0, Math.PI * 2);
            ctx.fill();

            // Outer ring
            ctx.strokeStyle = 'rgba(255, 100, 0, 0.4)';
            ctx.lineWidth = 2;
            ctx.setLineDash([15, 10]);
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        } else if (this.type === 'stronghold') {
            // Draw a massive, dark obsidian polygon citadel (completely distinct from the oppressor)
            
            // Outer shield ring (red energy)
            ctx.save();
            ctx.rotate(-this.tick * 0.003); // Counter-rotates outer rings
            ctx.strokeStyle = 'rgba(255, 0, 50, 0.25)';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.15, 0, Math.PI * 2);
            ctx.stroke();

            // Segmented red power shield bars
            ctx.strokeStyle = '#ff003c';
            ctx.lineWidth = 4;
            ctx.setLineDash([50, 80]);
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.15, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            // Draw 4 massive obsidian triangular wedge/shield plates
            ctx.save();
            ctx.rotate(this.tick * 0.005);
            for (let i = 0; i < 4; i++) {
                ctx.save();
                ctx.rotate((i * Math.PI * 2) / 4);

                // Wedge shape
                ctx.fillStyle = '#1a050b';
                ctx.strokeStyle = '#ff0044';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(this.radius * 0.4, -40);
                ctx.lineTo(this.radius * 1.05, -70);
                ctx.lineTo(this.radius * 1.05, 70);
                ctx.lineTo(this.radius * 0.4, 40);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Inner red glowing energy vents in wedges
                ctx.fillStyle = '#ff1100';
                ctx.fillRect(this.radius * 0.6, -15, this.radius * 0.35, 10);
                ctx.fillRect(this.radius * 0.6, 5, this.radius * 0.35, 10);

                ctx.restore();
            }
            ctx.restore();

            // Next, draw a rotating mid-layer (counter-rotating star spike)
            ctx.save();
            ctx.rotate(-this.tick * 0.01);
            const spikes = 8;
            ctx.fillStyle = '#0f0204';
            ctx.strokeStyle = '#8b0000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let i = 0; i < spikes * 2; i++) {
                const angle = (i * Math.PI) / spikes;
                const r = (i % 2 === 0) ? this.radius * 0.75 : this.radius * 0.3;
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Heavy Gun Emitters at the core cardinal points (non-rotating for aiming context)
            const weaponPods = 4;
            for (let i = 0; i < weaponPods; i++) {
                ctx.save();
                ctx.rotate((i * Math.PI * 2) / weaponPods);

                // Heavy railgun barrels
                ctx.fillStyle = '#2d2d2d';
                ctx.strokeStyle = '#555';
                ctx.lineWidth = 2;
                ctx.fillRect(this.radius * 0.2, -18, this.radius * 0.45, 12);
                ctx.fillRect(this.radius * 0.2, 6, this.radius * 0.45, 12);

                // Heavy pod mount
                ctx.fillStyle = '#220005';
                ctx.strokeStyle = '#ff003c';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.radius * 0.3, 0, 32, -Math.PI/3, Math.PI/3);
                ctx.stroke();

                ctx.restore();
            }

            // Central core citadel
            ctx.fillStyle = '#080002';
            ctx.strokeStyle = '#ff003c';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.28, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Glowing central heart (eye-shaped but cybernetic/crystalline red)
            const pulse = 10 * Math.sin(this.tick * 0.08);
            ctx.shadowBlur = 20 + pulse;
            ctx.shadowColor = '#ff0000';
            ctx.fillStyle = '#ff0033';
            ctx.beginPath();
            // A sharp diamond crystalline shape for the core
            ctx.moveTo(0, -this.radius * 0.16 - pulse * 0.4);
            ctx.lineTo(this.radius * 0.16 + pulse * 0.4, 0);
            ctx.lineTo(0, this.radius * 0.16 + pulse * 0.4);
            ctx.lineTo(-this.radius * 0.16 - pulse * 0.4, 0);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;

            // Inner white-hot crystal core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(0, -this.radius * 0.06);
            ctx.lineTo(this.radius * 0.06, 0);
            ctx.lineTo(0, this.radius * 0.06);
            ctx.lineTo(-this.radius * 0.06, 0);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}
