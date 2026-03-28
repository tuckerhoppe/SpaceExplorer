import { Utils } from '../utils.js';
import { Camera } from './Camera.js';
import { Input } from './Input.js';
import { Player } from '../entities/Player.js';
import { Asteroid } from '../entities/Asteroid.js';
import { Enemy } from '../entities/Enemy.js';
import { Battleship } from '../entities/Battleship.js';
import { NeutralShip } from '../entities/NeutralShip.js';
import { Gem } from '../entities/Gem.js';
import { Particle } from '../entities/Particle.js';
import { HUD } from '../ui/HUD.js';
import { SectorManager } from './SectorManager.js';
import { RegionManager } from './RegionManager.js';
import { QuestManager } from './QuestManager.js';
import { REGIONS, DEFAULT_REGION } from '../data/regions.js';
import { AmbientParticle } from '../entities/AmbientParticle.js';
import { HAIL_MESSAGES, SPECIFIC_HAILS } from '../data/messages.js';
import { NPC_ROSTER, getGenericShipContact } from '../data/npcs.js';
import { GhostCompanion } from '../entities/GhostCompanion.js';
import { Dreadnought } from '../entities/Dreadnought.js';
import { TutorialShip } from '../entities/TutorialShip.js';
import { MegaLandmark } from '../entities/MegaLandmark.js';
import { MEGA_LANDMARKS } from '../data/landmarks.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.camera = new Camera(this.canvas);

        this.player = new Player();
        this.ghost = new GhostCompanion(this.player);
        this.tutorialShip = null;
        this.projectiles = [];
        this.asteroids = [];
        this.enemies = [];
        this.tutorialEnemySpawned = false;
        this.battleships = [];
        this.neutralShips = [];
        this.enemyProjectiles = [];
        this.gems = [];
        this.particles = [];
        this.stars = [];
        this.ambientParticles = [];
        this.dreadnoughts = [];
        this.megaLandmarks = MEGA_LANDMARKS.map(lm => new MegaLandmark(lm));
        this._ambushSpawned = false;

        this.isPaused = false;
        this.gameOver = false;

        this.hud = new HUD(this);
        this.questManager = new QuestManager(this);
        this.sectorManager = new SectorManager();
        this.regionManager = new RegionManager();

        this.init();
    }

    init() {
        this.resize();
        Input.init(this.canvas, this.camera);

        // Settings
        this.settings = {
            dynamicZoom: localStorage.getItem('setting_dynamic_zoom') !== 'false',
            ghostDialogue: localStorage.getItem('setting_ghost_dialogue') === 'true', // Default to OFF
            navHints: localStorage.getItem('setting_nav_hints') !== 'false',
            showStats: localStorage.getItem('setting_show_stats') === 'true',         // Default to OFF
            showNavLog: localStorage.getItem('setting_show_nav_log') === 'true',      // Default to OFF
            devMode: localStorage.getItem('setting_dev_mode') === 'true',
            discoverAll: localStorage.getItem('setting_discover_all') === 'true'     // Default to OFF
        };
        for (let i = 0; i < 300; i++) {
            this.stars.push({
                x: Utils.rand(0, 2000),
                y: Utils.rand(0, 2000),
                s: Utils.rand(0.5, 2),
                parallax: Utils.rand(0.1, 0.6)
            });
        }

        for (let i = 0; i < 40; i++) {
            this.spawnAsteroid(0, 0, 2500);
        }

        // Spawn initial ships
        // Guard: Don't spawn hostiles if tutorial is active or starting
        const isTutorial = this.questManager.activeQuests.some(q => q.id.startsWith('tut_')) ||
            (this.questManager.activeQuests.length === 0 && this.questManager.completedQuestIds.size === 0);

        if (!isTutorial) {
            for (let i = 0; i < 3; i++) this.spawnEnemy(0, 0);
            for (let i = 0; i < 1; i++) this.spawnBattleship(0, 0);
        }
        for (let i = 0; i < 3; i++) this.spawnNeutralShip(0, 0);

        if (this.settings.devMode) {
            this.applyDevMode();
        }

        // --- TUTORIAL SPANW POSITION ---
        // Spawn at grid (0, -3) until Frontier Station is discovered
        if (!this.sectorManager.discoveredIds.has('station_frontier')) {
            this.player.x = 0;
            this.player.y = 3000;
        } else {
            this.player.x = 0;
            this.player.y = 0;
        }

        this.hud.update(this.player);
        this.hud.setupUpgrades();
        this.hud.setupShips();
        this.hud.refreshNavLog(); // Restore nav log from localStorage on startup/respawn

        // Cache background color once — getComputedStyle every frame is expensive
        this._bgColor = getComputedStyle(document.body).getPropertyValue('--bg-color').trim() || '#03040b';
        if (!this._bgColor) this._bgColor = '#03040b'; // Extra safety fallback
        this._targetBgColor = this._bgColor;
        this._hudFrame = 0;
        this._dockFrame = 0;

        // Remove old resize listener to avoid HMR duplicates
        if (window.__resizeHandler) {
            window.removeEventListener('resize', window.__resizeHandler);
        }
        window.__resizeHandler = () => this.resize();
        // Window resize
        window.addEventListener('resize', window.__resizeHandler);

        // Guard: cancel any stale loop from a previous page load / HMR reload
        if (window.__activeRafId) {
            cancelAnimationFrame(window.__activeRafId);
            console.warn('[Game] Stale loop cancelled before starting new one.');
        }
        this._loopActive = false; // tracks whether a rAF is currently queued

        this._queueLoop();

        // Auto-start Tutorial if no quests ever done
        if (this.questManager.activeQuests.length === 0 && this.questManager.completedQuestIds.size === 0) {
            this.questManager.acceptQuest('tut_flight');
        }

        // Post-tutorial Respawn Logic
        if (this.questManager.completedQuestIds.has('tut_final') &&
            !this.questManager.completedQuestIds.has('story_find_station') &&
            !this.questManager.activeQuests.some(q => q.id === 'story_find_station')) {
            // First spawn after tutorial death!
            this.player.health = this.player.maxHealth / 2;
            this.questManager.acceptQuest('story_find_station');
        }
    }

    discoverAll() {
        if (this.sectorManager) this.sectorManager.discoverAll();
        if (this.regionManager) this.regionManager.discoverAll();
        if (this.hud) this.hud.refreshNavLog();
    }

    _queueLoop() {
        if (!this._loopActive) {
            this._loopActive = true;
            window.__activeRafId = requestAnimationFrame((t) => this.loop(t));
        }
    }

    applyDevMode() {
        if (!this.player) return;

        const MIN_GEMS = 5000;
        const MIN_SCI = 1000;

        let changed = false;
        if (this.player.gems < MIN_GEMS) {
            this.player.gems = MIN_GEMS;
            if (this.player.totalGemsCollected < MIN_GEMS) {
                this.player.totalGemsCollected = MIN_GEMS;
            }
            changed = true;
        }
        if (this.player.sciencePoints < MIN_SCI) {
            this.player.sciencePoints = MIN_SCI;
            changed = true;
        }

        if (changed) {
            this.player.save();
            this.hud.update(this.player);
        }
    }

    toggleUpgrades() {
        this.isPaused = !this.isPaused;
        this.hud.toggleUpgradeMenu(this.isPaused);
        // When unpausing, restart the loop (safely guarded against duplicates)
        if (!this.isPaused) this._queueLoop();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.camera.w = this.canvas.width;
        this.camera.h = this.canvas.height;
    }

    spawnAsteroid(cx, cy, range) {
        const angle = Utils.rand(0, Math.PI * 2);
        const dist = Utils.rand(1000, range);
        const size = Utils.randInt(1, 3);
        this.asteroids.push(new Asteroid(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, size));
    }

    spawnEnemy(cx, cy, minDist = 1200, maxDist = 3000, color = undefined) {
        const angle = Utils.rand(0, Math.PI * 2);
        const dist = Utils.rand(minDist, maxDist);
        const diff = this.regionManager ? this.regionManager.currentRegion.difficulty : 1.0;
        this.enemies.push(new Enemy(
            cx + Math.cos(angle) * dist,
            cy + Math.sin(angle) * dist,
            diff,
            null,
            color
        ));
    }

    spawnBattleship(cx, cy, minDist = 2000, maxDist = 4000, color = undefined) {
        const angle = Utils.rand(0, Math.PI * 2);
        const dist = Utils.rand(minDist, maxDist); // spawn farther away
        const diff = this.regionManager ? this.regionManager.currentRegion.difficulty : 1.0;
        this.battleships.push(new Battleship(
            cx + Math.cos(angle) * dist,
            cy + Math.sin(angle) * dist,
            diff,
            color
        ));
    }

    spawnNeutralShip(cx, cy) {
        const angle = Utils.rand(0, Math.PI * 2);
        const dist = Utils.rand(1000, 3000);
        this.neutralShips.push(new NeutralShip(
            cx + Math.cos(angle) * dist,
            cy + Math.sin(angle) * dist
        ));
    }

    spawnDreadnought(cx, cy, color = undefined) {
        const angle = Utils.rand(0, Math.PI * 2);
        const dist = Utils.rand(3000, 5000); // spawn very far away
        const diff = this.regionManager ? this.regionManager.currentRegion.difficulty : 1.0;
        this.dreadnoughts.push(new Dreadnought(
            cx + Math.cos(angle) * dist,
            cy + Math.sin(angle) * dist,
            diff,
            color
        ));
    }

    spawnExplosion(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            const angle = Utils.rand(0, Math.PI * 2);
            const speed = Utils.rand(1, 6);
            this.particles.push(Particle.get(
                x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
                color, Utils.randInt(20, 50)
            ));
        }
    }

    update() {
        Input.update(this.camera);
        if (this.isPaused) return;

        this.player.update(this);
        this.ghost.update(this);

        // Tutorial Ship Lifecycle
        const isTutorialActive = this.questManager.activeQuests.some(q => q.id.startsWith('tut_'));
        const currentRegion = this.regionManager ? this.regionManager.currentRegion : DEFAULT_REGION;

        // Special spawn for tutorial enemy
        if (this.questManager.activeQuests.some(q => q.id === 'tut_hostile') && !this.tutorialEnemySpawned) {
            this.spawnEnemy(this.player.x, this.player.y, 400, 600);
            this.tutorialEnemySpawned = true;
        }

        if (isTutorialActive && !this.tutorialShip) {
            this.tutorialShip = new TutorialShip(this.player.x + 300, this.player.y);
        } else if (!isTutorialActive && this.tutorialShip) {
            this.tutorialShip = null;
        }

        if (this.tutorialShip) {
            this.tutorialShip.update(this);
        }

        // Notify QuestManager of inputs for tutorial tracking
        if (Input.keys['w']) this.questManager.notify('input', { key: 'w' });
        if (Input.keys['a']) this.questManager.notify('input', { key: 'a' });
        if (Input.keys['s']) this.questManager.notify('input', { key: 's' });
        if (Input.keys['d']) this.questManager.notify('input', { key: 'd' });

        // Notify of boost state
        if (this.player.engineMode === 'boost' && Input.keys['w']) {
            this.questManager.notify('boost', { active: true });
        }

        let targetZoom = 1.0;
        const ENABLE_DYNAMIC_ZOOM = this.settings.dynamicZoom; // Respect toggle

        if (ENABLE_DYNAMIC_ZOOM && this.player.engineMode === 'boost') {
            // 60 frames = 1 second. Zoom out starts after 3 seconds (180 frames) at full boost
            if (this.player.boostTime > 180) {
                // Ramp up the zoom out gradually over the next 120 frames (2 seconds)
                const extraTime = Math.min(1.0, (this.player.boostTime - 180) / 120);
                targetZoom = 1.0 - (extraTime * 0.35);
            }
        }
        this.camera.zoom += (targetZoom - this.camera.zoom) * 0.015;

        this.camera.follow(this.player);

        this.regionManager.update(this.player, this);

        // Notify QuestManager of current region
        this.questManager.notify('region', { region: this.regionManager.currentRegion.name });

        const caps = currentRegion.caps || { asteroids: 10, fighters: 3, battleships: 0 };

        // Background color transition
        if (currentRegion.bgColor) {
            this._targetBgColor = currentRegion.bgColor;
        }
        if (this._bgColor !== this._targetBgColor) {
            this._bgColor = Utils.lerpColor(this._bgColor, this._targetBgColor, 0.001);
            // Snap if close enough
            if (this._bgColor === Utils.lerpColor(this._bgColor, this._targetBgColor, 0.0001)) {
                this._bgColor = this._targetBgColor;
            }
        }

        // Ambient Particles management
        const targetType = currentRegion.particleType || 'none';

        // Remove particles that don't match the current region
        for (let i = this.ambientParticles.length - 1; i >= 0; i--) {
            const p = this.ambientParticles[i];
            p.update();
            // Fast fade out if the region changed
            if (p.type !== targetType) p.life -= 5;

            if (p.life <= 0) {
                this.ambientParticles.splice(i, 1);
            }
        }

        // Spawn new particles if beneath cap for the region
        if (targetType !== 'none' && this.ambientParticles.length < 40) {
            if (Math.random() < 0.1) { // trickle spawn
                this.ambientParticles.push(new AmbientParticle(this.camera, targetType));
            }
        }

        if (this.asteroids.length < caps.asteroids) {
            this.spawnAsteroid(this.player.x, this.player.y, 3000);
        }

        // Enemy spawning — cap driven by region
        // Guard: No hostile enemies in Neutral Space during the tutorial
        if (this.enemies.length < caps.fighters && !(isTutorialActive && currentRegion.name === DEFAULT_REGION.name)) {
            // Faster spawning in Home Region
            const spawnCount = currentRegion.name === 'Home Region' ? 3 : 1;
            const enemyColor = currentRegion.name === 'Blob Space' ? currentRegion.color : undefined;
            for (let i = 0; i < spawnCount && this.enemies.length < caps.fighters; i++) {
                const minDist = currentRegion.name === 'Home Region' ? 800 : 1200;
                const maxDist = currentRegion.name === 'Home Region' ? 2000 : 3000;
                this.spawnEnemy(this.player.x, this.player.y, minDist, maxDist, enemyColor);
            }
        }

        // Battleship spawning
        if (this.battleships.length < caps.battleships && !(isTutorialActive && currentRegion.name === DEFAULT_REGION.name)) {
            const minDist = currentRegion.name === 'Home Region' ? 1200 : 2000;
            const maxDist = currentRegion.name === 'Home Region' ? 2500 : 4000;
            const enemyColor = currentRegion.name === 'Blob Space' ? currentRegion.color : undefined;
            this.spawnBattleship(this.player.x, this.player.y, minDist, maxDist, enemyColor);
        }

        // --- AMBUSH LOGIC ---
        // If the final tutorial quest just started, spawn a bunch of hostile enemies nearby
        if (this.questManager.activeQuests.some(q => q.id === 'tut_final') && !this._ambushSpawned) {
            this._ambushSpawned = true;
            for (let i = 0; i < 15; i++) {
                this.spawnEnemy(this.player.x, this.player.y);
            }
            for (let i = 0; i < 3; i++) {
                this.spawnBattleship(this.player.x, this.player.y);
            }
        }
        // Reset ambush flag if tut_final is completed or not active
        if (!this.questManager.activeQuests.some(q => q.id === 'tut_final') && this._ambushSpawned) {
            // we keep it true for the duration of the tutorial state, 
            // but if the quest is gone (completed or reset), we could reset it.
            // Actually, once it's done, it's done. 
        }

        // Neutral ship spawning — capped by region
        if (this.neutralShips.length < caps.neutrals) {
            this.spawnNeutralShip(this.player.x, this.player.y);
        }

        // Dreadnought spawning — rare cap
        if (caps.dreadnoughts && this.dreadnoughts.length < caps.dreadnoughts) {
            const enemyColor = currentRegion.name === 'Blob Space' ? currentRegion.color : undefined;
            this.spawnDreadnought(this.player.x, this.player.y, enemyColor);
        }

        // Handle _neutralGemDrop signal from NeutralShip
        if (this._neutralGemDrop) {
            this.gems.push(new Gem(this._neutralGemDrop.x, this._neutralGemDrop.y, 1));
            this._neutralGemDrop = null;
        }

        this.projectiles.forEach((p, i) => {
            p.update();
            if (p.life <= 0) this.projectiles.splice(i, 1);
        });

        // Enemy projectiles
        this.enemyProjectiles.forEach((p, i) => {
            p.update();
            if (p.life <= 0) this.enemyProjectiles.splice(i, 1);
        });

        this.particles.forEach((p, i) => {
            p.update();
            if (p.life <= 0) {
                p.release();
                this.particles.splice(i, 1);
            }
        });

        for (let a = this.asteroids.length - 1; a >= 0; a--) {
            let ast = this.asteroids[a];
            ast.update();

            if (Utils.dist(this.player.x, this.player.y, ast.x, ast.y) > 4000) {
                this.asteroids.splice(a, 1);
                continue;
            }

            if (Utils.dist(this.player.x, this.player.y, ast.x, ast.y) < this.player.radius + ast.radius) {
                const isBoosting = this.player.engineMode === 'boost';
                const hasHeatShield = this.player.tech.heat_shield;

                if (!(isBoosting && hasHeatShield)) {
                    this.player.health -= ast.size * 10;
                }

                this.spawnExplosion(ast.x, ast.y, 10, '#aaa');
                this.asteroids.splice(a, 1);
                this.hud.update(this.player);

                if (this.player.health <= 0 && !this.gameOver) {
                    this.triggerGameOver();
                }
                continue;
            }

            for (let p = this.projectiles.length - 1; p >= 0; p--) {
                let proj = this.projectiles[p];
                if (Utils.dist(proj.x, proj.y, ast.x, ast.y) < ast.radius + 4) {
                    ast.health -= proj.damage;
                    this.projectiles.splice(p, 1);
                    this.spawnExplosion(proj.x, proj.y, 3, '#ff3c3c');

                    if (ast.health <= 0 && !ast.destroyed) {
                        ast.destroyed = true;
                        this.spawnExplosion(ast.x, ast.y, ast.size * 8, '#aaa');
                        if (ast.size > 1) {
                            for (let i = 0; i < ast.size; i++) {
                                this.asteroids.push(new Asteroid(ast.x, ast.y, ast.size - 1));
                            }
                        }

                        const gemDrops = ast.size * Utils.randInt(1, 4);
                        for (let i = 0; i < gemDrops; i++) {
                            this.gems.push(new Gem(ast.x, ast.y, 1));
                        }

                        // Notify quest manager
                        this.questManager.notify('destroy', { type: 'asteroid' });

                        this.asteroids.splice(a, 1);
                    }
                    break;
                }
            }
        }

        for (let g = this.gems.length - 1; g >= 0; g--) {
            let gem = this.gems[g];
            gem.update();

            let d = Utils.dist(this.player.x, this.player.y, gem.x, gem.y);
            if (d < this.player.magnetRadius) {
                let a = Utils.ang(gem.x, gem.y, this.player.x, this.player.y);
                let speed = (this.player.magnetRadius - d) * 0.15;
                gem.vx += Math.cos(a) * speed;
                gem.vy += Math.sin(a) * speed;

                if (d < this.player.radius + 15) {
                    const collectedValue = gem.value * (gem.isInfected ? 2 : 1);
                    this.player.gems += collectedValue;
                    this.player.totalGemsCollected += collectedValue;
                    this.questManager.notify('collect', { target: 'gems', amount: collectedValue });
                    this.player.save();

                    if (gem.isInfected) {
                        if (this.player.tech.biometric_filtering) {
                            this.player.addScience(1);
                            if (this.hud) {
                                this.hud.showFloatingReward(`+1 🔬 (BIOMETRIC)`, '#00ffcc');
                            }
                        } else {
                            const damage = 1;
                            this.player.health -= damage;
                            if (this.hud) {
                                this.hud.showFloatingReward(`-${damage} ❤️ (INFECTED!)`, '#09ab29');
                            }
                            if (this.player.health <= 0 && !this.gameOver) {
                                this.triggerGameOver();
                            }
                        }
                    }

                    this.gems.splice(g, 1);
                }
            } else if (gem.life <= 0) {
                this.gems.splice(g, 1);
            }
        }

        // ── Parasite update & collision ───────────────────────────
        for (const obj of this.sectorManager.objects) {
            if (obj.parasite) {
                const parasite = obj.parasite;
                parasite.update(this);

                if (parasite.numGuards > 0 && !parasite.spawnedGuards) {
                    const diff = this.regionManager ? this.regionManager.currentRegion.difficulty : 1.0;
                    const enemyColor = currentRegion.name === 'Blob Space' ? currentRegion.color : undefined;
                    for (let i = 0; i < parasite.numGuards; i++) {
                        const angle = Utils.rand(0, Math.PI * 2);
                        const dist = Utils.rand(100, 300);
                        this.enemies.push(new Enemy(
                            parasite.x + Math.cos(angle) * dist,
                            parasite.y + Math.sin(angle) * dist,
                            diff,
                            parasite,
                            enemyColor
                        ));
                    }
                    parasite.spawnedGuards = true;
                }

                // Body collision with player
                if (Utils.dist(this.player.x, this.player.y, parasite.x, parasite.y) < this.player.radius + parasite.radius) {
                    this.player.health -= parasite.bodyDamage;
                    this.hud.update(this.player);
                    if (this.player.health <= 0 && !this.gameOver) {
                        this.triggerGameOver();
                    }
                }

                // Player projectile hits parasite
                for (let p = this.projectiles.length - 1; p >= 0; p--) {
                    const proj = this.projectiles[p];
                    if (Utils.dist(proj.x, proj.y, parasite.x, parasite.y) < parasite.radius + 4) {
                        parasite.health -= proj.damage;
                        this.projectiles.splice(p, 1);
                        this.spawnExplosion(proj.x, proj.y, 5, parasite.color);

                        if (parasite.health <= 0) {
                            this.spawnExplosion(parasite.x, parasite.y, 40, parasite.color);
                            const drops = Utils.randInt(20, 35);
                            const isInfected = currentRegion.name === 'Blob Space' || parasite.type === 'blob';
                            for (let i = 0; i < drops; i++) this.gems.push(new Gem(parasite.x, parasite.y, 1, isInfected));
                            obj.parasite = null;

                            // Trigger Liberation Hail! (Only for planets and stations)
                            if (obj.type === 'planet' || obj.type === 'station') {
                                setTimeout(() => {
                                    if (this.hud && typeof this.hud.triggerHail === 'function') {
                                        if (!this.sectorManager.hailedIds.has(obj.id)) {
                                            this.sectorManager.markHailed(obj.id);
                                            let msgData;
                                            if (SPECIFIC_HAILS[obj.id]) {
                                                msgData = SPECIFIC_HAILS[obj.id];
                                            } else {
                                                const msgs = HAIL_MESSAGES.liberation;
                                                msgData = msgs[Math.floor(Math.random() * msgs.length)];
                                            }
                                            this.hud.triggerHail(obj.name.toUpperCase(), msgData);
                                        }
                                    }
                                }, 1500); // 1.5s delay after explosion
                            }
                        }
                        break;
                    }
                }
            }
        }

        // ── Enemy update & collision ──────────────────────────────
        for (let e = this.enemies.length - 1; e >= 0; e--) {
            const enemy = this.enemies[e];
            enemy.update(this);

            // Despawn if too far from player
            if (Utils.dist(this.player.x, this.player.y, enemy.x, enemy.y) > 4500) {
                this.enemies.splice(e, 1);
                continue;
            }

            // Player projectile hits enemy
            for (let p = this.projectiles.length - 1; p >= 0; p--) {
                const proj = this.projectiles[p];
                if (Utils.dist(proj.x, proj.y, enemy.x, enemy.y) < enemy.radius + 4) {
                    enemy.health -= proj.damage;
                    this.projectiles.splice(p, 1);
                    this.spawnExplosion(proj.x, proj.y, 3, '#ff9500');

                    if (enemy.health <= 0) {
                        this.spawnExplosion(enemy.x, enemy.y, 20, '#ff6a00');
                        const isInfected = enemy.color === '#09ab29ff';
                        const drops = Utils.randInt(3, 8);
                        for (let i = 0; i < drops; i++) {
                            this.gems.push(new Gem(enemy.x, enemy.y, 1, isInfected));
                        }
                        this.enemies.splice(e, 1);
                        this.questManager.notify('destroy', { type: 'enemy' });
                    }
                    break;
                }
            }
        }

        // ── Enemy projectile hits player ──────────────────────────
        if (this.player.health > 0) {
            for (let p = this.enemyProjectiles.length - 1; p >= 0; p--) {
                const proj = this.enemyProjectiles[p];
                if (Utils.dist(proj.x, proj.y, this.player.x, this.player.y) < this.player.radius + 4) {
                    this.player.health -= proj.damage;
                    this.enemyProjectiles.splice(p, 1);
                    this.spawnExplosion(proj.x, proj.y, 5, '#ff9500');

                    if (this.player.health <= 0 && !this.gameOver) {
                        this.triggerGameOver();
                    }
                }
            }
        }

        // ── Battleship update & collision ───────────────────────
        for (let e = this.battleships.length - 1; e >= 0; e--) {
            const bs = this.battleships[e];
            bs.update(this);

            if (Utils.dist(this.player.x, this.player.y, bs.x, bs.y) > 5000) {
                this.battleships.splice(e, 1);
                continue;
            }

            for (let p = this.projectiles.length - 1; p >= 0; p--) {
                const proj = this.projectiles[p];
                if (Utils.dist(proj.x, proj.y, bs.x, bs.y) < bs.radius + 4) {
                    bs.health -= proj.damage;
                    this.projectiles.splice(p, 1);
                    this.spawnExplosion(proj.x, proj.y, 4, '#ff4400');

                    if (bs.health <= 0) {
                        const isInfected = bs.color === '#09ab29ff';
                        this.spawnExplosion(bs.x, bs.y, 35, '#ff4400');
                        const drops = Utils.randInt(15, 25);
                        for (let i = 0; i < drops; i++) this.gems.push(new Gem(bs.x, bs.y, 1, isInfected));
                        this.battleships.splice(e, 1);
                    }
                    break;
                }
            }
        }

        // ── Dreadnought update & collision ──────────────────────
        for (let e = this.dreadnoughts.length - 1; e >= 0; e--) {
            const dn = this.dreadnoughts[e];
            dn.update(this);

            if (Utils.dist(this.player.x, this.player.y, dn.x, dn.y) > 6000) {
                this.dreadnoughts.splice(e, 1);
                continue;
            }

            for (let p = this.projectiles.length - 1; p >= 0; p--) {
                const proj = this.projectiles[p];
                if (Utils.dist(proj.x, proj.y, dn.x, dn.y) < dn.radius + 4) {
                    dn.health -= proj.damage;
                    this.projectiles.splice(p, 1);
                    this.spawnExplosion(proj.x, proj.y, 6, '#ff00ff');

                    if (dn.health <= 0) {
                        const isInfected = dn.color === '#09ab29ff';
                        this.spawnExplosion(dn.x, dn.y, 60, '#ff00ff');
                        const drops = Utils.randInt(40, 70);
                        for (let i = 0; i < drops; i++) this.gems.push(new Gem(dn.x, dn.y, 1, isInfected));
                        this.dreadnoughts.splice(e, 1);
                        this.questManager.notify('destroy', { type: 'dreadnought' });
                    }
                    break;
                }
            }
        }

        // ── Neutral ship update & collision ─────────────────────
        for (let e = this.neutralShips.length - 1; e >= 0; e--) {
            const ns = this.neutralShips[e];
            ns.update(this);

            if (Utils.dist(this.player.x, this.player.y, ns.x, ns.y) > 4500) {
                this.neutralShips.splice(e, 1);
                continue;
            }

            for (let p = this.projectiles.length - 1; p >= 0; p--) {
                const proj = this.projectiles[p];
                if (Utils.dist(proj.x, proj.y, ns.x, ns.y) < ns.radius + 4) {
                    ns.health -= proj.damage;
                    ns.wasAttacked = true; // turns hostile!
                    this.projectiles.splice(p, 1);
                    this.spawnExplosion(proj.x, proj.y, 3, '#55ffcc');

                    if (ns.health <= 0) {
                        this.spawnExplosion(ns.x, ns.y, 15, '#55ffcc');
                        const drops = Utils.randInt(5, 12);
                        for (let i = 0; i < drops; i++) this.gems.push(new Gem(ns.x, ns.y, 1));
                        this.neutralShips.splice(e, 1);
                    }
                    break;
                }
            }
        }

        this._dockFrame++;

        // Check for stellar object discoveries
        this.sectorManager.checkDiscovery(this.player, this);

        // Check for docking effects (heal at station, gems at other objects)
        this.sectorManager.checkDocking(this.player, this);

        // Check for proximity communications from planets and stations
        if (this.sectorManager.checkComms) {
            this.sectorManager.checkComms(this.player, this);
        }

        // Update science mini-game
        if (this.hud.scienceMiniGame) {
            this.hud.scienceMiniGame.update();
        }

        // Throttle HUD DOM writes to every 6 frames (~10×/sec)
        if (++this._hudFrame % 6 === 0) {
            this.hud.update(this.player);
            this.checkContacts();
        }

        // Periodic save (approx every 5 seconds at 60fps)
        if (this._hudFrame % 300 === 0) {
            this.player.save();
        }
    }

    checkContacts() {
        if (!this.hud || typeof this.hud.updateContacts !== 'function') return;

        let currentContacts = [];

        // Check stellar objects for contacts
        for (const obj of this.sectorManager.objects) {
            if (obj.type === 'planet' || obj.type === 'station') {
                if (Utils.dist(this.player.x, this.player.y, obj.x, obj.y) < 1200) {
                    for (const key in NPC_ROSTER) {
                        if (NPC_ROSTER[key].locationId === obj.id) {
                            currentContacts.push(NPC_ROSTER[key]);
                        }
                    }
                }
            }
        }

        // Check generic ships
        for (const ns of this.neutralShips) {
            if (Utils.dist(this.player.x, this.player.y, ns.x, ns.y) < 350) {
                if (!ns.contact) ns.contact = getGenericShipContact();
                currentContacts.push(ns.contact);
            }
        }

        // See if contacts array changed to avoid resetting DOM every frame
        const currentContactNames = currentContacts.map(c => c.name).join(',');
        if (this._lastContactsStr !== currentContactNames) {
            this._lastContactsStr = currentContactNames;
            this.hud.updateContacts(currentContacts);
        }
    }

    draw() {
        this.ctx.fillStyle = this._bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.stars.forEach(s => {
            let px = ((s.x - this.camera.x * s.parallax) % this.canvas.width + this.canvas.width) % this.canvas.width;
            let py = ((s.y - this.camera.y * s.parallax) % this.canvas.height + this.canvas.height) % this.canvas.height;

            // Instead of alpha blending (which tints stars the background color),
            // calculate a solid greyscale color based on parallax depth
            const brightness = Math.floor(255 * s.parallax);
            this.ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;

            this.ctx.beginPath();
            this.ctx.arc(px, py, s.s, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw ambient background particles (behind entities)
        this.ambientParticles.forEach(p => p.draw(this.ctx));

        // Draw Mega Landmarks on lowest parallax layer
        this.megaLandmarks.forEach(m => m.draw(this.ctx, this.camera));

        this.ctx.save();
        this.ctx.scale(this.camera.zoom, this.camera.zoom);

        let cx = -this.camera.x;
        let cy = -this.camera.y;

        if (this.player.health > 0 && this.player.health < 30) {
            cx += Utils.rand(-3, 3) / this.camera.zoom;
            cy += Utils.rand(-3, 3) / this.camera.zoom;
        }

        this.ctx.translate(cx, cy);

        this.sectorManager.draw(this.ctx, this.camera, this.player);
        this.gems.forEach(g => g.draw(this.ctx, this.camera));
        this.asteroids.forEach(a => a.draw(this.ctx, this.camera));
        this.enemies.forEach(e => e.draw(this.ctx, this.camera));
        this.battleships.forEach(b => b.draw(this.ctx, this.camera));
        this.dreadnoughts.forEach(d => d.draw(this.ctx, this.camera));
        this.neutralShips.forEach(n => n.draw(this.ctx, this.camera));
        this.projectiles.forEach(p => p.draw(this.ctx, this.camera));
        this.enemyProjectiles.forEach(p => p.draw(this.ctx, this.camera));
        this.player.draw(this.ctx);
        if (this.tutorialShip) this.tutorialShip.draw(this.ctx);
        this.ghost.draw(this.ctx, this);
        this.particles.forEach(p => p.draw(this.ctx, this.camera));

        this.ctx.restore();

        // Draw science mini-game in screen space
        if (this.hud.scienceMiniGame) {
            this.hud.scienceMiniGame.draw(this.ctx, this.canvas.width, this.canvas.height);
        }

        // Draw nav hints in screen space
        this.drawNavHints();

        // Draw mini-map in screen space
        if (this.hud && this.hud.miniMap) {
            this.hud.miniMap.draw();
        }
    }

    drawNavHints() {
        if (!this.player || this.player.health <= 0) return;
        if (!this.settings || !this.settings.navHints) return;

        const hw = this.canvas.width / 2;
        const hh = this.canvas.height / 2;
        const radius = Math.min(hw, hh) - 40; // inset slightly from edge

        const drawHint = (tx, ty, name, icon, color, isRegion = false) => {
            // Only draw if target is significantly off-screen
            if (tx >= this.camera.x && tx <= this.camera.x + this.canvas.width &&
                ty >= this.camera.y && ty <= this.camera.y + this.canvas.height) {
                return; // On screen, no hint needed
            }

            const angle = Utils.ang(this.player.x, this.player.y, tx, ty);
            const r = radius;

            const px = hw + Math.cos(angle) * r;
            const py = hh + Math.sin(angle) * r;

            this.ctx.save();
            this.ctx.translate(px, py);

            this.ctx.rotate(angle);
            this.ctx.fillStyle = color;

            if (isRegion) {
                // Draw a glowing diamond for regions
                this.ctx.shadowColor = color;
                this.ctx.shadowBlur = 10;
                this.ctx.beginPath();
                this.ctx.moveTo(14, 0);
                this.ctx.lineTo(0, -9);
                this.ctx.lineTo(-14, 0);
                this.ctx.lineTo(0, 9);
                this.ctx.fill();

                // Inner highlight
                this.ctx.fillStyle = '#fff';
                this.ctx.shadowBlur = 0;
                this.ctx.beginPath();
                this.ctx.moveTo(8, 0);
                this.ctx.lineTo(0, -5);
                this.ctx.lineTo(-8, 0);
                this.ctx.lineTo(0, 5);
                this.ctx.fill();
            } else {
                // Colored pointer triangle for objects
                this.ctx.beginPath();
                this.ctx.moveTo(10, 0);
                this.ctx.lineTo(-6, -6);
                this.ctx.lineTo(-6, 6);
                this.ctx.fill();
            }

            this.ctx.rotate(-angle);

            // Icon & Text
            if (icon) {
                this.ctx.font = isRegion ? '18px serif' : '16px serif'; // slightly larger icon
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(icon, 0, -22);
            }

            this.ctx.font = isRegion ? '11px Inter, sans-serif' : '10px Inter, sans-serif';
            // Emphasize the text slightly more
            this.ctx.fillStyle = isRegion ? color : 'rgba(255, 255, 255, 0.7)';
            if (isRegion) {
                this.ctx.shadowColor = color;
                this.ctx.shadowBlur = 5;
            }
            this.ctx.textAlign = 'center';
            this.ctx.fillText(name, 0, icon ? -38 : -22);

            this.ctx.restore();
        };

        // 1. Hints for discovered stellar objects in CURRENT region
        const currentRegion = this.regionManager.currentRegion;
        for (const obj of this.sectorManager.objects) {
            let isVisible = this.sectorManager.discoveredIds.has(obj.id);
            let forceShow = false;

            // Special Case: Show Home Planet if Return Home quest is active
            if (obj.id === 'planet_home' && this.questManager.activeQuests.some(q => q.id === 'tut_home')) {
                isVisible = true;
                forceShow = true;
            }
            // Special Case: Show Training Nebula if tut_science quest is active
            if (obj.id === 'nebula_tutorial' && this.questManager.activeQuests.some(q => q.id === 'tut_science')) {
                isVisible = true;
                forceShow = true;
            }

            if (isVisible) {
                const objGridX = obj.x / 1000;
                const objGridY = -obj.y / 1000;

                let objBelongsHere = false;

                if (currentRegion === DEFAULT_REGION) {
                    objBelongsHere = !REGIONS.some(reg => reg.test(objGridX, objGridY));
                } else {
                    objBelongsHere = currentRegion.test(objGridX, objGridY);
                }

                // Show hint if it belongs here OR if it's a forced tutorial objective
                if (objBelongsHere || forceShow) {
                    const TYPE_ICONS = { planet: '🪐', nebula: '🌌', star: '⭐', station: '🛸', artifact: '💠' };
                    drawHint(obj.x, obj.y, obj.name, TYPE_ICONS[obj.type], obj.color);
                }
            }
        }

        // 2. Hints for OTHER regions
        const allRegions = [...REGIONS, DEFAULT_REGION];
        for (const region of allRegions) {
            // Only draw hints for regions we are NOT currently in, and only if they have a center defined and are discovered
            if (region !== currentRegion && region.center && this.regionManager.discoveredRegions.has(region.name)) {
                drawHint(region.center.worldX, region.center.worldY, region.name, region.icon, region.color, true);
            }
        }
    }

    triggerGameOver() {
        this.gameOver = true;
        this.isPaused = true;

        if (this.questManager.activeQuests.some(q => q.id === 'tut_final')) {
            this.questManager.completeQuest('tut_final');
        }

        const lostGems = Math.floor(this.player.gems / 2);
        this.player.gems -= lostGems;

        this.spawnExplosion(this.player.x, this.player.y, 100, '#00f0ff');
        this.spawnExplosion(this.player.x, this.player.y, 100, '#ff3c3c');
        this.player.save();
        this.draw();

        setTimeout(() => {
            this.hud.showGameOver();
        }, 1000);
    }

    loop(timestamp = performance.now()) {
        // Rolling FPS average over last 60 frames
        if (!this._fpsTimestamps) this._fpsTimestamps = [];
        this._fpsTimestamps.push(timestamp);
        if (this._fpsTimestamps.length > 60) this._fpsTimestamps.shift();
        if (this._fpsTimestamps.length > 1) {
            const elapsed = this._fpsTimestamps[this._fpsTimestamps.length - 1] - this._fpsTimestamps[0];
            const fps = Math.round((this._fpsTimestamps.length - 1) / (elapsed / 1000));
            // Update DOM at most every 20 frames to avoid flicker
            if (!this._fpsFrame) this._fpsFrame = 0;
            if (++this._fpsFrame % 20 === 0) {
                const el = document.getElementById('fps-counter');
                if (el) el.textContent = `${fps} FPS`;
                const devEl = document.getElementById('dev-fps');
                if (devEl) devEl.textContent = fps;
            }
        }

        this.update();
        if (!this.gameOver || this.particles.length > 0) {
            this.draw();
        }
        // Re-queue — _loopActive is already true, so it stays true until we stop
        this._loopActive = false; // clear so _queueLoop can set it again
        if (!this.isPaused) {
            this._queueLoop();
        }
    }
}
