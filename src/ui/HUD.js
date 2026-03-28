import { UPGRADES, TECH_UPGRADES, SHIPS } from '../config.js';
import { QUESTS } from '../data/quests.js';
import { REGIONS, DEFAULT_REGION } from '../data/regions.js';
import { ScienceMiniGame } from './ScienceMiniGame.js';
import { MiniMap } from './MiniMap.js';

export class HUD {
    constructor(game) {
        this.game = game;
        this.scienceMiniGame = new ScienceMiniGame(game);
        this.objectivesPanel = document.getElementById('objectives-panel');
        this._lastObjectivesHtml = '';
        this._lastQuestIds = '';
        this.mapState = { offsetX: 0, offsetY: 0, zoom: 1, isDragging: false, lastMouse: {x: 0, y: 0}, hoverObj: null, maxZoom: 3, minZoom: 0.5 };
        this.miniMap = new MiniMap(game);
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (window.__hudKeydownHandler) {
            window.removeEventListener('keydown', window.__hudKeydownHandler);
        }

        window.__hudKeydownHandler = (e) => {
            if (e.key === 'Escape' && !this.game.gameOver) {
                this.game.toggleUpgrades();
            }
            if (e.key === '`') {
                this.toggleDevHud();
            }
            // Tab — toggle between Thruster and Boost engine
            if (e.key === 'Tab') {
                e.preventDefault();
                this.game.player.toggleEngine();
                this._refreshEngineModeUI();
            }
            // Hails are now auto-accepted
            // Map hotkey
            if ((e.key === 'm' || e.key === 'M') && !this.game.gameOver && !this.pendingHail) {
                this.toggleMap();
            }

            // Science Mini-game Skill Check
            if (e.key === ' ' && this.scienceMiniGame.active) {
                e.preventDefault();
                const result = this.scienceMiniGame.checkHit();
                if (result) {
                    this.handleMiniGameResult(result);
                }
            }
        };

        window.addEventListener('keydown', window.__hudKeydownHandler);

        const tabUpgrades = document.getElementById('tab-upgrades');
        const tabShips = document.getElementById('tab-ships');
        const tabTech = document.getElementById('tab-tech');
        const tabObjectives = document.getElementById('tab-objectives');
        const tabCodex = document.getElementById('tab-codex');
        const tabSettings = document.getElementById('tab-settings');
        const contentUpgrades = document.getElementById('content-upgrades');
        const contentShips = document.getElementById('content-ships');
        const contentTech = document.getElementById('content-tech');
        const contentObjectives = document.getElementById('content-objectives');
        const contentCodex = document.getElementById('content-codex');
        const contentSettings = document.getElementById('content-settings');

        const resetTabs = () => {
            tabUpgrades.classList.remove('active');
            tabShips.classList.remove('active');
            tabTech.classList.remove('active');
            if (tabObjectives) tabObjectives.classList.remove('active');
            if (tabCodex) tabCodex.classList.remove('active');
            tabSettings.classList.remove('active');
            contentUpgrades.classList.add('hidden');
            contentUpgrades.classList.remove('active');
            contentShips.classList.add('hidden');
            contentShips.classList.remove('active');
            contentTech.classList.add('hidden');
            contentTech.classList.remove('active');
            if (contentObjectives) {
                contentObjectives.classList.add('hidden');
                contentObjectives.classList.remove('active');
            }
            if (contentCodex) {
                contentCodex.classList.add('hidden');
                contentCodex.classList.remove('active');
            }
            contentSettings.classList.add('hidden');
            contentSettings.classList.remove('active');
        };

        if (tabUpgrades && tabShips && tabTech && tabSettings) {
            tabUpgrades.addEventListener('click', () => {
                resetTabs();
                tabUpgrades.classList.add('active');
                if (contentUpgrades) contentUpgrades.classList.remove('hidden');
                if (contentUpgrades) contentUpgrades.classList.add('active');
            });
            tabShips.addEventListener('click', () => {
                resetTabs();
                tabShips.classList.add('active');
                if (contentShips) contentShips.classList.remove('hidden');
                if (contentShips) contentShips.classList.add('active');
            });
            tabTech.addEventListener('click', () => {
                resetTabs();
                tabTech.classList.add('active');
                if (contentTech) contentTech.classList.remove('hidden');
                if (contentTech) contentTech.classList.add('active');
            });
            if (tabObjectives) {
                tabObjectives.addEventListener('click', () => {
                    resetTabs();
                    tabObjectives.classList.add('active');
                    if (contentObjectives) contentObjectives.classList.remove('hidden');
                    if (contentObjectives) contentObjectives.classList.add('active');
                    this.refreshObjectivesTab();
                });
            }
            if (tabCodex) {
                tabCodex.addEventListener('click', () => {
                    resetTabs();
                    tabCodex.classList.add('active');
                    if (contentCodex) contentCodex.classList.remove('hidden');
                    if (contentCodex) contentCodex.classList.add('active');
                    this.refreshCodex();
                });
            }
            tabSettings.addEventListener('click', () => {
                resetTabs();
                tabSettings.classList.add('active');
                if (contentSettings) contentSettings.classList.remove('hidden');
                if (contentSettings) contentSettings.classList.add('active');
            });
        }

        const resumeBtn = document.getElementById('resume-btn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => this.game.toggleUpgrades());
        }
        this.bindButton('restart-btn', () => location.reload());

        // Dev: reset all saved progress and reload
        this.bindButton('dev-reset-btn', () => {
            if (!confirm('Reset ALL progress? This clears discoveries, regions, quests, and settings.')) return;

            const keysToRemove = [
                'space_explorer_discovered',
                'space_explorer_regions',
                'space_explorer_science',
                'space_explorer_progress',
                'space_explorer_hailed',
                'space_explorer_quests',
                'setting_dynamic_zoom',
                'setting_nav_hints',
                'setting_show_stats',
                'setting_show_nav_log',
                'setting_ghost_dialogue',
                'setting_dev_mode'
            ];

            keysToRemove.forEach(k => localStorage.removeItem(k));
            location.reload();
        });

        // Engine mode toggle button
        this.bindButton('engine-toggle-btn', () => {
            this.game.player.toggleEngine();
            this._refreshEngineModeUI();
        });

        // Hail alert bindings
        this.bindButton('hail-done-btn', () => {
            document.getElementById('hail-modal').classList.add('hidden');
            this._resumeFromPopup();
        });

        // Map bindings
        this.bindButton('map-close-btn', () => this.toggleMap());

        const mapContainer = document.getElementById('map-container');
        if (mapContainer) {
            mapContainer.addEventListener('mousedown', (e) => {
                this.mapState.isDragging = true;
                this.mapState.lastMouse = { x: e.clientX, y: e.clientY };
            });
            window.addEventListener('mousemove', (e) => {
                if (!this.mapState.isDragging) return;
                const dx = e.clientX - this.mapState.lastMouse.x;
                const dy = e.clientY - this.mapState.lastMouse.y;
                this.mapState.offsetX += dx / this.mapState.zoom;
                this.mapState.offsetY += dy / this.mapState.zoom;
                this.mapState.lastMouse = { x: e.clientX, y: e.clientY };
                this.renderMap();
            });
            window.addEventListener('mouseup', () => {
                this.mapState.isDragging = false;
            });
            mapContainer.addEventListener('wheel', (e) => {
                e.preventDefault();
                const zoomFactor = 1.1;
                if (e.deltaY < 0) this.mapState.zoom = Math.min(this.mapState.maxZoom, this.mapState.zoom * zoomFactor);
                else this.mapState.zoom = Math.max(this.mapState.minZoom, this.mapState.zoom / zoomFactor);
                this.renderMap();
            });
            mapContainer.addEventListener('mousemove', (e) => {
                if (this.mapState.isDragging) return;
                const canvas = document.getElementById('mapCanvas');
                if (!canvas) return;
                const rect = canvas.getBoundingClientRect();
                const mouseX = (e.clientX - rect.left) * (600 / rect.width);
                const mouseY = (e.clientY - rect.top) * (600 / rect.height);
                this._handleMapHover(mouseX, mouseY, e.clientX, e.clientY);
            });
            mapContainer.addEventListener('mouseleave', () => {
                const tooltip = document.getElementById('map-tooltip');
                if (tooltip) tooltip.style.opacity = '0';
                this.mapState.hoverObj = null;
                this.renderMap();
            });
        }

        // Settings
        const zoomSettingCheckbox = document.getElementById('setting-dynamic-zoom');
        if (zoomSettingCheckbox) {
            // Initialize checkbox based on local storage
            const savedSetting = localStorage.getItem('setting_dynamic_zoom');
            const isZoomEnabled = savedSetting !== 'false'; // Defaults to true
            zoomSettingCheckbox.checked = isZoomEnabled;

            zoomSettingCheckbox.addEventListener('change', (e) => {
                const isEnabled = e.target.checked;
                localStorage.setItem('setting_dynamic_zoom', isEnabled ? 'true' : 'false');
                if (this.game.settings) {
                    this.game.settings.dynamicZoom = isEnabled;
                }
            });
        }
        
        const ghostDialogueCheckbox = document.getElementById('setting-ghost-dialogue');
        if (ghostDialogueCheckbox) {
            const savedSetting = localStorage.getItem('setting_ghost_dialogue');
            const isEnabled = savedSetting === 'true'; // Default to OFF
            ghostDialogueCheckbox.checked = isEnabled;

            ghostDialogueCheckbox.addEventListener('change', (e) => {
                const isEnabled = e.target.checked;
                localStorage.setItem('setting_ghost_dialogue', isEnabled ? 'true' : 'false');
                if (this.game.settings) {
                    this.game.settings.ghostDialogue = isEnabled;
                }
            });
        }

        const devModeCheckbox = document.getElementById('setting-dev-mode');
        if (devModeCheckbox) {
            const isDevMode = localStorage.getItem('setting_dev_mode') === 'true';
            devModeCheckbox.checked = isDevMode;

            devModeCheckbox.addEventListener('change', (e) => {
                const isEnabled = e.target.checked;
                localStorage.setItem('setting_dev_mode', isEnabled ? 'true' : 'false');
                if (this.game.settings) {
                    this.game.settings.devMode = isEnabled;
                    if (isEnabled) {
                        this.game.applyDevMode();
                    }
                }
            });
        }

        const navHintsCheckbox = document.getElementById('setting-nav-hints');
        if (navHintsCheckbox) {
            // Initialize checkbox based on local storage
            const savedNavHints = localStorage.getItem('setting_nav_hints');
            const isNavHintsEnabled = savedNavHints !== 'false'; // Defaults to true
            navHintsCheckbox.checked = isNavHintsEnabled;

            navHintsCheckbox.addEventListener('change', (e) => {
                const isEnabled = e.target.checked;
                localStorage.setItem('setting_nav_hints', isEnabled ? 'true' : 'false');
                if (this.game.settings) {
                    this.game.settings.navHints = isEnabled;
                }
            });
        }

        const showStatsCheckbox = document.getElementById('setting-show-stats');
        if (showStatsCheckbox) {
            const savedShowStats = localStorage.getItem('setting_show_stats');
            const isEnabled = savedShowStats === 'true'; // Default to OFF
            showStatsCheckbox.checked = isEnabled;
            
            const statsPanel = document.getElementById('stats-panel');
            if (statsPanel) {
                statsPanel.classList.toggle('hidden', !isEnabled);
            }

            showStatsCheckbox.addEventListener('change', (e) => {
                const isEnabled = e.target.checked;
                localStorage.setItem('setting_show_stats', isEnabled ? 'true' : 'false');
                const panel = document.getElementById('stats-panel');
                if (panel) panel.classList.toggle('hidden', !isEnabled);
            });
        }

        const showNavLogCheckbox = document.getElementById('setting-show-nav-log');
        if (showNavLogCheckbox) {
            const savedShowNavLog = localStorage.getItem('setting_show_nav_log');
            const isEnabled = savedShowNavLog === 'true'; // Default to OFF
            showNavLogCheckbox.checked = isEnabled;
            
            const navLogPanel = document.getElementById('nav-log-panel');
            if (navLogPanel) {
                navLogPanel.classList.toggle('hidden', !isEnabled);
            }

            showNavLogCheckbox.addEventListener('change', (e) => {
                const isEnabled = e.target.checked;
                localStorage.setItem('setting_show_nav_log', isEnabled ? 'true' : 'false');
                const panel = document.getElementById('nav-log-panel');
                if (panel) panel.classList.toggle('hidden', !isEnabled);
            });
        }

        const discoverAllCheckbox = document.getElementById('setting-discover-all');
        if (discoverAllCheckbox) {
            const isEnabled = localStorage.getItem('setting_discover_all') === 'true';
            discoverAllCheckbox.checked = isEnabled;

            discoverAllCheckbox.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                localStorage.setItem('setting_discover_all', isChecked ? 'true' : 'false');
                if (isChecked) {
                    this.game.discoverAll();
                }
            });
        }
    }

    bindButton(id, handler) {
        const btn = document.getElementById(id);
        if (!btn) return;
        if (btn._hudHandler) {
            btn.removeEventListener('click', btn._hudHandler);
        }
        btn._hudHandler = handler;
        btn.addEventListener('click', btn._hudHandler);
    }

    toggleDevHud() {
        const panel = document.getElementById('dev-hud-panel');
        const isHidden = panel.classList.toggle('hidden');
        if (!isHidden) {
            // Populate dev nav log every time it opens
            this.buildDevNavLog();
        }
    }

    buildDevNavLog() {
        const container = document.getElementById('dev-nav-log');
        const sm = this.game.sectorManager;
        if (!sm || !container) return;

        const TYPE_ICONS = { planet: '🪐', nebula: '🌌', star: '⭐', artifact: '💠' };
        container.innerHTML = '';
        sm.objects.forEach(obj => {
            const isDiscovered = sm.discoveredIds.has(obj.id);
            const row = document.createElement('div');
            row.className = `dev-obj-row ${isDiscovered ? 'dev-obj-discovered' : 'dev-obj-undiscovered'}`;
            row.innerHTML = `
                <span class="dev-obj-icon">${TYPE_ICONS[obj.type] || '✦'}</span>
                <span class="dev-obj-name">${obj.name}</span>
                <span class="dev-obj-coord">${obj.coordX}:${obj.coordY}</span>
            `;
            container.appendChild(row);
        });
    }

    setupUpgrades() {
        const list = document.getElementById('upgrade-list');
        list.innerHTML = '';
        UPGRADES.forEach(u => {
            const card = document.createElement('div');
            card.className = 'upgrade-card';
            const sciTag = u.sciLevel > 0
                ? `<div class="upgrade-sci-req" data-req="${u.sciLevel}">🔬 Sci Lvl ${u.sciLevel} required</div>`
                : '';
            card.innerHTML = `
                <div class="upgrade-info">
                    <div class="upgrade-name">${u.name}</div>
                    <div class="upgrade-level">Level ${this.game.player.stats[u.id]}</div>
                    <div class="upgrade-desc">${u.desc}</div>
                    ${sciTag}
                </div>
                <div class="upgrade-action">
                    <div class="upgrade-cost"></div>
                    <button class="btn buy-btn" data-id="${u.id}">Upgrade</button>
                </div>
            `;
            list.appendChild(card);
        });

        list.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const def = UPGRADES.find(x => x.id === id);
                const currentLevel = this.game.player.stats[id];
                if (currentLevel >= 5) return; // MAX level reached
                const cost = def.baseCost * currentLevel;
                const sciOk = this.game.player.scienceLevel >= (def.sciLevel || 0);
                if (sciOk && this.game.player.gems >= cost) {
                    this.game.player.gems -= cost;
                    this.game.player.stats[id]++;
                    if (id === 'hull') {
                        this.game.player.health += 20;
                    }
                    this.refreshUpgrades();
                    this.update(this.game.player);
                    this.game.player.save();
                }
            });
        });
        this.setupTechUpgrades();
        this.refreshUpgrades();
    }

    refreshUpgrades() {
        const list = document.getElementById('upgrade-list');
        const sciLevel = this.game.player.scienceLevel;
        UPGRADES.forEach((u, index) => {
            const level = this.game.player.stats[u.id];
            const cost = u.baseCost * level;
            const card = list.children[index];
            const isMaxed = level >= 5;
            card.querySelector('.upgrade-level').textContent = isMaxed ? `Level ${level} (MAX)` : `Level ${level}`;
            card.querySelector('.upgrade-cost').textContent = isMaxed ? 'MAX' : `${cost} 💎`;

            const sciOk = sciLevel >= (u.sciLevel || 0);
            const canAfford = this.game.player.gems >= cost;
            const btn = card.querySelector('.buy-btn');
            btn.disabled = isMaxed || !sciOk || !canAfford;
            if (isMaxed) {
                btn.textContent = 'Maxed';
            } else {
                btn.textContent = 'Upgrade';
            }

            // Update science req badge colour
            const sciReq = card.querySelector('.upgrade-sci-req');
            if (sciReq) {
                sciReq.classList.toggle('sci-req-met', sciOk);
                sciReq.classList.toggle('sci-req-miss', !sciOk);
            }
        });
    }

    setupShips() {
        const list = document.getElementById('ship-list');
        list.innerHTML = '';
        SHIPS.forEach((s, index) => {
            const card = document.createElement('div');
            card.className = 'upgrade-card';
            const sciTag = s.sciLevel > 0
                ? `<div class="upgrade-sci-req" data-req="${s.sciLevel}">🔬 Sci Lvl ${s.sciLevel} required</div>`
                : '';

            // Format stat bonuses for display
            const bonuses = [];
            if (s.stats.hull > 0) bonuses.push(`+${s.stats.hull * 20} Hull`);
            if (s.stats.engine > 0) bonuses.push(`+${s.stats.engine} Thruster/Boost`);
            if (s.stats.weapons > 0) bonuses.push(`+${s.stats.weapons * 5} DMG`);
            if (s.stats.magnet > 0) bonuses.push(`+${s.stats.magnet * 50} Magnet`);
            const bonusText = bonuses.length > 0 ? `<div class="upgrade-level">Bonuses: ${bonuses.join(', ')}</div>` : `<div class="upgrade-level" style="color:#aaa;">No Bonuses</div>`;

            card.innerHTML = `
                <div class="ship-preview-container">
                    <canvas class="ship-preview-canvas" id="ship-canvas-${index}" width="60" height="60"></canvas>
                </div>
                <div class="upgrade-info">
                    <div class="upgrade-name">${s.name}</div>
                    ${bonusText}
                    <div class="upgrade-desc">${s.desc}</div>
                    ${sciTag}
                </div>
                <div class="upgrade-action">
                    <div class="upgrade-cost">${s.cost > 0 ? s.cost + ' 💎' : 'FREE'}</div>
                    <button class="btn buy-btn" data-index="${index}">Buy</button>
                </div>
            `;
            list.appendChild(card);

            // Draw the ship on the canvas
            const canvas = document.getElementById(`ship-canvas-${index}`);
            const ctx = canvas.getContext('2d');
            ctx.translate(30, 30);
            ctx.rotate(-Math.PI / 4); // Turn slightly to face top-right
            ctx.fillStyle = '#0a0f1e';
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2;
            s.drawShape(ctx, 15);
        });

        list.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index, 10);
                if (index === this.game.player.shipIndex) return; // Already owned

                const ship = SHIPS[index];
                const sciOk = this.game.player.scienceLevel >= (ship.sciLevel || 0);

                if (sciOk && this.game.player.gems >= ship.cost) {
                    this.game.player.gems -= ship.cost;
                    this.game.player.shipIndex = index;

                    // Restore health proportional to new max health if it jumped (or just heal to full on buy)
                    this.game.player.health = this.game.player.maxHealth;

                    this.refreshShips();
                    this.update(this.game.player);
                    this.game.player.save();
                }
            });
        });
        this.refreshShips();
    }

    refreshShips() {
        if (!document.getElementById('ship-list')) return;
        const list = document.getElementById('ship-list');
        const sciLevel = this.game.player.scienceLevel;

        SHIPS.forEach((s, index) => {
            const card = list.children[index];
            if (!card) return;

            const isOwned = this.game.player.shipIndex === index;
            const sciOk = sciLevel >= (s.sciLevel || 0);
            const canAfford = this.game.player.gems >= s.cost;
            const btn = card.querySelector('.buy-btn');

            if (isOwned) {
                btn.textContent = 'Equipped';
                btn.disabled = true;
                btn.style.opacity = '1';
                btn.style.borderColor = '#00f0ff';
                btn.style.color = '#00f0ff';
                btn.style.background = 'rgba(0, 240, 255, 0.1)';
            } else {
                btn.textContent = 'Buy';
                btn.disabled = !sciOk || !canAfford;
                btn.style.opacity = '';
                btn.style.borderColor = '';
                btn.style.color = '';
                btn.style.background = '';
            }

            const sciReq = card.querySelector('.upgrade-sci-req');
            if (sciReq) {
                sciReq.classList.toggle('sci-req-met', sciOk);
                sciReq.classList.toggle('sci-req-miss', !sciOk);
            }
        });
    }

    setupTechUpgrades() {
        const list = document.getElementById('tech-list');
        if (!list) return;
        list.innerHTML = '';
        TECH_UPGRADES.forEach(u => {
            const card = document.createElement('div');
            card.className = 'upgrade-card';
            const sciTag = u.sciLevel > 0
                ? `<div class="upgrade-sci-req" data-req="${u.sciLevel}">🔬 Sci Lvl ${u.sciLevel} required</div>`
                : '';
            card.innerHTML = `
                <div class="upgrade-info">
                    <div class="upgrade-name">${u.name}</div>
                    <div class="upgrade-desc">${u.desc}</div>
                    ${sciTag}
                </div>
                <div class="upgrade-action">
                    <div class="upgrade-cost">${u.cost} 💎</div>
                    <button class="btn buy-btn" data-id="${u.id}">Buy Tech</button>
                </div>
            `;
            list.appendChild(card);
        });

        list.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const def = TECH_UPGRADES.find(x => x.id === id);
                if (this.game.player.tech[id]) return; // Already owned
                
                const sciOk = this.game.player.scienceLevel >= (def.sciLevel || 0);
                if (sciOk && this.game.player.gems >= def.cost) {
                    this.game.player.gems -= def.cost;
                    this.game.player.tech[id] = true;
                    this.refreshTechUpgrades();
                    this.update(this.game.player);
                    this.game.player.save();
                }
            });
        });
        this.refreshTechUpgrades();
    }

    refreshTechUpgrades() {
        const list = document.getElementById('tech-list');
        if (!list || list.children.length === 0) return;
        const sciLevel = this.game.player.scienceLevel;
        TECH_UPGRADES.forEach((u, index) => {
            const card = list.children[index];
            if (!card) return;
            const isOwned = this.game.player.tech[u.id];
            const sciOk = sciLevel >= (u.sciLevel || 0);
            const canAfford = this.game.player.gems >= u.cost;
            const btn = card.querySelector('.buy-btn');

            if (isOwned) {
                btn.textContent = 'Owned';
                btn.disabled = true;
                btn.style.opacity = '1';
                btn.style.borderColor = '#00f0ff';
                btn.style.color = '#00f0ff';
                btn.style.background = 'rgba(0, 240, 255, 0.1)';
            } else {
                btn.textContent = 'Buy Tech';
                btn.disabled = !sciOk || !canAfford;
            }

            const sciReq = card.querySelector('.upgrade-sci-req');
            if (sciReq) {
                sciReq.classList.toggle('sci-req-met', sciOk);
                sciReq.classList.toggle('sci-req-miss', !sciOk);
            }
        });
    }

    refreshCodex() {
        const list = document.getElementById('codex-list');
        if (!list) return;
        
        const sm = this.game.sectorManager;
        const player = this.game.player;
        if (!sm || !player) return;

        const discovered = sm.objects.filter(obj => sm.discoveredIds.has(obj.id));
        
        if (discovered.length === 0) {
            list.innerHTML = '<div class="nav-log-empty" style="padding: 20px; text-align: center;">No scientific data collected yet. Explore the galaxy to populate the Codex.</div>';
            return;
        }

        const TYPE_ICONS = { planet: '🪐', nebula: '🌌', star: '⭐', artifact: '💠', station: '🛸' };

        list.innerHTML = discovered.map(obj => {
            const sciEarned = player.scienceEarned[obj.id] || 0;
            const isFullyCharted = obj.maxScience > 0 && sciEarned >= obj.maxScience;
            const statusHtml = isFullyCharted 
                ? '<div class="codex-status">✅ DATA COMPLETE</div>' 
                : obj.maxScience > 0 
                    ? `<div class="codex-status" style="color:#aaa;">📡 SURVEY IN PROGRESS (${sciEarned}/${obj.maxScience} SP)</div>`
                    : '';

            return `
                <div class="codex-card">
                    <div class="codex-icon">${TYPE_ICONS[obj.type] || '✦'}</div>
                    <div class="codex-main">
                        <div class="codex-header">
                            <div class="codex-name">${obj.name}</div>
                            <div class="codex-type">${obj.type}</div>
                        </div>
                        <div class="codex-region">${obj.regionName || 'Deep Space'}</div>
                        <div class="codex-desc">${obj.description || 'No additional data available.'}</div>
                        ${statusHtml}
                    </div>
                </div>
            `;
        }).join('');
    }

    toggleUpgradeMenu(isPaused) {
        const menu = document.getElementById('upgrade-menu');
        const map = document.getElementById('map-modal');
        if (isPaused && !map.classList.contains('active')) {
            this.refreshUpgrades();
            this.refreshShips();
            this.refreshTechUpgrades();
            menu.classList.remove('hidden');
            menu.classList.add('active'); // mark as currently open UI
        } else {
            menu.classList.add('hidden');
            menu.classList.remove('active');
        }
    }

    toggleMap() {
        if (this.game.gameOver) return;
        const upgradeMenu = document.getElementById('upgrade-menu');
        if (upgradeMenu.classList.contains('active')) return; // Priority

        const mapModal = document.getElementById('map-modal');
        const isHidden = mapModal.classList.contains('hidden');

        if (isHidden) {
            mapModal.classList.remove('hidden');
            mapModal.classList.add('active');
            
            // Re-center on player when opening
            const pGridX = this.game.player.x / 1000;
            const pGridY = this.game.player.y / 1000;
            const GRID_SIZE = 10;
            this.mapState.offsetX = -(pGridX * GRID_SIZE);
            this.mapState.offsetY = -(pGridY * GRID_SIZE);
            this.mapState.zoom = 1;

            this._pauseForPopup();
            this.renderMap();
        } else {
            mapModal.classList.add('hidden');
            mapModal.classList.remove('active');
            this._resumeFromPopup();
        }
    }



    _handleMapHover(canvasX, canvasY, clientX, clientY) {
        if (!this.game.sectorManager) return;
        
        const MAP_RADIUS = 25;
        const GRID_SIZE = 10;
        const midX = 300; 
        const midY = 300;
        
        // Convert screen-space mouse to map-space logic coords
        const logicX = (canvasX - midX) / this.mapState.zoom - this.mapState.offsetX;
        const logicY = (canvasY - midY) / this.mapState.zoom - this.mapState.offsetY;

        let foundObj = null;
        for (const obj of this.game.sectorManager.objects) {
            // Only show discovered objects
            if (!this.game.sectorManager.discoveredIds.has(obj.id)) continue;
            
            const px = (obj.coordX * GRID_SIZE);
            const py = (-obj.coordY * GRID_SIZE);
            
            // Check distance in map units
            const dist = Math.hypot(logicX - px, logicY - py);
            if (dist < 10 / this.mapState.zoom) { 
                foundObj = obj;
                break;
            }
        }
        
        const tooltip = document.getElementById('map-tooltip');
        const container = document.getElementById('map-container');
        if (!tooltip || !container) return;
        
        if (foundObj) {
            this.mapState.hoverObj = foundObj;
            tooltip.innerHTML = `<strong>${foundObj.name}</strong><br/>Type: ${foundObj.type}<br/>Coords: ${foundObj.coordX} : ${-foundObj.coordY}`;
            
            const containerRect = container.getBoundingClientRect();
            tooltip.style.left = (clientX - containerRect.left + 15) + 'px';
            tooltip.style.top = (clientY - containerRect.top + 15) + 'px';
            tooltip.style.opacity = '1';
        } else {
            this.mapState.hoverObj = null;
            tooltip.style.opacity = '0';
        }
        
        // Re-render to show hover highlight if any
        this.renderMap();
    }

    renderMap() {

        const canvas = document.getElementById('mapCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const sm = this.game.sectorManager;
        const rm = this.game.regionManager;

        const MAP_RADIUS = 25; // 25 unit radius covers most of the 20 unit generation bounds
        const GRID_SIZE = 10; 

        canvas.width = 600; 
        canvas.height = 600; 

        const midX = canvas.width / 2;
        const midY = canvas.height / 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Plan A implementation
        ctx.save();
        ctx.translate(midX, midY);
        ctx.scale(this.mapState.zoom, this.mapState.zoom);
        ctx.translate(this.mapState.offsetX, this.mapState.offsetY);

        // Draw basic region colors
        for (let y = -MAP_RADIUS; y <= MAP_RADIUS; y++) {
            for (let x = -MAP_RADIUS; x <= MAP_RADIUS; x++) {
                let foundRegion = DEFAULT_REGION;
                for (const reg of REGIONS) {
                    if (reg.test(x, -y)) {
                        foundRegion = reg;
                        break;
                    }
                }
                if (foundRegion !== DEFAULT_REGION && rm.discoveredRegions.has(foundRegion.name)) {
                    ctx.fillStyle = foundRegion.color + '44'; 
                    ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
                }
            }
        }

        // Grid lines (faint)
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
        ctx.lineWidth = 1 / this.mapState.zoom;
        for (let i = -MAP_RADIUS; i <= MAP_RADIUS; i++) {
            ctx.beginPath();
            ctx.moveTo(i * GRID_SIZE, -MAP_RADIUS * GRID_SIZE);
            ctx.lineTo(i * GRID_SIZE, MAP_RADIUS * GRID_SIZE);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-MAP_RADIUS * GRID_SIZE, i * GRID_SIZE);
            ctx.lineTo(MAP_RADIUS * GRID_SIZE, i * GRID_SIZE);
            ctx.stroke();
        }

        // Center Axis glow
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
        ctx.lineWidth = 2 / this.mapState.zoom;
        ctx.beginPath();
        ctx.moveTo(0, -MAP_RADIUS * GRID_SIZE); ctx.lineTo(0, MAP_RADIUS * GRID_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-MAP_RADIUS * GRID_SIZE, 0); ctx.lineTo(MAP_RADIUS * GRID_SIZE, 0);
        ctx.stroke();

        // Draw Region Names
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        REGIONS.forEach(reg => {
            if (rm.discoveredRegions.has(reg.name) && reg !== DEFAULT_REGION) {
                const cx = reg.center.worldX / 1000;
                const cy = reg.center.worldY / 1000;
                const px = cx * GRID_SIZE;
                const py = cy * GRID_SIZE;

                ctx.font = `bold ${12 / this.mapState.zoom}px Inter, sans-serif`;
                ctx.shadowBlur = 4 / this.mapState.zoom;
                ctx.shadowColor = 'rgba(0,0,0,0.9)';
                ctx.fillText(reg.name.toUpperCase(), px, py);
            }
        });
        ctx.restore();

        // Specific Draw Function for Icons
        const drawIcon = (px, py, type, color) => {
            const z = this.mapState.zoom;
            ctx.fillStyle = color;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1 / z;
            if (type === 'planet') {
                ctx.beginPath(); ctx.arc(px, py, 6/z, 0, Math.PI*2); ctx.fill(); ctx.stroke();
            } else if (type === 'star') {
                ctx.beginPath();
                for(let i=0; i<5; i++){
                    ctx.lineTo(px + Math.cos((18+i*72)*Math.PI/180)*6/z, py - Math.sin((18+i*72)*Math.PI/180)*6/z);
                    ctx.lineTo(px + Math.cos((54+i*72)*Math.PI/180)*3/z, py - Math.sin((54+i*72)*Math.PI/180)*3/z);
                }
                ctx.closePath(); ctx.fill(); ctx.stroke();
            } else if (type === 'nebula') {
                ctx.shadowBlur = 10; ctx.shadowColor = color;
                ctx.beginPath(); ctx.arc(px, py, 8/z, 0, Math.PI*2); ctx.fill();
                ctx.shadowBlur = 0;
            } else if (type === 'station') {
                ctx.fillRect(px - 5/z, py - 5/z, 10/z, 10/z); ctx.strokeRect(px - 5/z, py - 5/z, 10/z, 10/z);
            } else {
                ctx.beginPath(); ctx.arc(px, py, 4/z, 0, Math.PI*2); ctx.fill();
            }
        };

        // Draw Objects
        for (const obj of sm.objects) {
            if (sm.discoveredIds.has(obj.id)) {
                const px = (obj.coordX * GRID_SIZE);
                const py = (-obj.coordY * GRID_SIZE);
                
                drawIcon(px, py, obj.type, obj.color);

                if (this.mapState.hoverObj && this.mapState.hoverObj.id === obj.id) {
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2 / this.mapState.zoom;
                    ctx.beginPath();
                    ctx.arc(px, py, 12 / this.mapState.zoom, 0, Math.PI * 2);
                    ctx.stroke();
                }

                if (this.mapState.zoom > 1.5 || (this.mapState.hoverObj && this.mapState.hoverObj.id === obj.id)) {
                    ctx.fillStyle = '#fff';
                    ctx.font = `${10 / this.mapState.zoom}px Inter, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.fillText(obj.name, px, py - (10 / this.mapState.zoom));
                }
            }
        }

        // Draw Player Position
        const pGridX = this.game.player.x / 1000;
        const pGridY = this.game.player.y / 1000;
        const playerPx = (pGridX * GRID_SIZE);
        const playerPy = (pGridY * GRID_SIZE);

        ctx.fillStyle = '#0f0';
        ctx.beginPath();
        ctx.moveTo(playerPx, playerPy - 8/this.mapState.zoom);
        ctx.lineTo(playerPx + 6/this.mapState.zoom, playerPy + 6/this.mapState.zoom);
        ctx.lineTo(playerPx - 6/this.mapState.zoom, playerPy + 6/this.mapState.zoom);
        ctx.fill();

        ctx.fillStyle = '#0f0';
        ctx.font = `${12 / this.mapState.zoom}px Inter, sans-serif`;
        ctx.fillText("YOU", playerPx, playerPy - (12/this.mapState.zoom));

        ctx.restore();
    }

    update(player) {
        document.getElementById('gem-count').textContent = player.gems;
        document.getElementById('health-text').textContent = `${Math.ceil(player.health)} / ${player.maxHealth}`;
        const healthPercent = Math.max(0, (player.health / player.maxHealth) * 100);
        document.getElementById('health-bar-fill').style.width = `${healthPercent}%`;

        // Scale game coordinates down
        const coordX = Math.round(player.x / 1000);
        const coordY = Math.round(player.y / 1000);
        document.getElementById('coord-text').textContent = `${coordX} : ${-coordY}`;

        // Region display
        const region = this.game.regionManager?.currentRegion;
        if (region) {
            const el = document.getElementById('region-name');
            if (el) {
                el.textContent = region.name;
                el.style.color = region.color || 'rgba(0,240,255,0.7)';
            }
            
            const discoveryEl = document.getElementById('region-discovery-info');
            if (discoveryEl) {
                const progress = this.game.sectorManager.getRegionDiscoveryProgress(region.name);
                discoveryEl.textContent = `${progress.discovered} / ${progress.total} Stellar Objects Discovered`;
                
                if (progress.total > 0 && progress.discovered === progress.total) {
                    discoveryEl.classList.add('survey-complete');
                    discoveryEl.textContent = `✅ ${region.name} 100% Discovered`;
                } else {
                    discoveryEl.classList.remove('survey-complete');
                }
            }
        }

        // Boost charge bar
        const chargeBar = document.getElementById('boost-charge-fill');
        if (chargeBar) {
            chargeBar.style.width = `${player.boostCharge * 100}%`;
            chargeBar.style.opacity = player.engineMode === 'boost' ? '1' : '0.3';
        }

        // Science level + progress bar + numeric
        const sciLvlEl = document.getElementById('sci-level-text');
        const sciBarEl = document.getElementById('sci-progress-fill');
        const sciNumEl = document.getElementById('sci-progress-text');
        if (sciLvlEl || sciBarEl || sciNumEl) {
            const prog = player.scienceProgress;
            if (sciLvlEl) sciLvlEl.textContent = `SCI LVL ${player.scienceLevel}`;
            if (sciBarEl) sciBarEl.style.width = `${prog.fraction * 100}%`;
            if (sciNumEl) sciNumEl.textContent = `${prog.current} / ${prog.needed} SP`;
        }

        // Stats Panel Update
        const sets = [
            { id: 'engine', label: 'Thrusters', val: `Lvl ${player.stats.engine} (${player.thrusterMaxSpeed.toFixed(1)} m/s)` },
            { id: 'booster', label: 'Booster', val: `Lvl ${player.stats.booster} (${player.boostMaxSpeed.toFixed(1)} m/s)` },
            { id: 'hull', label: 'Hull HP', val: `Lvl ${player.stats.hull} (${player.maxHealth} HP)` },
            { id: 'weapons', label: 'Weapons', val: `Lvl ${player.stats.weapons} (${player.damage} DMG | ${player.shotsPerSecond}s)` },
            { id: 'magnet', label: 'Magnet', val: `Lvl ${player.stats.magnet} (${player.magnetRadius}m)` }
        ];

        document.getElementById('stat-engine-val').textContent = sets[0].val;
        document.getElementById('stat-booster-val').textContent = sets[1].val;
        document.getElementById('stat-hull-val').textContent = sets[2].val;
        document.getElementById('stat-weapons-val').textContent = sets[3].val;
        document.getElementById('stat-magnet-val').textContent = sets[4].val;
        this._updateObjectives();
    }

    _refreshEngineModeUI() {
        const player = this.game.player;
        const thrusterOpt = document.getElementById('engine-thruster');
        const boosterOpt = document.getElementById('engine-booster');

        if (thrusterOpt && boosterOpt) {
            const isBoost = player.engineMode === 'boost';
            thrusterOpt.classList.toggle('active', !isBoost);
            boosterOpt.classList.toggle('active', isBoost);
        }
    }

    /** Pause the game loop without opening the upgrade menu. */
    _pauseForPopup() {
        this.game.isPaused = true;
    }

    /** Resume the game loop that was paused by _pauseForPopup. */
    _resumeFromPopup() {
        if (!this.game.isPaused) return; // already running
        this.game.isPaused = false;
        this.game._queueLoop();
    }

    /**
     * Show a floating "+N 💎" / "+N 🔬 SP" / "+N ❤️" label near the dock bar.
     * @param {string} text   - e.g. "+1 💎"
     * @param {string} color  - CSS colour for the text
     */
    showFloatingReward(text, color) {
        const el = document.createElement('div');
        el.className = 'floating-reward';
        el.textContent = text;
        el.style.color = color;
        // Slight random horizontal offset so multiple rewards don't perfectly overlap
        el.style.setProperty('--jitter', `${Math.round((Math.random() - 0.5) * 60)}px`);
        document.getElementById('ui-layer').appendChild(el);
        // Remove after animation finishes
        el.addEventListener('animationend', () => el.remove());
    }

    showGameOver() {
        document.getElementById('game-over').classList.remove('hidden');
    }

    showDiscoveryPopup(obj) {
        const TYPE_LABELS = { planet: 'Planet Discovered!', nebula: 'Nebula Charted!', star: 'Star Located!', station: 'Station Found!', artifact: 'Artifact Discovered!' };
        const TYPE_ICONS = { planet: '🪐', nebula: '🌌', star: '⭐', station: '🛸', artifact: '💠' };

        const hasSci = (obj.maxScience || 0) > 0;
        const sciLine = hasSci
            ? `<div class="discovery-reward sci-reward">+5 🔬 SP &nbsp;<span class="sci-reward-sub">(max ${obj.maxScience} from this source)</span></div>`
            : '';

        const popup = document.getElementById('discovery-popup');
        popup.innerHTML = `
            <div class="discovery-icon">${TYPE_ICONS[obj.type] || '✦'}</div>
            <div class="discovery-type">${TYPE_LABELS[obj.type] || 'Object Found!'}</div>
            <div class="discovery-name">${obj.name}</div>
            <div class="discovery-desc">${obj.description}</div>
            <div class="discovery-reward">+${obj.gemReward} 💎</div>
            ${sciLine}
            <button class="popup-close-btn">OK — Got It</button>
        `;
        
        if (obj.type === 'region_survey') {
            popup.innerHTML = `
                <div class="discovery-icon">🏆</div>
                <div class="discovery-type" style="color:#50dc78;">Region Specialized!</div>
                <div class="discovery-name">${obj.name} 100%</div>
                <div class="discovery-desc">${obj.description}</div>
                <div class="discovery-reward">+${obj.gemReward} 💎 Bonus</div>
                <button class="popup-close-btn">Accept Bonus</button>
            `;
        }

        // Pin it — stays until manually closed, game pauses
        clearTimeout(this._popupTimer);
        popup.classList.add('active', 'popup-pinned');
        this._pauseForPopup();

        popup.querySelector('.popup-close-btn').addEventListener('click', () => {
            popup.classList.remove('active', 'popup-pinned');
            this._resumeFromPopup();
        });
    }

    showRegionDiscovery(region, gems = null, sciPoints = null) {
        const popup = document.getElementById('discovery-popup');
        const isFirstTime = gems !== null;

        const rewardLines = isFirstTime ? `
            <div class="discovery-reward" style="margin-top:8px">+ ${gems} 💎 &nbsp; + ${sciPoints} 🔬 SP</div>
        ` : '';

        const closeBtn = isFirstTime
            ? `<button class="popup-close-btn">OK — Got It</button>`
            : '';

        popup.innerHTML = `
            <div class="discovery-icon">${region.icon || '🗺️'}</div>
            <div class="discovery-type" style="color:${region.color}">${isFirstTime ? 'Region Discovered!' : 'Region Entered'}</div>
            <div class="discovery-name" style="color:${region.color}">${region.name}</div>
            <div class="discovery-desc">${region.description || ''}</div>
            ${rewardLines}
            ${closeBtn}
        `;

        clearTimeout(this._popupTimer);

        if (isFirstTime) {
            // Pin until dismissed, game pauses
            popup.classList.add('active', 'popup-pinned');
            this._pauseForPopup();
            popup.querySelector('.popup-close-btn').addEventListener('click', () => {
                popup.classList.remove('active', 'popup-pinned');
                this._resumeFromPopup();
            });
        } else {
            // Auto-dismiss
            popup.classList.remove('popup-pinned');
            popup.classList.add('active');
            this._popupTimer = setTimeout(() => {
                popup.classList.remove('active');
            }, 4000);
        }
    }

    refreshNavLog() {
        const panel = document.getElementById('nav-log-entries');
        const sm = this.game.sectorManager;
        if (!sm) return;

        const discovered = [...sm.discoveredIds];
        if (discovered.length === 0) {
            panel.innerHTML = '<div class="nav-log-empty">No objects discovered yet.</div>';
            return;
        }

        const TYPE_ICONS = { planet: '🪐', nebula: '🌌', star: '⭐', artifact: '💠' };
        panel.innerHTML = '';
        sm.objects
            .filter(obj => sm.discoveredIds.has(obj.id))
            .forEach(obj => {
                const entry = document.createElement('div');
                entry.className = 'nav-log-entry';
                const coordY = -obj.y / 1000; // Reverse canvas Y inversion for display
                const coordX = obj.x / 1000;
                entry.innerHTML = `
                    <span class="nav-entry-icon">${TYPE_ICONS[obj.type] || '✦'}</span>
                    <span class="nav-entry-name">${obj.name}</span>
                    <span class="nav-entry-coord">${Math.round(coordX)}:${Math.round(coordY)}</span>
                `;
                panel.appendChild(entry);
            });
    }

    updateDockStatus(obj) {
        const bar = document.getElementById('dock-status');
        if (!bar) return;
        if (!obj) {
            bar.classList.remove('active');
            return;
        }
        const EFFECT_LABEL = { heal: '⚕ HULL REPAIR', gems: '💎 +GEMS' };
        const TYPE_ICONS = { planet: '🪐', nebula: '🌌', star: '⭐', station: '🛸', artifact: '💠' };

        if (obj.parasite) {
            const isOppressor = obj.parasite.type === 'oppressor';
            const icon = isOppressor ? '🛰️' : '🦠';
            const actionText = isOppressor ? 'DESTROY ENEMY STATION' : 'DESTROY PARASITE';

            bar.innerHTML = `
                <span class="dock-icon" style="filter: drop-shadow(0 0 5px red);">${icon}</span>
                <span class="dock-name" style="color:#ff3c3c;">DOCKING BLOCKED</span>
                <span class="dock-effect" style="color:#ff3c3c; border-left-color: rgba(255, 60, 60, 0.3);">${actionText}</span>
            `;
        } else {
            bar.innerHTML = `
                <span class="dock-icon">${TYPE_ICONS[obj.type] || '⚓'}</span>
                <span class="dock-name">DOCKED — ${obj.name.toUpperCase()}</span>
                <span class="dock-effect">${EFFECT_LABEL[obj.dockEffect] || ''}</span>
            `;
        }
        bar.classList.add('active');
    }

    addCommsMessage(msgData) {
        const panel = document.getElementById('comms-entries');
        if (!panel) return;

        // Remove empty state if present
        const emptyState = panel.querySelector('.nav-log-empty');
        if (emptyState) {
            emptyState.remove();
        }

        const entry = document.createElement('div');
        entry.className = 'comms-entry';

        let color = '#00f0ff';
        if (msgData.entity === 'hostile') color = '#ff3c3c';
        else if (msgData.entity === 'neutral') color = '#55ffcc';

        entry.innerHTML = `
            <span class="comms-entry-sender" style="color: ${color};">${msgData.sender}:</span>
            <span class="comms-entry-text">${msgData.text}</span>
        `;

        panel.insertBefore(entry, panel.firstChild);
        this._updateCommsVisibility();

        // Keep only the last 5 messages (remove oldest from bottom)
        while (panel.children.length > 5) {
            panel.removeChild(panel.lastChild);
        }

        // Fade out older messages (newest is at idx 0)
        Array.from(panel.children).forEach((child, idx) => {
            if (child.style.opacity === '0') return; // skip if fading out
            if (idx === 0) child.style.opacity = '1';
            else if (idx === 1) child.style.opacity = '0.85';
            else if (idx === 2) child.style.opacity = '0.7';
            else if (idx === 3) child.style.opacity = '0.5';
            else child.style.opacity = '0.3';
        });

        // Auto remove after 10 seconds
        setTimeout(() => {
            if (entry.parentNode === panel) {
                entry.style.opacity = '0'; // trigger CSS transition
                setTimeout(() => {
                    if (entry.parentNode === panel) {
                        panel.removeChild(entry);
                        if (panel.children.length === 0) {
                            const empty = document.createElement('div');
                            empty.className = 'nav-log-empty';
                            empty.textContent = 'No incoming transmissions.';
                            panel.appendChild(empty);
                        }
                        this._updateCommsVisibility();
                    }
                }, 1000); // Wait for fade transition
            }
        }, 10000);
    }

    handleMiniGameResult(result) {
        const obj = this.scienceMiniGame.stellarObject;
        if (!obj) return;

        if (result === 'great' || result === 'good') {
            const amount = result === 'great' ? 10 : 3;
            const before = this.game.player.sciencePoints;
            this.game.player.addScience(amount, obj.id, obj.maxScience);
            const gained = this.game.player.sciencePoints - before;

            if (gained > 0) {
                this.showFloatingReward(`+${gained} 🔬 ${result.toUpperCase()}!`, result === 'great' ? '#ffffff' : '#50dc78');

                // Notify QuestManager of science success
                this.game.questManager.notify('science', { success: true, amount: gained, target: obj.id });
            } else {
                this.showFloatingReward('DATA FULL', '#aaa');
                this.scienceMiniGame.stop();
            }
        } else {
            this.showFloatingReward('MISS', '#ff3c3c');
        }
    }

    // ── Contacts & Hailing ─────────────────────────────────

    updateContacts(contacts) {
        const container = document.getElementById('comms-contacts');
        if (!container) return;

        if (!contacts || contacts.length === 0) {
            container.style.display = 'none';
            container.innerHTML = '';
            return;
        }

        container.style.display = 'flex';
        container.innerHTML = '';

        contacts.forEach(npc => {
            const entry = document.createElement('div');
            entry.className = 'contact-entry';

            entry.innerHTML = `
                <div class="contact-info">
                    <span class="contact-name">${npc.name}</span>
                    <span class="contact-role">${npc.role || 'Unknown'}</span>
                </div>
                <button class="contact-hail-btn">Hail</button>
            `;

            const hailBtn = entry.querySelector('.contact-hail-btn');
            hailBtn.addEventListener('click', () => {
                // Find and evaluate the valid dialogue condition
                const validDialogue = npc.dialogues.find(d => typeof d.condition === 'function' && d.condition(this.game));
                if (validDialogue) {
                    // Open modal with this dialogue
                    this.openContactDialogue(npc.name, validDialogue);
                }
            });

            container.appendChild(entry);
        });

        this._updateCommsVisibility();
    }

    openContactDialogue(senderName, dialogueData) {
        const modal = document.getElementById('hail-modal');
        this._renderHailStep(senderName, dialogueData);
        modal.classList.remove('hidden');
        this._pauseForPopup();
    }

    triggerHail(senderName, hailData) {
        if (this.pendingHail) return; // Ignore if one is already ringing

        this.pendingHail = { sender: senderName, data: hailData };
        document.getElementById('hail-alert-text').textContent = `INCOMING HAIL: ${senderName.toUpperCase()}`;
        document.getElementById('hail-alert').classList.remove('hidden');

        // Auto-accept after a brief delay
        this._hailTimeout = setTimeout(() => {
            if (this.pendingHail) this.acceptHail();
        }, 2000);
    }

    declineHail() {
        this.pendingHail = null;
        clearTimeout(this._hailTimeout);
        document.getElementById('hail-alert').classList.add('hidden');
    }

    acceptHail() {
        if (!this.pendingHail) return;

        const data = this.pendingHail;
        this.declineHail(); // clears alert badge

        const modal = document.getElementById('hail-modal');
        this._renderHailStep(data.sender, data.data);

        modal.classList.remove('hidden');
        this._pauseForPopup();
    }

    resolveHailOption(sender, opt) {
        // Perform option specific actions
        if (typeof opt.action === 'function') {
            opt.action(this.game);
        }

        if (opt.reward) {
            this.game.player.gems += opt.reward;
            this.game.player.totalGemsCollected += opt.reward;
            this.showFloatingReward(`+${opt.reward} 💎`, '#00ffd0');
        }

        if (opt.next) {
            // Move to the next "step" of the conversation
            this._renderHailStep(sender, {
                text: opt.reply || "...",
                options: opt.next
            });
        } else {
            // Show the final response in the modal (fallback for missing replies)
            document.getElementById('hail-message-text').textContent = opt.reply || "Transmission ended.";

            // Hide options, show done button
            document.getElementById('hail-option-1').style.display = 'none';
            document.getElementById('hail-option-2').style.display = 'none';
            document.getElementById('hail-done-btn').style.display = 'block';
        }
    }

    _renderHailStep(senderName, dialogueData) {
        document.getElementById('hail-sender-name').textContent = senderName;
        document.getElementById('hail-message-text').textContent = dialogueData.text;

        const btn1 = document.getElementById('hail-option-1');
        const btn2 = document.getElementById('hail-option-2');
        const doneBtn = document.getElementById('hail-done-btn');

        if (!dialogueData.options || dialogueData.options.length === 0) {
            btn1.style.display = 'none';
            btn2.style.display = 'none';
            doneBtn.style.display = 'block';
            return;
        }

        doneBtn.style.display = 'none';

        const opt1 = dialogueData.options[0];
        const opt2 = dialogueData.options[1];

        if (opt1) {
            btn1.style.display = 'block';
            btn1.textContent = opt1.text;
            const newBtn1 = btn1.cloneNode(true);
            btn1.parentNode.replaceChild(newBtn1, btn1);
            newBtn1.addEventListener('click', () => this.resolveHailOption(senderName, opt1));
        } else {
            btn1.style.display = 'none';
        }

        if (opt2) {
            btn2.style.display = 'block';
            btn2.textContent = opt2.text;
            const newBtn2 = btn2.cloneNode(true);
            btn2.parentNode.replaceChild(newBtn2, btn2);
            newBtn2.addEventListener('click', () => this.resolveHailOption(senderName, opt2));
        } else {
            btn2.style.display = 'none';
        }
    }

    _updateCommsVisibility() {
        const commsPanel = document.getElementById('comms-panel');
        const contactsContainer = document.getElementById('comms-contacts');
        const entriesContainer = document.getElementById('comms-entries');
        if (!commsPanel || !contactsContainer || !entriesContainer) return;

        const hasVisibleContacts = contactsContainer.style.display !== 'none' && contactsContainer.children.length > 0;
        const hasMessages = entriesContainer.querySelectorAll('.comms-entry').length > 0;

        if (hasVisibleContacts || hasMessages) {
            commsPanel.classList.remove('hidden');
        } else {
            commsPanel.classList.add('hidden');
        }
    }

    _updateObjectives() {
        if (!this.objectivesPanel) return;

        const activeQuests = this.game.questManager.activeQuests;
        const currentRegionName = this.game.regionManager?.currentRegion?.name || '';
        
        // Find the prioritized quest to show in the HUD
        // Priority: 1. Current region's quest, 2. Most recently accepted incomplete quest
        let displayQuest = activeQuests.find(q => q.category === 'region' && q.regionId === currentRegionName);
        if (!displayQuest && activeQuests.length > 0) {
            displayQuest = activeQuests[activeQuests.length - 1]; // Assuming the last one is the most recent
        }

        const refreshKey = (displayQuest ? displayQuest.id : 'none') + '|' + currentRegionName + '|' + activeQuests.length;

        // 1. If the displayed quest changed or region changed, do a full refresh
        if (this._lastQuestIds !== refreshKey) {
            this._lastQuestIds = refreshKey;

            if (!displayQuest) {
                this.objectivesPanel.innerHTML = '';
                const regionPanel = document.getElementById('region-quests-panel');
                if (regionPanel) regionPanel.innerHTML = '';
                return;
            }

            // Render single objective in HUD
            this.objectivesPanel.innerHTML = `
                <div class="objective-item" id="obj-${displayQuest.id}">
                    <div class="objective-title">${displayQuest.title}</div>
                    <div class="objective-desc">${displayQuest.description}</div>
                    <div class="objective-progress-container">
                        ${displayQuest.objectives.map(obj => {
                            let progressText = `${obj.current} / ${obj.count}`;
                            if (obj.type === 'reach') {
                                progressText = `${obj.current}/${obj.count} Discovered`;
                            } else if (obj.type === 'collect') {
                                progressText = `${obj.current}/${obj.count} Gems`;
                            }
                            return `
                                <div class="objective-progress-tag">
                                    ${progressText}
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <button class="see-more-btn" id="see-more-objectives">See More</button>
                </div>
            `;

            const seeMoreBtn = document.getElementById('see-more-objectives');
            if (seeMoreBtn) {
                seeMoreBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.game.toggleUpgrades(); // Opens terminal
                    const tabObjectives = document.getElementById('tab-objectives');
                    if (tabObjectives) tabObjectives.click(); // Switch to objectives tab
                };
            }

            // Clear the old region panel as we are unifying objectives in the top bar
            const regionPanel = document.getElementById('region-quests-panel');
            if (regionPanel) regionPanel.innerHTML = '';
            
            return;
        }

        // 2. Same quest, just update internal progress content if changed
        if (displayQuest) {
            const container = this.objectivesPanel.querySelector(`#obj-${displayQuest.id} .objective-progress-container`);
            if (container) {
                const html = displayQuest.objectives.map(obj => {
                    let progressText = `${obj.current} / ${obj.count}`;
                    if (obj.type === 'reach') {
                        progressText = `${obj.current}/${obj.count} Discovered`;
                    } else if (obj.type === 'collect') {
                        progressText = `${obj.current}/${obj.count} Gems`;
                    }
                    return `
                        <div class="objective-progress-tag">
                            ${progressText}
                        </div>
                    `;
                }).join('');

                if (container.innerHTML !== html) {
                    container.innerHTML = html;
                }
            }
        }
    }

    showQuestComplete(quest) {
        const popup = document.getElementById('discovery-popup');
        if (!popup) return;

        // Reuse discovery-popup structure for consistency
        const icon = quest.id.startsWith('tut_') ? '🏁' : quest.id.startsWith('story_') ? '👻' : '🏆';
        
        let rewardsHtml = '';
        if (quest.rewards) {
            if (quest.rewards.gems) rewardsHtml += `<div>+${quest.rewards.gems} 💎</div>`;
            if (quest.rewards.sci) rewardsHtml += `<div>+${quest.rewards.sci} 🔬</div>`;
        }

        popup.innerHTML = `
            <div class="discovery-icon">${icon}</div>
            <div class="discovery-type">OBJECTIVE COMPLETE</div>
            <div class="discovery-name">${quest.title}</div>
            <div class="discovery-desc">${quest.completionMessage || 'Mission parameters fulfilled.'}</div>
            <div class="discovery-reward">${rewardsHtml}</div>
            <button class="popup-close-btn">Excellent!</button>
        `;

        // Clear any old timer so it doesn't vanish while user is reading
        clearTimeout(this._popupTimer);
        
        popup.classList.add('active', 'popup-pinned');
        this._pauseForPopup();

        const closeBtn = popup.querySelector('.popup-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                popup.classList.remove('active', 'popup-pinned');
                this._resumeFromPopup();
            });
        }
    }

    refreshObjectivesTab() {
        const list = document.getElementById('objectives-list');
        if (!list) return;

        const activeQuests = this.game.questManager.activeQuests;
        const completedIds = Array.from(this.game.questManager.completedQuestIds);
        
        // 1. Active Quests
        const activeHtml = activeQuests.map(quest => {
            return `
                <div class="terminal-objective-card">
                    <div class="terminal-objective-header">
                        <div class="terminal-objective-title">${quest.title}</div>
                        <div class="terminal-objective-status status-active">Active</div>
                    </div>
                    <div class="terminal-objective-desc">${quest.description}</div>
                    <div class="terminal-objective-progress">
                        ${quest.objectives.map(obj => `
                            <div class="terminal-progress-item">
                                <span>${obj.id.replace(/_/g, ' ')}</span>
                                <span>${obj.current} / ${obj.count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');

        // 2. Completed Quests
        const completedHtml = completedIds.map(id => {
            const template = QUESTS[id];
            if (!template) return '';
            return `
                <div class="terminal-objective-card" style="opacity: 0.7;">
                    <div class="terminal-objective-header">
                        <div class="terminal-objective-title">${template.title}</div>
                        <div class="terminal-objective-status status-complete">Completed</div>
                    </div>
                    <div class="terminal-objective-desc">${template.description}</div>
                </div>
            `;
        }).join('');

        if (activeHtml === '' && completedHtml === '') {
            list.innerHTML = '<div style="text-align:center; padding: 40px; color: #666;">No objectives recorded yet.</div>';
        } else {
            list.innerHTML = `
                <h3 style="color:#00f0ff; font-family:'Orbitron'; font-size: 0.8rem; margin: 0 0 15px 5px; opacity: 0.8;">ACTIVE OBJECTIVES</h3>
                ${activeHtml || '<div style="padding:10px; color:#555; font-style:italic;">No active objectives.</div>'}
                <h3 style="color:#4aff80; font-family:'Orbitron'; font-size: 0.8rem; margin: 30px 0 15px 5px; opacity: 0.8;">MISSION HISTORY</h3>
                ${completedHtml}
            `;
        }
    }
}
