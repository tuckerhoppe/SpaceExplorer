import { REGIONS, DEFAULT_REGION } from '../data/regions.js';
import { CLUSTERS } from '../data/clusters.js';

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
        this._lastClusterExitTimes = new Map();
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

            // Clear exit time of the region we just entered
            this._lastExitTimes.delete(newRegion.name);

            // First-time discovery check
            let isFirstTime = false;
            let reward = 0;
            if (newRegion !== DEFAULT_REGION && !this.discoveredRegions.has(newRegion.name)) {
                isFirstTime = true;
                this.discoveredRegions.add(newRegion.name);
                localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.discoveredRegions]));

                reward = newRegion.gemReward || 0;
                if (reward > 0 && game?.player) {
                    game.player.gems += reward;
                    game.player.totalGemsCollected += reward;
                }
                if (game?.player) game.player.addScience(50);
            }

            // Check cluster transition
            const newCluster = CLUSTERS.find(c => c.regions.includes(newRegion.name));
            const prevCluster = this._prevRegion ? CLUSTERS.find(c => c.regions.includes(this._prevRegion.name)) : null;

            // Track cluster exit
            if (prevCluster && newCluster !== prevCluster) {
                this._lastClusterExitTimes.set(prevCluster.id, Date.now());
            }

            let showRegionImmediately = true;
            if (newCluster && newCluster !== prevCluster) {
                const lastExit = this._lastClusterExitTimes.get(newCluster.id) || 0;
                const isReturningQuickly = (Date.now() - lastExit) < 20000;

                if (!isReturningQuickly) {
                    if (game?.hud && typeof game.hud.showClusterAnnouncement === 'function') {
                        game.hud.showClusterAnnouncement(newCluster.name);
                        if (isFirstTime) {
                            showRegionImmediately = false;
                            // Delay the region discovery pop-up by 4 seconds (duration of cluster banner animation)
                            setTimeout(() => {
                                if (game?.hud) {
                                    game.hud.showRegionDiscovery(newRegion, reward, 50);
                                }
                            }, 4000);
                        }
                    }
                }
            }

            if (isFirstTime && showRegionImmediately) {
                if (game?.hud) {
                    game.hud.showRegionDiscovery(newRegion, reward, 50);
                }
            }

            this._prevRegion = newRegion;

            if (game?.spawnSquadsForRegion) {
                game.spawnSquadsForRegion(newRegion.name);
            }

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
        }
    }

    draw(ctx, camera) {
        ctx.save();

        const tick = Date.now() / 150;

        for (const region of REGIONS) {
            if (!region.bounds) continue;

            const rx1 = region.bounds.minX * 1000;
            const rx2 = region.bounds.maxX * 1000;
            const ry1 = -region.bounds.maxY * 1000;
            const ry2 = -region.bounds.minY * 1000;

            // Viewport culling to only draw visible regions
            if (rx2 < camera.x || rx1 > camera.x + camera.viewW ||
                ry2 < camera.y || ry1 > camera.y + camera.viewH) {
                continue;
            }

            // 1. Watermarked Region Name in the center
            const cx = (rx1 + rx2) / 2;
            const cy = (ry1 + ry2) / 2;
            ctx.fillStyle = (region.color || '#ffffff') + '15'; // Very subtle watermark
            ctx.font = '900 64px Orbitron, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(region.name.toUpperCase(), cx, cy);

            // 2. Corner Accents (Solid brackets)
            const len = 30;
            ctx.strokeStyle = (region.color || '#ffffff') + 'aa';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);

            // Top-left
            ctx.beginPath();
            ctx.moveTo(rx1 + len, ry1); ctx.lineTo(rx1, ry1); ctx.lineTo(rx1, ry1 + len);
            ctx.stroke();

            // Top-right
            ctx.beginPath();
            ctx.moveTo(rx2 - len, ry1); ctx.lineTo(rx2, ry1); ctx.lineTo(rx2, ry1 + len);
            ctx.stroke();

            // Bottom-left
            ctx.beginPath();
            ctx.moveTo(rx1 + len, ry2); ctx.lineTo(rx1, ry2); ctx.lineTo(rx1, ry2 - len);
            ctx.stroke();

            // Bottom-right
            ctx.beginPath();
            ctx.moveTo(rx2 - len, ry2); ctx.lineTo(rx2, ry2); ctx.lineTo(rx2, ry2 - len);
            ctx.stroke();

            // 3. Animated Glowing Dotted Border
            // Outer wider glow line
            ctx.strokeStyle = (region.color || '#ffffff') + '22';
            ctx.lineWidth = 6;
            ctx.setLineDash([12, 18]);
            ctx.lineDashOffset = -tick * 1.5;
            ctx.beginPath();
            ctx.rect(rx1, ry1, rx2 - rx1, ry2 - ry1);
            ctx.stroke();

            // Inner sharp line
            ctx.strokeStyle = (region.color || '#ffffff') + '88';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([12, 18]);
            ctx.lineDashOffset = -tick * 1.5;
            ctx.beginPath();
            ctx.rect(rx1, ry1, rx2 - rx1, ry2 - ry1);
            ctx.stroke();
        }

        ctx.restore();
    }

    get caps() {
        return this.currentRegion.caps;
    }
}

