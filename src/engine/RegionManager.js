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
            this._prevRegion = newRegion;
            if (game?.questManager) {
                game.questManager.notify('reach', { region: newRegion.name });
            }

            // Home Region Ambush Trigger
            if (newRegion.name === 'Home Region' && game?.hud && game?.questManager) {
                if (!game.questManager.completedQuestIds.has('region_home_defense') && 
                    !game.questManager.activeQuests.find(q => q.id === 'region_home_defense')) {
                    game.hud.triggerHail('COMMODORE REED', 'home_region_ambush');
                }
            }

            // First-time discovery: award gems + science and show combined popup
            if (newRegion !== DEFAULT_REGION && !this.discoveredRegions.has(newRegion.name)) {
                this.discoveredRegions.add(newRegion.name);
                localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.discoveredRegions]));

                const reward = newRegion.gemReward || 0;
                if (reward > 0 && game?.player) {
                    game.player.gems += reward;
                    game.player.totalGemsCollected += reward;
                }
                // +50 SP for discovering a new region (primary science source)
                if (game?.player) game.player.addScience(50);
                // Show discovery popup with rewards (replaces separate showRegionReward call)
                if (game?.hud) game.hud.showRegionDiscovery(newRegion, reward, 50);
            } else if (newRegion !== DEFAULT_REGION && game?.hud) {
                // Repeat entry — auto-dismiss popup, no rewards
                game.hud.showRegionDiscovery(newRegion);
            }
        }
    }

    get caps() {
        return this.currentRegion.caps;
    }
}
