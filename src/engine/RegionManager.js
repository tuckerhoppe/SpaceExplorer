import { REGIONS, DEFAULT_REGION } from '../data/regions.js';

const STORAGE_KEY = 'space_explorer_regions';

export class RegionManager {
    constructor() {
        this.currentRegion = DEFAULT_REGION;
        this._prevRegion = null;

        // Restore discovered regions from localStorage
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            this.discoveredRegions = new Set(saved);
            this.discoveredRegions.add('Home Region'); // Default discovery for tutorial hints
        } catch {
            this.discoveredRegions = new Set(['Home Region']);
        }

        // Session-level flags (not persisted)
        this._hasHailedHome = false;
        this._lastExitTimes = new Map();
    }

    discoverAll() {
        for (const region of REGIONS) {
            if (region !== DEFAULT_REGION) {
                this.discoveredRegions.add(region.name);
            }
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.discoveredRegions]));
    }

    /**
     * Call once per frame in Game.update().
     * - Shows an entry popup every time the player moves into a new region.
     * - On the FIRST entry to a named region: awards gems and shows reward popup.
     */
    update(player, game) {
        const coordX = player.x / 1000;
        const coordY = -player.y / 1000; // canvas Y is inverted

        let newRegion = DEFAULT_REGION;
        for (const region of REGIONS) {
            if (region.test(coordX, coordY)) {
                newRegion = region;
                break;
            }
        }

        this.currentRegion = newRegion;

        if (newRegion !== this._prevRegion) {
            // Track when we left the old region
            if (this._prevRegion) {
                this._lastExitTimes.set(this._prevRegion.name, Date.now());
            }

            this._prevRegion = newRegion;
            
            if (game?.questManager) {
                game.questManager.notify('reach', { region: newRegion.name });
            }

            // Home Region Ambush Trigger
            if (newRegion.name === 'Home Region' && game?.hud && game?.questManager && !this._hasHailedHome) {
                if (!game.questManager.isQuestCompletedOrActive('region_home_defense')) {
                    this._hasHailedHome = true;
                    game.hud.triggerHail('COMMODORE REED', 'home_region_ambush');
                }
            }

            // --- VISUAL POPUP COOLDOWN LOGIC ---
            const now = Date.now();
            const lastExit = this._lastExitTimes.get(newRegion.name) || 0;
            const isReturningQuickly = (now - lastExit) < 30000; // 30 second returning-too-soon window

            if (newRegion !== DEFAULT_REGION && !isReturningQuickly) {
                if (!this.discoveredRegions.has(newRegion.name)) {
                    // First-time discovery: award gems + science and show combined popup
                    this.discoveredRegions.add(newRegion.name);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.discoveredRegions]));

                    const reward = newRegion.gemReward || 0;
                    if (reward > 0 && game?.player) {
                        game.player.gems += reward;
                        game.player.totalGemsCollected += reward;
                    }
                    if (game?.player) game.player.addScience(50);
                    if (game?.hud) game.hud.showRegionDiscovery(newRegion, reward, 50);
                } else if (game?.hud) {
                    // Repeat entry — show informational popup only
                    game.hud.showRegionDiscovery(newRegion);
                }
            }
        }
    }

    get caps() {
        return this.currentRegion.caps;
    }
}
