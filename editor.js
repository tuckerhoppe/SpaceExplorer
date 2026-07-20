import { STELLAR_OBJECTS } from './src/data/stellarObjects.js';
import { REGIONS, DEFAULT_REGION } from './src/data/regions.js';
import { LARGE_ASTEROID_DEFINITIONS } from './src/data/largeAsteroids.js';
import { NEBULA_DEFINITIONS } from './src/data/nebulas.js';
import { TRADE_ROUTES_CONFIG } from './src/data/tradeRoutes.js';
import { CLUSTERS } from './src/data/clusters.js';

// Application State
let stellarObjects = [...STELLAR_OBJECTS];
let regions = [...REGIONS];
let defaultRegion = { ...DEFAULT_REGION };
let asteroids = [...LARGE_ASTEROID_DEFINITIONS];
let nebulas = [...NEBULA_DEFINITIONS];
let tradeRoutes = [...TRADE_ROUTES_CONFIG];
let clusters = [...CLUSTERS];

let selectedEntity = null; // Primary selected item
let selectedEntities = []; // Array of { type, ref }
let currentTab = 'list-tab';
let filterType = 'all';

// Marquee Selection State
let isSelecting = false;
let selectStart = { x: 0, y: 0 };
let selectEnd = { x: 0, y: 0 };

// Panning State Helper
let isSpacePressed = false;


// Visibility Filters State
const visibility = {
    regions: true,
    planets: true,
    stations: true,
    stars: true,
    asteroids: true,
    nebulas: true,
    routes: true
};

// Undo Stack State
const undoStack = [];
let formEditingStateSaved = false;
let dragStateSaved = false;

// Drag & Drop State
let dragTarget = null; // { type, ref, handle }
let isPanning = false;
let panStart = { x: 0, y: 0 };
let mouseWorldPos = { x: 0, y: 0 };

// Canvas Setup
const canvas = document.getElementById('editorCanvas');
const ctx = canvas.getContext('2d');

const camera = {
    x: 0,
    y: 0,
    zoom: 0.02, // Pixels per world unit
    minZoom: 0.002,
    maxZoom: 0.2
};

// UI Elements
const entitiesList = document.getElementById('entities-list');
const filterSelect = document.getElementById('filter-type');
const inspectorEmpty = document.getElementById('inspector-empty');
const inspectorForm = document.getElementById('inspector-form');
const inspectorFields = document.getElementById('inspector-fields');
const inspectorTitle = document.getElementById('inspector-title');
const cursorCoords = document.getElementById('cursor-coords');
const statusOverlay = document.getElementById('status-overlay');

// Color palettes for UI rendering
const TYPE_COLORS = {
    star: '#ffaa00',
    planet: '#4db8ff',
    station: '#80d4ff',
    nebula: '#cc00ff',
    asteroid: '#888888',
    region: 'rgba(0, 240, 255, 0.2)'
};

// Initialize Application
function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Setup tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });

    // Event Listeners
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    // Spacebar Panning Listeners
    window.addEventListener('keydown', e => {
        if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            isSpacePressed = true;
            canvas.style.cursor = 'grab';
        }
    });
    window.addEventListener('keyup', e => {
        if (e.code === 'Space') {
            isSpacePressed = false;
            canvas.style.cursor = 'default';
        }
    });


    // Zoom Buttons
    document.getElementById('btn-zoom-in').onclick = () => zoom(1.2);
    document.getElementById('btn-zoom-out').onclick = () => zoom(0.8);
    document.getElementById('btn-zoom-reset').onclick = () => {
        camera.zoom = 0.02;
        requestAnimationFrame(draw);
    };

    // Center map
    document.getElementById('btn-center-map').onclick = () => {
        camera.x = 0;
        camera.y = 0;
        requestAnimationFrame(draw);
    };

    // Filtering
    filterSelect.onchange = (e) => {
        filterType = e.target.value;
        renderList();
    };

    // Save & Export
    document.getElementById('btn-save').onclick = saveToFiles;
    document.getElementById('btn-undo').onclick = undo;
    document.getElementById('btn-export-all').onclick = exportAllFiles;

    // Creation buttons
    document.getElementById('btn-create-init').onclick = createNewEntity;

    // Link Trade Route button
    const trBtn = document.getElementById('btn-create-route');
    if (trBtn) trBtn.onclick = createTradeRoute;

    // Delete button
    document.getElementById('btn-inspect-delete').onclick = deleteSelectedEntity;

    // Visibility checkboxes
    ['regions', 'planets', 'stations', 'stars', 'asteroids', 'nebulas', 'routes'].forEach(type => {
        const checkbox = document.getElementById(`vis-${type}`);
        if (checkbox) {
            checkbox.onchange = (e) => {
                visibility[type] = e.target.checked;
                requestAnimationFrame(draw);
            };
        }
    });

    renderList();
    requestAnimationFrame(draw);
}

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    requestAnimationFrame(draw);
}

function switchTab(tabId) {
    currentTab = tabId;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabId);
    });
}

// Coordinate Conversions
function worldToScreen(wx, wy) {
    const sx = (wx - camera.x) * camera.zoom + canvas.width / 2;
    const sy = (wy - camera.y) * camera.zoom + canvas.height / 2;
    return { x: sx, y: sy };
}

function screenToWorld(sx, sy) {
    const wx = (sx - canvas.width / 2) / camera.zoom + camera.x;
    const wy = (sy - canvas.height / 2) / camera.zoom + camera.y;
    return { x: wx, y: wy };
}

// Undo System Functions & Unsaved State
let hasUnsavedChanges = false;

function setUnsavedChanges(value) {
    hasUnsavedChanges = value;
    const dot = document.getElementById('save-status-dot');
    const text = document.getElementById('save-status-text');
    if (dot && text) {
        if (value) {
            dot.style.backgroundColor = '#ff9900';
            text.innerText = 'Unsaved changes';
            text.style.color = '#ff9900';
        } else {
            dot.style.backgroundColor = '#50dc78';
            text.innerText = 'All changes saved';
            text.style.color = '#a0a5b5';
        }
    }
}

window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
    }
});

function saveState() {
    const state = {
        stellarObjects: JSON.parse(JSON.stringify(stellarObjects)),
        regions: JSON.parse(JSON.stringify(regions)),
        asteroids: JSON.parse(JSON.stringify(asteroids)),
        nebulas: JSON.parse(JSON.stringify(nebulas)),
        tradeRoutes: JSON.parse(JSON.stringify(tradeRoutes)),
        clusters: JSON.parse(JSON.stringify(clusters))
    };
    undoStack.push(state);
    if (undoStack.length > 50) {
        undoStack.shift();
    }
    updateUndoButtonState();
    setUnsavedChanges(true);
}

function undo() {
    if (undoStack.length === 0) return;
    const previousState = undoStack.pop();

    stellarObjects = previousState.stellarObjects;
    regions = previousState.regions;
    asteroids = previousState.asteroids;
    nebulas = previousState.nebulas;
    tradeRoutes = previousState.tradeRoutes || [];
    clusters = previousState.clusters || [];

    if (selectedEntity) {
        const ref = selectedEntity.ref;
        let found = null;
        if (selectedEntity.type === 'stellar') {
            found = stellarObjects.find(s => s.id === ref.id);
        } else if (selectedEntity.type === 'region') {
            found = regions.find(r => r.name === ref.name);
        } else if (selectedEntity.type === 'asteroids') {
            found = asteroids.find(a => a.id === ref.id);
        } else if (selectedEntity.type === 'nebulas') {
            found = nebulas.find(n => n.name === ref.name);
        } else if (selectedEntity.type === 'route') {
            found = tradeRoutes.find(r => r.id === ref.id);
        } else if (selectedEntity.type === 'cluster') {
            found = clusters.find(c => c.id === ref.id);
        }

        if (found) {
            selectedEntity.ref = found;
            updateInspectorInputs();
        } else {
            selectEntity(null);
        }
    }

    renderList();
    updateUndoButtonState();
    setUnsavedChanges(true);
    requestAnimationFrame(draw);
}

function updateUndoButtonState() {
    const btn = document.getElementById('btn-undo');
    if (btn) {
        btn.disabled = undoStack.length === 0;
    }
}


// Drawing Functions
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Grid
    drawGrid();

    // Draw Regions (lowest layer)
    if (visibility.regions) {
        regions.forEach(region => drawRegion(region));
    }

    // Draw Trade Routes
    if (visibility.routes) {
        drawTradeRoutes();
    }

    // Draw Nebulas
    if (visibility.nebulas) {
        nebulas.forEach(neb => drawNebula(neb));
    }

    // Draw Large Asteroids
    if (visibility.asteroids) {
        asteroids.forEach(ast => drawAsteroid(ast));
    }

    // Draw Stellar Objects
    stellarObjects.forEach(obj => {
        if (obj.type === 'planet' && !visibility.planets) return;
        if (obj.type === 'station' && !visibility.stations) return;
        if (obj.type === 'star' && !visibility.stars) return;
        if (obj.type === 'nebula' && !visibility.nebulas) return;
        if (obj.type === 'asteroid' && !visibility.asteroids) return;
        drawStellarObject(obj);
    });

    // Draw Selection Highlights
    drawSelectionHighlights();

    // Draw Marquee Selection Box
    if (isSelecting) {
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
        ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        const pStart = worldToScreen(selectStart.x, selectStart.y);
        const pEnd = worldToScreen(selectEnd.x, selectEnd.y);
        ctx.fillRect(pStart.x, pStart.y, pEnd.x - pStart.x, pEnd.y - pStart.y);
        ctx.strokeRect(pStart.x, pStart.y, pEnd.x - pStart.x, pEnd.y - pStart.y);
        ctx.setLineDash([]);
    }
}

function drawGrid() {
    const startWorld = screenToWorld(0, 0);
    const endWorld = screenToWorld(canvas.width, canvas.height);

    const step = 1000; // 1 coordinate unit
    const startX = Math.floor(startWorld.x / step) * step;
    const endX = Math.ceil(endWorld.x / step) * step;
    const startY = Math.floor(startWorld.y / step) * step;
    const endY = Math.ceil(endWorld.y / step) * step;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    for (let x = startX; x <= endX; x += step) {
        const screen = worldToScreen(x, 0);
        ctx.beginPath();
        ctx.moveTo(screen.x, 0);
        ctx.lineTo(screen.x, canvas.height);
        ctx.stroke();

        // Coordinates text at major axes
        if (x % 5000 === 0) {
            ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
            ctx.font = '10px Orbitron';
            ctx.fillText((x / 1000).toFixed(0), screen.x + 4, canvas.height - 10);
        }
    }

    for (let y = startY; y <= endY; y += step) {
        const screen = worldToScreen(0, y);
        ctx.beginPath();
        ctx.moveTo(0, screen.y);
        ctx.lineTo(canvas.width, screen.y);
        ctx.stroke();

        if (y % 5000 === 0) {
            ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
            ctx.font = '10px Orbitron';
            ctx.fillText((-y / 1000).toFixed(0), 10, screen.y - 4);
        }
    }

    // Main Axes
    const origin = worldToScreen(0, 0);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(origin.x, 0);
    ctx.lineTo(origin.x, canvas.height);
    ctx.moveTo(0, origin.y);
    ctx.lineTo(canvas.width, origin.y);
    ctx.stroke();
}

function drawRegion(region) {
    if (!region.bounds) return; // Skip void or neutral regions with no rectangular bounds

    const minX = region.bounds.minX * 1000;
    const maxX = region.bounds.maxX * 1000;
    const minY = -region.bounds.maxY * 1000;
    const maxY = -region.bounds.minY * 1000;

    const topLeft = worldToScreen(minX, minY);
    const bottomRight = worldToScreen(maxX, maxY);

    const w = bottomRight.x - topLeft.x;
    const h = bottomRight.y - topLeft.y;

    // Fill
    ctx.fillStyle = region.color + '0c'; // Very transparent
    ctx.fillRect(topLeft.x, topLeft.y, w, h);

    // Border
    ctx.strokeStyle = region.color + '44'; // Semi transparent border
    ctx.lineWidth = selectedEntity && selectedEntity.ref === region ? 3 : 1;
    if (selectedEntity && selectedEntity.ref === region) {
        ctx.strokeStyle = region.color;
    }
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(topLeft.x, topLeft.y, w, h);
    ctx.setLineDash([]);

    // Name text
    ctx.fillStyle = region.color + '88';
    ctx.font = '12px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(`${region.name} (${region.difficulty ? 'Lvl ' + region.difficulty : ''})`, topLeft.x + w / 2, topLeft.y + h / 2);
    ctx.textAlign = 'left';
}

function drawTradeRoutes() {
    ctx.lineWidth = 2;
    tradeRoutes.forEach(route => {
        const pA = stellarObjects.find(s => s.id === route.planetAId);
        const pB = stellarObjects.find(s => s.id === route.planetBId);
        if (pA && pB) {
            const screenA = worldToScreen(pA.worldX, pA.worldY);
            const screenB = worldToScreen(pB.worldX, pB.worldY);

            ctx.strokeStyle = route.color || 'rgba(0, 240, 255, 0.4)';
            ctx.beginPath();
            ctx.moveTo(screenA.x, screenA.y);
            ctx.lineTo(screenB.x, screenB.y);
            ctx.stroke();
        }
    });
}

function drawNebula(neb) {
    const screen = worldToScreen(neb.worldX, neb.worldY);
    const radius = neb.baseRadius * camera.zoom;

    // Outer cloud
    const grad = ctx.createRadialGradient(screen.x, screen.y, radius * 0.1, screen.x, screen.y, radius);
    grad.addColorStop(0, neb.color + '33');
    grad.addColorStop(0.5, neb.color + '18');
    grad.addColorStop(1, 'transparent');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Center core indicator
    ctx.fillStyle = neb.color + 'aa';
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, Math.max(3, radius * 0.03), 0, Math.PI * 2);
    ctx.fill();

    // Text Label
    ctx.fillStyle = '#fff';
    ctx.font = '11px Inter';
    ctx.fillText(neb.name, screen.x + 8, screen.y + 4);
}

function drawAsteroid(ast) {
    const screen = worldToScreen(ast.worldX, ast.worldY);
    const radius = ast.radius * camera.zoom;

    ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.arc(screen.x, screen.y, Math.max(4, radius), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Text Label
    ctx.fillStyle = '#aaa';
    ctx.font = '10px Inter';
    ctx.fillText(ast.name, screen.x + Math.max(6, radius + 4), screen.y + 3);
}

function drawStellarObject(obj) {
    const screen = worldToScreen(obj.worldX, obj.worldY);
    const radius = Math.max(5, obj.radius * camera.zoom);

    ctx.fillStyle = obj.color || '#fff';
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner details based on type
    if (obj.type === 'star') {
        ctx.shadowColor = obj.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    } else if (obj.type === 'station') {
        // Draw cross lines to look like station
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(screen.x - radius, screen.y);
        ctx.lineTo(screen.x + radius, screen.y);
        ctx.moveTo(screen.x, screen.y - radius);
        ctx.lineTo(screen.x, screen.y + radius);
        ctx.stroke();
    }

    // Outer dock boundary
    if (obj.dockRadius) {
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, obj.dockRadius * camera.zoom, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Text Label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Inter';
    ctx.fillText(obj.name, screen.x + radius + 6, screen.y + 4);
}

function drawSelectionHighlights() {
    if (selectedEntities.length === 0) return;

    ctx.strokeStyle = varColor('--accent-blue');
    ctx.lineWidth = 2;

    selectedEntities.forEach(sel => {
        if (sel.type === 'region') {
            const reg = sel.ref;
            if (!reg.bounds) return;

            const minX = reg.bounds.minX * 1000;
            const maxX = reg.bounds.maxX * 1000;
            const minY = -reg.bounds.maxY * 1000;
            const maxY = -reg.bounds.minY * 1000;

            const topLeft = worldToScreen(minX, minY);
            const bottomRight = worldToScreen(maxX, maxY);

            const w = bottomRight.x - topLeft.x;
            const h = bottomRight.y - topLeft.y;
            ctx.strokeStyle = varColor('--accent-blue');
            ctx.lineWidth = 2;
            ctx.strokeRect(topLeft.x, topLeft.y, w, h);

            // Draw handles only for the primary selected region
            if (selectedEntity && selectedEntity.ref === reg) {
                const handles = [
                    topLeft, // TL
                    { x: bottomRight.x, y: topLeft.y }, // TR
                    bottomRight, // BR
                    { x: topLeft.x, y: bottomRight.y } // BL
                ];

                ctx.fillStyle = '#fff';
                handles.forEach(h => {
                    ctx.beginPath();
                    ctx.rect(h.x - 5, h.y - 5, 10, 10);
                    ctx.fill();
                    ctx.stroke();
                });
            }
        } else if (sel.type === 'route') {
            const route = sel.ref;
            const pA = stellarObjects.find(s => s.id === route.planetAId);
            const pB = stellarObjects.find(s => s.id === route.planetBId);
            if (pA && pB) {
                const screenA = worldToScreen(pA.worldX, pA.worldY);
                const screenB = worldToScreen(pB.worldX, pB.worldY);
                ctx.save();
                ctx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(screenA.x, screenA.y);
                ctx.lineTo(screenB.x, screenB.y);
                ctx.stroke();
                ctx.restore();
            }
        } else {
            const item = sel.ref;
            const screen = worldToScreen(item.worldX, item.worldY);
            const size = Math.max(15, (item.radius || item.baseRadius || 500) * camera.zoom + 5);

            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, size, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    });
}

function varColor(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

function colorToHex(color) {
    if (!color) return '#000000';
    if (color.startsWith('#')) return color;
    const match = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/);
    if (match) {
        const r = parseInt(match[1]).toString(16).padStart(2, '0');
        const g = parseInt(match[2]).toString(16).padStart(2, '0');
        const b = parseInt(match[3]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }
    return '#000000';
}

// Selection & Inspection Logic
function selectEntity(entity, type, keepMulti = false) {
    formEditingStateSaved = false;
    if (!entity) {
        selectedEntity = null;
        selectedEntities = [];
        inspectorForm.classList.add('hidden');
        inspectorEmpty.classList.remove('hidden');
        renderList();
        requestAnimationFrame(draw);
        return;
    }

    selectedEntity = { type, ref: entity };
    if (!keepMulti) {
        selectedEntities = [{ type, ref: entity }];
    }

    inspectorEmpty.classList.add('hidden');
    inspectorForm.classList.remove('hidden');

    if (selectedEntities.length > 1) {
        inspectorTitle.innerText = `Multiple Selected (${selectedEntities.length})`;
        let fieldsHtml = `
            <div class="info-message" style="padding: 10px 0; text-align: left; color: var(--accent-blue);">
                🚀 Selected <strong>${selectedEntities.length}</strong> items. Drag them on the map to move them together.
            </div>
        `;
        
        const selectedRegions = selectedEntities.filter(sel => sel.type === 'region');
        if (selectedRegions.length > 0 && selectedRegions.length === selectedEntities.length) {
            fieldsHtml += `
                <div style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 15px; padding-top: 15px;">
                    <h4 style="margin: 0 0 10px 0; color: #ff9500;">Cluster Options</h4>
                    <button type="button" id="btn-create-cluster-selected" class="btn primary-btn" style="width: 100%;">
                        Group into New Cluster
                    </button>
                </div>
            `;
            setTimeout(() => {
                const btn = document.getElementById('btn-create-cluster-selected');
                if (btn) {
                    btn.onclick = () => createClusterFromSelected(selectedRegions.map(r => r.ref.name));
                }
            }, 0);
        }
        
        inspectorFields.innerHTML = fieldsHtml;
        renderList();
        requestAnimationFrame(draw);
        switchTab('inspector-tab');
        return;
    }

    inspectorTitle.innerText = `Edit ${entity.name || 'Unnamed'}`;

    // Generate dynamic fields in inspector
    let html = '';

    if (type === 'stellar') {
        html = `
            <input type="hidden" id="edit-id" value="${entity.id}">
            <div class="form-group">
                <label for="edit-name">Name</label>
                <input type="text" id="edit-name" value="${entity.name || ''}">
            </div>
            <div class="form-group-row">
                <div class="form-group">
                    <label for="edit-type">Type</label>
                    <select id="edit-type">
                        <option value="planet" ${entity.type === 'planet' ? 'selected' : ''}>Planet</option>
                        <option value="star" ${entity.type === 'star' ? 'selected' : ''}>Star</option>
                        <option value="station" ${entity.type === 'station' ? 'selected' : ''}>Station</option>
                        <option value="nebula" ${entity.type === 'nebula' ? 'selected' : ''}>Nebula (Stellar)</option>
                        <option value="asteroid" ${entity.type === 'asteroid' ? 'selected' : ''}>Asteroid</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-color">Color Hex</label>
                    <input type="color" id="edit-color" value="${entity.color || '#ffffff'}">
                </div>
            </div>
            <div class="form-group-row">
                <div class="form-group">
                    <label for="edit-cx">Coord X</label>
                    <input type="number" step="0.1" id="edit-cx" value="${entity.coordX}">
                </div>
                <div class="form-group">
                    <label for="edit-cy">Coord Y</label>
                    <input type="number" step="0.1" id="edit-cy" value="${entity.coordY}">
                </div>
            </div>
            <div class="form-group-row">
                <div class="form-group">
                    <label for="edit-radius">Radius (World Px)</label>
                    <input type="number" id="edit-radius" value="${entity.radius || 300}">
                </div>
                <div class="form-group">
                    <label for="edit-dock">Dock Radius</label>
                    <input type="number" id="edit-dock" value="${entity.dockRadius || 150}">
                </div>
            </div>
            <div class="form-group-row">
                <div class="form-group">
                    <label for="edit-gems">Gem Reward</label>
                    <input type="number" id="edit-gems" value="${entity.gemReward || 0}">
                </div>
                <div class="form-group">
                    <label for="edit-science">Max Science</label>
                    <input type="number" id="edit-science" value="${entity.maxScience || 0}">
                </div>
            </div>
            <div class="form-group">
                <label for="edit-effect">Dock Effect</label>
                <select id="edit-effect">
                    <option value="none" ${entity.dockEffect === 'none' ? 'selected' : ''}>None</option>
                    <option value="heal" ${entity.dockEffect === 'heal' ? 'selected' : ''}>Heal Hull</option>
                    <option value="gems" ${entity.dockEffect === 'gems' ? 'selected' : ''}>Acquire Gems</option>
                    <option value="science" ${entity.dockEffect === 'science' ? 'selected' : ''}>Gain Science</option>
                </select>
            </div>
            <div class="form-group">
                <label for="edit-desc">Description</label>
                <textarea id="edit-desc" rows="3">${entity.description || ''}</textarea>
            </div>
            <div class="form-group-row" style="margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px;">
                <div class="form-group">
                    <label for="edit-parasite-type">Parasite Type</label>
                    <select id="edit-parasite-type">
                        <option value="none" ${!entity.parasite ? 'selected' : ''}>None</option>
                        <option value="blob" ${entity.parasite && entity.parasite.type === 'blob' ? 'selected' : ''}>Blob</option>
                        <option value="oppressor" ${entity.parasite && entity.parasite.type === 'oppressor' ? 'selected' : ''}>Oppressor</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-parasite-guards">Guards Count</label>
                    <input type="number" id="edit-parasite-guards" value="${entity.parasite ? entity.parasite.guards : 4}" ${!entity.parasite ? 'disabled' : ''}>
                </div>
            </div>
        `;
    } else if (type === 'region') {
        html = `
            <div class="form-group">
                <label for="edit-name">Region Name</label>
                <input type="text" id="edit-name" value="${entity.name || ''}">
            </div>
            <div class="form-group-row">
                <div class="form-group">
                    <label for="edit-icon">Icon</label>
                    <input type="text" id="edit-icon" value="${entity.icon || ''}">
                </div>
                <div class="form-group">
                    <label for="edit-color">Color Hex</label>
                    <input type="color" id="edit-color" value="${entity.color || '#ffffff'}">
                </div>
            </div>
            <div class="form-group-row">
                <div class="form-group">
                    <label for="edit-diff">Difficulty Lvl</label>
                    <input type="number" id="edit-diff" value="${entity.difficulty || 1}">
                </div>
                <div class="form-group">
                    <label for="edit-reward">Gem Reward</label>
                    <input type="number" id="edit-reward" value="${entity.gemReward || 0}">
                </div>
            </div>
            <div class="form-group">
                <label for="edit-desc">Description</label>
                <textarea id="edit-desc" rows="2">${entity.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label for="edit-bg">BG Color</label>
                <div style="display: flex; gap: 8px;">
                    <input type="text" id="edit-bg" value="${entity.bgColor || '#000000'}" style="flex: 1;">
                    <input type="color" id="edit-bg-picker" value="${colorToHex(entity.bgColor)}" style="width: 45px; padding: 0; height: 38px; cursor: pointer; border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; background: none;">
                </div>
            </div>
            <div class="form-group">
                <label for="edit-particles">Particles</label>
                <select id="edit-particles">
                    <option value="none" ${entity.particleType === 'none' ? 'selected' : ''}>None</option>
                    <option value="dust" ${entity.particleType === 'dust' ? 'selected' : ''}>Dust</option>
                    <option value="spore" ${entity.particleType === 'spore' ? 'selected' : ''}>Spore</option>
                    <option value="ember" ${entity.particleType === 'ember' ? 'selected' : ''}>Ember</option>
                </select>
            </div>
            ${entity.caps ? `
            <h4 style="margin-top: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;">Spawn Caps</h4>
            <div class="form-group-row">
                <div class="form-group">
                    <label for="cap-gravityWells">Gravity Wells</label>
                    <input type="number" id="cap-gravityWells" value="${entity.caps.gravityWells || 0}">
                </div>
                <div class="form-group">
                    <label for="cap-comets">Comets</label>
                    <input type="number" id="cap-comets" value="${entity.caps.comets || 0}">
                </div>
            </div>
            <div class="form-group-row">
                <div class="form-group">
                    <label for="cap-cargoTrains">Cargo Trains</label>
                    <input type="number" id="cap-cargoTrains" value="${entity.caps.cargoTrains || 0}">
                </div>
                <div class="form-group">
                    <label for="cap-mines">Space Mines</label>
                    <input type="number" id="cap-mines" value="${entity.caps.mines || 0}">
                </div>
            </div>
            <div class="form-group-row">
                <div class="form-group">
                    <label for="cap-derelicts">Derelicts</label>
                    <input type="number" id="cap-derelicts" value="${entity.caps.derelicts || 0}">
                </div>
                <div class="form-group">
                    <label for="cap-asteroids">Asteroids</label>
                    <input type="number" id="cap-asteroids" value="${entity.caps.asteroids || 0}">
                </div>
            </div>
            <div class="form-group-row">
                <div class="form-group">
                    <label for="cap-fighters">Fighters</label>
                    <input type="number" id="cap-fighters" value="${entity.caps.fighters || 0}">
                </div>
                <div class="form-group">
                    <label for="cap-battleships">Battleships</label>
                    <input type="number" id="cap-battleships" value="${entity.caps.battleships || 0}">
                </div>
            </div>
            <div class="form-group-row">
                <div class="form-group">
                    <label for="cap-neutrals">Neutrals</label>
                    <input type="number" id="cap-neutrals" value="${entity.caps.neutrals || 0}">
                </div>
                <div class="form-group">
                    <label for="cap-dreadnoughts">Dreadnoughts</label>
                    <input type="number" id="cap-dreadnoughts" value="${entity.caps.dreadnoughts || 0}">
                </div>
            </div>
            ` : ''}
        `;

        if (entity.bounds) {
            html += `
                <h4 style="margin-top: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;">Bounds Coordinates</h4>
                <div class="form-group-row">
                    <div class="form-group">
                        <label for="edit-minx">Min Coord X</label>
                        <input type="number" step="0.5" id="edit-minx" value="${entity.bounds.minX}">
                    </div>
                    <div class="form-group">
                        <label for="edit-maxx">Max Coord X</label>
                        <input type="number" step="0.5" id="edit-maxx" value="${entity.bounds.maxX}">
                    </div>
                </div>
                <div class="form-group-row">
                    <div class="form-group">
                        <label for="edit-miny">Min Coord Y</label>
                        <input type="number" step="0.5" id="edit-miny" value="${entity.bounds.minY}">
                    </div>
                    <div class="form-group">
                        <label for="edit-maxy">Max Coord Y</label>
                        <input type="number" step="0.5" id="edit-maxy" value="${entity.bounds.maxY}">
                    </div>
                </div>
            `;
        }
    } else if (type === 'asteroids') {
        html = `
            <input type="hidden" id="edit-id" value="${entity.id}">
            <div class="form-group">
                <label for="edit-name">Asteroid Name</label>
                <input type="text" id="edit-name" value="${entity.name || ''}">
            </div>
            <div class="form-group-row">
                <div class="form-group">
                    <label for="edit-cx">Coord X</label>
                    <input type="number" step="0.1" id="edit-cx" value="${(entity.worldX / 1000).toFixed(2)}">
                </div>
                <div class="form-group">
                    <label for="edit-cy">Coord Y</label>
                    <input type="number" step="0.1" id="edit-cy" value="${(-entity.worldY / 1000).toFixed(2)}">
                </div>
            </div>
            <div class="form-group">
                <label for="edit-radius">Radius (World Px)</label>
                <input type="number" id="edit-radius" value="${entity.radius || 800}">
            </div>
        `;
    } else if (type === 'nebulas') {
        html = `
            <div class="form-group">
                <label for="edit-name">Nebula Name</label>
                <input type="text" id="edit-name" value="${entity.name || ''}">
            </div>
            <div class="form-group-row">
                <div class="form-group">
                    <label for="edit-cx">Coord X</label>
                    <input type="number" step="0.1" id="edit-cx" value="${(entity.worldX / 1000).toFixed(2)}">
                </div>
                <div class="form-group">
                    <label for="edit-cy">Coord Y</label>
                    <input type="number" step="0.1" id="edit-cy" value="${(-entity.worldY / 1000).toFixed(2)}">
                </div>
            </div>
            <div class="form-group-row">
                <div class="form-group">
                    <label for="edit-radius">Base Radius</label>
                    <input type="number" id="edit-radius" value="${entity.baseRadius || 1000}">
                </div>
                <div class="form-group">
                    <label for="edit-color">Color Hex</label>
                    <input type="color" id="edit-color" value="${entity.color || '#8a2be2'}">
                </div>
            </div>
            <div class="form-group">
                <label for="edit-blobs">Blob Count</label>
                <input type="number" id="edit-blobs" value="${entity.blobCount || 10}">
            </div>
        `;
    } else if (type === 'route') {
        inspectorTitle.innerText = `Edit Trade Route`;
        html = `
            <input type="hidden" id="edit-id" value="${entity.id}">
            <div class="form-group">
                <label for="edit-route-id">Route ID</label>
                <input type="text" id="edit-route-id" value="${entity.id}" readonly style="opacity: 0.6;">
            </div>
            <div class="form-group">
                <label for="edit-color">Color Hex</label>
                <input type="color" id="edit-color" value="${entity.color || '#00ffaa'}">
            </div>
            <div class="form-group-row">
                <div class="form-group">
                    <label for="edit-width">Width (World Px)</label>
                    <input type="number" id="edit-width" value="${entity.width || 250}">
                </div>
                <div class="form-group">
                    <label for="edit-speed">Speed Multiplier</label>
                    <input type="number" step="0.1" id="edit-speed" value="${entity.speedMultiplier || 2.5}">
                </div>
            </div>
        `;
    } else if (type === 'cluster') {
        inspectorTitle.innerText = `Edit Cluster`;
        html = `
            <div class="form-group">
                <label for="edit-name">Cluster Name</label>
                <input type="text" id="edit-name" value="${entity.name || ''}">
            </div>
            <div class="form-group-row">
                <div class="form-group">
                    <label for="edit-cluster-gems">Gem Reward</label>
                    <input type="number" id="edit-cluster-gems" value="${entity.reward ? entity.reward.gems : 0}">
                </div>
                <div class="form-group">
                    <label for="edit-cluster-science">Science Reward</label>
                    <input type="number" id="edit-cluster-science" value="${entity.reward ? entity.reward.science : 0}">
                </div>
            </div>
            <div class="form-group">
                <label for="edit-dialogue-sender">Dialogue Sender</label>
                <input type="text" id="edit-dialogue-sender" value="${entity.dialogue ? entity.dialogue.sender : 'GHOST COMPANION'}">
            </div>
            <div class="form-group">
                <label for="edit-dialogue-text">Dialogue Text</label>
                <textarea id="edit-dialogue-text" rows="3">${entity.dialogue ? entity.dialogue.text : ''}</textarea>
            </div>
            <div class="form-group">
                <label>Regions in Cluster</label>
                <div style="font-size: 0.8rem; background: rgba(0,0,0,0.2); padding: 5px 10px; border-radius: 4px; color: #aaa; max-height: 80px; overflow-y: auto; line-height: 1.4;">
                    ${entity.regions.join('<br>')}
                </div>
            </div>
        `;
    }

    inspectorFields.innerHTML = html;

    // Attach listener to update live variables on input changes
    const inputs = inspectorFields.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', updateEntityFromForm);
    });

    renderList();
    requestAnimationFrame(draw);
    switchTab('inspector-tab');
}

function updateEntityFromForm() {
    if (!selectedEntity) return;

    if (!formEditingStateSaved) {
        saveState();
        formEditingStateSaved = true;
    }

    const entity = selectedEntity.ref;
    const type = selectedEntity.type;

    const nameVal = document.getElementById('edit-name')?.value;
    if (nameVal !== undefined) entity.name = nameVal;

    const colorVal = document.getElementById('edit-color')?.value;
    if (colorVal !== undefined) entity.color = colorVal;

    const descVal = document.getElementById('edit-desc')?.value;
    if (descVal !== undefined) entity.description = descVal;

    if (type === 'stellar') {
        const typeVal = document.getElementById('edit-type')?.value;
        if (typeVal !== undefined) entity.type = typeVal;

        const cxVal = parseFloat(document.getElementById('edit-cx')?.value || 0);
        const cyVal = parseFloat(document.getElementById('edit-cy')?.value || 0);
        entity.coordX = cxVal;
        entity.coordY = cyVal;
        entity.worldX = cxVal * 1000;
        entity.worldY = -cyVal * 1000;

        const radVal = parseInt(document.getElementById('edit-radius')?.value || 0);
        if (radVal !== undefined) entity.radius = radVal;

        const dockVal = parseInt(document.getElementById('edit-dock')?.value || 0);
        if (dockVal !== undefined) entity.dockRadius = dockVal;

        const gemsVal = parseInt(document.getElementById('edit-gems')?.value || 0);
        if (gemsVal !== undefined) entity.gemReward = gemsVal;

        const sciVal = parseInt(document.getElementById('edit-science')?.value || 0);
        if (sciVal !== undefined) entity.maxScience = sciVal;

        const effectVal = document.getElementById('edit-effect')?.value;
        if (effectVal !== undefined) entity.dockEffect = effectVal;

        const parasiteTypeVal = document.getElementById('edit-parasite-type')?.value;
        const parasiteGuardsVal = parseInt(document.getElementById('edit-parasite-guards')?.value || 4);

        if (parasiteTypeVal === 'none') {
            delete entity.parasite;
            const guardsInput = document.getElementById('edit-parasite-guards');
            if (guardsInput) guardsInput.disabled = true;
        } else {
            entity.parasite = {
                type: parasiteTypeVal,
                guards: parasiteGuardsVal
            };
            const guardsInput = document.getElementById('edit-parasite-guards');
            if (guardsInput) guardsInput.disabled = false;
        }

    } else if (type === 'region') {
        const iconVal = document.getElementById('edit-icon')?.value;
        if (iconVal !== undefined) entity.icon = iconVal;

        const diffVal = parseInt(document.getElementById('edit-diff')?.value || 1);
        if (diffVal !== undefined) entity.difficulty = diffVal;

        const gemRewardVal = parseInt(document.getElementById('edit-reward')?.value || 0);
        if (gemRewardVal !== undefined) entity.gemReward = gemRewardVal;

        const bgVal = document.getElementById('edit-bg')?.value;
        const bgPickerVal = document.getElementById('edit-bg-picker')?.value;
        if (document.activeElement?.id === 'edit-bg-picker' && bgPickerVal) {
            document.getElementById('edit-bg').value = bgPickerVal;
            entity.bgColor = bgPickerVal;
        } else if (document.activeElement?.id === 'edit-bg' && bgVal) {
            entity.bgColor = bgVal;
            const hex = colorToHex(bgVal);
            const picker = document.getElementById('edit-bg-picker');
            if (picker) picker.value = hex;
        } else if (bgVal) {
            entity.bgColor = bgVal;
        }

        const partVal = document.getElementById('edit-particles')?.value;
        if (partVal !== undefined) entity.particleType = partVal;

        if (entity.bounds) {
            const minX = parseFloat(document.getElementById('edit-minx')?.value || 0);
            const maxX = parseFloat(document.getElementById('edit-maxx')?.value || 0);
            const minY = parseFloat(document.getElementById('edit-miny')?.value || 0);
            const maxY = parseFloat(document.getElementById('edit-maxy')?.value || 0);

            entity.bounds.minX = minX;
            entity.bounds.maxX = maxX;
            entity.bounds.minY = minY;
            entity.bounds.maxY = maxY;

            // Recenter region
            entity.center = {
                worldX: ((minX + maxX) / 2) * 1000,
                worldY: -((minY + maxY) / 2) * 1000
            };
        }

        if (entity.caps) {
            entity.caps.gravityWells = parseInt(document.getElementById('cap-gravityWells')?.value || 0);
            entity.caps.comets = parseInt(document.getElementById('cap-comets')?.value || 0);
            entity.caps.cargoTrains = parseInt(document.getElementById('cap-cargoTrains')?.value || 0);
            entity.caps.mines = parseInt(document.getElementById('cap-mines')?.value || 0);
            entity.caps.derelicts = parseInt(document.getElementById('cap-derelicts')?.value || 0);
            entity.caps.asteroids = parseInt(document.getElementById('cap-asteroids')?.value || 0);
            entity.caps.fighters = parseInt(document.getElementById('cap-fighters')?.value || 0);
            entity.caps.battleships = parseInt(document.getElementById('cap-battleships')?.value || 0);
            entity.caps.neutrals = parseInt(document.getElementById('cap-neutrals')?.value || 0);
            entity.caps.dreadnoughts = parseInt(document.getElementById('cap-dreadnoughts')?.value || 0);
        }
    } else if (type === 'asteroids') {
        const cxVal = parseFloat(document.getElementById('edit-cx')?.value || 0);
        const cyVal = parseFloat(document.getElementById('edit-cy')?.value || 0);
        entity.worldX = cxVal * 1000;
        entity.worldY = -cyVal * 1000;

        const radVal = parseInt(document.getElementById('edit-radius')?.value || 0);
        if (radVal !== undefined) entity.radius = radVal;

    } else if (type === 'nebulas') {
        const cxVal = parseFloat(document.getElementById('edit-cx')?.value || 0);
        const cyVal = parseFloat(document.getElementById('edit-cy')?.value || 0);
        entity.worldX = cxVal * 1000;
        entity.worldY = -cyVal * 1000;

        const radVal = parseInt(document.getElementById('edit-radius')?.value || 0);
        if (radVal !== undefined) entity.baseRadius = radVal;

        const blobsVal = parseInt(document.getElementById('edit-blobs')?.value || 0);
        if (blobsVal !== undefined) entity.blobCount = blobsVal;
    } else if (type === 'cluster') {
        const gemReward = parseInt(document.getElementById('edit-cluster-gems')?.value || 0);
        const science = parseInt(document.getElementById('edit-cluster-science')?.value || 0);
        entity.reward = { gems: gemReward, science };

        const sender = document.getElementById('edit-dialogue-sender')?.value || 'NPC';
        const text = document.getElementById('edit-dialogue-text')?.value || '';
        entity.dialogue = {
            sender,
            text,
            options: entity.dialogue ? entity.dialogue.options : [
                {
                    text: "Thank you. Let's keep moving.",
                    reply: "Understood."
                }
            ]
        };
    }

    renderList();
    requestAnimationFrame(draw);
}

// Side Panel List Rendering
function renderList() {
    entitiesList.innerHTML = '';

    const list = [];
    if (filterType === 'all' || filterType === 'stellar') {
        stellarObjects.forEach(obj => list.push({ item: obj, type: 'stellar', label: obj.name, subtitle: obj.type, cx: obj.coordX, cy: obj.coordY }));
    }
    if (filterType === 'all' || filterType === 'regions') {
        regions.forEach(reg => {
            const cx = reg.bounds ? (reg.bounds.minX + reg.bounds.maxX) / 2 : 0;
            const cy = reg.bounds ? (reg.bounds.minY + reg.bounds.maxY) / 2 : 0;
            list.push({ item: reg, type: 'region', label: reg.name, subtitle: 'Region', cx, cy });
        });
    }
    if (filterType === 'all' || filterType === 'asteroids') {
        asteroids.forEach(ast => list.push({ item: ast, type: 'asteroids', label: ast.name, subtitle: 'Asteroid', cx: ast.worldX / 1000, cy: -ast.worldY / 1000 }));
    }
    if (filterType === 'all' || filterType === 'nebulas') {
        nebulas.forEach(neb => list.push({ item: neb, type: 'nebulas', label: neb.name, subtitle: 'Nebula', cx: neb.worldX / 1000, cy: -neb.worldY / 1000 }));
    }
    if (filterType === 'all' || filterType === 'routes') {
        tradeRoutes.forEach(route => {
            const pA = stellarObjects.find(s => s.id === route.planetAId);
            const pB = stellarObjects.find(s => s.id === route.planetBId);
            const cx = pA && pB ? ((pA.coordX + pB.coordX) / 2) : 0;
            const cy = pA && pB ? ((pA.coordY + pB.coordY) / 2) : 0;
            list.push({ item: route, type: 'route', label: route.id, subtitle: 'Trade Route', cx, cy });
        });
    }
    if (filterType === 'all' || filterType === 'clusters') {
        clusters.forEach(c => {
            list.push({ item: c, type: 'cluster', label: c.name, subtitle: `Cluster (${c.regions.length} regions)`, cx: 0, cy: 0 });
        });
    }

    // Sort by name
    list.sort((a, b) => a.label.localeCompare(b.label));

    list.forEach(entry => {
        const itemEl = document.createElement('div');
        itemEl.className = 'list-item';
        if (selectedEntity && selectedEntity.ref === entry.item) {
            itemEl.classList.add('selected');
        }

        itemEl.innerHTML = `
            <div>
                <div class="list-item-name">${entry.label || 'Unnamed'}</div>
                <div class="list-item-type">${entry.subtitle}</div>
            </div>
            <div class="list-item-coords">${entry.type !== 'cluster' ? `[${entry.cx.toFixed(1)}, ${entry.cy.toFixed(1)}]` : ''}</div>
        `;

        itemEl.onclick = () => {
            selectEntity(entry.item, entry.type);
            // Center camera on it
            if (entry.item.worldX !== undefined) {
                camera.x = entry.item.worldX;
                camera.y = entry.item.worldY;
            } else if (entry.item.bounds) {
                camera.x = ((entry.item.bounds.minX + entry.item.bounds.maxX) / 2) * 1000;
                camera.y = -((entry.item.bounds.minY + entry.item.bounds.maxY) / 2) * 1000;
            } else if (entry.type === 'route') {
                const pA = stellarObjects.find(s => s.id === entry.item.planetAId);
                const pB = stellarObjects.find(s => s.id === entry.item.planetBId);
                if (pA && pB) {
                    camera.x = (pA.worldX + pB.worldX) / 2;
                    camera.y = (pA.worldY + pB.worldY) / 2;
                }
            }
            requestAnimationFrame(draw);
        };

        entitiesList.appendChild(itemEl);
    });
}

function getDistanceToSegment(p, v, w) {
    const l2 = Math.hypot(v.x - w.x, v.y - w.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

// Drag & Drop Mechanics & Canvas Handlers
function onMouseDown(e) {
    dragStateSaved = false;
    const screenPos = { x: e.clientX - canvas.getBoundingClientRect().left, y: e.clientY - canvas.getBoundingClientRect().top };
    const worldPos = screenToWorld(screenPos.x, screenPos.y);

    if (e.button === 2 || e.button === 1) {
        // Right Click/Middle Click is panning
        isPanning = true;
        panStart = { x: e.clientX, y: e.clientY };
        return;
    }

    const isMultiSelectKey = e.shiftKey || e.ctrlKey || e.metaKey;

    function handleSelection(item, type) {
        if (isMultiSelectKey) {
            const index = selectedEntities.findIndex(sel => sel.ref === item);
            if (index !== -1) {
                selectedEntities.splice(index, 1);
                if (selectedEntity && selectedEntity.ref === item) {
                    selectedEntity = selectedEntities[0] || null;
                }
            } else {
                selectedEntities.push({ type, ref: item });
                selectedEntity = { type, ref: item };
            }
            selectEntity(selectedEntity ? selectedEntity.ref : null, selectedEntity ? selectedEntity.type : null, true);
        } else {
            const exists = selectedEntities.some(sel => sel.ref === item);
            if (!exists) {
                selectedEntities = [{ type, ref: item }];
                selectedEntity = { type, ref: item };
            }
            selectEntity(selectedEntity.ref, selectedEntity.type, true);
        }

        // Cache initial positions for multi dragging
        selectedEntities.forEach(sel => {
            if (sel.type === 'stellar' || sel.type === 'asteroids' || sel.type === 'nebulas') {
                sel.startWorldX = sel.ref.worldX;
                sel.startWorldY = sel.ref.worldY;
            } else if (sel.type === 'region' && sel.ref.bounds) {
                sel.startBounds = { ...sel.ref.bounds };
            }
        });
    }

    // Check for Region Resizing Handles
    if (selectedEntity && selectedEntity.type === 'region' && selectedEntity.ref.bounds && selectedEntities.length === 1) {
        const reg = selectedEntity.ref;
        const minX = reg.bounds.minX * 1000;
        const maxX = reg.bounds.maxX * 1000;
        const minY = -reg.bounds.maxY * 1000;
        const maxY = -reg.bounds.minY * 1000;

        const corners = [
            { x: minX, y: minY, handle: 'TL' },
            { x: maxX, y: minY, handle: 'TR' },
            { x: maxX, y: maxY, handle: 'BR' },
            { x: minX, y: maxY, handle: 'BL' }
        ];

        for (const c of corners) {
            const screenC = worldToScreen(c.x, c.y);
            const dist = Math.hypot(screenPos.x - screenC.x, screenPos.y - screenC.y);
            if (dist < 10) {
                dragTarget = { type: 'region-handle', ref: reg, handle: c.handle };
                return;
            }
        }
    }

    // Stellar Objects
    if (visibility.planets || visibility.stations || visibility.stars || visibility.asteroids || visibility.nebulas) {
        for (const obj of stellarObjects) {
            if (obj.type === 'planet' && !visibility.planets) continue;
            if (obj.type === 'station' && !visibility.stations) continue;
            if (obj.type === 'star' && !visibility.stars) continue;
            if (obj.type === 'nebula' && !visibility.nebulas) continue;
            if (obj.type === 'asteroid' && !visibility.asteroids) continue;

            const dist = Math.hypot(worldPos.x - obj.worldX, worldPos.y - obj.worldY);
            if (dist < Math.max(400, obj.radius || 300)) {
                handleSelection(obj, 'stellar');
                dragTarget = { type: 'stellar', ref: obj, startWorld: { ...worldPos } };
                return;
            }
        }
    }

    // Asteroids
    if (visibility.asteroids) {
        for (const ast of asteroids) {
            const dist = Math.hypot(worldPos.x - ast.worldX, worldPos.y - ast.worldY);
            if (dist < Math.max(400, ast.radius || 300)) {
                handleSelection(ast, 'asteroids');
                dragTarget = { type: 'asteroids', ref: ast, startWorld: { ...worldPos } };
                return;
            }
        }
    }

    // Nebulas
    if (visibility.nebulas) {
        for (const neb of nebulas) {
            const dist = Math.hypot(worldPos.x - neb.worldX, worldPos.y - neb.worldY);
            if (dist < Math.max(500, neb.baseRadius || 400)) {
                handleSelection(neb, 'nebulas');
                dragTarget = { type: 'nebulas', ref: neb, startWorld: { ...worldPos } };
                return;
            }
        }
    }

    // Regions Click (inside region box)
    if (visibility.regions) {
        for (const reg of regions) {
            if (!reg.bounds) continue;
            const cx = worldPos.x / 1000;
            const cy = -worldPos.y / 1000;
            if (cx >= reg.bounds.minX && cx <= reg.bounds.maxX && cy >= reg.bounds.minY && cy <= reg.bounds.maxY) {
                handleSelection(reg, 'region');
                dragTarget = { type: 'region-drag', ref: reg, startWorld: { ...worldPos }, startBounds: { ...reg.bounds } };
                return;
            }
        }
    }

    // Trade Routes Click
    if (visibility.routes) {
        for (const route of tradeRoutes) {
            const pA = stellarObjects.find(s => s.id === route.planetAId);
            const pB = stellarObjects.find(s => s.id === route.planetBId);
            if (pA && pB) {
                const dist = getDistanceToSegment(worldPos, { x: pA.worldX, y: pA.worldY }, { x: pB.worldX, y: pB.worldY });
                if (dist < Math.max(200, (route.width || 250) / 2)) {
                    handleSelection(route, 'route');
                    return;
                }
            }
        }
    }

    // Clicked empty space: Pan if Shift or Space is held, otherwise start marquee select
    if (isMultiSelectKey || isSpacePressed) {
        isPanning = true;
        panStart = { x: e.clientX, y: e.clientY };
        return;
    }

    selectEntity(null);
    isSelecting = true;
    selectStart = { ...worldPos };
    selectEnd = { ...worldPos };
}

function onMouseMove(e) {
    const screenPos = { x: e.clientX - canvas.getBoundingClientRect().left, y: e.clientY - canvas.getBoundingClientRect().top };
    const worldPos = screenToWorld(screenPos.x, screenPos.y);

    // Update cursor coordinate display
    cursorCoords.innerText = `Cursor: ${(worldPos.x / 1000).toFixed(2)}, ${(-worldPos.y / 1000).toFixed(2)}`;

    if (isPanning) {
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        camera.x -= dx / camera.zoom;
        camera.y -= dy / camera.zoom;
        panStart = { x: e.clientX, y: e.clientY };
        requestAnimationFrame(draw);
        return;
    }

    if (isSelecting) {
        selectEnd = { ...worldPos };
        requestAnimationFrame(draw);
        return;
    }

    if (dragTarget) {
        if (!dragStateSaved) {
            saveState();
            dragStateSaved = true;
        }

        const cx = worldPos.x / 1000;
        const cy = -worldPos.y / 1000;

        if (dragTarget.type === 'region-handle') {
            const reg = dragTarget.ref;
            const stepVal = e.shiftKey ? 0.1 : 0.5; // Snap options
            const snappedX = Math.round(cx / stepVal) * stepVal;
            const snappedY = Math.round(cy / stepVal) * stepVal;

            if (dragTarget.handle === 'TL') {
                reg.bounds.minX = Math.min(snappedX, reg.bounds.maxX - 0.5);
                reg.bounds.maxY = Math.max(snappedY, reg.bounds.minY + 0.5);
            } else if (dragTarget.handle === 'TR') {
                reg.bounds.maxX = Math.max(snappedX, reg.bounds.minX + 0.5);
                reg.bounds.maxY = Math.max(snappedY, reg.bounds.minY + 0.5);
            } else if (dragTarget.handle === 'BR') {
                reg.bounds.maxX = Math.max(snappedX, reg.bounds.minX + 0.5);
                reg.bounds.minY = Math.min(snappedY, reg.bounds.maxY - 0.5);
            } else if (dragTarget.handle === 'BL') {
                reg.bounds.minX = Math.min(snappedX, reg.bounds.maxX - 0.5);
                reg.bounds.minY = Math.min(snappedY, reg.bounds.maxY - 0.5);
            }
            reg.center = {
                worldX: ((reg.bounds.minX + reg.bounds.maxX) / 2) * 1000,
                worldY: -((reg.bounds.minY + reg.bounds.maxY) / 2) * 1000
            };
            updateInspectorInputs();
        } else {
            // Multi drag offset
            const dx = worldPos.x - dragTarget.startWorld.x;
            const dy = worldPos.y - dragTarget.startWorld.y;

            selectedEntities.forEach(sel => {
                if (sel.type === 'stellar') {
                    const obj = sel.ref;
                    obj.worldX = Math.round(sel.startWorldX + dx);
                    obj.worldY = Math.round(sel.startWorldY + dy);
                    obj.coordX = parseFloat((obj.worldX / 1000).toFixed(2));
                    obj.coordY = parseFloat((-obj.worldY / 1000).toFixed(2));
                } else if (sel.type === 'asteroids') {
                    const ast = sel.ref;
                    ast.worldX = Math.round(sel.startWorldX + dx);
                    ast.worldY = Math.round(sel.startWorldY + dy);
                } else if (sel.type === 'nebulas') {
                    const neb = sel.ref;
                    neb.worldX = Math.round(sel.startWorldX + dx);
                    neb.worldY = Math.round(sel.startWorldY + dy);
                } else if (sel.type === 'region') {
                    const reg = sel.ref;
                    if (reg.bounds) {
                        const stepVal = e.shiftKey ? 0.1 : 0.5;
                        const snappedDx = Math.round((dx / 1000) / stepVal) * stepVal;
                        const snappedDy = Math.round((-dy / 1000) / stepVal) * stepVal;

                        reg.bounds.minX = sel.startBounds.minX + snappedDx;
                        reg.bounds.maxX = sel.startBounds.maxX + snappedDx;
                        reg.bounds.minY = sel.startBounds.minY + snappedDy;
                        reg.bounds.maxY = sel.startBounds.maxY + snappedDy;

                        reg.center = {
                            worldX: ((reg.bounds.minX + reg.bounds.maxX) / 2) * 1000,
                            worldY: -((reg.bounds.minY + reg.bounds.maxY) / 2) * 1000
                        };
                    }
                }
            });
            updateInspectorInputs();
        }

        requestAnimationFrame(draw);
    }
}

function onMouseUp(e) {
    dragTarget = null;
    isPanning = false;

    if (isSelecting) {
        isSelecting = false;
        
        const dx = Math.abs(selectEnd.x - selectStart.x);
        const dy = Math.abs(selectEnd.y - selectStart.y);

        if (dx > 50 || dy > 50) { // Require a small threshold to start marquee
            const minX = Math.min(selectStart.x, selectEnd.x);
            const maxX = Math.max(selectStart.x, selectEnd.x);
            const minY = Math.min(selectStart.y, selectEnd.y);
            const maxY = Math.max(selectStart.y, selectEnd.y);

            function isInside(wx, wy) {
                return wx >= minX && wx <= maxX && wy >= minY && wy <= maxY;
            }

            const newSelections = [];

            // Stellar Objects
            stellarObjects.forEach(obj => {
                if (obj.type === 'planet' && !visibility.planets) return;
                if (obj.type === 'station' && !visibility.stations) return;
                if (obj.type === 'star' && !visibility.stars) return;
                if (obj.type === 'nebula' && !visibility.nebulas) return;
                if (obj.type === 'asteroid' && !visibility.asteroids) return;

                if (isInside(obj.worldX, obj.worldY)) {
                    newSelections.push({ type: 'stellar', ref: obj });
                }
            });

            // Asteroids
            if (visibility.asteroids) {
                asteroids.forEach(ast => {
                    if (isInside(ast.worldX, ast.worldY)) {
                        newSelections.push({ type: 'asteroids', ref: ast });
                    }
                });
            }

            // Nebulas
            if (visibility.nebulas) {
                nebulas.forEach(neb => {
                    if (isInside(neb.worldX, neb.worldY)) {
                        newSelections.push({ type: 'nebulas', ref: neb });
                    }
                });
            }

            // Regions
            if (visibility.regions) {
                regions.forEach(reg => {
                    if (reg.bounds) {
                        const rcx = reg.center ? reg.center.worldX : ((reg.bounds.minX + reg.bounds.maxX) / 2) * 1000;
                        const rcy = reg.center ? reg.center.worldY : -((reg.bounds.minY + reg.bounds.maxY) / 2) * 1000;
                        if (isInside(rcx, rcy)) {
                            newSelections.push({ type: 'region', ref: reg });
                        }
                    }
                });
            }

            if (newSelections.length > 0) {
                selectedEntities = newSelections;
                selectedEntity = newSelections[0];
                selectEntity(selectedEntity.ref, selectedEntity.type, true);
            }
        }
        requestAnimationFrame(draw);
    }
}

function onWheel(e) {
    e.preventDefault();
    const zoomFactor = 1.1;
    if (e.deltaY < 0) {
        zoom(zoomFactor);
    } else {
        zoom(1 / zoomFactor);
    }
}

function zoom(factor) {
    const newZoom = Math.min(camera.maxZoom, Math.max(camera.minZoom, camera.zoom * factor));
    camera.zoom = newZoom;
    requestAnimationFrame(draw);
}

function updateInspectorInputs() {
    if (!selectedEntity) return;
    const entity = selectedEntity.ref;
    const type = selectedEntity.type;

    if (type === 'stellar') {
        const cxInput = document.getElementById('edit-cx');
        const cyInput = document.getElementById('edit-cy');
        if (cxInput) cxInput.value = entity.coordX;
        if (cyInput) cyInput.value = entity.coordY;
    } else if (type === 'region') {
        if (entity.bounds) {
            const minX = document.getElementById('edit-minx');
            const maxX = document.getElementById('edit-maxx');
            const minY = document.getElementById('edit-miny');
            const maxY = document.getElementById('edit-maxy');
            if (minX) minX.value = entity.bounds.minX;
            if (maxX) maxX.value = entity.bounds.maxX;
            if (minY) minY.value = entity.bounds.minY;
            if (maxY) maxY.value = entity.bounds.maxY;
        }
    } else if (type === 'asteroids' || type === 'nebulas') {
        const cxInput = document.getElementById('edit-cx');
        const cyInput = document.getElementById('edit-cy');
        if (cxInput) cxInput.value = (entity.worldX / 1000).toFixed(2);
        if (cyInput) cyInput.value = (-entity.worldY / 1000).toFixed(2);
    }
}

// Add / Delete Entities
function createNewEntity() {
    saveState();
    const createType = document.getElementById('create-type').value;
    const centerWorld = { x: Math.round(camera.x), y: Math.round(camera.y) };
    const centerCoord = { x: parseFloat((camera.x / 1000).toFixed(1)), y: parseFloat((-camera.y / 1000).toFixed(1)) };

    let newEnt = null;
    let typeTag = '';

    if (createType === 'stellar') {
        newEnt = {
            id: 'station_' + Math.random().toString(36).substr(2, 9),
            name: 'New Stellar Object',
            type: 'station',
            coordX: centerCoord.x,
            coordY: centerCoord.y,
            worldX: centerWorld.x,
            worldY: centerWorld.y,
            radius: 300,
            dockRadius: 150,
            gemReward: 0,
            dockEffect: 'none',
            maxScience: 0,
            color: '#ffffff',
            description: 'A newly mapped celestial object.'
        };
        stellarObjects.push(newEnt);
        typeTag = 'stellar';
    } else if (createType === 'region') {
        newEnt = {
            name: 'New Sector',
            icon: '🪐',
            color: '#00ffaa',
            description: 'An uncharted new boundary.',
            bounds: {
                minX: centerCoord.x - 3,
                maxX: centerCoord.x + 3,
                minY: centerCoord.y - 3,
                maxY: centerCoord.y + 3
            },
            center: { worldX: centerWorld.x, worldY: centerWorld.y },
            difficulty: 1,
            bgColor: '#000805',
            particleType: 'none',
            caps: {
                gravityWells: 1,
                comets: 1,
                cargoTrains: 0,
                mines: 2,
                derelicts: 4,
                asteroids: 30,
                fighters: 4,
                battleships: 0,
                neutrals: 4,
                dreadnoughts: 0,
            }
        };
        regions.push(newEnt);
        typeTag = 'region';
    } else if (createType === 'asteroid') {
        newEnt = {
            id: 'large_ast_' + Math.random().toString(36).substr(2, 9),
            name: 'New Asteroid',
            worldX: centerWorld.x,
            worldY: centerWorld.y,
            radius: 800
        };
        asteroids.push(newEnt);
        typeTag = 'asteroids';
    } else if (createType === 'nebula') {
        newEnt = {
            name: 'New Nebula Field',
            worldX: centerWorld.x,
            worldY: centerWorld.y,
            color: '#8a2be2',
            blobCount: 10,
            baseRadius: 1000
        };
        nebulas.push(newEnt);
        typeTag = 'nebulas';
    }

    renderList();
    selectEntity(newEnt, typeTag);
}

function deleteSelectedEntity() {
    if (!selectedEntity) return;

    const label = selectedEntity.ref.name || selectedEntity.ref.id || 'this object';
    const confirmDel = confirm(`Are you sure you want to delete "${label}"?`);
    if (!confirmDel) return;

    saveState();
    const ref = selectedEntity.ref;
    if (selectedEntity.type === 'stellar') {
        stellarObjects = stellarObjects.filter(obj => obj !== ref);
    } else if (selectedEntity.type === 'region') {
        regions = regions.filter(reg => reg !== ref);
    } else if (selectedEntity.type === 'asteroids') {
        asteroids = asteroids.filter(ast => ast !== ref);
    } else if (selectedEntity.type === 'nebulas') {
        nebulas = nebulas.filter(neb => neb !== ref);
    } else if (selectedEntity.type === 'route') {
        tradeRoutes = tradeRoutes.filter(r => r !== ref);
    } else if (selectedEntity.type === 'cluster') {
        clusters = clusters.filter(c => c !== ref);
    }

    selectEntity(null);
}

// Save back to local files via Editor Node Server
async function saveToFiles() {
    try {
        const stContent = serializeStellarObjects();
        const astContent = serializeAsteroids();
        const nebContent = serializeNebulas();
        const regContent = serializeRegions();
        const trContent = serializeTradeRoutes();
        const clContent = serializeClusters();

        const files = [
            { filename: 'stellarObjects.js', content: stContent },
            { filename: 'largeAsteroids.js', content: astContent },
            { filename: 'nebulas.js', content: nebContent },
            { filename: 'regions.js', content: regContent },
            { filename: 'tradeRoutes.js', content: trContent },
            { filename: 'clusters.js', content: clContent }
        ];

        for (const file of files) {
            const res = await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(file)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        }

        showStatus('Changes saved to files!');
        setUnsavedChanges(false);
    } catch (err) {
        alert('Error saving files: ' + err.message);
        console.error(err);
    }
}

function showStatus(text) {
    statusOverlay.innerText = text;
    statusOverlay.classList.remove('hidden');
    setTimeout(() => {
        statusOverlay.classList.add('hidden');
    }, 3000);
}

// Local helper to download file locally if server is not used
function exportFile(filename, content) {
    const blob = new Blob([content], { type: 'application/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function exportAllFiles() {
    exportFile('stellarObjects.js', serializeStellarObjects());
    exportFile('largeAsteroids.js', serializeAsteroids());
    exportFile('nebulas.js', serializeNebulas());
    exportFile('regions.js', serializeRegions());
    exportFile('tradeRoutes.js', serializeTradeRoutes());
    exportFile('clusters.js', serializeClusters());
}

// Data Serializers to reconstruct the exact clean JavaScript Code
function serializeStellarObjects() {
    let out = `// All stellar objects in the galaxy. Each entry defines a persistent world object.\n`;
    out += `// worldX = coordX * 1000, worldY = -coordY * 1000 (Canvas Y is inverted)\n`;
    out += `export const STELLAR_OBJECTS = [\n`;

    const formatted = stellarObjects.map(obj => {
        return '    ' + JSON.stringify(obj, null, 4).replace(/\n/g, '\n    ');
    });

    out += formatted.join(',\n') + '\n];\n';
    return out;
}

function serializeAsteroids() {
    let out = `export const LARGE_ASTEROID_DEFINITIONS = [\n`;

    const formatted = asteroids.map(ast => {
        return '    ' + JSON.stringify(ast, null, 4).replace(/\n/g, '\n    ');
    });

    out += formatted.join(',\n') + '\n];\n';
    return out;
}

function serializeNebulas() {
    let out = `export const NEBULA_DEFINITIONS = [\n`;

    const formatted = nebulas.map(neb => {
        return '    ' + JSON.stringify(neb, null, 4).replace(/\n/g, '\n    ');
    });

    out += formatted.join(',\n') + '\n];\n';
    return out;
}

function serializeRegions() {
    let out = `// Regions are defined as coordinate-space predicates + spawn caps.\n`;
    out += `// coordX = worldX / 1000, coordY = -worldY / 1000 (Y is inverted on canvas)\n\n`;
    out += `export const REGIONS = [\n`;

    const formatted = regions.map(reg => {
        let testFuncStr;
        if (reg.name === 'The Void') {
            testFuncStr = `(cx, cy) => Math.abs(cx) > 45 || Math.abs(cy) > 45`;
        } else if (reg.name === 'Blob Space') {
            testFuncStr = `(cx, cy) => cx > 4 && cy < -10`;
        } else if (reg.name === 'Robo Space') {
            testFuncStr = `(cx, cy) => cx < -6 && cy < -10`;
        } else if (reg.name === 'The Great Barrier') {
            testFuncStr = `(cx, cy) => cx > -3 && cy < -10 && cx < 3 && cy > -20`;
        } else if (reg.bounds) {
            testFuncStr = `(cx, cy) => cx >= ${reg.bounds.minX} && cx <= ${reg.bounds.maxX} && cy >= ${reg.bounds.minY} && cy <= ${reg.bounds.maxY}`;
        } else {
            testFuncStr = `() => true`;
        }

        const lines = [];
        lines.push('{');
        lines.push(`    "name": ${JSON.stringify(reg.name)},`);
        if (reg.icon !== undefined) lines.push(`    "icon": ${JSON.stringify(reg.icon)},`);
        lines.push(`    "color": ${JSON.stringify(reg.color)},`);
        lines.push(`    "test": ${testFuncStr},`);
        if (reg.description !== undefined) lines.push(`    "description": ${JSON.stringify(reg.description)},`);
        if (reg.gemReward !== undefined) lines.push(`    "gemReward": ${reg.gemReward},`);
        if (reg.bounds !== undefined) lines.push(`    "bounds": ${JSON.stringify(reg.bounds, null, 8).trim()},`);
        if (reg.center !== undefined) lines.push(`    "center": ${JSON.stringify(reg.center, null, 8).trim()},`);
        if (reg.difficulty !== undefined) lines.push(`    "difficulty": ${reg.difficulty},`);
        if (reg.isVoid !== undefined) lines.push(`    "isVoid": ${reg.isVoid},`);
        if (reg.bgColor !== undefined) lines.push(`    "bgColor": ${JSON.stringify(reg.bgColor)},`);
        if (reg.particleType !== undefined) lines.push(`    "particleType": ${JSON.stringify(reg.particleType)},`);
        if (reg.caps !== undefined) lines.push(`    "caps": ${JSON.stringify(reg.caps, null, 8).trim()}`);
        lines.push('}');

        const block = lines.join('\n');
        return '    ' + block.replace(/\n/g, '\n    ');
    });

    out += formatted.join(',\n') + '\n];\n\n';

    // Serialize default region
    const defaultLines = [];
    defaultLines.push('{');
    defaultLines.push(`    name: ${JSON.stringify(defaultRegion.name)},`);
    defaultLines.push(`    icon: ${JSON.stringify(defaultRegion.icon)},`);
    defaultLines.push(`    color: ${JSON.stringify(defaultRegion.color)},`);
    defaultLines.push(`    test: () => true,`);
    defaultLines.push(`    description: ${JSON.stringify(defaultRegion.description)},`);
    defaultLines.push(`    difficulty: ${defaultRegion.difficulty},`);
    defaultLines.push(`    center: ${JSON.stringify(defaultRegion.center, null, 4).trim()},`);
    defaultLines.push(`    bgColor: ${JSON.stringify(defaultRegion.bgColor)},`);
    defaultLines.push(`    particleType: ${JSON.stringify(defaultRegion.particleType)},`);
    defaultLines.push(`    caps: ${JSON.stringify(defaultRegion.caps, null, 4).trim()}`);
    defaultLines.push('}');

    out += `export const DEFAULT_REGION = ${defaultLines.join('\n')};\n`;

    return out;
}

function createTradeRoute() {
    const stars = selectedEntities.filter(sel => sel.type === 'stellar');
    if (stars.length !== 2 || selectedEntities.length !== 2) {
        alert("Please select exactly two stellar objects on the map first (use Shift + Click to select multiple).");
        return;
    }

    const pA = stars[0].ref;
    const pB = stars[1].ref;

    // Check if route already exists
    const exists = tradeRoutes.some(r => 
        (r.planetAId === pA.id && r.planetBId === pB.id) || 
        (r.planetAId === pB.id && r.planetBId === pA.id)
    );

    if (exists) {
        alert("A trade route already exists between these two objects.");
        return;
    }

    saveState();

    const cleanId = (id) => id.replace('planet_', '').replace('station_', '').replace('star_', '');
    const newRoute = {
        id: `${cleanId(pA.id)}_${cleanId(pB.id)}`,
        planetAId: pA.id,
        planetBId: pB.id,
        color: '#00ffaa',
        width: 250,
        speedMultiplier: 2.5
    };

    tradeRoutes.push(newRoute);
    
    // Select the new route
    selectedEntities = [{ type: 'route', ref: newRoute }];
    selectedEntity = { type: 'route', ref: newRoute };
    selectEntity(newRoute, 'route', true);

    showStatus("Created Trade Route!");
    renderList();
    requestAnimationFrame(draw);
}

function serializeTradeRoutes() {
    let out = `export const TRADE_ROUTES_CONFIG = [\n`;
    const formatted = tradeRoutes.map(route => {
        return '    ' + JSON.stringify(route, null, 4).replace(/\n/g, '\n    ');
    });
    out += formatted.join(',\n') + '\n];\n';
    return out;
}

function serializeClusters() {
    let out = `export const CLUSTERS = [\n`;
    const formatted = clusters.map(c => {
        return '    ' + JSON.stringify(c, null, 4).replace(/\n/g, '\n    ');
    });
    out += formatted.join(',\n') + '\n];\n';
    return out;
}

function createClusterFromSelected(regionNames) {
    const clusterName = prompt("Enter the name of the new cluster (e.g. The Frontier):");
    if (!clusterName) return;

    const clusterId = clusterName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Check if ID already exists
    if (clusters.some(c => c.id === clusterId)) {
        alert("A cluster with that name/ID already exists!");
        return;
    }

    const gemRewardStr = prompt("Enter Gem Reward amount:", "2000");
    const gemReward = parseInt(gemRewardStr) || 0;

    const scienceRewardStr = prompt("Enter Science Reward amount:", "150");
    const science = parseInt(scienceRewardStr) || 0;

    const speaker = prompt("Enter dialogue speaker:", "GHOST COMPANION");
    const text = prompt("Enter dialogue message:", "Incredible work, Commander! We have fully secured the " + clusterName + " cluster.");

    const newCluster = {
        id: clusterId,
        name: clusterName,
        regions: [...regionNames],
        reward: { gems: gemReward, science },
        dialogue: {
            sender: speaker || 'NPC',
            text: text || ('You have secured ' + clusterName + '.'),
            options: [
                {
                    text: "Thank you. Let's keep moving.",
                    reply: "Understood."
                }
            ]
        }
    };

    saveState();
    clusters.push(newCluster);
    setUnsavedChanges(true);
    alert(`Cluster "${clusterName}" created successfully with ${regionNames.length} regions!`);
    
    // Switch to list tab and select it
    selectEntity(newCluster, 'cluster');
    renderList();
}

// Start application
window.onload = init;
