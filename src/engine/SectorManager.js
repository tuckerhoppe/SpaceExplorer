import { STELLAR_OBJECTS } from '../data/stellarObjects.js';
import { StellarObject } from '../entities/StellarObject.js';
import { Utils } from '../utils.js';
import { NPC_MESSAGES } from '../data/messages.js';
import { REGIONS, DEFAULT_REGION } from '../data/regions.js';

const STORAGE_KEY = 'space_explorer_discovered';
const HAILED_STORAGE_KEY = 'space_explorer_hailed';
const CLEARED_STORAGE_KEY = 'space_explorer_cleared';

export class SectorManager {
    constructor() {
        // Restore cleared set (parasites/oppressors already defeated)
        try {
            const savedCleared = JSON.parse(localStorage.getItem(CLEARED_STORAGE_KEY) || '[]');
            this.clearedIds = new Set(savedCleared);
        } catch {
            this.clearedIds = new Set();
        }

        this.objects = STELLAR_OBJECTS.map(data => {
            const cx = data.worldX / 1000;
            const cy = -data.worldY / 1000;
            let difficulty = DEFAULT_REGION.difficulty;
            let regionName = DEFAULT_REGION.name;
            for (const reg of REGIONS) {
                if (reg.test(cx, cy)) {
                    difficulty = reg.difficulty;
                    regionName = reg.name;
                    break;
                }
            }
            // If this object was previously cleared, don't pass the parasite data
            const cleanData = this.clearedIds.has(data.id) ? { ...data, parasite: null } : data;
            return new StellarObject(cleanData, difficulty, regionName);
        });
        this.dockedAt = null;

        // Restore discovered set from localStorage
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            this.discoveredIds = new Set(saved);
            this.discoveredIds.add('nebula_tutorial'); // Default discovery for tutorial hints
        } catch {
            this.discoveredIds = new Set(['nebula_tutorial']);
        }

        // Restore hailed set from localStorage
        try {
            const savedHailed = JSON.parse(localStorage.getItem(HAILED_STORAGE_KEY) || '[]');
            this.hailedIds = new Set(savedHailed);
        } catch {
            this.hailedIds = new Set();
        }
    }

    discoverAll() {
        for (const obj of this.objects) {
            this.discoveredIds.add(obj.id);
        }
        this._saveDiscovered();
    }

    _saveDiscovered() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.discoveredIds]));
    }

    markHailed(id) {
        this.hailedIds.add(id);
        localStorage.setItem(HAILED_STORAGE_KEY, JSON.stringify([...this.hailedIds]));
    }

    markCleared(id) {
        this.clearedIds.add(id);
        localStorage.setItem(CLEARED_STORAGE_KEY, JSON.stringify([...this.clearedIds]));
    }

    /** Safety check: is it safe to respawn the player at these coordinates?
     * Returns true if no stellar object at (x,y) has an active parasite. */
    isSafeForSpawn(x, y) {
        for (const obj of this.objects) {
            // Check if coordinates match the object center
            if (obj.x === x && obj.y === y) {
                // Return false if there's still a parasite there
                return !obj.parasite;
            }
        }
        return true;
    }

    getRegionDiscoveryProgress(regionName) {
        const regionObjects = this.objects.filter(obj => obj.regionName === regionName);
        const total = regionObjects.length;
        const discovered = regionObjects.filter(obj => this.discoveredIds.has(obj.id)).length;
        return { discovered, total };
    }

    checkDiscovery(player, game) {
        if (player.health <= 0) return;

        for (const obj of this.objects) {
            if (this.discoveredIds.has(obj.id)) continue;

            const d = Utils.dist(player.x, player.y, obj.x, obj.y);
            if (d < obj.radius) {
                // Add to discovered set and persist
                this.discoveredIds.add(obj.id);
                this._saveDiscovered();

                // Award discovery science (25 SP per stellar object — primary science source)
                player.addScience(25);

                // Notify HUD
                game.hud.showDiscoveryPopup(obj);
                game.hud.refreshNavLog();

                // Notify QuestManager
                game.questManager.notify('reach', { target: obj.id, targetType: obj.type, region: obj.regionName });

                // Check for region 100% discovery
                const progress = this.getRegionDiscoveryProgress(obj.regionName);
                if (progress.total > 0 && progress.discovered === progress.total) {
                    this.awardSurveyBonus(obj.regionName, player, game);
                }
            }
        }
    }

    awardSurveyBonus(regionName, player, game) {
        const bonusGems = 500;
        const bonusSci = 50; // Significant science for fully surveying a region
        player.gems += bonusGems;
        player.gemVault = (player.gemVault || 0) + bonusGems;
        player.totalGemsCollected += bonusGems;
        player.addScience(bonusSci);

        if (game.hud) {
            game.hud.showDiscoveryPopup({
                name: regionName,
                type: 'region_survey',
                description: `You have fully discovered the ${regionName}! The Galactic Council awards you a completion bonus.`,
                gemReward: bonusGems,
                sciReward: bonusSci
            });
        }
    }

    checkDocking(player, game) {
        if (player.health <= 0) {
            this.dockedAt = null;
            game.hud.updateDockStatus(null);
            return;
        }

        this.dockedAt = null;
        for (const obj of this.objects) {
            if (Utils.dist(player.x, player.y, obj.x, obj.y) < obj.dockRadius) {
                this.dockedAt = obj;
                // Notify Ghost of the last docked object (so it stops pointing there)
                if (game.ghost && game.ghost.lastDockedId !== obj.id) {
                    game.ghost.lastDockedId = obj.id;
                }
                break;
            }
        }

        // Stop mini-game if no longer docked at the same object
        if (game.hud.scienceMiniGame.active && (!this.dockedAt || this.dockedAt.id !== game.hud.scienceMiniGame.stellarObject?.id)) {
            game.hud.scienceMiniGame.stop();
        }

        if (this.dockedAt && !this.dockedAt.parasite) {
            const f = game._dockFrame;

            // === STATION: Deposit cargo gems into vault ===
            if (this.dockedAt.type === 'station') {
                // Record last docked station position for respawn
                player.lastStationX = this.dockedAt.x;
                player.lastStationY = this.dockedAt.y;

                // Deposit all cargo on first frame of docking (and whenever new cargo arrives)
                if (player.cargoGems > 0 && !this._depositedThisDock) {
                    const deposited = player.cargoGems;
                    player.gems += deposited;
                    player.gemVault += deposited;
                    player.cargoGems = 0;
                    player.save();
                    if (game.hud) game.hud.showFloatingReward(`+${deposited} 💎 DEPOSITED`, '#ffe066');
                    this._depositedThisDock = true;
                }
                // Reset flag so re-docking after collecting more cargo works
                if (player.cargoGems === 0) {
                    this._depositedThisDock = false;
                }
            }

            if (this.dockedAt.dockEffect === 'heal') {
                // Heal 1 HP every 30 frames (~2 HP/sec)
                if (f % 30 === 0 && player.health < player.maxHealth) {
                    player.health = Math.min(player.maxHealth, player.health + 1);
                    if (game.hud) game.hud.showFloatingReward('+1 ❤️', '#ff6b6b');
                }
            } else if (this.dockedAt.dockEffect === 'gems') {
                // +1 gem every 90 frames (~0.67 gems/sec)
                if (f % 90 === 0) {
                    player.gems += 1;
                    player.gemVault += 1;
                    player.totalGemsCollected += 1;
                    if (game.hud) game.hud.showFloatingReward('+1 💎', '#00ffd0');
                }
            }

            // Science from docking: stars give 2 SP, nebulas give 1 SP, every 180 frames (~3 sec)
            if (f % 180 === 0 && this.dockedAt.maxScience > 0) {
                // If mini-game is active, only award automatic science if the player isn't actively hitting skill checks
                // or maybe just reduce it. Let's start the mini-game if it's not active.
                if (!game.hud.scienceMiniGame.active && !game.hud.scienceMiniGame.result) {
                    const sciEarned = player.scienceEarned[this.dockedAt.id] || 0;
                    if (sciEarned < this.dockedAt.maxScience) {
                        game.hud.scienceMiniGame.start(this.dockedAt);
                    }
                }

                const spGain = this.dockedAt.type === 'star' ? 2 : 1;
                const before = player.sciencePoints;
                player.addScience(spGain, this.dockedAt.id, this.dockedAt.maxScience);
                const gained = player.sciencePoints - before;
                
                // Only show and notify if science was actually awarded (not already at cap)
                if (gained > 0 && game.hud) {
                    game.hud.showFloatingReward(`+${gained} 🔬`, '#50dc78');
                    game.questManager.notify('science', { 
                        success: true, 
                        amount: gained, 
                        target: this.dockedAt.id,
                        region: this.dockedAt.regionName
                    });
                }
            }
        }

        game.hud.updateDockStatus(this.dockedAt);
    }

    checkComms(player, game) {
        if (player.health <= 0) return;

        for (const obj of this.objects) {
            if (!this.discoveredIds.has(obj.id)) continue;
            if (obj.parasite) continue;
            if (obj.type !== 'planet' && obj.type !== 'station') continue;

            const d = Utils.dist(player.x, player.y, obj.x, obj.y);
            if (d < 1200) {
                if (obj.lastCommsFrame === undefined) obj.lastCommsFrame = -1800; // Ready immediately

                if (game._dockFrame - obj.lastCommsFrame > 1800) { // ~30 seconds cooldown
                    obj.lastCommsFrame = game._dockFrame;
                    if (game.hud && typeof game.hud.addCommsMessage === 'function') {
                        const msgs = NPC_MESSAGES[obj.type];
                        if (msgs && msgs.length > 0) {
                            const msg = msgs[Math.floor(Math.random() * msgs.length)];
                            game.hud.addCommsMessage({ sender: obj.name.toUpperCase(), text: msg, entity: "neutral" });
                        }
                    }
                }
            }
        }
    }

    draw(ctx, camera, player) {
        for (const obj of this.objects) {
            const sciEarned = player?.scienceEarned?.[obj.id] || 0;
            obj.draw(ctx, this.discoveredIds.has(obj.id), camera, sciEarned);
            if (obj.parasite) {
                obj.parasite.draw(ctx, camera);
            }
        }
    }
}
