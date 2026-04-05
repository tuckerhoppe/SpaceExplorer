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
import { SHIPS } from '../config.js';
import { RegionManager } from './RegionManager.js';
import { QuestManager } from './QuestManager.js';
import { REGIONS, DEFAULT_REGION } from '../data/regions.js';
import { AmbientParticle } from '../entities/AmbientParticle.js';
import { HAIL_MESSAGES, SPECIFIC_HAILS } from '../data/messages.js';
import { NPC_ROSTER, getGenericShipContact } from '../data/npcs.js';
import { GhostCompanion } from '../entities/GhostCompanion.js';
import { IntroTerminal } from '../ui/IntroTerminal.js';

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
        this.waypoint = null;

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
            navHints: localStorage.getItem('setting_nav_hints') === 'true', // Defaults to false
            showStats: localStorage.getItem('setting_show_stats') === 'true',         // Default to OFF
            showNavLog: localStorage.getItem('setting_show_nav_log') === 'true',      // Default to OFF
            devMode: localStorage.getItem('setting_dev_mode') === 'true',
            discoverAll: localStorage.getItem('setting_discover_all') === 'true'     // Default to OFF
        };

        // Load waypoint
        const savedWaypoint = localStorage.getItem('space_explorer_waypoint');
        if (savedWaypoint) {
            try {
                this.waypoint = JSON.parse(savedWaypoint);
            } catch (e) {
                console.error('Failed to parse waypoint:', e);
            }
        }
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

        // --- SPAWN POSITION ---
        // respawn there. Otherwise fall back to tutorial/default logic.
        const spawnX = this.player.lastStationX;
        const spawnY = this.player.lastStationY;
        const isSafeToSpawnAtStation = (spawnX !== null) && this.sectorManager.isSafeForSpawn(spawnX, spawnY);

        if (isSafeToSpawnAtStation) {
            this.player.x = spawnX;
            this.player.y = spawnY;
        } else {
            // Default Start: Frontier Station (0, 0)
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

        // New Tutorial Terminal
        if (this.player.totalGemsCollected === 0 && !this.introShown) {
            this.introShown = true;
            this.intro = new IntroTerminal();
            this.intro.start();
        }

        // Auto-start Tutorial if no quests ever done
        /* 
        Tutorial and Story flow disabled for now
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
        */
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
            this.player.gemVault = Math.max(this.player.gemVault || 0, MIN_GEMS);
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

    setWaypoint(x, y) {
        if (x === null || y === null) {
            this.waypoint = null;
            localStorage.removeItem('space_explorer_waypoint');
        } else {
            this.waypoint = { x, y };
            localStorage.setItem('space_explorer_waypoint', JSON.stringify(this.waypoint));
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

    /**
     * Map a region's difficulty float to an integer level 1-12,
     * then pick a size (1-3) weighted toward large in high levels.
     * Also ensures a sprinkle of small asteroids for scale contrast.
     */
    spawnAsteroid(cx, cy, range) {
        const angle = Utils.rand(0, Math.PI * 2);
        const dist = Utils.rand(1000, range);

        const diff = this.regionManager ? this.regionManager.currentRegion.difficulty : 1.0;
        // Map difficulty to level 1-12  (difficulty 1.0 → level 1, 10.0 → level 10, capped at 12)
        const regionLevel = Math.max(1, Math.min(12, Math.round(diff)));

        // Size weighting: 20% chance of small (size 1) for scale reference,
        // remaining 80% weighted toward the top of the tier.
        let size;
        const roll = Math.random();
        if (roll < 0.2) {
            // Small "reference" asteroid — always size 1
            size = 1;
        } else if (regionLevel <= 2) {
            // Low levels: mostly small with some medium
            size = Math.random() < 0.7 ? 1 : 2;
        } else if (regionLevel <= 5) {
            // Mid levels: mix of medium and large
            size = Math.random() < 0.5 ? 2 : 3;
        } else {
            // High levels: mostly large
            size = Math.random() < 0.25 ? 2 : 3;
        }

        this.asteroids.push(new Asteroid(
            cx + Math.cos(angle) * dist,
            cy + Math.sin(angle) * dist,
            size,
            regionLevel
        ));
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

        // Base zoom driven by ship size — larger ships pull the camera back
        const baseZoom = SHIPS[this.player.shipIndex]?.shipZoom ?? 1.0;
        let targetZoom = baseZoom;
        const ENABLE_DYNAMIC_ZOOM = this.settings.dynamicZoom;

        if (ENABLE_DYNAMIC_ZOOM && this.player.engineMode === 'boost') {
            // 60 frames = 1 second. Zoom out starts after 3 seconds (180 frames) at full boost
            if (this.player.boostTime > 180) {
                // Ramp up the zoom out gradually over the next 120 frames (2 seconds)
                const extraTime = Math.min(1.0, (this.player.boostTime - 180) / 120);
                // Subtract from the base so bigger ships still boost-zoom proportionally
                targetZoom = baseZoom - (extraTime * 0.35);
            }
        }
        this.camera.zoom += (targetZoom - this.camera.zoom) * 0.015;

        this.camera.follow(this.player);

        this.regionManager.update(this.player, this);

        // Notify QuestManager of current region
        this.questManager.notify('region', { region: this.regionManager.currentRegion.name });

        let caps = { ...(currentRegion.caps || { asteroids: 10, fighters: 3, battleships: 0 }) };

        // Dynamic Cap Overrides based on quest completion
        if (currentRegion.clearedQuestId && this.questManager.isQuestCompleted(currentRegion.clearedQuestId)) {
            if (currentRegion.clearedCaps) {
                caps = { ...caps, ...currentRegion.clearedCaps };
            }
        }

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
                    if (proj.isTorpedo) {
                        this.spawnExplosion(proj.x, proj.y, 60, '#00eaff');
                        this.spawnExplosion(proj.x, proj.y, 40, '#ffffff');
                    } else {
                        this.spawnExplosion(proj.x, proj.y, 3, '#ff3c3c');
                    }

                    if (ast.health <= 0) {
                        this._onAsteroidDestroyed(ast, a);
                    }
                    break;
                }
            }
        }

        for (let g = this.gems.length - 1; g >= 0; g--) {
            let gem = this.gems[g];
            gem.update();

            let d = Utils.dist(this.player.x, this.player.y, gem.x, gem.y);
            // Magnet is disabled when cargo hold is full
            if (!this.player.cargoFull && d < this.player.magnetRadius) {
                let a = Utils.ang(gem.x, gem.y, this.player.x, this.player.y);
                let speed = (this.player.magnetRadius - d) * 0.15;
                gem.vx += Math.cos(a) * speed;
                gem.vy += Math.sin(a) * speed;

                if (d < this.player.radius + 15) {
                    const collectedValue = gem.value * (gem.isInfected ? 2 : 1);

                    // Space left in cargo
                    const spaceLeft = this.player.cargoCapacity - this.player.cargoGems;
                    const actualValue = Math.min(collectedValue, spaceLeft);

                    this.player.cargoGems += actualValue;
                    this.player.totalGemsCollected += actualValue;
                    this.questManager.notify('collect', {
                        target: 'gems',
                        amount: actualValue,
                        region: this.regionManager?.currentRegion?.name
                    });
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
                        if (proj.isTorpedo) {
                            this.spawnExplosion(proj.x, proj.y, 70, '#00eaff');
                            this.spawnExplosion(proj.x, proj.y, 40, '#ffffff');
                        } else {
                            this.spawnExplosion(proj.x, proj.y, 5, parasite.color);
                        }

                        if (parasite.health <= 0) {
                            this._onParasiteDestroyed(obj, parasite);
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
                    if (proj.isTorpedo) {
                        this.spawnExplosion(proj.x, proj.y, 60, '#00eaff');
                        this.spawnExplosion(proj.x, proj.y, 30, '#ffffff');
                    } else {
                        this.spawnExplosion(proj.x, proj.y, 3, '#ff9500');
                    }

                    if (enemy.health <= 0) {
                        this._onHostileDestroyed(enemy, e, this.enemies, 'fighter');
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
                    if (proj.isTorpedo) {
                        this.spawnExplosion(proj.x, proj.y, 80, '#00eaff');
                        this.spawnExplosion(proj.x, proj.y, 50, '#ffffff');
                    } else {
                        this.spawnExplosion(proj.x, proj.y, 4, '#ff4400');
                    }

                    if (bs.health <= 0) {
                        this._onHostileDestroyed(bs, e, this.battleships, 'battleship');
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
                    if (proj.isTorpedo) {
                        this.spawnExplosion(proj.x, proj.y, 100, '#00eaff');
                        this.spawnExplosion(proj.x, proj.y, 60, '#ffffff');
                    } else {
                        this.spawnExplosion(proj.x, proj.y, 6, '#ff00ff');
                    }

                    if (dn.health <= 0) {
                        this._onHostileDestroyed(dn, e, this.dreadnoughts, 'dreadnought');
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
                    if (proj.isTorpedo) {
                        this.spawnExplosion(proj.x, proj.y, 60, '#00eaff');
                        this.spawnExplosion(proj.x, proj.y, 30, '#ffffff');
                    } else {
                        this.spawnExplosion(proj.x, proj.y, 3, '#55ffcc');
                    }

                    if (ns.health <= 0) {
                        this._onHostileDestroyed(ns, e, this.neutralShips, 'neutral');
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

        // Gravity Beam Logic
        if (this.player.isFiringGravityLaser) {
            this.updateGravityBeam();
        }
    }

    updateGravityBeam() {
        const beamLength = 600;
        const x1 = this.player.x;
        const y1 = this.player.y;
        const x2 = x1 + Math.cos(this.player.angle) * beamLength;
        const y2 = y1 + Math.sin(this.player.angle) * beamLength;

        // Damage Asteroids
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const ast = this.asteroids[i];
            const d = Utils.distToSegment(ast.x, ast.y, x1, y1, x2, y2);
            if (d < ast.radius + 10) {
                ast.health -= 150; // TITANIC asteroid damage
                if (Math.random() < 0.3) this.spawnExplosion(ast.x, ast.y, 2, '#8a2be2');
                if (ast.health <= 0) {
                    this._onAsteroidDestroyed(ast, i);
                }
            }
        }

        // Damage Hostiles
        const processGroup = (group, type) => {
            for (let i = group.length - 1; i >= 0; i--) {
                const target = group[i];
                const d = Utils.distToSegment(target.x, target.y, x1, y1, x2, y2);
                if (d < (target.radius || 20) + 10) {
                    target.health -= 60; // Extreme constant damage
                    if (target.wasAttacked !== undefined) target.wasAttacked = true;
                    if (Math.random() < 0.2) this.spawnExplosion(target.x, target.y, 1, '#8a2be2');
                    
                    if (target.health <= 0) {
                        this._onHostileDestroyed(target, i, group, type);
                    }
                }
            }
        };

        processGroup(this.enemies, 'fighter');
        processGroup(this.battleships, 'battleship');
        processGroup(this.dreadnoughts, 'dreadnought');
        processGroup(this.neutralShips, 'neutral');

        // Void Particles
        if (Math.random() < 0.5) {
            const t = Math.random();
            const px = x1 + (x2 - x1) * t + Utils.rand(-10, 10);
            const py = y1 + (y2 - y1) * t + Utils.rand(-10, 10);
            this.particles.push(Particle.get(px, py, Utils.rand(-1, 1), Utils.rand(-1, 1), '#4b0082', Utils.randInt(10, 20)));
        }
    }

    drawGravityBeam() {
        if (!this.player.isFiringGravityLaser) return;

        const beamLength = 600;
        const x1 = this.player.x;
        const y1 = this.player.y;
        const x2 = x1 + Math.cos(this.player.angle) * beamLength;
        const y2 = y1 + Math.sin(this.player.angle) * beamLength;

        this.ctx.save();
        
        // Multi-layered glow
        this.ctx.lineCap = 'round';
        
        // Outer glow
        this.ctx.globalAlpha = 0.3;
        this.ctx.strokeStyle = '#8a2be2';
        this.ctx.lineWidth = 25 + Math.sin(Date.now() * 0.02) * 5;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();

        // Inner beam
        this.ctx.globalAlpha = 0.7;
        this.ctx.strokeStyle = '#4b0082';
        this.ctx.lineWidth = 12;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();

        // Core
        this.ctx.globalAlpha = 1.0;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();

        this.ctx.restore();
    }

    _onAsteroidDestroyed(ast, index) {
        if (ast.destroyed) return;
        ast.destroyed = true;
        this.spawnExplosion(ast.x, ast.y, Math.floor(ast.radius * 0.75), '#aaa');

        // Split: children inherit parent region level, smaller size
        if (ast.size > 1) {
            for (let i = 0; i < ast.size; i++) {
                this.asteroids.push(new Asteroid(ast.x, ast.y, ast.size - 1, ast.regionLevel || 1));
            }
        }

        // Gem drops: scale num gems by regionLevel to match difficulty (health) scaling
        const baseGems = ast.size * Utils.randInt(1, 4);
        const levelMult = Math.pow(1.2, (ast.regionLevel || 1) - 1);
        const gemDrops = Math.floor(baseGems * levelMult);

        const isInfected = this.regionManager?.currentRegion?.name === 'Blob Space';
        for (let i = 0; i < gemDrops; i++) {
            this.gems.push(new Gem(ast.x, ast.y, ast.gemValue || 1, isInfected, ast.gemColor || null));
        }

        // Notify quest manager
        this.questManager.notify('destroy', {
            type: 'asteroid',
            region: this.regionManager?.currentRegion?.name
        });

        this.asteroids.splice(index, 1);
    }

    _onHostileDestroyed(target, index, group, type) {
        const explosionColors = {
            fighter: '#ff6a00',
            battleship: '#ff4400',
            dreadnought: '#ff00ff',
            neutral: '#55ffcc'
        };
        const explosionSizes = {
            fighter: 20,
            battleship: 35,
            dreadnought: 60,
            neutral: 15
        };

        this.spawnExplosion(target.x, target.y, explosionSizes[type] || 20, explosionColors[type] || '#ff6a00');
        
        const isInfected = target.color === '#09ab29ff';
        let drops = 0;
        if (type === 'fighter') drops = Utils.randInt(3, 8);
        else if (type === 'battleship') drops = Utils.randInt(15, 25);
        else if (type === 'dreadnought') drops = Utils.randInt(40, 70);
        else if (type === 'neutral') drops = Utils.randInt(5, 12);

        for (let i = 0; i < drops; i++) {
            this.gems.push(new Gem(target.x, target.y, 1, isInfected));
        }

        group.splice(index, 1);

        this.questManager.notify('destroy', {
            type: type,
            region: this.regionManager?.currentRegion?.name
        });
    }

    _onParasiteDestroyed(obj, parasite) {
        this.spawnExplosion(parasite.x, parasite.y, 40, parasite.color);
        const drops = Utils.randInt(20, 35);
        const currentRegion = this.regionManager?.currentRegion;
        const isInfected = (currentRegion?.name === 'Blob Space') || parasite.type === 'blob';
        for (let i = 0; i < drops; i++) {
            this.gems.push(new Gem(parasite.x, parasite.y, 1, isInfected));
        }
        obj.parasite = null;
        this.sectorManager.markCleared(obj.id);

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

    checkContacts() {
        if (!this.hud || typeof this.hud.updateContacts !== 'function') return;

        let currentContacts = [];

        // Check stellar objects for contacts (Planets only; Stations are handled by the Station HUD)
        for (const obj of this.sectorManager.objects) {
            if (obj.type === 'planet') {
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
        
        this.drawGravityBeam();
        
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

        const hw = this.canvas.width / 2;
        const hh = this.canvas.height / 2;
        const radius = Math.min(hw, hh) * 0.62; // move hints closer to player for better visibility

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
        if (this.settings && this.settings.navHints) {
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
        }

        // 2. Region hints have been moved to the MiniMap to declutter the HUD.

        // 3. Hint for active Waypoint
        if (this.waypoint) {
            const wx = (this.waypoint.x / 1000).toFixed(1);
            const wy = (this.waypoint.y / 1000).toFixed(1);
            drawHint(this.waypoint.x, this.waypoint.y, `NAV WAYPOINT (${wx} : ${wy})`, '🎯', '#00ffcc');
        }
    }

    triggerGameOver() {
        this.gameOver = true;
        this.isPaused = true;

        if (this.questManager.activeQuests.some(q => q.id === 'tut_final')) {
            this.questManager.completeQuest('tut_final');
        }

        // Only penalise CARGO gems — vault is always safe
        const lostGems = Math.floor(this.player.cargoGems / 2);
        this.player.cargoGems -= lostGems;
        // (player.gems / gemVault are untouched)

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
