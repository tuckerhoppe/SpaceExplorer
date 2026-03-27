import { Utils } from '../utils.js';

export class MegaLandmark {
    constructor(data) {
        this.type = data.type;
        this.worldX = data.worldX;
        this.worldY = data.worldY;
        this.parallax = data.parallax || 0.05;
        this.radius = data.radius || 2500;

        this.canvas = null;
        this.initCanvas();
    }

    initCanvas() {
        const size = this.radius * 2;

        // Use OffscreenCanvas if supported, otherwise standard Canvas
        if (typeof OffscreenCanvas !== 'undefined') {
            this.canvas = new OffscreenCanvas(size, size);
        } else {
            this.canvas = document.createElement('canvas');
            this.canvas.width = size;
            this.canvas.height = size;
        }

        const ctx = this.canvas.getContext('2d');

        // Center drawing context
        ctx.translate(this.radius, this.radius);

        if (this.type === 'Shattered Moon') {
            this._drawShatteredMoon(ctx);
        } else if (this.type === 'Spiral Galaxy') {
            this._drawSpiralGalaxy(ctx);
        } else if (this.type === 'Ring Galaxy') {
            this._drawRingGalaxy(ctx);
        } else if (this.type === 'Black Hole') {
            this._drawBlackHole(ctx);
        } else if (this.type === 'Crimson Nebula') {
            this._drawCrimsonNebula(ctx);
        }
    }

    _drawShatteredMoon(ctx) {
        const r = this.radius * 0.8;

        // Base glowing aura
        const aura = ctx.createRadialGradient(0, 0, r * 0.8, 0, 0, r * 1.5);
        aura.addColorStop(0, 'rgba(255, 100, 40, 0.5)');
        aura.addColorStop(0.5, 'rgba(150, 50, 20, 0.2)');
        aura.addColorStop(1, 'transparent');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Main moon body
        ctx.fillStyle = '#2a1a10';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Rocky dark hemisphere overlay (slightly offset)
        ctx.fillStyle = '#1a0d05';
        ctx.beginPath();
        ctx.arc(-r * 0.1, -r * 0.1, r * 0.95, 0, Math.PI * 2);
        ctx.fill();

        // Rim light highlight
        const rim = ctx.createRadialGradient(-r * 0.4, -r * 0.4, r * 0.5, -r * 0.4, -r * 0.4, r);
        rim.addColorStop(0, 'rgba(255, 200, 150, 0)');
        rim.addColorStop(1, 'rgba(255, 150, 100, 0.2)');
        ctx.fillStyle = rim;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Carve out gaps so stars show through!
        ctx.globalCompositeOperation = 'destination-out';

        // Big jagged cut-out 1
        ctx.beginPath();
        ctx.moveTo(-r, r * 0.2);
        ctx.lineTo(-r * 0.5, r * 0.1);
        ctx.lineTo(0, r * 0.3);
        ctx.lineTo(r * 0.5, 0);
        ctx.lineTo(r * 0.8, -r * 0.2);
        ctx.lineTo(r, r * 0.1);
        ctx.lineTo(r, r * 0.5);
        ctx.lineTo(0, r * 0.6);
        ctx.lineTo(-r, r * 0.8);
        ctx.closePath();
        ctx.fill();

        // Big jagged cut-out 2
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r * 0.2, -r * 0.4);
        ctx.lineTo(r * 0.5, -r * 0.6);
        ctx.lineTo(r, -r * 0.3);
        ctx.lineTo(r, -r);
        ctx.closePath();
        ctx.fill();

        // Thick jagged lines
        ctx.strokeStyle = '#000'; // Color doesn't matter for destination-out
        ctx.lineJoin = 'bevel';
        ctx.lineWidth = 100;
        ctx.beginPath();
        ctx.moveTo(-r * 0.5, -r * 0.5);
        ctx.lineTo(-r * 0.2, 0);
        ctx.lineTo(-r * 0.4, r * 0.5);
        ctx.stroke();

        ctx.lineWidth = 60;
        ctx.beginPath();
        ctx.moveTo(r * 0.2, r * 0.4);
        ctx.lineTo(r * 0.6, r * 0.2);
        ctx.stroke();

        ctx.globalCompositeOperation = 'source-over';

        // Glowing fracture edges
        ctx.strokeStyle = 'rgba(255, 100, 40, 0.4)';
        ctx.lineWidth = 20;
        ctx.beginPath();
        // Path 1
        ctx.moveTo(-r, r * 0.2); ctx.lineTo(-r * 0.5, r * 0.1); ctx.lineTo(0, r * 0.3); ctx.lineTo(r * 0.5, 0);
        ctx.stroke();
        // Path 2
        ctx.beginPath();
        ctx.moveTo(0, -r); ctx.lineTo(r * 0.2, -r * 0.4); ctx.lineTo(r * 0.5, -r * 0.6);
        ctx.stroke();

        // Add some small fragmented floating pieces around
        ctx.fillStyle = '#2a1a10';
        for (let i = 0; i < 40; i++) {
            const fx = Utils.rand(-r * 1.2, r * 1.2);
            const fy = Utils.rand(-r * 1.2, r * 1.2);
            const dist = Utils.dist(0, 0, fx, fy);
            if (dist > r * 0.3 && dist < r * 1.1) {
                ctx.beginPath();
                ctx.arc(fx, fy, Utils.rand(20, 90), 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    _drawBlackHole(ctx) {
        const r = this.radius;
        const horizonR = r * 0.18;

        // 1. Gravitational lensing glow (faint blue/purple aura)
        const aura = ctx.createRadialGradient(0, 0, horizonR, 0, 0, r * 0.9);
        aura.addColorStop(0, 'rgba(50, 0, 150, 0.4)');
        aura.addColorStop(0.5, 'rgba(20, 0, 60, 0.2)');
        aura.addColorStop(1, 'transparent');
        ctx.fillStyle = aura;
        ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2); ctx.fill();

        // 2. Accretion Disk (Background/Under-warp)
        // This part is the back of the disk warped *above* the event horizon
        ctx.save();
        const backWarp = ctx.createRadialGradient(0, -horizonR * 0.5, horizonR, 0, -horizonR * 0.5, r * 0.7);
        backWarp.addColorStop(0, '#ffffff');
        backWarp.addColorStop(0.1, '#ffaa00');
        backWarp.addColorStop(0.4, 'rgba(255, 60, 0, 0.3)');
        backWarp.addColorStop(1, 'transparent');
        ctx.fillStyle = backWarp;
        ctx.beginPath();
        ctx.ellipse(0, -horizonR * 0.8, r * 0.6, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 3. Main Horizontal Disk (Asymmetric Beaming)
        ctx.save();
        ctx.scale(1, 0.15);
        const diskGrad = ctx.createRadialGradient(-r * 0.2, 0, horizonR, -r * 0.2, 0, r);
        diskGrad.addColorStop(0, '#ffffff');
        diskGrad.addColorStop(0.1, '#ffdd44');
        diskGrad.addColorStop(0.3, 'rgba(255, 100, 0, 0.6)');
        diskGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = diskGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 4. Fore-warp (Bottom part of the warped disk)
        ctx.save();
        const foreWarp = ctx.createRadialGradient(0, horizonR * 0.5, horizonR, 0, horizonR * 0.5, r * 0.5);
        foreWarp.addColorStop(0, '#ffffff');
        foreWarp.addColorStop(0.2, '#ff8800');
        foreWarp.addColorStop(1, 'transparent');
        ctx.fillStyle = foreWarp;
        ctx.beginPath();
        ctx.ellipse(0, horizonR * 1.0, r * 0.5, r * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 5. Event Horizon (The "Void")
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(0, 0, horizonR, 0, Math.PI * 2);
        ctx.fill();

        // 6. Photon Sphere (Sharp bright edge)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, horizonR + 2, 0, Math.PI * 2);
        ctx.stroke();

        // Add a faint secondary glow inside the photon sphere
        ctx.strokeStyle = 'rgba(255, 200, 100, 0.5)';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(0, 0, horizonR + 5, 0, Math.PI * 2);
        ctx.stroke();
    }

    _drawCrimsonNebula(ctx) {
        const r = this.radius;

        // 1. Large Universal Background Glow
        const bg = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        bg.addColorStop(0, 'rgba(80, 0, 40, 0.15)');
        bg.addColorStop(0.7, 'rgba(40, 0, 80, 0.05)');
        bg.addColorStop(1, 'transparent');
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // 2. Cohesive Elliptical Lobes
        // We use a few very large, stretched gradients to create the main structure
        const colors = [
            'rgba(255, 0, 50, 0.12)',  // Crimson
            'rgba(150, 0, 255, 0.08)', // Violet
            'rgba(255, 100, 0, 0.08)'  // Orange
        ];

        for (let i = 0; i < 5; i++) {
            ctx.save();
            ctx.rotate(i * (Math.PI * 2 / 5) + 0.5);
            // Non-uniform scaling to create ellipses
            ctx.scale(1.6, 0.6); 
            
            const lobeSize = r * 0.5;
            const lobe = ctx.createRadialGradient(0, 0, 0, 0, 0, lobeSize);
            lobe.addColorStop(0, colors[i % colors.length]);
            lobe.addColorStop(1, 'transparent');
            
            ctx.fillStyle = lobe;
            ctx.beginPath();
            ctx.arc(r * 0.2, 0, lobeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // 3. Wispy Gas Filaments
        // Long, flowing strokes using quadratic curves
        ctx.lineCap = 'round';
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 + Math.random();
            const startDist = r * 0.2;
            const endDist = r * 0.85;
            
            const x1 = Math.cos(angle) * startDist;
            const y1 = Math.sin(angle) * startDist;
            const x2 = Math.cos(angle + 0.8) * endDist;
            const y2 = Math.sin(angle + 0.8) * endDist;
            const cpX = Math.cos(angle + 0.4) * r * 0.6;
            const cpY = Math.sin(angle + 0.4) * r * 0.6;

            const filament = ctx.createLinearGradient(x1, y1, x2, y2);
            filament.addColorStop(0, 'rgba(255, 150, 150, 0)');
            filament.addColorStop(0.5, 'rgba(255, 100, 100, 0.08)');
            filament.addColorStop(1, 'rgba(255, 50, 50, 0)');

            ctx.strokeStyle = filament;
            ctx.lineWidth = 15 + Math.random() * 20;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo(cpX, cpY, x2, y2);
            ctx.stroke();
        }

        // 4. Central Proto-star (Brighter, more integrated)
        const core = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.12);
        core.addColorStop(0, '#ffffff');
        core.addColorStop(0.3, 'rgba(200, 255, 255, 0.4)');
        core.addColorStop(0.7, 'rgba(100, 200, 255, 0.1)');
        core.addColorStop(1, 'transparent');
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2);
        ctx.fill();

        // 5. Very faint outer haze
        const haze = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 1.2);
        haze.addColorStop(0, 'rgba(255, 255, 255, 0.02)');
        haze.addColorStop(1, 'transparent');
        ctx.fillStyle = haze;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.2, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawSpiralGalaxy(ctx) {
        const r = this.radius;
        const arms = 4;

        // Deep purple/blue core
        const core = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.3);
        core.addColorStop(0, '#ffffff');
        core.addColorStop(0.2, '#aa55ff');
        core.addColorStop(1, 'transparent');
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Spiral arms
        for (let a = 0; a < arms; a++) {
            ctx.save();
            ctx.rotate((a / arms) * Math.PI * 2);
            ctx.beginPath();

            // Draw an arm composed of overlapping soft circles
            for (let i = 0; i < 50; i++) {
                ctx.beginPath();
                const dist = (i / 50) * r;
                const angle = dist * 0.003; // spiral twist
                const size = (1 - i / 50) * r * 0.2 + 20;

                const px = Math.cos(angle) * dist;
                const py = Math.sin(angle) * dist;

                const grad = ctx.createRadialGradient(px, py, 0, px, py, size);
                grad.addColorStop(0, 'rgba(100, 200, 255, 0.15)');
                grad.addColorStop(1, 'transparent');

                ctx.fillStyle = grad;
                ctx.arc(px, py, size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // Dust lanes
        // ctx.fillStyle = 'rgba(0,0,0,0.4)';
        // for (let i = 0; i < 30; i++) {
        //     const dist = Utils.rand(0, r * 0.8);
        //     const angle = Math.random() * Math.PI * 2;
        //     ctx.beginPath();
        //     ctx.arc(Math.cos(angle)*dist, Math.sin(angle)*dist, Utils.rand(20, 100), 0, Math.PI*2);
        //     ctx.fill();
        // }
    }

    _drawRingGalaxy(ctx) {
        const r = this.radius;

        // 1. Central Bulge (Golden/Golden-White)
        const core = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.25);
        core.addColorStop(0, '#ffffff');
        core.addColorStop(0.3, '#ffcc88'); // Warm golden core
        core.addColorStop(1, 'transparent');
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // 2. The Galactic Ring (Cyan/Blue-Violet)
        const ringInner = r * 0.55;
        const ringOuter = r * 0.85;

        // Draw the main ring body with a radial gradient
        const ringGrad = ctx.createRadialGradient(0, 0, ringInner, 0, 0, ringOuter);
        ringGrad.addColorStop(0, 'rgba(100, 200, 255, 0)'); // Transparent inner edge
        ringGrad.addColorStop(0.5, 'rgba(80, 160, 255, 0.2)'); // Soft blue body
        ringGrad.addColorStop(1, 'rgba(150, 100, 255, 0)'); // Purple-ish outer edge

        ctx.fillStyle = ringGrad;
        ctx.beginPath();
        ctx.arc(0, 0, ringOuter, 0, Math.PI * 2);
        ctx.arc(0, 0, ringInner, 0, Math.PI * 2, true); // Reverse arc for cut-out
        ctx.fill();

        // 3. Star Clusters and Gas Knots in the ring
        for (let i = 0; i < 150; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = ringInner + Math.random() * (ringOuter - ringInner);
            const size = Math.random() * 40 + 10;

            const px = Math.cos(angle) * dist;
            const py = Math.sin(angle) * dist;

            const cluster = ctx.createRadialGradient(px, py, 0, px, py, size);
            // Alternate colors for variety
            if (i % 3 === 0) {
                cluster.addColorStop(0, 'rgba(200, 255, 255, 0.3)'); // Cyan
            } else if (i % 3 === 1) {
                cluster.addColorStop(0, 'rgba(255, 200, 255, 0.2)'); // Pinkish
            } else {
                cluster.addColorStop(0, 'rgba(255, 255, 255, 0.35)'); // White
            }
            cluster.addColorStop(1, 'transparent');

            ctx.fillStyle = cluster;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // 4. Distant halo (very faint glow around everything)
        const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        halo.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
        halo.addColorStop(0.6, 'rgba(100, 150, 255, 0.02)');
        halo.addColorStop(1, 'transparent');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
    }

    draw(ctx, camera) {
        if (!this.canvas) return;

        // Calculate parallax position relative to camera
        // Using same parallax logic as stars but for a specific coordinate

        // Formula used in Game.js for stars: 
        // px = (s.x - camera.x * s.parallax) ...
        // Here, worldX/worldY is absolute. But since it's a fixed landmark:
        // Normally: ScreenX = WorldX - CameraX
        // Parallax means moving slower. Parallax 0 means it moves with camera (fixed on screen)
        // Parallax 1 means it moves fully with world (normal object)
        // Wait, standard 2D parallax:
        // Screen position = WorldPos - CameraPos * parallax

        // Since we want 0.05 to simulate extreme distance, it moves very little as camera moves.
        const drawX = this.worldX - (camera.x * this.parallax);
        const drawY = this.worldY - (camera.y * this.parallax);

        // Cull if entirely off-screen
        // (Remember canvas is drawn from top-left, but we pass centered context, so offset by radius)
        if (drawX + this.radius < 0 || drawX - this.radius > camera.viewW ||
            drawY + this.radius < 0 || drawY - this.radius > camera.viewH) {
            return;
        }

        ctx.drawImage(
            this.canvas,
            drawX - this.radius,
            drawY - this.radius
        );
    }
}
