import { REGIONS } from '../data/regions.js';
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

        ctx.restore();

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
}
