import { REGIONS, DEFAULT_REGION } from '../data/regions.js';
import { Utils } from '../utils.js';

export class MiniMap {
    constructor(game) {
        this.game = game;
        this.container = document.getElementById('mini-map-container');
        this.canvas = document.getElementById('miniMapCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.size = 200; // Size of the mini-map in pixels
        this.radarRadius = 90; // Internal radius for the circular view
        this.scale = 0.04; // How much of the world to show (zoom level)
        
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', () => {
            if (this.game.hud) {
                this.game.hud.toggleMap();
            }
        });
    }

    draw() {
        if (!this.game.player) return;

        const ctx = this.ctx;
        const player = this.game.player;
        const centerX = this.size / 2;
        const centerY = this.size / 2;

        // Clear canvas
        ctx.clearRect(0, 0, this.size, this.size);

        // Draw circular background (Glassmorphism look)
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.radarRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(5, 10, 25, 0.7)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.clip(); // Ensure everything stays inside the circle

        // Translate and scale for coordinate space
        ctx.translate(centerX, centerY);
        ctx.scale(this.scale, this.scale);
        
        // Background Grid (Moving with player)
        this.drawGrid(ctx, player);

        // Region Borders
        this.drawRegionBorders(ctx, player);

        // Stellar Objects
        this.drawStellarObjects(ctx, player);

        // Enemies
        this._drawEnemyMarkers(ctx, player);

        // Large Asteroids
        this._drawLargeAsteroids(ctx, player);

        ctx.restore(); // Pop the world-space scale/translate

        // Region Hints (Screen space inside the clip)
        this.drawRegionHints(ctx, centerX, centerY, player);

        ctx.restore(); // Pop the clip segment

        // Draw Player Icon (Always in center)
        this.drawPlayerIcon(ctx, centerX, centerY, player.angle);

        // Draw Radar Sweep or Glimmer
        this.drawRadarSweep(ctx, centerX, centerY);
        
        // Draw Bezel / Border
        this.drawBezel(ctx, centerX, centerY);
    }

    drawGrid(ctx, player) {
        const gridSize = 2000;
        const offsetX = -player.x % gridSize;
        const offsetY = -player.y % gridSize;
        
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
        ctx.lineWidth = 20;

        const range = 5;
        for (let i = -range; i <= range; i++) {
            // Vertical lines
            ctx.beginPath();
            ctx.moveTo(offsetX + i * gridSize, -this.radarRadius / this.scale);
            ctx.lineTo(offsetX + i * gridSize, this.radarRadius / this.scale);
            ctx.stroke();

            // Horizontal lines
            ctx.beginPath();
            ctx.moveTo(-this.radarRadius / this.scale, offsetY + i * gridSize);
            ctx.lineTo(this.radarRadius / this.scale, offsetY + i * gridSize);
            ctx.stroke();
        }
    }

    drawRegionBorders(ctx, player) {
        REGIONS.forEach(reg => {
            if (reg.bounds) {
                const b = reg.bounds;
                // Convert grid bounds to world coords
                const minX = b.minX * 1000 - player.x;
                const maxX = b.maxX * 1000 - player.x;
                const minY = -b.maxY * 1000 - player.y; // Y is inverted in the grid data vs worldY
                const maxY = -b.minY * 1000 - player.y;

                // Draw region rectangle
                ctx.beginPath();
                ctx.rect(minX, minY, maxX - minX, maxY - minY);
                
                // Styling
                ctx.strokeStyle = reg.color + '66'; // 40% opacity
                ctx.lineWidth = 100; // Thick border line
                ctx.setLineDash([200, 200]);
                ctx.stroke();
                ctx.setLineDash([]);

                // Fill with very faint color
                ctx.fillStyle = reg.color + '11'; // ~6% opacity
                ctx.fill();

                // Draw Name Label at center of bounds
                const centerX = (minX + maxX) / 2;
                const centerY = (minY + maxY) / 2;
                
                const dist = Utils.dist(player.x, player.y, (b.minX + b.maxX) * 500, -(b.minY + b.maxY) * 500);
                if (dist < 15000) {
                    ctx.save();
                    ctx.scale(1 / this.scale, 1 / this.scale);
                    ctx.fillStyle = reg.color;
                    ctx.font = 'bold 9px Orbitron';
                    ctx.textAlign = 'center';
                    ctx.shadowColor = '#000';
                    ctx.shadowBlur = 4;
                    ctx.fillText(reg.name.toUpperCase(), centerX * this.scale, centerY * this.scale);
                    ctx.restore();
                }
            } else if (reg.center) {
                // Fallback for regions without bounds
                const rx = reg.center.worldX - player.x;
                const ry = reg.center.worldY - player.y;
                ctx.beginPath();
                ctx.arc(rx, ry, 3000, 0, Math.PI * 2);
                ctx.strokeStyle = reg.color + '33';
                ctx.stroke();
            }
        });
    }

    drawStellarObjects(ctx, player) {
        const sm = this.game.sectorManager;
        if (!sm) return;

        const TYPE_ICONS = { planet: '🪐', nebula: '🌌', star: '⭐', artifact: '💠', station: '🛸' };

        sm.objects.forEach(obj => {
            const isDiscovered = sm.discoveredIds.has(obj.id);
            if (!isDiscovered) return;

            const ox = obj.x - player.x;
            const oy = obj.y - player.y;

            // Don't draw if way out of bounds
            if (Math.abs(ox) > 8000 || Math.abs(oy) > 8000) return;

            ctx.save();
            ctx.translate(ox, oy);
            
            // Draw a small dot or icon
            ctx.beginPath();
            ctx.arc(0, 0, 150, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            
            // Optional: Icon label
            ctx.scale(1 / this.scale, 1 / this.scale);
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(TYPE_ICONS[obj.type] || '✦', 0, 0);
            
            ctx.restore();
        });
    }

    _drawEnemyMarkers(ctx, player) {
        // Collect all potential hostile entities
        const hostiles = [
            ...this.game.enemies,
            ...this.game.battleships,
            ...this.game.dreadnoughts,
            ...this.game.neutralShips.filter(ns => ns.wasAttacked)
        ];

        hostiles.forEach(e => {
            const ex = e.x - player.x;
            const ey = e.y - player.y;

            // Simple distance check to avoid drawing entities that are definitely clipped
            // (The radar circle clip is ~2250 units at 0.04 scale)
            const tacticalRange = 2500;
            if (Math.abs(ex) > tacticalRange || Math.abs(ey) > tacticalRange) return;

            ctx.save();
            ctx.translate(ex, ey);

            // Red glow for hostiles
            ctx.fillStyle = '#ff3c3c';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff3c3c';

            // Draw based on size (radius)
            if (e.radius > 30) {
                // Large ships: Diamond shape
                ctx.beginPath();
                ctx.moveTo(0, -180);
                ctx.lineTo(120, 0);
                ctx.lineTo(0, 180);
                ctx.lineTo(-120, 0);
                ctx.closePath();
                ctx.fill();
            } else {
                // Small ships: Circle
                ctx.beginPath();
                ctx.arc(0, 0, 75, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        });
    }

    _drawLargeAsteroids(ctx, player) {
        this.game.asteroids.forEach(a => {
            // "Max size for the region" logic:
            // Region Level 1-2: maxSize is 2
            // Region Level 3+: maxSize is 3
            const maxSize = a.regionLevel <= 2 ? 2 : 3;
            if (a.size < maxSize) return;

            const ax = a.x - player.x;
            const ay = a.y - player.y;

            // Simple distance check to avoid drawing entities that are definitely clipped
            const tacticalRange = 2500;
            if (Math.abs(ax) > tacticalRange || Math.abs(ay) > tacticalRange) return;

            ctx.save();
            ctx.translate(ax, ay);

            // Grey/Stone color for asteroids
            ctx.fillStyle = 'rgba(150, 150, 150, 0.6)';
            ctx.beginPath();
            ctx.arc(0, 0, 100, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }

    drawPlayerIcon(ctx, x, y, rotation) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);

        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-6, -6);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-6, 6);
        ctx.closePath();

        ctx.fillStyle = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f0ff';
        ctx.fill();
        
        ctx.restore();
    }

    drawRadarSweep(ctx, x, y) {
        const time = Date.now() / 1000;
        const angle = (time % 2) * Math.PI; // 2 second rotation
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        
        const grad = ctx.createConicGradient(0, 0, 0);
        grad.addColorStop(0, 'rgba(0, 240, 255, 0.2)');
        grad.addColorStop(0.1, 'rgba(0, 240, 255, 0)');
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, this.radarRadius, 0, 0.2);
        ctx.fillStyle = grad;
        ctx.fill();
        
        ctx.restore();
    }

    drawBezel(ctx, x, y) {
        ctx.beginPath();
        ctx.arc(x, y, this.radarRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Add cardinal marks
        for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(i * Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(0, -this.radarRadius);
            ctx.lineTo(0, -this.radarRadius + 8);
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }
    }

    drawRegionHints(ctx, x, y, player) {
        if (!this.game.regionManager) return;
        const currentRegion = this.game.regionManager.currentRegion;
        const allRegions = [...REGIONS, DEFAULT_REGION];

        // 1. Gather all candidate regions with their distances
        const candidates = allRegions
            .filter(reg => {
                const isDiscovered = (reg === DEFAULT_REGION) || (this.game.regionManager.discoveredRegions.has(reg.name));
                return reg !== currentRegion && reg.center && isDiscovered;
            })
            .map(reg => {
                const dx = reg.center.worldX - player.x;
                const dy = reg.center.worldY - player.y;
                return { reg, dx, dy, dist: Math.hypot(dx, dy) };
            })
            .filter(c => c.dist > this.radarRadius / this.scale) // Only off-screen regions
            .sort((a, b) => a.dist - b.dist) // Closest first
            .slice(0, 5); // Limit to top 5

        // 2. Draw the limited hints
        candidates.forEach(({ reg, dx, dy, dist }) => {
            const angle = Math.atan2(dy, dx);
            // Draw at the edge of the radar circle (inset slightly)
            const indicatorRadius = this.radarRadius - 5;
            const ix = x + Math.cos(angle) * indicatorRadius;
            const iy = y + Math.sin(angle) * indicatorRadius;

            ctx.save();
            ctx.translate(ix, iy);
            
            // Draw a small colored dot
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fillStyle = reg.color;
            ctx.shadowBlur = 5;
            ctx.shadowColor = reg.color;
            ctx.fill();
            
            // Draw the icon/emoji if it exists
            if (reg.icon) {
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowBlur = 0;
                // Offset emoji slightly inward from the dot
                const ex = -Math.cos(angle) * 12;
                const ey = -Math.sin(angle) * 12;
                ctx.fillText(reg.icon, ex, ey);
            }
            
            ctx.restore();
        });
    }
}
