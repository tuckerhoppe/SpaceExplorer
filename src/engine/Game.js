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
import { FleetShip } from '../entities/FleetShip.js';
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
import { TradeRouteManager } from './TradeRouteManager.js';

import { Dreadnought } from '../entities/Dreadnought.js';
import { Boss } from '../entities/Boss.js';
import { TutorialShip } from '../entities/TutorialShip.js';
import { MegaLandmark } from '../entities/MegaLandmark.js';
import { MEGA_LANDMARKS } from '../data/landmarks.js';
import { DerelictHull } from '../entities/DerelictHull.js';
import { SpaceMine } from '../entities/SpaceMine.js';
import { CargoTrain } from '../entities/CargoTrain.js';
import { Comet } from '../entities/Comet.js';
import { SQUAD_DEFINITIONS } from '../data/patrols.js';
import { Squad } from '../entities/Squad.js';
import { NEBULA_DEFINITIONS } from '../data/nebulas.js';
import { Nebula } from '../entities/Nebula.js';
import { LARGE_ASTEROID_DEFINITIONS } from '../data/largeAsteroids.js';
import { LargeAsteroid } from '../entities/LargeAsteroid.js';
import { CLUSTERS } from '../data/clusters.js';
import { Structure } from '../entities/Structure.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.camera = new Camera(this.canvas);

        this.player = new Player();
        this.ghost = new GhostCompanion(this.player);
        this.tutorialShip = null;
        this.projectiles = [];
        this.fleetShips = [];
        this.asteroids = [];
        this.derelicts = [];
        this.mines = [];
        this.cargoTrains = [];
        this.comets = [];
        this.shockwaves = [];
        this.shakeIntensity = 0;
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
        this.bosses = [];
        this.megaLandmarks = MEGA_LANDMARKS.map(lm => new MegaLandmark(lm));
        this.nebulas = NEBULA_DEFINITIONS.map(def => new Nebula(def));
        this.largeAsteroids = LARGE_ASTEROID_DEFINITIONS.map(def => new LargeAsteroid(def));
        this._ambushSpawned = false;
        this.waypoint = null;

        // Build mode and structures properties
        this.structures = [];
        this.buildMode = false;
        this.buildMenuOpen = false;
        this.selectedStructureType = 'mining_station';
        this._prevMouseLeft = false;
        this.buildPreview = null;

        this.isPaused = false;
        this.gameOver = false;

        this.hud = new HUD(this);
        this.questManager = new QuestManager(this);
        this.sectorManager = new SectorManager();
        this.regionManager = new RegionManager();
        this.tradeRouteManager = new TradeRouteManager();

        this.conquestSessionKills = {};
        this.conquestSquadKills = {};
        for (const reg of REGIONS) {
            if (reg.name !== 'Neutral Space' && !reg.isVoid) {
                const parasiteCount = this.sectorManager.objects.filter(obj => {
                    const cx = obj.x / 1000;
                    const cy = -obj.y / 1000;
                    return reg.test(cx, cy) && obj.initialParasite;
                }).length;

                const regionSquads = SQUAD_DEFINITIONS[reg.name] || [];
                const squadCount = regionSquads.length;

                if (!reg.conquest) {
                    const diff = reg.difficulty || 1;
                    const fighters = 5 + Math.min(15, Math.floor(diff * 1.0));
                    const battleships = diff >= 3 ? Math.min(5, Math.floor(diff / 3)) : 0;
                    const dreadnoughts = diff >= 6 ? Math.min(3, Math.floor(diff / 6)) : 0;
                    reg.conquest = { fighters, battleships, dreadnoughts, stations: parasiteCount, squads: squadCount };
                } else {
                    reg.conquest.stations = parasiteCount;
                    reg.conquest.squads = squadCount;
                }
                this.conquestSessionKills[reg.name] = { fighters: 0, battleships: 0, dreadnoughts: 0 };
            }
        }

        this.activeSquads = [];
        try {
            const savedDefeatedSquads = JSON.parse(localStorage.getItem('space_explorer_defeated_squads') || '[]');
            this.defeatedSquadIds = new Set(savedDefeatedSquads);
        } catch {
            this.defeatedSquadIds = new Set();
        }

        try {
            const savedConquered = JSON.parse(localStorage.getItem('space_explorer_conquered_regions') || '[]');
            this.conqueredRegions = new Set(savedConquered);
        } catch {
            this.conqueredRegions = new Set();
        }

        try {
            const savedClusters = JSON.parse(localStorage.getItem('space_explorer_completed_clusters') || '[]');
            this.completedClusterIds = new Set(savedClusters);
        } catch {
            this.completedClusterIds = new Set();
        }

        // Load constructed structures
        try {
            const savedStructures = JSON.parse(localStorage.getItem('space_explorer_structures') || '[]');
            for (const structData of savedStructures) {
                let parent = this.sectorManager.objects.find(o => o.id === structData.parentId);
                if (!parent) {
                    parent = this.largeAsteroids.find(a => a.id === structData.parentId);
                }
                if (!parent && this.nebulas) {
                    parent = this.nebulas.find(n => n.id === structData.parentId);
                }
                if (parent) {
                    const struct = new Structure(
                        structData.type,
                        parent,
                        structData.relativeAngle,
                        structData.relativeDist,
                        structData.locationType,
                        structData.edgeIndex
                    );
                    this.structures.push(struct);
                }
            }
        } catch (e) {
            console.error('Failed to load structures', e);
        }

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
        
        // Instantiate active fleet ships
        this.fleetShips = [];
        if (this.player.fleetEmbarked && this.player.fleetIndices && Array.isArray(this.player.fleetIndices)) {
            this.player.fleetIndices.forEach(idx => {
                this.fleetShips.push(new FleetShip(this, idx, this.player.x, this.player.y));
            });
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

    toggleBuildMenu() {
        if (this.gameOver) return;
        if (this.buildMode) {
            this.buildMode = false;
            this.buildMenuOpen = false;
        } else {
            this.buildMenuOpen = !this.buildMenuOpen;
        }
        if (this.hud && typeof this.hud.updateBuildModeUI === 'function') {
            this.hud.updateBuildModeUI(this.buildMode, this.buildMenuOpen);
        }
    }

    startBuildPlacement(structureType) {
        if (this.gameOver) return;
        this.selectedStructureType = structureType;
        this.buildMenuOpen = false;
        this.buildMode = true;
        if (this.hud && typeof this.hud.updateBuildModeUI === 'function') {
            this.hud.updateBuildModeUI(this.buildMode, this.buildMenuOpen);
        }
    }

    toggleBuildMode() {
        if (this.gameOver) return;
        this.buildMode = !this.buildMode;
        if (!this.buildMode) this.buildMenuOpen = false;
        if (this.hud && typeof this.hud.updateBuildModeUI === 'function') {
            this.hud.updateBuildModeUI(this.buildMode, this.buildMenuOpen);
        }
    }

    saveStructures() {
        const data = this.structures.map(s => ({
            type: s.type,
            parentId: s.parent.id,
            relativeAngle: s.relativeAngle,
            relativeDist: s.relativeDist,
            locationType: s.locationType,
            edgeIndex: s.edgeIndex
        }));
        localStorage.setItem('space_explorer_structures', JSON.stringify(data));
    }

    updateBuildPreview(clickedThisFrame) {
        if (!this.buildMode) {
            this.buildPreview = null;
            return;
        }

        const mx = Input.mouse.worldX;
        const my = Input.mouse.worldY;

        // Check if hovering over an existing structure for demolition
        if (this.selectedStructureType === 'deconstruct') {
            const hoveredStruct = this.structures.find(s => Utils.dist(mx, my, s.x, s.y) <= 60);
            if (hoveredStruct) {
                const refund = hoveredStruct.type === 'shipyard' ? 100 : (hoveredStruct.type === 'science_station' ? 75 : 50);
                this.buildPreview = {
                    valid: true,
                    demolish: true,
                    parent: hoveredStruct.parent,
                    structure: hoveredStruct,
                    x: hoveredStruct.x,
                    y: hoveredStruct.y,
                    message: `Click to Demolish (${refund} 💎 Refund)`
                };

                if (clickedThisFrame) {
                    this.structures = this.structures.filter(s => s !== hoveredStruct);
                    this.saveStructures();
                    this.player.gems += refund;
                    this.player.save();
                    if (this.hud) {
                        this.hud.showFloatingReward(`+${refund} 💎`, '#00ffd0');
                        this.hud.showFloatingRewardAt(hoveredStruct.x, hoveredStruct.y, 'STRUCTURE DECONSTRUCTED', '#ff4444');
                    }
                    this.toggleBuildMode();
                }
            } else {
                this.buildPreview = {
                    valid: false,
                    demolish: true,
                    x: mx,
                    y: my,
                    message: "Hover over structure to deconstruct"
                };
            }
            return;
        }

        let nearestObj = null;
        let minDist = Infinity;
        let placementType = null;
        
        if (this.selectedStructureType === 'science_station') {
            // Check planets
            for (const obj of this.sectorManager.objects) {
                if (obj.type === 'planet') {
                    const d = Utils.dist(mx, my, obj.x, obj.y);
                    if (d < minDist) {
                        minDist = d;
                        nearestObj = obj;
                        placementType = 'planet';
                    }
                }
            }
            // Check stars
            for (const obj of this.sectorManager.objects) {
                if (obj.type === 'star') {
                    const d = Utils.dist(mx, my, obj.x, obj.y);
                    if (d < minDist) {
                        minDist = d;
                        nearestObj = obj;
                        placementType = 'star';
                    }
                }
            }
            // Check Nebulas
            if (this.nebulas) {
                for (const neb of this.nebulas) {
                    const d = Utils.dist(mx, my, neb.x, neb.y);
                    if (d < minDist) {
                        minDist = d;
                        nearestObj = neb;
                        placementType = 'nebula';
                    }
                }
            }
        } else if (this.selectedStructureType === 'mining_station') {
            // Check planets
            for (const obj of this.sectorManager.objects) {
                if (obj.type === 'planet') {
                    const d = Utils.dist(mx, my, obj.x, obj.y);
                    if (d < minDist) {
                        minDist = d;
                        nearestObj = obj;
                        placementType = 'planet';
                    }
                }
            }
            // Check stars
            for (const obj of this.sectorManager.objects) {
                if (obj.type === 'star') {
                    const d = Utils.dist(mx, my, obj.x, obj.y);
                    if (d < minDist) {
                        minDist = d;
                        nearestObj = obj;
                        placementType = 'star';
                    }
                }
            }
            // Check LargeAsteroids
            if (this.largeAsteroids) {
                for (const ast of this.largeAsteroids) {
                    const d = Utils.dist(mx, my, ast.x, ast.y);
                    if (d < minDist) {
                        minDist = d;
                        nearestObj = ast;
                        placementType = 'asteroid';
                    }
                }
            }
        } else {
            // Default placement (e.g. shipyard)
            for (const obj of this.sectorManager.objects) {
                if (obj.type === 'planet') {
                    const d = Utils.dist(mx, my, obj.x, obj.y);
                    if (d < minDist) {
                        minDist = d;
                        nearestObj = obj;
                        placementType = 'planet';
                    }
                }
            }
        }

        if (!nearestObj) {
            this.buildPreview = { valid: false, message: "No build site nearby" };
            return;
        }

        let isValid = false;
        let snapX = mx;
        let snapY = my;
        let relativeAngle = 0;
        let relativeDist = 0;
        let message = "";
        let edgeIndex = null;
        let ringName = null;

        if (placementType === 'planet') {
            const planetRadius = nearestObj.radius * 0.5;
            const orbitRadius = nearestObj.orbitLineRadius;
            
            if (this.selectedStructureType === 'shipyard' || this.selectedStructureType === 'space_dock') {
                if (minDist <= orbitRadius + 40 && minDist >= planetRadius + 30) {
                    isValid = true;
                    relativeAngle = Math.atan2(my - nearestObj.y, mx - nearestObj.x);
                    relativeDist = minDist;
                    snapX = mx;
                    snapY = my;
                    message = `${this.selectedStructureType === 'space_dock' ? 'Space Dock' : 'Drydock'}: ${nearestObj.name}`;
                } else {
                    message = "Must place within planet's orbit area";
                }
            } else if (minDist <= orbitRadius + 60 && minDist >= planetRadius + 30) {
                isValid = true;
                relativeAngle = Math.atan2(my - nearestObj.y, mx - nearestObj.x);
                relativeDist = orbitRadius;
                snapX = nearestObj.x + Math.cos(relativeAngle) * relativeDist;
                snapY = nearestObj.y + Math.sin(relativeAngle) * relativeDist;
                message = `Orbit: ${nearestObj.name}`;
            } else {
                message = "Must place within planet's orbit line";
            }
        } else if (placementType === 'asteroid') {
            const worldAngle = Math.atan2(my - nearestObj.y, mx - nearestObj.x);
            edgeIndex = typeof nearestObj.getEdgeIndexAtAngle === 'function' ? nearestObj.getEdgeIndexAtAngle(worldAngle) : 0;
            
            const surfaceRadius = typeof nearestObj.getSurfaceRadiusAtAngle === 'function'
                ? nearestObj.getSurfaceRadiusAtAngle(worldAngle)
                : nearestObj.radius;

            if (Math.abs(minDist - surfaceRadius) <= 60) {
                isValid = true;
                relativeAngle = worldAngle - nearestObj.rotation;
                relativeDist = surfaceRadius;
                snapX = nearestObj.x + Math.cos(worldAngle) * relativeDist;
                snapY = nearestObj.y + Math.sin(worldAngle) * relativeDist;
            } else {
                message = "Must place near Large Asteroid's edge";
            }
        } else if (placementType === 'nebula') {
            const nebRadius = nearestObj.baseRadius || 500;
            if (minDist <= nebRadius + 100) {
                isValid = true;
                relativeAngle = Math.atan2(my - nearestObj.y, mx - nearestObj.x);
                relativeDist = minDist;
                snapX = mx;
                snapY = my;
                message = `Nebula: ${nearestObj.name}`;
            } else {
                message = "Must place within Nebula cloud";
            }
        } else if (placementType === 'star') {
            const innerR = nearestObj.orbitDiameters.inner / 2;
            const midR = nearestObj.orbitDiameters.mid / 2;
            const outerR = nearestObj.orbitDiameters.outer / 2;

            let chosenRing = null;
            let targetR = 0;

            if (Math.abs(minDist - innerR) <= 75) {
                chosenRing = "inner";
                targetR = innerR;
            } else if (Math.abs(minDist - midR) <= 75) {
                chosenRing = "mid";
                targetR = midR;
            } else if (Math.abs(minDist - outerR) <= 75) {
                chosenRing = "outer";
                targetR = outerR;
            }

            if (chosenRing) {
                isValid = true;
                relativeAngle = Math.atan2(my - nearestObj.y, mx - nearestObj.x);
                relativeDist = targetR;
                snapX = nearestObj.x + Math.cos(relativeAngle) * relativeDist;
                snapY = nearestObj.y + Math.sin(relativeAngle) * relativeDist;
                ringName = chosenRing;
            } else {
                message = "Must place on one of Star's orbital rings";
            }
        }

        if (isValid) {
            if (placementType === 'asteroid') {
                const countOnThisEdge = this.structures.filter(s => s.parent && s.parent.id === nearestObj.id && s.edgeIndex === edgeIndex).length;
                if (countOnThisEdge >= 1) {
                    isValid = false;
                    message = `Edge #${edgeIndex + 1} Limit Reached (Max 1)`;
                } else {
                    message = `Asteroid: ${nearestObj.name} (Edge #${edgeIndex + 1}) [Slot: 0/1 Used]`;
                }
            } else if (placementType === 'planet') {
                const planetCount = this.structures.filter(s => s.parent && s.parent.id === nearestObj.id).length;
                if (planetCount >= 5) {
                    isValid = false;
                    message = `Planet Limit Reached [5/5 Slots Used]`;
                } else {
                    message = `Orbit: ${nearestObj.name} [Slots: ${planetCount}/5 Used]`;
                }
            } else if (placementType === 'nebula') {
                const nebulaCount = this.structures.filter(s => s.parent && s.parent.id === nearestObj.id).length;
                if (nebulaCount >= 3) {
                    isValid = false;
                    message = `Nebula Limit Reached [3/3 Slots Used]`;
                } else {
                    message = `Nebula: ${nearestObj.name} [Slots: ${nebulaCount}/3 Used]`;
                }
            } else if (placementType === 'star') {
                const ringCount = this.structures.filter(s => s.parent && s.parent.id === nearestObj.id && s.ringName === ringName).length;
                if (ringCount >= 1) {
                    isValid = false;
                    message = `Ring Limit Reached (Max 1)`;
                } else {
                    message = `Star: ${nearestObj.name} (${ringName} Ring) [Slot: 0/1 Used]`;
                }
            }
        }

        if (isValid) {
            const region = this.getRegionAt(snapX, snapY);
            const isLiberated = !region || !region.conquest || this.conqueredRegions.has(region.name);
            if (!isLiberated) {
                isValid = false;
                message = "Region must be liberated to build!";
            }
        }

        this.buildPreview = {
            valid: isValid,
            x: snapX,
            y: snapY,
            parent: nearestObj,
            locationType: placementType,
            relativeAngle: relativeAngle,
            relativeDist: relativeDist,
            message: message
        };

        if (clickedThisFrame) {
            const cost = this.selectedStructureType === 'space_dock' ? 300 : (this.selectedStructureType === 'shipyard' ? 200 : (this.selectedStructureType === 'science_station' ? 150 : 100));
            if (isValid) {
                if (this.player.gems >= cost) {
                    this.player.gems -= cost;
                    this.player.save();
                    
                    const newStruct = new Structure(
                        this.selectedStructureType,
                        nearestObj,
                        relativeAngle,
                        relativeDist,
                        placementType,
                        edgeIndex,
                        ringName
                    );
                    this.structures.push(newStruct);
                    this.saveStructures();
                    
                    if (this.hud) {
                        this.hud.showFloatingReward(`-${cost} 💎`, '#ff4444');
                        this.hud.showFloatingRewardAt(snapX, snapY, `${this.selectedStructureType.toUpperCase().replace('_', ' ')} CONSTRUCTED!`, '#00ff88');
                    }
                    
                    this.toggleBuildMode();
                } else {
                    if (this.hud) this.hud.showFloatingReward(`NEED ${cost} 💎!`, '#ff3c3c');
                }
            } else {
                if (this.hud) {
                    this.hud.showFloatingReward(message || 'INVALID PLACEMENT', '#ff3c3c');
                }
            }
        }
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.camera.w = this.canvas.width;
        this.camera.h = this.canvas.height;
    }

    getRegionAt(worldX, worldY) {
        const cx = worldX / 1000;
        const cy = -worldY / 1000;
        for (const region of REGIONS) {
            if (region.test(cx, cy)) {
                return region;
            }
        }
        return DEFAULT_REGION;
    }

    /**
     * Map a region's difficulty float to an integer level 1-12,
     * then pick a size (1-3) weighted toward large in high levels.
     * Also ensures a sprinkle of small asteroids for scale contrast.
     */
    spawnAsteroid(cx, cy, range) {
        const angle = Utils.rand(0, Math.PI * 2);
        const dist = Utils.rand(1000, range);
        const spawnX = cx + Math.cos(angle) * dist;
        const spawnY = cy + Math.sin(angle) * dist;

        const region = this.getRegionAt(spawnX, spawnY);
        const regionLevel = Math.max(1, Math.min(12, Math.round(region.difficulty)));

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
            spawnX,
            spawnY,
            size,
            regionLevel
        ));
    }

    spawnDerelict(cx, cy, range) {
        const angle = Utils.rand(0, Math.PI * 2);
        const dist = Utils.rand(1000, range);
        const spawnX = cx + Math.cos(angle) * dist;
        const spawnY = cy + Math.sin(angle) * dist;
        const region = this.getRegionAt(spawnX, spawnY);
        const regionLevel = Math.max(1, Math.min(12, Math.round(region.difficulty)));
        this.derelicts.push(new DerelictHull(
            spawnX,
            spawnY,
            regionLevel
        ));
    }

    spawnMine(cx, cy, range) {
        const angle = Utils.rand(0, Math.PI * 2);
        const dist = Utils.rand(1000, range);
        const spawnX = cx + Math.cos(angle) * dist;
        const spawnY = cy + Math.sin(angle) * dist;
        const region = this.getRegionAt(spawnX, spawnY);
        const regionLevel = Math.max(1, Math.min(12, Math.round(region.difficulty)));
        this.mines.push(new SpaceMine(
            spawnX,
            spawnY,
            regionLevel
        ));
    }

    spawnCargoTrain(cx, cy, range) {
        const angle = Utils.rand(0, Math.PI * 2);
        const dist = Utils.rand(1000, range);
        const spawnX = cx + Math.cos(angle) * dist;
        const spawnY = cy + Math.sin(angle) * dist;
        const region = this.getRegionAt(spawnX, spawnY);
        const regionLevel = Math.max(1, Math.min(12, Math.round(region.difficulty)));
        this.cargoTrains.push(new CargoTrain(
            spawnX,
            spawnY,
            regionLevel
        ));
    }

    spawnComet(cx, cy, range) {
        const angle = Utils.rand(0, Math.PI * 2);
        const dist = Utils.rand(1000, range);
        const spawnX = cx + Math.cos(angle) * dist;
        const spawnY = cy + Math.sin(angle) * dist;
        const region = this.getRegionAt(spawnX, spawnY);
        const regionLevel = Math.max(1, Math.min(12, Math.round(region.difficulty)));
        this.comets.push(new Comet(
            spawnX,
            spawnY,
            regionLevel
        ));
    }

    spawnShockwave(x, y, maxRadius, color, lineWidth = 4) {
        const life = 28; // slightly longer lifetime for epic wave expansion
        const speed = maxRadius / life;
        this.shockwaves.push({
            x, y,
            radius: 5,
            maxRadius,
            speed,
            color,
            lineWidth,
            life,
            maxLife: life
        });
    }

    spawnEnemy(cx, cy, minDist = 1200, maxDist = 3000, color = undefined) {
        const angle = Utils.rand(0, Math.PI * 2);
        const dist = Utils.rand(minDist, maxDist);
        const spawnX = cx + Math.cos(angle) * dist;
        const spawnY = cy + Math.sin(angle) * dist;
        const region = this.getRegionAt(spawnX, spawnY);
        const diff = region.difficulty;
        const enemyColor = color || (region.name === 'Blob Space' ? region.color : undefined);
        this.enemies.push(new Enemy(
            spawnX,
            spawnY,
            diff,
            null,
            enemyColor
        ));
    }

    spawnBattleship(cx, cy, minDist = 2000, maxDist = 4000, color = undefined) {
        const angle = Utils.rand(0, Math.PI * 2);
        const dist = Utils.rand(minDist, maxDist); // spawn farther away
        const spawnX = cx + Math.cos(angle) * dist;
        const spawnY = cy + Math.sin(angle) * dist;
        const region = this.getRegionAt(spawnX, spawnY);
        const diff = region.difficulty;
        const enemyColor = color || (region.name === 'Blob Space' ? region.color : undefined);
        this.battleships.push(new Battleship(
            spawnX,
            spawnY,
            diff,
            enemyColor
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
        const spawnX = cx + Math.cos(angle) * dist;
        const spawnY = cy + Math.sin(angle) * dist;
        const region = this.getRegionAt(spawnX, spawnY);
        const diff = region.difficulty;
        const enemyColor = color || (region.name === 'Blob Space' ? region.color : undefined);
        this.dreadnoughts.push(new Dreadnought(
            spawnX,
            spawnY,
            diff,
            enemyColor
        ));
    }

    spawnBoss(regionName) {
        // Find region center
        const region = REGIONS.find(r => r.name === regionName);
        if (!region) return;

        const bx = region.center.worldX;
        const by = region.center.worldY;

        let bossId, bossName, commsText;
        if (regionName === "The Sentinel's Post") {
            bossId = 'sentinel_commander';
            bossName = 'Sentinel Commander';
            commsText = "CRITICAL THREAT DETECTED: Imperial Flagship 'The Sentinel' has entered the sector.";
        } else if (regionName === "Star Empire") {
            bossId = 'imperial_arbiter';
            bossName = 'The Imperial Arbiter';
            commsText = "URGENT BROADCAST: The Imperial Arbiter's Dreadnought has been deployed to suppress local resistance!";
        } else {
            return;
        }

        // Check if boss already exists
        if (this.bosses.some(b => b.id === bossId)) return;

        const diff = (region.difficulty || 4.0) * 1.5; // Bosses are harder than region default
        console.log("SPAWNING BOSS:", bossName, "at", bx, by);
        this.bosses.push(new Boss(bx, by, bossId, bossName, diff));

        if (this.hud) {
            this.hud.addCommsMessage({
                sender: "SYSTEM SCANNER",
                text: commsText,
                entity: "system"
            });
        }
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

        const clickedThisFrame = Input.mouse.left && !this._prevMouseLeft;
        this._prevMouseLeft = Input.mouse.left;

        if (this.buildMode) {
            this.updateBuildPreview(clickedThisFrame);
        }

        this.player.update(this);
        
        // Update player fleet ships
        if (this.fleetShips) {
            const headingAngle = this.player.angle;
            const offsets = [
                { x: -65, y: -50 }, // Slot 1: Back-left
                { x: -65, y: 50 },  // Slot 2: Back-right
                { x: -120, y: -90 }, // Slot 3: Far Back-left
                { x: -120, y: 90 },  // Slot 4: Far Back-right
                { x: -160, y: 0 }    // Slot 5: Center Back
            ];
            this.fleetShips.forEach((ship, idx) => {
                const offset = offsets[idx] || { x: -60 - idx * 30, y: 0 };
                const rx = offset.x * Math.cos(headingAngle) - offset.y * Math.sin(headingAngle);
                const ry = offset.x * Math.sin(headingAngle) + offset.y * Math.cos(headingAngle);
                const tx = this.player.x + rx;
                const ty = this.player.y + ry;
                ship.update(this.player.x, this.player.y, tx, ty, this.player);
            });
        }

        this.ghost.update(this);

        // Update structures
        for (const s of this.structures) {
            s.update(this);
        }

        // --- LARGE ASTEROIDS COLLISION CHECK ---
        if (this.largeAsteroids) {
            this.largeAsteroids.forEach(largeAst => {
                largeAst.update(); // Update slow rotation

                // 1. Player collision
                const angleToPlayer = Utils.ang(largeAst.x, largeAst.y, this.player.x, this.player.y);
                const surfaceRadiusPlayer = typeof largeAst.getSurfaceRadiusAtAngle === 'function'
                    ? largeAst.getSurfaceRadiusAtAngle(angleToPlayer)
                    : largeAst.radius;
                const distToPlayer = Utils.dist(this.player.x, this.player.y, largeAst.x, largeAst.y);

                if (this.player.health > 0 && distToPlayer < this.player.radius + surfaceRadiusPlayer) {
                    const angle = angleToPlayer;

                    // Push player out to boundary of exact surface shape
                    this.player.x = largeAst.x + Math.cos(angle) * (this.player.radius + surfaceRadiusPlayer);
                    this.player.y = largeAst.y + Math.sin(angle) * (this.player.radius + surfaceRadiusPlayer);

                    // Reflect / Bounce velocity
                    const normalX = Math.cos(angle);
                    const normalY = Math.sin(angle);
                    const dot = this.player.vx * normalX + this.player.vy * normalY;

                    // Only bounce and damage if moving towards the asteroid
                    if (dot < 0) {
                        // Elastic bounce + extra repulsive impulse away from the rock
                        this.player.vx = (this.player.vx - 2 * dot * normalX) * 0.85 + normalX * 2.0;
                        this.player.vy = (this.player.vy - 2 * dot * normalY) * 0.85 + normalY * 2.0;

                        // Inflict small damage (5 HP)
                        this.player.health -= 5;
                        this.hud.update(this.player);
                        this.shakeIntensity = Math.max(this.shakeIntensity, 6);

                        // Spawn dust/debris particles
                        for (let i = 0; i < 6; i++) {
                            const pAngle = angle + Utils.rand(-0.6, 0.6);
                            const pSpeed = Utils.rand(1, 3.5);
                            this.particles.push(Particle.get(
                                this.player.x - Math.cos(angle) * this.player.radius,
                                this.player.y - Math.sin(angle) * this.player.radius,
                                Math.cos(pAngle) * pSpeed,
                                Math.sin(pAngle) * pSpeed,
                                '#888888',
                                Utils.randInt(12, 24)
                            ));
                        }

                        if (this.player.health <= 0 && !this.gameOver) {
                            this.triggerGameOver();
                        }
                    }
                }

                // 2. Enemy ship collisions (fighters, battleships, dreadnoughts, neutrals)
                const checkEnemyShipCollision = (ship) => {
                    const angleToShip = Utils.ang(largeAst.x, largeAst.y, ship.x, ship.y);
                    const surfaceRadiusShip = typeof largeAst.getSurfaceRadiusAtAngle === 'function'
                        ? largeAst.getSurfaceRadiusAtAngle(angleToShip)
                        : largeAst.radius;
                    const dist = Utils.dist(ship.x, ship.y, largeAst.x, largeAst.y);

                    if (dist < ship.radius + surfaceRadiusShip) {
                        ship.x = largeAst.x + Math.cos(angleToShip) * (ship.radius + surfaceRadiusShip);
                        ship.y = largeAst.y + Math.sin(angleToShip) * (ship.radius + surfaceRadiusShip);

                        const normalX = Math.cos(angleToShip);
                        const normalY = Math.sin(angleToShip);
                        const dot = ship.vx * normalX + ship.vy * normalY;
                        if (dot < 0) {
                            ship.vx = (ship.vx - 2 * dot * normalX) * 0.4;
                            ship.vy = (ship.vy - 2 * dot * normalY) * 0.4;
                        }
                    }
                };
                this.enemies.forEach(checkEnemyShipCollision);
                this.battleships.forEach(checkEnemyShipCollision);
                this.dreadnoughts.forEach(checkEnemyShipCollision);
                this.neutralShips.forEach(checkEnemyShipCollision);
            });
        }

        if (this.tradeRouteManager) {
            this.tradeRouteManager.update(this);
        }

        if (this.sectorManager) {
            this.sectorManager.update();
        }

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

        // --- CONQUEST EXIT RESET TIMER CHECK ---
        const now = Date.now();
        for (const [regionName, exitTime] of this.regionManager._lastExitTimes.entries()) {
            if (regionName !== this.regionManager.currentRegion.name) {
                if (now - exitTime > 15000) {
                    this.despawnSquadsForRegion(regionName);
                    const kills = this.conquestSessionKills[regionName];
                    if (kills && (kills.fighters > 0 || kills.battleships > 0 || kills.dreadnoughts > 0 || (this.conquestSquadKills[regionName] || 0) > 0)) {
                        kills.fighters = 0;
                        kills.battleships = 0;
                        kills.dreadnoughts = 0;
                        this.conquestSquadKills[regionName] = 0;
                    }
                    this.regionManager._lastExitTimes.delete(regionName);
                }
            }
        }

        // --- THE VOID HANDLING ---
        if (this.regionManager.currentRegion.isVoid) {
            // Apply damage over time
            const voidDamage = 0.1; // ~6 HP per second at 60fps
            this.player.health -= voidDamage;

            // Show alert occasionally
            if (this._hudFrame % 120 === 0 && this.player.health > 0) {
                if (this.hud) this.hud.showFloatingReward(`!!! VOID RADIATION WARNING !!!`, '#ff3c3c');
            }

            if (this.player.health <= 0 && !this.gameOver) {
                this.triggerGameOver();
            }

            // Clear entities immediately
            this.asteroids = [];
            this.enemies = [];
            this.battleships = [];
            this.dreadnoughts = [];
            this.neutralShips = [];
        }

        // Notify QuestManager of current region
        this.questManager.notify('region', { region: this.regionManager.currentRegion.name });

        let caps = { ...(currentRegion.caps || { asteroids: 10, fighters: 3, battleships: 0 }) };

        // Dynamic Cap Overrides based on quest completion
        if (currentRegion.clearedQuestId && this.questManager.isQuestCompleted(currentRegion.clearedQuestId)) {
            if (currentRegion.clearedCaps) {
                caps = { ...caps, ...currentRegion.clearedCaps };
            }
        }

        // Before region is conquered, scale up hostile spawn limits
        if (currentRegion.conquest && !this.conqueredRegions.has(currentRegion.name)) {
            if (caps.fighters > 0) caps.fighters = Math.floor(caps.fighters * 4.0);
            if (caps.battleships > 0) caps.battleships = Math.floor(caps.battleships * 4.0);
            if (caps.dreadnoughts > 0) caps.dreadnoughts = Math.floor(caps.dreadnoughts * 4.0);
        }

        // Ambient Particles management
        // Update existing ambient particles and fade them out if they cross boundaries into non-matching regions
        for (let i = this.ambientParticles.length - 1; i >= 0; i--) {
            const p = this.ambientParticles[i];
            p.update();
            const pRegion = this.getRegionAt(p.x, p.y);
            const expectedType = pRegion.particleType || 'none';
            if (p.type !== expectedType) {
                p.life -= 10;
            }
            if (p.life <= 0) {
                this.ambientParticles.splice(i, 1);
            }
        }

        // Spawn new particles based on visible regions
        if (this.ambientParticles.length < 60) {
            if (Math.random() < 0.25) {
                const px = this.camera.x + Math.random() * this.camera.viewW;
                const py = this.camera.y + Math.random() * this.camera.viewH;
                const spawnRegion = this.getRegionAt(px, py);
                if (spawnRegion.particleType && spawnRegion.particleType !== 'none') {
                    const p = new AmbientParticle(this.camera, spawnRegion.particleType);
                    p.x = px;
                    p.y = py;
                    this.ambientParticles.push(p);
                }
            }
        }

        if (this.asteroids.length < caps.asteroids) {
            this.spawnAsteroid(this.player.x, this.player.y, 3000);
        }

        if (caps.derelicts && this.derelicts.length < caps.derelicts) {
            this.spawnDerelict(this.player.x, this.player.y, 3000);
        }

        if (caps.mines && this.mines.length < caps.mines) {
            this.spawnMine(this.player.x, this.player.y, 3000);
        }

        if (caps.cargoTrains && this.cargoTrains.length < caps.cargoTrains) {
            this.spawnCargoTrain(this.player.x, this.player.y, 3000);
        }

        if (caps.comets && this.comets.length < caps.comets) {
            this.spawnComet(this.player.x, this.player.y, 3000);
        }

        // Enemy spawning — cap driven by region
        // Guard: No hostile enemies in Neutral Space during the tutorial
        const activeFighters = this.enemies.filter(e => !e.isPatrolSquadMember).length;
        if (activeFighters < caps.fighters && !(isTutorialActive && currentRegion.name === DEFAULT_REGION.name)) {
            // Faster spawning in Home Region
            const spawnCount = currentRegion.name === 'Home Region' ? 3 : 1;
            const enemyColor = currentRegion.name === 'Blob Space' ? currentRegion.color : undefined;
            for (let i = 0; i < spawnCount && this.enemies.filter(e => !e.isPatrolSquadMember).length < caps.fighters; i++) {
                const minDist = currentRegion.name === 'Home Region' ? 800 : 1200;
                const maxDist = currentRegion.name === 'Home Region' ? 2000 : 3000;
                this.spawnEnemy(this.player.x, this.player.y, minDist, maxDist, enemyColor);
            }
        }

        // Battleship spawning
        const activeBattleships = this.battleships.filter(b => !b.isPatrolSquadMember).length;
        if (activeBattleships < caps.battleships && !(isTutorialActive && currentRegion.name === DEFAULT_REGION.name)) {
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
        const activeDreadnoughts = this.dreadnoughts.filter(d => !d.isPatrolSquadMember).length;
        if (caps.dreadnoughts && activeDreadnoughts < caps.dreadnoughts) {
            const enemyColor = currentRegion.name === 'Blob Space' ? currentRegion.color : undefined;
            this.spawnDreadnought(this.player.x, this.player.y, enemyColor);
        }

        // --- BOSS SPAWN HANDLING ---
        if (this.bosses.length === 0) {
            const hasSentinelQuest = this.questManager.activeQuests.some(q => q.id === 'region_sentinel_boss');
            const hasArbiterQuest = this.questManager.activeQuests.some(q => q.id === 'region_empire_boss');

            if (currentRegion.name === "The Sentinel's Post" && hasSentinelQuest) {
                this.spawnBoss(currentRegion.name);
            } else if (currentRegion.name === "Star Empire" && hasArbiterQuest) {
                this.spawnBoss(currentRegion.name);
            }
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

            // Check collision with large asteroids (shatter small asteroid)
            let shattered = false;
            for (const largeAst of this.largeAsteroids) {
                if (Utils.dist(ast.x, ast.y, largeAst.x, largeAst.y) < ast.radius + largeAst.radius) {
                    this.spawnExplosion(ast.x, ast.y, Math.floor(ast.radius * 0.75), '#aaa');
                    this.asteroids.splice(a, 1);
                    shattered = true;
                    break;
                }
            }
            if (shattered) continue;

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
                        this._explodeTorpedo(proj.x, proj.y);
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

        // Update and prune derelict hulls
        for (let d = this.derelicts.length - 1; d >= 0; d--) {
            let hull = this.derelicts[d];
            hull.update();

            if (Utils.dist(this.player.x, this.player.y, hull.x, hull.y) > 4000) {
                this.derelicts.splice(d, 1);
                continue;
            }

            if (Utils.dist(this.player.x, this.player.y, hull.x, hull.y) < this.player.radius + hull.radius) {
                const isBoosting = this.player.engineMode === 'boost';
                const hasHeatShield = this.player.tech.heat_shield;

                if (!(isBoosting && hasHeatShield)) {
                    this.player.health -= 25;
                }

                this.spawnExplosion(hull.x, hull.y, 20, '#a08877');
                this.derelicts.splice(d, 1);
                this.hud.update(this.player);

                if (this.player.health <= 0 && !this.gameOver) {
                    this.triggerGameOver();
                }
                continue;
            }

            for (let p = this.projectiles.length - 1; p >= 0; p--) {
                let proj = this.projectiles[p];
                if (Utils.dist(proj.x, proj.y, hull.x, hull.y) < hull.radius + 4) {
                    hull.health -= proj.damage;
                    this.projectiles.splice(p, 1);
                    if (proj.isTorpedo) {
                        this._explodeTorpedo(proj.x, proj.y);
                    } else {
                        this.spawnExplosion(proj.x, proj.y, 3, '#ff3c3c');
                    }

                    if (hull.health <= 0) {
                        this._onDerelictDestroyed(hull, d);
                    }
                    break;
                }
            }
        }

        // Update and prune space mines
        for (let m = this.mines.length - 1; m >= 0; m--) {
            let mine = this.mines[m];
            if (!mine || mine.destroyed) continue;
            mine.update();

            if (Utils.dist(this.player.x, this.player.y, mine.x, mine.y) > 4000) {
                this.mines.splice(m, 1);
                continue;
            }

            // Player collision
            if (Utils.dist(this.player.x, this.player.y, mine.x, mine.y) < this.player.radius + mine.radius) {
                this._explodeMine(mine);
                continue;
            }

            // Enemy collision
            let triggeredByEnemy = false;
            const checkEnemyCollision = (group) => {
                for (let e = group.length - 1; e >= 0; e--) {
                    const enemy = group[e];
                    if (Utils.dist(enemy.x, enemy.y, mine.x, mine.y) < enemy.radius + mine.radius) {
                        this._explodeMine(mine);
                        triggeredByEnemy = true;
                        break;
                    }
                }
            };
            checkEnemyCollision(this.enemies);
            if (triggeredByEnemy) continue;
            checkEnemyCollision(this.battleships);
            if (triggeredByEnemy) continue;
            checkEnemyCollision(this.dreadnoughts);
            if (triggeredByEnemy) continue;

            // Projectile collision
            for (let p = this.projectiles.length - 1; p >= 0; p--) {
                let proj = this.projectiles[p];
                if (Utils.dist(proj.x, proj.y, mine.x, mine.y) < mine.radius + 4) {
                    this.projectiles.splice(p, 1);
                    this._explodeMine(mine);
                    triggeredByEnemy = true;
                    break;
                }
            }
            if (triggeredByEnemy) continue;

            // Enemy projectile collision
            for (let p = this.enemyProjectiles.length - 1; p >= 0; p--) {
                let proj = this.enemyProjectiles[p];
                if (Utils.dist(proj.x, proj.y, mine.x, mine.y) < mine.radius + 4) {
                    this.enemyProjectiles.splice(p, 1);
                    this._explodeMine(mine);
                    triggeredByEnemy = true;
                    break;
                }
            }
        }

        // Clean up exploded/destroyed mines
        this.mines = this.mines.filter(m => !m.destroyed);

        // Update and prune cargo trains
        for (let t = this.cargoTrains.length - 1; t >= 0; t--) {
            let train = this.cargoTrains[t];
            train.update();

            if (Utils.dist(this.player.x, this.player.y, train.x, train.y) > 4500) {
                this.cargoTrains.splice(t, 1);
                continue;
            }

            // Player collision
            if (Utils.dist(this.player.x, this.player.y, train.x, train.y) < this.player.radius + train.radius) {
                const isBoosting = this.player.engineMode === 'boost';
                const hasHeatShield = this.player.tech.heat_shield;

                if (!(isBoosting && hasHeatShield)) {
                    this.player.health -= 20;
                }

                this.spawnExplosion(train.x, train.y, 25, '#777777');
                this.cargoTrains.splice(t, 1);
                this.hud.update(this.player);

                if (this.player.health <= 0 && !this.gameOver) {
                    this.triggerGameOver();
                }
                continue;
            }

            // Projectile collision
            for (let p = this.projectiles.length - 1; p >= 0; p--) {
                let proj = this.projectiles[p];
                if (Utils.dist(proj.x, proj.y, train.x, train.y) < train.radius + 4) {
                    train.health -= proj.damage;
                    this.projectiles.splice(p, 1);
                    if (proj.isTorpedo) {
                        this._explodeTorpedo(proj.x, proj.y);
                    } else {
                        this.spawnExplosion(proj.x, proj.y, 3, '#ff3c3c');
                    }

                    if (train.health <= 0) {
                        this._onCargoTrainDestroyed(train, t);
                    }
                    break;
                }
            }
        }

        // Update and prune comets
        for (let c = this.comets.length - 1; c >= 0; c--) {
            let comet = this.comets[c];
            comet.update(this);

            if (Utils.dist(this.player.x, this.player.y, comet.x, comet.y) > 5500) {
                this.comets.splice(c, 1);
                continue;
            }

            // Player collision -> bounces!
            const hitPlayer = comet.bounceOff(this.player.x, this.player.y, this.player.radius);
            if (hitPlayer) {
                // Inflict small collision damage to player
                const isBoosting = this.player.engineMode === 'boost';
                const hasHeatShield = this.player.tech.heat_shield;
                if (!(isBoosting && hasHeatShield)) {
                    this.player.health -= 10;
                }
                this.hud.update(this.player);
                if (this.player.health <= 0 && !this.gameOver) {
                    this.triggerGameOver();
                }
            }

            // Bounce off other obstacles (asteroids, derelicts, cargo trains)
            this.asteroids.forEach(ast => comet.bounceOff(ast.x, ast.y, ast.radius));
            this.derelicts.forEach(hull => comet.bounceOff(hull.x, hull.y, hull.radius));
            this.cargoTrains.forEach(train => comet.bounceOff(train.x, train.y, train.radius));

            // Projectile collision -> damages comet
            for (let p = this.projectiles.length - 1; p >= 0; p--) {
                let proj = this.projectiles[p];
                if (Utils.dist(proj.x, proj.y, comet.x, comet.y) < comet.radius + 4) {
                    comet.health -= proj.damage;
                    this.projectiles.splice(p, 1);
                    if (proj.isTorpedo) {
                        this._explodeTorpedo(proj.x, proj.y);
                    } else {
                        this.spawnExplosion(proj.x, proj.y, 3, '#00f0ff');
                    }

                    if (comet.health <= 0) {
                        this._onCometDestroyed(comet, c);
                    }
                    break;
                }
            }
        }

        // Update shockwaves
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.radius += sw.speed;
            sw.life -= 1;
            if (sw.life <= 0) {
                this.shockwaves.splice(i, 1);
            }
        }

        // Decay screen shake
        if (this.shakeIntensity > 0) {
            this.shakeIntensity = Math.max(0, this.shakeIntensity - 0.7);
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
                            this._explodeTorpedo(proj.x, proj.y);
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

        // ── Patrol Squads update ──────────────────────────────────
        for (const squad of this.activeSquads) {
            squad.update(this);
        }

        // ── Enemy update & collision ──────────────────────────────
        for (let e = this.enemies.length - 1; e >= 0; e--) {
            const enemy = this.enemies[e];
            if (!enemy) continue;
            enemy.update(this);

            // Despawn if too far from player
            if (Utils.dist(this.player.x, this.player.y, enemy.x, enemy.y) > 4500 && !enemy.isPatrolSquadMember) {
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
                        this._explodeTorpedo(proj.x, proj.y);
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

        // ── Enemy projectile hits fleet ships ─────────────────────
        if (this.fleetShips && this.fleetShips.length > 0) {
            for (let sIdx = this.fleetShips.length - 1; sIdx >= 0; sIdx--) {
                const ship = this.fleetShips[sIdx];
                if (ship.health <= 0) continue;
                for (let p = this.enemyProjectiles.length - 1; p >= 0; p--) {
                    const proj = this.enemyProjectiles[p];
                    if (Utils.dist(proj.x, proj.y, ship.x, ship.y) < ship.radius + 4) {
                        ship.health -= proj.damage;
                        this.enemyProjectiles.splice(p, 1);
                        this.spawnExplosion(proj.x, proj.y, 5, '#ff9500');

                        if (ship.health <= 0) {
                            this.spawnExplosion(ship.x, ship.y, 16, '#ffaa00');
                            this.fleetShips.splice(sIdx, 1);
                            this.player.fleetIndices.splice(sIdx, 1);
                            this.player.save();
                            if (this.hud && typeof this.hud.refreshShipyardFleetMenu === 'function') {
                                this.hud.refreshShipyardFleetMenu();
                            }
                            break;
                        }
                    }
                }
            }
        }

        // ── Battleship update & collision ───────────────────────
        for (let e = this.battleships.length - 1; e >= 0; e--) {
            const bs = this.battleships[e];
            if (!bs) continue;
            bs.update(this);

            if (Utils.dist(this.player.x, this.player.y, bs.x, bs.y) > 5000 && !bs.isPatrolSquadMember) {
                this.battleships.splice(e, 1);
                continue;
            }

            for (let p = this.projectiles.length - 1; p >= 0; p--) {
                const proj = this.projectiles[p];
                if (Utils.dist(proj.x, proj.y, bs.x, bs.y) < bs.radius + 4) {
                    bs.health -= proj.damage;
                    this.projectiles.splice(p, 1);
                    if (proj.isTorpedo) {
                        this._explodeTorpedo(proj.x, proj.y);
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
            if (!dn) continue;
            dn.update(this);

            if (Utils.dist(this.player.x, this.player.y, dn.x, dn.y) > 6000 && !dn.isPatrolSquadMember) {
                this.dreadnoughts.splice(e, 1);
                continue;
            }

            for (let p = this.projectiles.length - 1; p >= 0; p--) {
                const proj = this.projectiles[p];
                if (Utils.dist(proj.x, proj.y, dn.x, dn.y) < dn.radius + 4) {
                    dn.health -= proj.damage;
                    this.projectiles.splice(p, 1);
                    if (proj.isTorpedo) {
                        this._explodeTorpedo(proj.x, proj.y);
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

        // ── Boss update & collision ──────────────────────────────
        for (let b = this.bosses.length - 1; b >= 0; b--) {
            const boss = this.bosses[b];
            if (!boss) continue;
            boss.update(this);

            // Boss health bar is handled in HUD.js (we'll ensure it has access to active bosses)

            for (let p = this.projectiles.length - 1; p >= 0; p--) {
                const proj = this.projectiles[p];
                if (Utils.dist(proj.x, proj.y, boss.x, boss.y) < boss.radius + 4) {
                    boss.health -= proj.damage;
                    this.projectiles.splice(p, 1);
                    if (proj.isTorpedo) {
                        this._explodeTorpedo(proj.x, proj.y);
                    } else {
                        this.spawnExplosion(proj.x, proj.y, 6, boss.color);
                    }

                    if (boss.health <= 0) {
                        this._onBossDestroyed(boss, b);
                    }
                    break;
                }
            }
        }

        // ── Neutral ship update & collision ─────────────────────
        for (let e = this.neutralShips.length - 1; e >= 0; e--) {
            const ns = this.neutralShips[e];
            if (!ns) continue;
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
                        this._explodeTorpedo(proj.x, proj.y);
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

        // Damage Derelict Hulls
        for (let i = this.derelicts.length - 1; i >= 0; i--) {
            const hull = this.derelicts[i];
            const d = Utils.distToSegment(hull.x, hull.y, x1, y1, x2, y2);
            if (d < hull.radius + 10) {
                hull.health -= 150;
                if (Math.random() < 0.3) this.spawnExplosion(hull.x, hull.y, 2, '#ff9800');
                if (hull.health <= 0) {
                    this._onDerelictDestroyed(hull, i);
                }
            }
        }

        // Damage Space Mines
        for (let i = this.mines.length - 1; i >= 0; i--) {
            const mine = this.mines[i];
            const d = Utils.distToSegment(mine.x, mine.y, x1, y1, x2, y2);
            if (d < mine.radius + 10) {
                this._explodeMine(mine);
            }
        }

        // Damage Cargo Trains
        for (let i = this.cargoTrains.length - 1; i >= 0; i--) {
            const train = this.cargoTrains[i];
            const d = Utils.distToSegment(train.x, train.y, x1, y1, x2, y2);
            if (d < train.radius + 10) {
                train.health -= 150;
                if (Math.random() < 0.3) this.spawnExplosion(train.x, train.y, 2, '#ffaa00');
                if (train.health <= 0) {
                    this._onCargoTrainDestroyed(train, i);
                }
            }
        }

        // Damage Comets
        for (let i = this.comets.length - 1; i >= 0; i--) {
            const comet = this.comets[i];
            const d = Utils.distToSegment(comet.x, comet.y, x1, y1, x2, y2);
            if (d < comet.radius + 10) {
                comet.health -= 150;
                if (Math.random() < 0.3) this.spawnExplosion(comet.x, comet.y, 2, '#00eaff');
                if (comet.health <= 0) {
                    this._onCometDestroyed(comet, i);
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

    _onDerelictDestroyed(hull, index) {
        if (hull.destroyed) return;
        hull.destroyed = true;
        this.spawnExplosion(hull.x, hull.y, Math.floor(hull.radius * 0.8), '#a08877');

        // Gem drops
        const isInfected = this.regionManager?.currentRegion?.name === 'Blob Space';
        for (let i = 0; i < hull.gemCount; i++) {
            this.gems.push(new Gem(hull.x, hull.y, hull.gemValue, isInfected, hull.gemColor));
        }

        this.questManager.notify('destroy', {
            type: 'derelict',
            region: this.regionManager?.currentRegion?.name
        });

        this.derelicts.splice(index, 1);
    }

    _explodeMine(mine) {
        if (mine.destroyed) return;
        mine.destroyed = true;

        if (mine.blastTier === 'small') {
            this.shakeIntensity = Math.max(this.shakeIntensity, 7);
            this.spawnExplosion(mine.x, mine.y, 50, '#ff3c3c');
            this.spawnExplosion(mine.x, mine.y, 30, '#ffff00');
            this.spawnShockwave(mine.x, mine.y, mine.blastRadius, '#ff3c3c', 8.0);
        } else if (mine.blastTier === 'medium') {
            this.shakeIntensity = Math.max(this.shakeIntensity, 16);
            this.spawnExplosion(mine.x, mine.y, 90, '#ff8000');
            this.spawnExplosion(mine.x, mine.y, 60, '#ffbb00');
            this.spawnExplosion(mine.x, mine.y, 40, '#ffffff');
            this.spawnShockwave(mine.x, mine.y, mine.blastRadius, '#ff8000', 16.0);
            this.spawnShockwave(mine.x, mine.y, mine.blastRadius * 0.55, '#ffff33', 8.0);
        } else {
            this.shakeIntensity = Math.max(this.shakeIntensity, 32);
            this.spawnExplosion(mine.x, mine.y, 160, '#ff3c00');
            this.spawnExplosion(mine.x, mine.y, 110, '#ffbb00');
            this.spawnExplosion(mine.x, mine.y, 80, '#ffffff');
            this.spawnShockwave(mine.x, mine.y, mine.blastRadius, '#ff3c00', 28.0);
            this.spawnShockwave(mine.x, mine.y, mine.blastRadius * 0.7, '#ff9900', 16.0);
            this.spawnShockwave(mine.x, mine.y, mine.blastRadius * 0.35, '#ffffff', 8.0);
        }

        const playerDist = Utils.dist(this.player.x, this.player.y, mine.x, mine.y);
        if (playerDist < mine.blastRadius) {
            const pct = 1 - (playerDist / mine.blastRadius);
            const dmg = Math.floor(mine.blastDamage * pct);
            if (dmg > 0) {
                const isBoosting = this.player.engineMode === 'boost';
                const hasHeatShield = this.player.tech.heat_shield;
                if (!(isBoosting && hasHeatShield)) {
                    this.player.health -= dmg;
                }
            }
            this.hud.update(this.player);
            if (this.player.health <= 0 && !this.gameOver) {
                this.triggerGameOver();
            }
        }

        const dealSplash = (group, type) => {
            for (let e = group.length - 1; e >= 0; e--) {
                const enemy = group[e];
                const dist = Utils.dist(enemy.x, enemy.y, mine.x, mine.y);
                if (dist < mine.blastRadius) {
                    const pct = 1 - (dist / mine.blastRadius);
                    enemy.health -= Math.floor(mine.blastDamage * pct);
                    if (enemy.wasAttacked !== undefined) enemy.wasAttacked = true;
                    if (enemy.health <= 0) {
                        this._onHostileDestroyed(enemy, e, group, type);
                    }
                }
            }
        };
        dealSplash(this.enemies, 'fighter');
        dealSplash(this.battleships, 'battleship');
        dealSplash(this.dreadnoughts, 'dreadnought');
        dealSplash(this.neutralShips, 'neutral');

        for (let a = this.asteroids.length - 1; a >= 0; a--) {
            const ast = this.asteroids[a];
            const dist = Utils.dist(ast.x, ast.y, mine.x, mine.y);
            if (dist < mine.blastRadius) {
                const pct = 1 - (dist / mine.blastRadius);
                ast.health -= Math.floor(mine.blastDamage * 1.5 * pct);
                if (ast.health <= 0) {
                    this._onAsteroidDestroyed(ast, a);
                }
            }
        }

        for (let d = this.derelicts.length - 1; d >= 0; d--) {
            const hull = this.derelicts[d];
            const dist = Utils.dist(hull.x, hull.y, mine.x, mine.y);
            if (dist < mine.blastRadius) {
                const pct = 1 - (dist / mine.blastRadius);
                hull.health -= Math.floor(mine.blastDamage * pct);
                if (hull.health <= 0) {
                    this._onDerelictDestroyed(hull, d);
                }
            }
        }

        // Chain Reaction! Detonate adjacent space mines in blast radius
        for (let m = this.mines.length - 1; m >= 0; m--) {
            const otherMine = this.mines[m];
            if (!otherMine || otherMine.destroyed) continue;
            const dist = Utils.dist(otherMine.x, otherMine.y, mine.x, mine.y);
            if (dist < mine.blastRadius) {
                this._explodeMine(otherMine);
            }
        }

        // Splash damage to Cargo Trains
        for (let t = this.cargoTrains.length - 1; t >= 0; t--) {
            const train = this.cargoTrains[t];
            const dist = Utils.dist(train.x, train.y, mine.x, mine.y);
            if (dist < mine.blastRadius) {
                const pct = 1 - (dist / mine.blastRadius);
                train.health -= Math.floor(mine.blastDamage * pct);
                if (train.health <= 0) {
                    this._onCargoTrainDestroyed(train, t);
                }
            }
        }

        // Splash damage to Comets
        for (let c = this.comets.length - 1; c >= 0; c--) {
            const comet = this.comets[c];
            const dist = Utils.dist(comet.x, comet.y, mine.x, mine.y);
            if (dist < mine.blastRadius) {
                const pct = 1 - (dist / mine.blastRadius);
                comet.health -= Math.floor(mine.blastDamage * pct);
                if (comet.health <= 0) {
                    this._onCometDestroyed(comet, c);
                }
            }
        }
    }

    _explodeTorpedo(x, y) {
        // Visual particles
        this.spawnExplosion(x, y, 60, '#00eaff');
        this.spawnExplosion(x, y, 40, '#ffffff');

        // Glowing nested shockwave rings
        this.spawnShockwave(x, y, 180, '#00eaff', 10.0);
        this.spawnShockwave(x, y, 110, '#ffffff', 5.0);

        const blastRadius = 180;
        const blastDamage = 100;

        // Splash proximity damage to hostiles
        const dealSplash = (group, type) => {
            for (let e = group.length - 1; e >= 0; e--) {
                const enemy = group[e];
                const dist = Utils.dist(enemy.x, enemy.y, x, y);
                if (dist < blastRadius) {
                    const pct = 1 - (dist / blastRadius);
                    enemy.health -= Math.floor(blastDamage * pct);
                    if (enemy.wasAttacked !== undefined) enemy.wasAttacked = true;
                    if (enemy.health <= 0) {
                        this._onHostileDestroyed(enemy, e, group, type);
                    }
                }
            }
        };
        dealSplash(this.enemies, 'fighter');
        dealSplash(this.battleships, 'battleship');
        dealSplash(this.dreadnoughts, 'dreadnought');
        dealSplash(this.neutralShips, 'neutral');

        // Splash proximity damage to bosses
        for (let b = this.bosses.length - 1; b >= 0; b--) {
            const boss = this.bosses[b];
            const dist = Utils.dist(boss.x, boss.y, x, y);
            if (dist < blastRadius) {
                const pct = 1 - (dist / blastRadius);
                boss.health -= Math.floor(blastDamage * pct);
                if (boss.health <= 0) {
                    this._onBossDestroyed(boss, b);
                }
            }
        }

        // Splash damage to Asteroids
        for (let a = this.asteroids.length - 1; a >= 0; a--) {
            const ast = this.asteroids[a];
            const dist = Utils.dist(ast.x, ast.y, x, y);
            if (dist < blastRadius) {
                const pct = 1 - (dist / blastRadius);
                ast.health -= Math.floor(blastDamage * 1.5 * pct);
                if (ast.health <= 0) {
                    this._onAsteroidDestroyed(ast, a);
                }
            }
        }

        // Splash damage to Derelict Hulls
        for (let d = this.derelicts.length - 1; d >= 0; d--) {
            const hull = this.derelicts[d];
            const dist = Utils.dist(hull.x, hull.y, x, y);
            if (dist < blastRadius) {
                const pct = 1 - (dist / blastRadius);
                hull.health -= Math.floor(blastDamage * pct);
                if (hull.health <= 0) {
                    this._onDerelictDestroyed(hull, d);
                }
            }
        }

        // Proximity detonation of space mines
        for (let m = this.mines.length - 1; m >= 0; m--) {
            const mine = this.mines[m];
            if (!mine || mine.destroyed) continue;
            const dist = Utils.dist(mine.x, mine.y, x, y);
            if (dist < blastRadius) {
                this._explodeMine(mine);
            }
        }

        // Splash damage to Cargo Trains
        for (let t = this.cargoTrains.length - 1; t >= 0; t--) {
            const train = this.cargoTrains[t];
            const dist = Utils.dist(train.x, train.y, x, y);
            if (dist < blastRadius) {
                const pct = 1 - (dist / blastRadius);
                train.health -= Math.floor(blastDamage * pct);
                if (train.health <= 0) {
                    this._onCargoTrainDestroyed(train, t);
                }
            }
        }

        // Splash damage to Comets
        for (let c = this.comets.length - 1; c >= 0; c--) {
            const comet = this.comets[c];
            const dist = Utils.dist(comet.x, comet.y, x, y);
            if (dist < blastRadius) {
                const pct = 1 - (dist / blastRadius);
                comet.health -= Math.floor(blastDamage * pct);
                if (comet.health <= 0) {
                    this._onCometDestroyed(comet, c);
                }
            }
        }
    }

    _onCargoTrainDestroyed(train, index) {
        if (train.destroyed) return;
        train.destroyed = true;
        this.spawnExplosion(train.x, train.y, 60, train.containerColor);
        this.spawnExplosion(train.x, train.y, 35, '#ffffff');

        // Glowing shockwave matching container theme
        this.spawnShockwave(train.x, train.y, 200, train.containerColor, 6.0);

        // Gem drops (drops twice the regional max!)
        const isInfected = this.regionManager?.currentRegion?.name === 'Blob Space';
        for (let i = 0; i < train.gemCount; i++) {
            this.gems.push(new Gem(train.x, train.y, train.gemValue, isInfected, train.gemColor));
        }

        this.questManager.notify('destroy', {
            type: 'cargo_train',
            region: this.regionManager?.currentRegion?.name
        });

        this.cargoTrains.splice(index, 1);
    }

    _onCometDestroyed(comet, index) {
        if (comet.destroyed) return;
        comet.destroyed = true;
        this.spawnExplosion(comet.x, comet.y, 65, '#00f0ff');
        this.spawnExplosion(comet.x, comet.y, 40, '#ffffff');

        // Shockwave
        this.spawnShockwave(comet.x, comet.y, 220, '#00eaff', 6.0);

        // Gem drops (worth 5 times regional value!)
        const isInfected = this.regionManager?.currentRegion?.name === 'Blob Space';
        for (let i = 0; i < comet.gemCount; i++) {
            this.gems.push(new Gem(comet.x, comet.y, comet.gemValue, isInfected, comet.gemColor));
        }

        this.questManager.notify('destroy', {
            type: 'comet',
            region: this.regionManager?.currentRegion?.name
        });

        this.comets.splice(index, 1);
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

        const currentRegionName = this.regionManager?.currentRegion?.name;

        // Squad member check
        if (target.isPatrolSquadMember) {
            const squad = this.activeSquads.find(s => s.id === target.squadId);
            if (squad) {
                // Filter out the dead ship
                squad.ships = squad.ships.filter(s => s !== target);
                if (squad.isDefeated()) {
                    this.defeatedSquadIds.add(squad.id);
                    localStorage.setItem('space_explorer_defeated_squads', JSON.stringify([...this.defeatedSquadIds]));
                    this.activeSquads = this.activeSquads.filter(s => s !== squad);

                    if (this.hud) {
                        this.hud.showFloatingReward(`SQUAD ELIMINATED: ${squad.name.toUpperCase()}`, '#ff9500');
                    }
                    if (currentRegionName) {
                        this.checkRegionConquest(currentRegionName);
                    }
                }
            }
        }

        if (currentRegionName && this.conquestSessionKills[currentRegionName] && !this.conqueredRegions.has(currentRegionName)) {
            const kills = this.conquestSessionKills[currentRegionName];
            if (target.isPatrolSquadMember) {
                this.conquestSquadKills[currentRegionName] = (this.conquestSquadKills[currentRegionName] || 0) + 1;
            } else {
                if (type === 'fighter') kills.fighters++;
                else if (type === 'battleship') kills.battleships++;
                else if (type === 'dreadnought') kills.dreadnoughts++;
            }
            this.checkRegionConquest(currentRegionName);
        }
    }

    _onBossDestroyed(boss, index) {
        this.spawnExplosion(boss.x, boss.y, 150, boss.color);
        this.spawnExplosion(boss.x, boss.y, 100, '#ffffff');
        this.spawnExplosion(boss.x, boss.y, 80, boss.accent);

        // Massive gem drop
        const drops = 150;
        for (let i = 0; i < drops; i++) {
            this.gems.push(new Gem(boss.x, boss.y, 1, false));
        }

        this.bosses.splice(index, 1);

        this.questManager.notify('destroy_boss', {
            target: boss.id,
            region: this.regionManager?.currentRegion?.name
        });

        if (this.hud) {
            this.hud.showFloatingReward(`!!! BOSS DEFEATED: ${boss.name.toUpperCase()} !!!`, '#ffd700');
        }
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

        const currentRegionName = this.regionManager?.currentRegion?.name;
        if (currentRegionName && !this.conqueredRegions.has(currentRegionName)) {
            this.checkRegionConquest(currentRegionName);
        }

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
        // 1. Fill entire screen with deep space background color
        this.ctx.fillStyle = '#000105';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 2. Draw Playable Galaxy (Neutral Space fallback area) bounds: -30000 to 30000
        const gx1 = -30000;
        const gx2 = 30000;
        const gy1 = -30000;
        const gy2 = 30000;
        if (!(gx2 < this.camera.x || gx1 > this.camera.x + this.camera.viewW ||
            gy2 < this.camera.y || gy1 > this.camera.y + this.camera.viewH)) {
            const gsx = (gx1 - this.camera.x) * this.camera.zoom;
            const gsy = (gy1 - this.camera.y) * this.camera.zoom;
            const gsw = (gx2 - gx1) * this.camera.zoom;
            const gsh = (gy2 - gy1) * this.camera.zoom;
            this.ctx.fillStyle = DEFAULT_REGION.bgColor;
            this.ctx.fillRect(gsx, gsy, gsw, gsh);
        }

        // 3. Draw each specific region background
        for (const region of REGIONS) {
            if (!region.bounds) continue;

            const rx1 = region.bounds.minX * 1000;
            const rx2 = region.bounds.maxX * 1000;
            const ry1 = -region.bounds.maxY * 1000;
            const ry2 = -region.bounds.minY * 1000;

            // Viewport culling to check if the region's background is on screen
            if (rx2 < this.camera.x || rx1 > this.camera.x + this.camera.viewW ||
                ry2 < this.camera.y || ry1 > this.camera.y + this.camera.viewH) {
                continue;
            }

            const sx = (rx1 - this.camera.x) * this.camera.zoom;
            const sy = (ry1 - this.camera.y) * this.camera.zoom;
            const sw = (rx2 - rx1) * this.camera.zoom;
            const sh = (ry2 - ry1) * this.camera.zoom;

            this.ctx.fillStyle = region.bgColor;
            this.ctx.fillRect(sx, sy, sw, sh);
        }

        // 4. Draw background stars
        this.stars.forEach(s => {
            let px = ((s.x - this.camera.x * s.parallax) % this.canvas.width + this.canvas.width) % this.canvas.width;
            let py = ((s.y - this.camera.y * s.parallax) % this.canvas.height + this.canvas.height) % this.canvas.height;

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
        if (this.shakeIntensity > 0) {
            cx += Utils.rand(-this.shakeIntensity, this.shakeIntensity) / this.camera.zoom;
            cy += Utils.rand(-this.shakeIntensity, this.shakeIntensity) / this.camera.zoom;
        }

        this.ctx.translate(cx, cy);

        if (this.tradeRouteManager) {
            this.tradeRouteManager.draw(this.ctx, this.camera);
        }

        if (this.regionManager) {
            this.regionManager.draw(this.ctx, this.camera);
        }

        this.nebulas.forEach(n => n.draw(this.ctx, this.camera));
        this.largeAsteroids.forEach(la => la.draw(this.ctx, this.camera));

        this.sectorManager.draw(this.ctx, this.camera, this.player);
        
        // Draw structures
        this.structures.forEach(s => s.draw(this.ctx, this.camera));

        this.gems.forEach(g => g.draw(this.ctx, this.camera));
        this.asteroids.forEach(a => a.draw(this.ctx, this.camera));
        this.derelicts.forEach(d => d.draw(this.ctx, this.camera));
        this.mines.forEach(m => m.draw(this.ctx, this.camera));
        this.cargoTrains.forEach(t => t.draw(this.ctx, this.camera));
        this.comets.forEach(c => c.draw(this.ctx, this.camera));

        // Draw shockwaves
        this.shockwaves.forEach(sw => {
            this.ctx.save();
            this.ctx.strokeStyle = sw.color;
            this.ctx.lineWidth = sw.lineWidth * (sw.life / sw.maxLife);
            this.ctx.globalAlpha = sw.life / sw.maxLife;
            this.ctx.shadowBlur = 24 * (sw.life / sw.maxLife);
            this.ctx.shadowColor = sw.color;
            this.ctx.beginPath();
            this.ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        });

        this.enemies.forEach(e => e.draw(this.ctx, this.camera));
        this.battleships.forEach(b => b.draw(this.ctx, this.camera));
        this.dreadnoughts.forEach(d => d.draw(this.ctx, this.camera));
        this.bosses.forEach(b => b.draw(this.ctx, this.camera));
        this.neutralShips.forEach(n => n.draw(this.ctx, this.camera));
        this.projectiles.forEach(p => p.draw(this.ctx, this.camera));
        this.enemyProjectiles.forEach(p => p.draw(this.ctx, this.camera));

        this.drawGravityBeam();

        if (this.fleetShips) {
            this.fleetShips.forEach(ship => ship.draw(this.ctx, this.camera));
        }

        this.player.draw(this.ctx);
        if (this.player.onTradeRoute && !this.player.tradeRouteCharged) {
            const progress = Math.min(1, this.player.tradeRouteTimeOn / 90);
            this.ctx.save();
            this.ctx.strokeStyle = this.player.tradeRouteColor || '#00ffcc';
            this.ctx.lineWidth = 2.5;
            this.ctx.shadowColor = this.player.tradeRouteColor || '#00ffcc';
            this.ctx.shadowBlur = 8;
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, this.player.radius + 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
            this.ctx.stroke();
            this.ctx.restore();
        }
        if (this.tutorialShip) this.tutorialShip.draw(this.ctx);
        this.ghost.draw(this.ctx, this);
        this.particles.forEach(p => p.draw(this.ctx, this.camera));

        // Draw build preview
        if (this.buildMode && this.buildPreview) {
            const preview = this.buildPreview;
            const ctx = this.ctx;
            
            // 1. Draw connecting guides/radius indicators in world space
            ctx.save();
            if (preview.demolish) {
                ctx.strokeStyle = 'rgba(255, 60, 60, 0.85)';
                ctx.lineWidth = 3.0;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.arc(preview.x, preview.y, 75, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                ctx.strokeStyle = preview.valid ? 'rgba(0, 255, 208, 0.6)' : 'rgba(255, 60, 60, 0.6)';
                ctx.lineWidth = 2.5;
                ctx.setLineDash([6, 6]);
                ctx.beginPath();
                ctx.arc(preview.x, preview.y, 70, 0, Math.PI * 2);
                ctx.stroke();

                if (preview.parent) {
                    ctx.strokeStyle = preview.valid ? 'rgba(0, 255, 208, 0.2)' : 'rgba(255, 60, 60, 0.2)';
                    ctx.setLineDash([3, 6]);
                    ctx.beginPath();
                    ctx.moveTo(preview.x, preview.y);
                    ctx.lineTo(preview.parent.x, preview.parent.y);
                    ctx.stroke();
                }
            }
            ctx.restore();

            // 2. Draw structure graphics (only if not demolishing)
            if (!preview.demolish) {
                ctx.save();
                ctx.globalAlpha = 0.5;
                ctx.translate(preview.x, preview.y);
                if (this.selectedStructureType === 'shipyard') {
                    const dockAngle = Math.atan2(preview.y - preview.parent.y, preview.x - preview.parent.x);
                    ctx.rotate(dockAngle);
                    ctx.strokeStyle = preview.valid ? '#00ff88' : '#ff3c3c';
                    ctx.fillStyle = '#141c24';
                    ctx.lineWidth = 3;
                    ctx.fillRect(-25, -60, 50, 24);
                    ctx.strokeRect(-25, -60, 50, 24);
                    ctx.fillRect(-55, -60, 24, 110);
                    ctx.strokeRect(-55, -60, 24, 110);
                    ctx.fillRect(31, -60, 24, 110);
                    ctx.strokeRect(31, -60, 24, 110);
                } else if (this.selectedStructureType === 'space_dock') {
                    const dockAngle = Math.atan2(preview.y - preview.parent.y, preview.x - preview.parent.x);
                    ctx.rotate(dockAngle);
                    ctx.strokeStyle = preview.valid ? '#0055ff' : '#ff3c3c';
                    ctx.fillStyle = '#141c24';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(0, 0, 30, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(0, 0, 65, 0, Math.PI * 2);
                    ctx.stroke();
                } else if (preview.locationType === 'planet') {
                    ctx.rotate(Date.now() / 1000);
                    ctx.strokeStyle = preview.valid ? '#00ffd0' : '#ff3c3c';
                    ctx.fillStyle = '#0b1d28';
                    ctx.lineWidth = 3.5;
                    ctx.beginPath();
                    ctx.arc(0, 0, 42, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    for (let i = 0; i < 4; i++) {
                        const angle = (i * Math.PI) / 2;
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(Math.cos(angle) * 42, Math.sin(angle) * 42);
                        ctx.stroke();
                    }
                    ctx.beginPath();
                    ctx.arc(0, 0, 18, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                } else if (preview.locationType === 'asteroid') {
                    const surfaceAngle = Math.atan2(preview.y - preview.parent.y, preview.x - preview.parent.x);
                    ctx.rotate(surfaceAngle);
                    ctx.strokeStyle = preview.valid ? '#ff9900' : '#ff3c3c';
                    ctx.fillStyle = '#1f130b';
                    ctx.lineWidth = 3;
                    ctx.fillRect(-6, -75, 12, 150);
                    ctx.strokeRect(-6, -75, 12, 150);
                    ctx.fillRect(0, -45, 70, 90);
                    ctx.strokeRect(0, -45, 70, 90);
                    ctx.fillRect(0, -76, 80, 28);
                    ctx.strokeRect(0, -76, 80, 28);
                    ctx.fillRect(70, -26, 35, 10);
                    ctx.strokeRect(70, -26, 35, 10);
                    ctx.fillRect(70, -5, 35, 10);
                    ctx.strokeRect(70, -5, 35, 10);
                    ctx.fillRect(70, 16, 35, 10);
                    ctx.strokeRect(70, 16, 35, 10);
                } else if (preview.locationType === 'star') {
                    ctx.rotate(Date.now() / 1000);
                    ctx.strokeStyle = preview.valid ? '#ffaa00' : '#ff3c3c';
                    ctx.fillStyle = '#1b1305';
                    ctx.lineWidth = 3.5;
                    ctx.beginPath();
                    ctx.arc(0, 0, 32, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    ctx.fillRect(-45, -6, 90, 12);
                    ctx.strokeRect(-45, -6, 90, 12);
                } else if (preview.locationType === 'nebula' || this.selectedStructureType === 'science_station') {
                    ctx.rotate(Date.now() / 1000);
                    ctx.strokeStyle = preview.valid ? '#00e5ff' : '#ff3c3c';
                    ctx.fillStyle = '#0b1021';
                    ctx.lineWidth = 3.5;
                    ctx.beginPath();
                    ctx.arc(0, 0, 40, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    ctx.beginPath();
                    for (let s = 0; s < 8; s++) {
                        const sAngle = (s / 8) * Math.PI * 2;
                        const px = Math.cos(sAngle) * 20;
                        const py = Math.sin(sAngle) * 20;
                        if (s === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.stroke();
                }
                ctx.restore();
            }

            // 3. Draw text message or demolish warning label
            ctx.save();
            ctx.fillStyle = preview.demolish ? '#ff3c3c' : (preview.valid ? '#00ffd0' : '#ff3c3c');
            ctx.font = 'bold 13px Orbitron, sans-serif';
            ctx.textAlign = 'center';
            if (preview.demolish && preview.structure) {
                ctx.fillText("⚠️ DEMOLISH", preview.x, preview.y - 100);
            }
            ctx.fillText(preview.message, preview.x, preview.y - 80);
            ctx.restore();
        }

        this.ctx.restore();

        // Draw science mini-game in screen space
        if (this.hud.scienceMiniGame) {
            this.hud.scienceMiniGame.draw(this.ctx, this.canvas.width, this.canvas.height);
        }

        // Draw trade route speed boost HUD indicator in screen space (fades smoothly on exit)
        if (this.player.tradeRouteSpeedBoostValue > 1.0) {
            const opacity = Math.min(1, (this.player.tradeRouteSpeedBoostValue - 1.0) / (this.player.tradeRouteMultiplier - 1.0 || 1.5));
            this.ctx.save();
            this.ctx.globalAlpha = opacity;
            this.ctx.fillStyle = this.player.tradeRouteColor || '#00ffcc';
            this.ctx.font = 'bold 15px Orbitron, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = this.player.tradeRouteColor || '#00ffcc';
            this.ctx.fillText('⚡ TRADE ROUTE SPEED BOOST ACTIVE ⚡', this.canvas.width / 2, this.canvas.height - 65);
            this.ctx.restore();
        } else if (this.player.onTradeRoute && !this.player.tradeRouteCharged) {
            // Draw charging drive banner!
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.font = 'bold 13px Orbitron, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.shadowBlur = 5;
            this.ctx.shadowColor = '#ffffff';
            this.ctx.fillText('⚡ ENGAGING HYPER-DRIVE... ⚡', this.canvas.width / 2, this.canvas.height - 65);
            this.ctx.restore();
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

    spawnSquadsForRegion(regionName) {
        this.despawnSquadsForRegion(regionName);

        const region = REGIONS.find(r => r.name === regionName);
        if (!region) return;

        const squadConfigs = SQUAD_DEFINITIONS[regionName] || [];
        for (const config of squadConfigs) {
            if (!this.defeatedSquadIds.has(config.id)) {
                const squad = new Squad(config, region);
                squad.spawn(this);
                this.activeSquads.push(squad);
            }
        }
    }

    despawnSquadsForRegion(regionName) {
        const toDespawn = this.activeSquads.filter(s => s.region.name === regionName);
        for (const squad of toDespawn) {
            squad.despawn(this);
        }
        this.activeSquads = this.activeSquads.filter(s => s.region.name !== regionName);
    }

    checkRegionConquest(regionName) {
        if (this.conqueredRegions.has(regionName)) return true;

        const region = REGIONS.find(r => r.name === regionName);
        if (!region || !region.conquest) return false;

        const kills = this.conquestSessionKills[regionName];
        if (!kills) return false;

        const req = region.conquest;
        if (kills.fighters < req.fighters || kills.battleships < req.battleships || (req.dreadnoughts && kills.dreadnoughts < req.dreadnoughts)) {
            return false;
        }

        // Check if all region squads are defeated
        const regionSquads = SQUAD_DEFINITIONS[regionName] || [];
        for (const s of regionSquads) {
            if (!this.defeatedSquadIds.has(s.id)) {
                return false;
            }
        }

        // Check if all enemy stations (parasites/oppressors) in the region are cleared.
        const regionObjects = this.sectorManager.objects.filter(obj => {
            const cx = obj.x / 1000;
            const cy = -obj.y / 1000;
            return region.test(cx, cy);
        });

        const enemyStations = regionObjects.filter(obj => obj.initialParasite);

        for (const station of enemyStations) {
            if (!this.sectorManager.clearedIds.has(station.id)) {
                return false;
            }
        }

        // Met all requirements! Conquer region
        this.conqueredRegions.add(regionName);
        localStorage.setItem('space_explorer_conquered_regions', JSON.stringify([...this.conqueredRegions]));

        if (this.hud) {
            this.hud.showFloatingReward(`REGION CONQUERED: ${regionName.toUpperCase()}`, '#00ffcc');
            this.hud.showDiscoveryPopup({
                name: regionName,
                type: 'region_conquest',
                description: `You have successfully liberated ${regionName} from hostile forces! It is now permanently secure.`,
                gemReward: region.gemReward || 100,
                sciReward: 50
            });
        }

        this.player.gems += region.gemReward || 100;
        this.player.gemVault += region.gemReward || 100;
        this.player.totalGemsCollected += region.gemReward || 100;
        this.player.addScience(50);

        this.checkClusterCompletion();

        this.player.save();
        return true;
    }

    checkClusterCompletion() {
        for (const cluster of CLUSTERS) {
            if (this.completedClusterIds.has(cluster.id)) continue;

            const allConquered = cluster.regions.every(regName => this.conqueredRegions.has(regName));
            if (allConquered) {
                this.completedClusterIds.add(cluster.id);
                localStorage.setItem('space_explorer_completed_clusters', JSON.stringify([...this.completedClusterIds]));

                // Apply rewards
                if (cluster.reward) {
                    if (cluster.reward.gems) {
                        this.player.gems += cluster.reward.gems;
                        this.player.gemVault += cluster.reward.gems;
                        this.player.totalGemsCollected += cluster.reward.gems;
                        this.hud?.showFloatingReward(`+${cluster.reward.gems} 💎 (Cluster Bonus)`, '#00ffd0');
                    }
                    if (cluster.reward.science) {
                        this.player.addScience(cluster.reward.science);
                        this.hud?.showFloatingReward(`+${cluster.reward.science} SP (Cluster/Sector Secured)`, '#00e5ff');
                    }
                }

                // Trigger dialogue
                if (cluster.dialogue && this.hud) {
                    setTimeout(() => {
                        this.hud.triggerHail(cluster.dialogue.sender || 'NPC', cluster.dialogue);
                    }, 2500);
                }
            }
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
