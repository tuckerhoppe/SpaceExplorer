import { STELLAR_OBJECTS } from './src/data/stellarObjects.js';
import { REGIONS, DEFAULT_REGION } from './src/data/regions.js';
import { LARGE_ASTEROID_DEFINITIONS } from './src/data/largeAsteroids.js';
import { NEBULA_DEFINITIONS } from './src/data/nebulas.js';
import { TRADE_ROUTES_CONFIG } from './src/data/tradeRoutes.js';

// Application State
let stellarObjects = [...STELLAR_OBJECTS];
let regions = [...REGIONS];
let defaultRegion = { ...DEFAULT_REGION };
let asteroids = [...LARGE_ASTEROID_DEFINITIONS];
let nebulas = [...NEBULA_DEFINITIONS];

let selectedEntity = null;
let currentTab = 'list-tab';
let filterType = 'all';

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

    // Delete button
    document.getElementById('btn-inspect-delete').onclick = deleteSelectedEntity;

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

// Undo System Functions
function saveState() {
    const state = {
        stellarObjects: JSON.parse(JSON.stringify(stellarObjects)),
        regions: JSON.parse(JSON.stringify(regions)),
        asteroids: JSON.parse(JSON.stringify(asteroids)),
        nebulas: JSON.parse(JSON.stringify(nebulas))
    };
    undoStack.push(state);
    if (undoStack.length > 50) {
        undoStack.shift();
    }
    updateUndoButtonState();
}

function undo() {
    if (undoStack.length === 0) return;
    const previousState = undoStack.pop();

    stellarObjects = previousState.stellarObjects;
    regions = previousState.regions;
    asteroids = previousState.asteroids;
    nebulas = previousState.nebulas;

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
    regions.forEach(region => drawRegion(region));

    // Draw Trade Routes
    drawTradeRoutes();

    // Draw Nebulas
    nebulas.forEach(neb => drawNebula(neb));

    // Draw Large Asteroids
    asteroids.forEach(ast => drawAsteroid(ast));

    // Draw Stellar Objects
    stellarObjects.forEach(obj => drawStellarObject(obj));

    // Draw Handles for Selected Entity (if applicable)
    drawSelectionHighlights();
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
    TRADE_ROUTES_CONFIG.forEach(route => {
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
    if (!selectedEntity) return;

    ctx.strokeStyle = varColor('--accent-blue');
    ctx.lineWidth = 2;

    if (selectedEntity.type === 'region') {
        const reg = selectedEntity.ref;
        if (!reg.bounds) return;

        const minX = reg.bounds.minX * 1000;
        const maxX = reg.bounds.maxX * 1000;
        const minY = -reg.bounds.maxY * 1000;
        const maxY = -reg.bounds.minY * 1000;

        const topLeft = worldToScreen(minX, minY);
        const bottomRight = worldToScreen(maxX, maxY);

        // Draw handles at 4 corners
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
    } else {
        const item = selectedEntity.ref;
        const screen = worldToScreen(item.worldX, item.worldY);
        const size = Math.max(15, (item.radius || item.baseRadius || 500) * camera.zoom + 5);

        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, size, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

function varColor(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

// Selection & Inspection Logic
function selectEntity(entity, type) {
    formEditingStateSaved = false;
    if (!entity) {
        selectedEntity = null;
        inspectorForm.classList.add('hidden');
        inspectorEmpty.classList.remove('hidden');
        renderList();
        requestAnimationFrame(draw);
        return;
    }

    selectedEntity = { type, ref: entity };
    inspectorEmpty.classList.add('hidden');
    inspectorForm.classList.remove('hidden');

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
                <input type="text" id="edit-bg" value="${entity.bgColor || '#000000'}">
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

    } else if (type === 'region') {
        const iconVal = document.getElementById('edit-icon')?.value;
        if (iconVal !== undefined) entity.icon = iconVal;

        const diffVal = parseInt(document.getElementById('edit-diff')?.value || 1);
        if (diffVal !== undefined) entity.difficulty = diffVal;

        const gemRewardVal = parseInt(document.getElementById('edit-reward')?.value || 0);
        if (gemRewardVal !== undefined) entity.gemReward = gemRewardVal;

        const bgVal = document.getElementById('edit-bg')?.value;
        if (bgVal !== undefined) entity.bgColor = bgVal;

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
            <div class="list-item-coords">[${entry.cx.toFixed(1)}, ${entry.cy.toFixed(1)}]</div>
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
            }
            requestAnimationFrame(draw);
        };

        entitiesList.appendChild(itemEl);
    });
}

// Drag & Drop Mechanics & Canvas Handlers
function onMouseDown(e) {
    dragStateSaved = false;
    const screenPos = { x: e.clientX - canvas.getBoundingClientRect().left, y: e.clientY - canvas.getBoundingClientRect().top };
    const worldPos = screenToWorld(screenPos.x, screenPos.y);

    if (e.button === 2 || e.button === 1 || e.shiftKey) {
        // Right Click/Middle Click or Shift+Click is panning
        isPanning = true;
        panStart = { x: e.clientX, y: e.clientY };
        return;
    }

    // Check for Region Resizing Handles
    if (selectedEntity && selectedEntity.type === 'region' && selectedEntity.ref.bounds) {
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

    // Check other objects (prioritize smaller sizes)
    // Stellar Objects
    for (const obj of stellarObjects) {
        const dist = Math.hypot(worldPos.x - obj.worldX, worldPos.y - obj.worldY);
        if (dist < Math.max(400, obj.radius || 300)) {
            dragTarget = { type: 'stellar', ref: obj };
            selectEntity(obj, 'stellar');
            return;
        }
    }

    // Asteroids
    for (const ast of asteroids) {
        const dist = Math.hypot(worldPos.x - ast.worldX, worldPos.y - ast.worldY);
        if (dist < Math.max(400, ast.radius || 300)) {
            dragTarget = { type: 'asteroids', ref: ast };
            selectEntity(ast, 'asteroids');
            return;
        }
    }

    // Nebulas
    for (const neb of nebulas) {
        const dist = Math.hypot(worldPos.x - neb.worldX, worldPos.y - neb.worldY);
        if (dist < Math.max(500, neb.baseRadius || 400)) {
            dragTarget = { type: 'nebulas', ref: neb };
            selectEntity(neb, 'nebulas');
            return;
        }
    }

    // Regions Click (inside region box)
    for (const reg of regions) {
        if (!reg.bounds) continue;
        const cx = worldPos.x / 1000;
        const cy = -worldPos.y / 1000;
        if (cx >= reg.bounds.minX && cx <= reg.bounds.maxX && cy >= reg.bounds.minY && cy <= reg.bounds.maxY) {
            dragTarget = { type: 'region-drag', ref: reg, startWorld: { ...worldPos }, startBounds: { ...reg.bounds } };
            selectEntity(reg, 'region');
            return;
        }
    }

    // Clicked empty space: deselect
    selectEntity(null);
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

    if (dragTarget) {
        if (!dragStateSaved) {
            saveState();
            dragStateSaved = true;
        }
        const cx = worldPos.x / 1000;
        const cy = -worldPos.y / 1000;

        if (dragTarget.type === 'stellar') {
            const obj = dragTarget.ref;
            obj.worldX = Math.round(worldPos.x);
            obj.worldY = Math.round(worldPos.y);
            obj.coordX = parseFloat((worldPos.x / 1000).toFixed(2));
            obj.coordY = parseFloat((-worldPos.y / 1000).toFixed(2));
            updateInspectorInputs();
        } else if (dragTarget.type === 'asteroids') {
            const ast = dragTarget.ref;
            ast.worldX = Math.round(worldPos.x);
            ast.worldY = Math.round(worldPos.y);
            updateInspectorInputs();
        } else if (dragTarget.type === 'nebulas') {
            const neb = dragTarget.ref;
            neb.worldX = Math.round(worldPos.x);
            neb.worldY = Math.round(worldPos.y);
            updateInspectorInputs();
        } else if (dragTarget.type === 'region-handle') {
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
        } else if (dragTarget.type === 'region-drag') {
            const reg = dragTarget.ref;
            const dx = cx - dragTarget.startWorld.x / 1000;
            const dy = cy - (-dragTarget.startWorld.y / 1000);
            
            const stepVal = e.shiftKey ? 0.1 : 0.5;
            const snappedDx = Math.round(dx / stepVal) * stepVal;
            const snappedDy = Math.round(dy / stepVal) * stepVal;

            reg.bounds.minX = dragTarget.startBounds.minX + snappedDx;
            reg.bounds.maxX = dragTarget.startBounds.maxX + snappedDx;
            reg.bounds.minY = dragTarget.startBounds.minY + snappedDy;
            reg.bounds.maxY = dragTarget.startBounds.maxY + snappedDy;

            reg.center = {
                worldX: ((reg.bounds.minX + reg.bounds.maxX) / 2) * 1000,
                worldY: -((reg.bounds.minY + reg.bounds.maxY) / 2) * 1000
            };
            updateInspectorInputs();
        }

        requestAnimationFrame(draw);
    }
}

function onMouseUp() {
    dragTarget = null;
    isPanning = false;
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

    const confirmDel = confirm(`Are you sure you want to delete "${selectedEntity.ref.name || 'this object'}"?`);
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

        const files = [
            { filename: 'stellarObjects.js', content: stContent },
            { filename: 'largeAsteroids.js', content: astContent },
            { filename: 'nebulas.js', content: nebContent },
            { filename: 'regions.js', content: regContent }
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
            testFuncStr = `(cx, cy) => Math.abs(cx) > 30 || Math.abs(cy) > 30`;
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

// Start application
window.onload = init;
