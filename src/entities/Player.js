import { Utils } from '../utils.js';
import { Input } from '../engine/Input.js';
import { SHIPS } from '../config.js';
import { Particle } from './Particle.js';
import { Projectile } from './Projectile.js';

export class Player {
    constructor() {
        this.x = 0; this.y = 0;
        this.vx = 0; this.vy = 0;
        this.angle = 0;
        this.radius = 18; // will be overwritten by updateShipRadius() after _loadProgress

        this.stats = { engine: 1, hull: 1, weapons: 1, magnet: 1, booster: 1, cargo: 0, healing: 0 };
        this.tech = { 
            biometric_filtering: false, 
            heat_shield: false, 
            auto_heal: false, 
            proton_torpedo: false,
            gravity_laser: false,
            evasive_maneuvers: false
        };
        this.dashCharges = 3;
        this.maxDashCharges = 3;
        this.dashRechargeTimer = 0; // 0 to 1
        this._dashKeysPressed = {}; // Local state to prevent continuous dashing
        this.isFiringGravityLaser = false;
        this._autoHealTimer = 0;
        this.lastFireTime = 0;
        this.lastTorpedoTime = 0;
        this.torpedoCooldown = 3000; // 3 seconds

        // ── Persistence ───────────────────────────────────────────
        this._baseHealth = 30; // Base health (hull upgrades add to this)
        this._loadProgress();
        this.updateShipRadius(); // sync radius to loaded shipIndex
        this.health = this.maxHealth;

        // ── Engine mode ───────────────────────────────────────────
        this.engineMode = 'thruster'; // 'thruster' | 'boost'
        this.boostCharge = 0;          // 0 → 1; only meaningful in boost mode
        this.boostTime = 0;            // frames spent at 100% boost charge
        this._wasThrustingBoost = false;

        // ── Science status ────────────────────────────────────────
        // Per-object SP earned (persisted so in-world bars survive reload)
        try {
            this.scienceEarned = JSON.parse(localStorage.getItem('space_explorer_science') || '{}');
        } catch {
            this.scienceEarned = {};
        }
    }

    _loadProgress() {
        try {
            const data = JSON.parse(localStorage.getItem('space_explorer_progress') || '{}');
            this.gems = data.gems || 0;                       // vault / spending pool
            this.cargoGems = data.cargoGems || 0;            // on-hand, undeposited
            this.gemVault = data.gemVault || data.gems || 0; // alias kept in sync with gems
            this.totalGemsCollected = data.totalGemsCollected || 0;
            this.sciencePoints = data.sciencePoints || 0;
            this.shipIndex = data.shipIndex || 0;
            this.lastStationX = data.lastStationX !== undefined ? data.lastStationX : null;
            this.lastStationY = data.lastStationY !== undefined ? data.lastStationY : null;
            if (data.stats) {
                this.stats = { ...this.stats, ...data.stats };
            }
            if (data.tech) {
                this.tech = { ...this.tech, ...data.tech };
            }
            this.dashCharges = data.dashCharges !== undefined ? data.dashCharges : 3;
            this.dashRechargeTimer = data.dashRechargeTimer || 0;
        } catch (e) {
            console.error("Failed to load player progress", e);
            this.gems = 0;
            this.cargoGems = 0;
            this.gemVault = 0;
            this.cargoCapacity = 50;
            this.totalGemsCollected = 0;
            this.sciencePoints = 0;
            this.shipIndex = 0;
            this.lastStationX = null;
            this.lastStationY = null;
        }
    }

    save() {
        try {
            const data = {
                gems: this.gems,
                cargoGems: this.cargoGems,
                gemVault: this.gemVault,
                totalGemsCollected: this.totalGemsCollected,
                sciencePoints: this.sciencePoints,
                stats: this.stats,
                tech: this.tech,
                dashCharges: this.dashCharges,
                dashRechargeTimer: this.dashRechargeTimer,
                shipIndex: this.shipIndex,
                lastStationX: this.lastStationX,
                lastStationY: this.lastStationY
            };
            localStorage.setItem('space_explorer_progress', JSON.stringify(data));
        } catch (e) {
            console.error("Failed to save player progress", e);
        }
    }

    /** Sync player radius (and magnet scale) to the current ship config. Call after ship purchase. */
    updateShipRadius() {
        const ship = SHIPS[this.shipIndex];
        if (ship?.shipRadius) {
            this.radius = ship.shipRadius;
        }
    }

    /** True when cargo hold is at or above capacity. */
    get cargoFull() {
        return this.cargoGems >= this.cargoCapacity;
    }

    /** Maximum gems the current ship can hold. */
    get cargoCapacity() {
        const baseCapacity = SHIPS[this.shipIndex]?.shipCargo || 50;
        const upgradeBonus = (this.stats.cargo || 0) * 50;
        return baseCapacity + upgradeBonus;
    }

    /** 0–1 fraction of cargo used. */
    get cargoFraction() {
        return Math.min(this.cargoGems / this.cargoCapacity, 1);
    }

    /** Current science level. Formula: level N needs N²×10 cumulative SP. */
    get scienceLevel() {
        return Math.floor(Math.sqrt(this.sciencePoints / 10));
    }

    /** Progress within the current level: { current, needed, fraction }. */
    get scienceProgress() {
        const lvl = this.scienceLevel;
        const currentBase = lvl * lvl * 10;
        const nextBase = (lvl + 1) * (lvl + 1) * 10;
        const needed = nextBase - currentBase;
        const current = this.sciencePoints - currentBase;
        return { current, needed, fraction: current / needed };
    }

    /**
     * Award science points.
     * @param {number} amount  - SP to add
     * @param {string|null} objectId  - if set, SP are capped by objectData.maxScience
     * @param {number} maxForObject   - cap for this object (0 = uncapped/no science)
     */
    addScience(amount, objectId = null, maxForObject = 0) {
        if (objectId) {
            if (maxForObject <= 0) return;                   // object gives no science
            const alreadyEarned = this.scienceEarned[objectId] || 0;
            if (alreadyEarned >= maxForObject) return;       // fully exhausted
            const canEarn = Math.min(amount, maxForObject - alreadyEarned);
            this.scienceEarned[objectId] = alreadyEarned + canEarn;
            this.sciencePoints += canEarn;
            localStorage.setItem('space_explorer_science', JSON.stringify(this.scienceEarned));
            this.save();
        } else {
            // Region discoveries etc. — no per-object cap
            this.sciencePoints += amount;
            this.save();
        }
    }

    /** Set the player's respawn point to the given coordinates. */
    setSpawnPoint(x, y) {
        this.lastStationX = x;
        this.lastStationY = y;
        this.save();
    }


    get shipBaseStats() {
        return SHIPS[this.shipIndex].stats;
    }

    get healingRate() {
        return this.stats.healing === 0 ? 1 : this.stats.healing * 2;
    }

    get maxHealth() {
        return this._baseHealth + ((this.stats.hull + this.shipBaseStats.hull) * 30);
    }

    // Thruster: instant, lower top speed
    get thrusterMaxSpeed() { return 2 + ((this.stats.engine + this.shipBaseStats.engine) * 0.5); }
    get thrusterAccel() { return 0.15 + ((this.stats.engine + this.shipBaseStats.engine) * 0.04); }

    // Boost: charge-up ~60 frames, higher top speed
    get boostMaxSpeed() { return 9 + ((this.stats.booster + this.shipBaseStats.booster) * 1.5); }
    get boostAccel() { return 0.22 + ((this.stats.booster + this.shipBaseStats.booster) * 0.04); }

    // Active speed: crawl during charge-up, then "punch it" surge in the last 15%
    get maxSpeed() {
        if (this.engineMode === 'boost') {
            const THRESHOLD = 0.85;   // charge level where the surge begins
            const CRAWL = 0.08;    // fraction of max speed during the crawl phase
            let effectiveness;
            if (this.boostCharge < THRESHOLD) {
                // Barely moving — linear from 0 to CRAWL across the long charge phase
                effectiveness = (this.boostCharge / THRESHOLD) * CRAWL;
            } else {
                // "Punch it!" — surge from CRAWL to 1.0 in the final 15% of charge
                const t = (this.boostCharge - THRESHOLD) / (1 - THRESHOLD);
                effectiveness = CRAWL + (1 - CRAWL) * t;
            }
            return this.boostMaxSpeed * Math.max(0.01, effectiveness);
        }
        return this.thrusterMaxSpeed;
    }

    get accel() {
        return this.engineMode === 'boost' ? this.boostAccel : this.thrusterAccel;
    }

    get friction() { return 0.96; }
    get fireRate() { return Math.max(80, 250 - ((this.stats.weapons + this.shipBaseStats.weapons) * 30)); }
    get damage() { return 10 + ((this.stats.weapons + this.shipBaseStats.weapons) * 5); }
    get shotsPerSecond() { return (60 / this.fireRate).toFixed(1); }
    get magnetRadius() { return 80 + ((this.stats.magnet + this.shipBaseStats.magnet) * 45); }

    toggleEngine() {
        if (this.engineMode === 'thruster') {
            this.engineMode = 'boost';
        } else {
            this.engineMode = 'thruster';
            this.boostCharge = 0; // reset charge when leaving boost
        }
    }

    update(game) {
        if (this.health <= 0) return;

        // Boost: slower turning — you commit to a direction before the surge
        const turnRate = this.engineMode === 'boost' ? 0.03 : 0.08;
        if (Input.keys['a']) this.angle -= turnRate;
        if (Input.keys['d']) this.angle += turnRate;

        const thrusting = !!Input.keys['w'];

        if (thrusting) {
            this.vx += Math.cos(this.angle) * this.accel;
            this.vy += Math.sin(this.angle) * this.accel;

            // Boost charge builds while thrusting in boost mode
            if (this.engineMode === 'boost') {
                const wasBelow = this.boostCharge < 1;
                this.boostCharge = Math.min(1, this.boostCharge + 0.008); // ~125 frames to full
                if (this.boostCharge >= 1) {
                    this.boostTime++;
                } else {
                    this.boostTime = 0;
                }
                // Spawn a burst of white particles the moment we hit full charge
                if (wasBelow && this.boostCharge >= 1) {
                    for (let i = 0; i < 12; i++) {
                        const ba = Utils.rand(0, Math.PI * 2);
                        game.particles.push(Particle.get(
                            this.x, this.y,
                            Math.cos(ba) * Utils.rand(3, 7), Math.sin(ba) * Utils.rand(3, 7),
                            '#ffffff', Utils.randInt(12, 22)
                        ));
                    }
                }
            }

            // Engine exhaust particles
            if (Math.random() < 0.6) {
                const a = this.angle + Math.PI + Utils.rand(-0.3, 0.3);
                const color = this.engineMode === 'boost'
                    ? (this.boostCharge > 0.8 ? '#ffffff' : `hsl(${200 + this.boostCharge * 40}, 100%, ${60 + this.boostCharge * 30}%)`)
                    : '#00f0ff';
                game.particles.push(Particle.get(
                    this.x - Math.cos(this.angle) * this.radius,
                    this.y - Math.sin(this.angle) * this.radius,
                    Math.cos(a) * Utils.rand(2, 5), Math.sin(a) * Utils.rand(2, 5),
                    color, Utils.randInt(10, 20)
                ));
            }
        } else {
            // Boost charge decays when not thrusting
            if (this.engineMode === 'boost') {
                this.boostCharge = Math.max(0, this.boostCharge - 0.03);
                this.boostTime = 0;
            }
        }

        if (Input.keys['s']) {
            this.vx *= 0.9;
            this.vy *= 0.9;
        }

        this.vx *= this.friction;
        this.vy *= this.friction;

        let speed = Math.hypot(this.vx, this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }

        this.x += this.vx; this.y += this.vy;

        // Auto-Heal Tech
        if (this.tech.auto_heal && this.health < this.maxHealth) {
            this._autoHealTimer++;
            if (this._autoHealTimer >= 120) { // ~2 seconds at 60fps
                this.health = Math.min(this.maxHealth, this.health + 1);
                this._autoHealTimer = 0;
                if (game.hud) {
                    game.hud.showFloatingReward('+1 ❤️', '#50dc78');
                }
            }
        } else {
            this._autoHealTimer = 0;
        }

        if (Input.mouse.left && performance.now() - this.lastFireTime > this.fireRate) {
            this.lastFireTime = performance.now();
            const aimAngle = Utils.ang(this.x, this.y, Input.mouse.worldX, Input.mouse.worldY);
            game.projectiles.push(new Projectile(
                this.x + Math.cos(aimAngle) * this.radius,
                this.y + Math.sin(aimAngle) * this.radius,
                aimAngle, 12, this.damage
            ));
            this.vx -= Math.cos(aimAngle) * 0.5;
            this.vy -= Math.sin(aimAngle) * 0.5;
        }

        // Proton Torpedo Fire (Right-Click)
        if (Input.mouse.right && this.tech.proton_torpedo && performance.now() - this.lastTorpedoTime > this.torpedoCooldown) {
            this.lastTorpedoTime = performance.now();
            const torpAngle = Utils.ang(this.x, this.y, Input.mouse.worldX, Input.mouse.worldY);
            // Torpedo fires towards the mouse click
            game.projectiles.push(new Projectile(
                this.x + Math.cos(torpAngle) * (this.radius + 10),
                this.y + Math.sin(torpAngle) * (this.radius + 10),
                torpAngle, 10, 600, undefined, true
            ));
            // Visual kickback effect (opposite to shot direction)
            this.vx -= Math.cos(torpAngle) * 4;
            this.vy -= Math.sin(torpAngle) * 4;
        }

        // Dash logic (Arrow Keys) - Trigger an impulse
        if (this.tech.evasive_maneuvers) {
            const dashKeys = [
                { key: 'arrowup', dx: 0, dy: -1 },
                { key: 'arrowdown', dx: 0, dy: 1 },
                { key: 'arrowleft', dx: -1, dy: 0 },
                { key: 'arrowright', dx: 1, dy: 0 }
            ];

            let triggered = false;
            for (const dk of dashKeys) {
                if (Input.keys[dk.key]) {
                    if (!this._dashKeysPressed[dk.key] && this.dashCharges >= 1) {
                        this.performDash(dk.dx, dk.dy, game);
                        this.dashCharges--;
                        this.save();
                        triggered = true;
                    }
                    this._dashKeysPressed[dk.key] = true;
                } else {
                    this._dashKeysPressed[dk.key] = false;
                }
                if (triggered) break;
            }

            // Dash Recharge logic (3x faster: 0.004 -> 0.012)
            if (this.dashCharges < this.maxDashCharges) {
                this.dashRechargeTimer = Math.min(1, this.dashRechargeTimer + 0.012); 
                if (this.dashRechargeTimer >= 1) {
                    this.dashCharges++;
                    this.dashRechargeTimer = (this.dashCharges < this.maxDashCharges) ? 0 : 0;
                    this.save();
                }
            } else {
                this.dashRechargeTimer = 0;
            }
        }

        // Gravity Beam (Hold Space)
        this.isFiringGravityLaser = (Input.keys[' '] && this.tech.gravity_laser);
    }

    performDash(dx, dy, game) {
        const dashStrength = 42; // Increased again from 28 to 42
        this.vx += dx * dashStrength;
        this.vy += dy * dashStrength;

        // Visual feedback
        if (game.hud) {
            game.hud.showFloatingReward('EVASIVE!', '#ffffff');
        }

        // Particles
        for (let i = 0; i < 15; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = Math.random() * 5 + 2;
            game.particles.push(Particle.get(
                this.x, this.y,
                Math.cos(a) * s, Math.sin(a) * s,
                '#ffffff', 10 + Math.random() * 10
            ));
        }
    }

    draw(ctx) {
        if (this.health <= 0) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        const aimAngle = Utils.ang(this.x, this.y, Input.mouse.worldX, Input.mouse.worldY);
        ctx.save();
        ctx.rotate(aimAngle);
        ctx.setLineDash([5, 15]);
        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(800, 0);
        ctx.strokeStyle = 'rgba(255, 60, 60, 0.2)';
        ctx.stroke();
        ctx.restore();

        // Boost charge glow ring
        if (this.engineMode === 'boost' && this.boostCharge > 0) {
            const glowAlpha = this.boostCharge * 0.7;
            const glowRadius = this.radius + 6 + this.boostCharge * 8;
            const hue = 200 + this.boostCharge * 40; // cyan → white-blue
            ctx.beginPath();
            ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${glowAlpha})`;
            ctx.lineWidth = 2 + this.boostCharge * 2;
            ctx.setLineDash([]);
            ctx.stroke();
        }

        ctx.rotate(this.angle);

        // Heat Shield Forcefield (Forward arc)
        if (this.tech.heat_shield && this.engineMode === 'boost' && this.boostCharge > 0.1) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.radius * 0.4, 0, this.radius * 1.3, -Math.PI / 2.5, Math.PI / 2.5);
            const shieldAlpha = this.boostCharge * 0.6;
            ctx.strokeStyle = `rgba(255, 180, 0, ${shieldAlpha})`;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur = 10;
            ctx.stroke();

            // Inner thinner arc
            ctx.beginPath();
            ctx.arc(this.radius * 0.6, 0, this.radius * 1.4, -Math.PI / 3.5, Math.PI / 3.5);
            ctx.strokeStyle = `rgba(255, 255, 200, ${shieldAlpha * 0.5})`;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        }

        ctx.fillStyle = '#0a0f1e';
        ctx.strokeStyle = this.engineMode === 'boost' ? `hsl(${200 + this.boostCharge * 40}, 100%, 65%)` : '#00f0ff';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);

        SHIPS[this.shipIndex].drawShape(ctx, this.radius);

        ctx.restore();
    }
}
