import { Utils } from '../utils.js';

export class Nebula {
    constructor(def) {
        this.id = def.id || ('nebula_' + def.name.replace(/\s+/g, '_').toLowerCase());
        this.name = def.name;
        this.x = def.worldX;
        this.y = def.worldY;
        this.color = def.color;
        this.baseRadius = def.baseRadius;
        
        // Simple seedable random number generator based on the nebula name
        let seed = 0;
        for (let i = 0; i < def.name.length; i++) {
            seed = (seed << 5) - seed + def.name.charCodeAt(i);
            seed |= 0;
        }
        
        const seededRandom = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };

        this.blobs = [];
        
        // 1. Center anchor blob
        this.blobs.push({
            dx: 0,
            dy: 0,
            r: this.baseRadius * (0.65 + seededRandom() * 0.25)
        });

        // 2. Generate irregular branches extending outwards
        const branchCount = 3 + Math.floor(seededRandom() * 3); // 3 to 5 branches
        for (let b = 0; b < branchCount; b++) {
            // Pick an outward angle for this branch
            const branchAngle = (b / branchCount) * Math.PI * 2 + (seededRandom() - 0.5) * 0.6;
            
            // Build a chain of 2 to 3 overlapping blobs along the branch
            const chainLength = 2 + Math.floor(seededRandom() * 2);
            let currentX = 0;
            let currentY = 0;
            let currentRadius = this.baseRadius * (0.6 + seededRandom() * 0.25);

            for (let c = 0; c < chainLength; c++) {
                const stepAngle = branchAngle + (seededRandom() - 0.5) * 0.4;
                const stepDist = currentRadius * (0.55 + seededRandom() * 0.35); // overlap spacing
                
                currentX += Math.cos(stepAngle) * stepDist;
                currentY += Math.sin(stepAngle) * stepDist;
                currentRadius *= (0.72 + seededRandom() * 0.15); // gradually taper the size
                
                this.blobs.push({
                    dx: currentX,
                    dy: currentY,
                    r: currentRadius
                });
            }
        }
    }

    contains(px, py) {
        for (const blob of this.blobs) {
            const bx = this.x + blob.dx;
            const by = this.y + blob.dy;
            const distSq = (px - bx) * (px - bx) + (py - by) * (py - by);
            if (distSq < blob.r * blob.r) {
                return true;
            }
        }
        return false;
    }

    draw(ctx, camera) {
        for (const blob of this.blobs) {
            const bx = this.x + blob.dx;
            const by = this.y + blob.dy;
            
            // Draw visual representation slightly larger than the collision radius (blob.r)
            // to ensure the player is visibly inside the nebula before being slowed down.
            const visualRadius = blob.r * 1.08;
            
            // Viewport cull using bounding circle of this blob
            if (bx + visualRadius < camera.x || bx - visualRadius > camera.x + camera.viewW / camera.zoom ||
                by + visualRadius < camera.y || by - visualRadius > camera.y + camera.viewH / camera.zoom) {
                continue;
            }
            
            ctx.save();
            
            // Base layer (strong color right up to the visual edge)
            const grad1 = ctx.createRadialGradient(bx, by, 0, bx, by, visualRadius);
            grad1.addColorStop(0, this.color + '55'); // 33% opacity inside
            grad1.addColorStop(0.93, this.color + '26'); // 15% opacity near the edge
            grad1.addColorStop(1, 'transparent');
            
            ctx.fillStyle = grad1;
            ctx.beginPath();
            ctx.arc(bx, by, visualRadius, 0, Math.PI * 2);
            ctx.fill();

            // Core highlight layer (smaller, brighter center)
            const grad2 = ctx.createRadialGradient(bx, by, 0, bx, by, visualRadius * 0.45);
            grad2.addColorStop(0, '#ffffff2b'); // faint white core
            grad2.addColorStop(0.4, this.color + '44'); // intense color core
            grad2.addColorStop(1, 'transparent');
            
            ctx.fillStyle = grad2;
            ctx.beginPath();
            ctx.arc(bx, by, visualRadius * 0.45, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    }
}
