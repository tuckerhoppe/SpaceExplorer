import { Parasite } from './Parasite.js';
import { Utils } from '../utils.js';

export class StellarObject {
    constructor(data, difficulty = 1.0, regionName = null) {
        this.id = data.id;
        this.name = data.name;
        this.type = data.type;
        this.coordX = data.coordX;
        this.coordY = data.coordY;
        this.x = data.worldX;
        this.y = data.worldY;
        this.radius = data.radius;
        this.dockRadius = data.dockRadius || 100;
        this.dockEffect = data.dockEffect || 'gems';
        this.color = data.color;
        this.description = data.description;
        this.gemReward = data.gemReward;
        this.maxScience = data.maxScience || 0;
        this.regionName = regionName;

        // Visual properties
        this.accentColor = data.accentColor || null;
        this.hasRings = data.hasRings || false;

        this._tick = 0; // used for animations

        if (data.parasite) {
            this.parasite = new Parasite(this, data.parasite, difficulty);
        }
    }

    draw(ctx, isDiscovered, camera, sciEarned = 0) {
        // Viewport cull — use radius as bounds
        if (this.x + this.radius < camera.x || this.x - this.radius > camera.x + camera.viewW ||
            this.y + this.radius < camera.y || this.y - this.radius > camera.y + camera.viewH) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        this._tick++;
        if (this.type === 'planet') {
            this._drawPlanet(ctx);
        } else if (this.type === 'nebula') {
            this._drawNebula(ctx);
        } else if (this.type === 'star') {
            this._drawStar(ctx);
        } else if (this.type === 'station') {
            this._drawStation(ctx);
        } else if (this.type === 'artifact') {
            this._drawArtifact(ctx);
        }

        // Dock range ring — subtle dashed circle showing docking zone
        ctx.strokeStyle = `${this.color}55`;
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 8]);
        ctx.beginPath();
        ctx.arc(0, 0, this.dockRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw name label and optional science bar if discovered
        if (isDiscovered) {
            const visualTop = this.type === 'planet' ? this.radius * 0.5
                : this.type === 'star' ? this.radius * 0.4
                    : this.type === 'station' ? this.dockRadius
                        : this.type === 'artifact' ? this.radius * 0.4
                            : this.radius * 0.5; // nebula
            const labelY = -(visualTop + 14);
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '500 13px Orbitron, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(this.name, 0, labelY);

            // Science progress bar (only for objects that give science)
            if (this.maxScience > 0) {
                const fraction = Math.min(1, sciEarned / this.maxScience);
                const barW = 80;
                const barH = 4;
                const barX = -barW / 2;
                const barY = labelY + 6;
                const exhausted = fraction >= 1;

                // Track
                ctx.fillStyle = 'rgba(255,255,255,0.12)';
                ctx.fillRect(barX, barY, barW, barH);

                // Fill
                ctx.fillStyle = exhausted ? 'rgba(140,140,140,0.5)' : 'rgba(80,220,120,0.8)';
                ctx.fillRect(barX, barY, barW * fraction, barH);

                // Label
                ctx.font = '9px Orbitron, sans-serif';
                ctx.fillStyle = exhausted ? 'rgba(140,140,140,0.6)' : 'rgba(80,220,120,0.7)';
                ctx.fillText(exhausted ? 'DATA FULL' : `⚗ ${sciEarned}/${this.maxScience} SP`, 0, barY + barH + 10);
            }
        }

        ctx.restore();
    }

    _drawPlanet(ctx) {
        const r = this.radius * 0.5;

        // Optional Rings (Back half)
        if (this.hasRings) {
            ctx.save();
            ctx.rotate(0.2); // Tilted angle
            ctx.strokeStyle = (this.accentColor || this.color) + '88';
            ctx.lineWidth = 12;
            ctx.beginPath();
            ctx.ellipse(0, 0, r * 1.6, r * 0.4, 0, Math.PI, Math.PI * 2); // Top half behind planet
            ctx.stroke();

            // Inner faint ring
            ctx.strokeStyle = '#ffffff33';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(0, 0, r * 1.3, r * 0.3, 0, Math.PI, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Planet base body (Solid Color)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Optional Accent Band
        if (this.accentColor) {
            const bandHeight = r * 0.8;
            const gradient = ctx.createLinearGradient(0, -bandHeight / 2, 0, bandHeight / 2);
            gradient.addColorStop(0, 'transparent');
            gradient.addColorStop(0.3, this.accentColor);
            gradient.addColorStop(0.7, this.accentColor);
            gradient.addColorStop(1, 'transparent');

            ctx.fillStyle = gradient;
            ctx.save();
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.clip(); // Clip to sphere
            ctx.fillRect(-r, -bandHeight / 2, r * 2, bandHeight); // Draw fading band across the middle
            ctx.restore();
        }

        // Inner 3D Shading (Crescent overlay)
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.clip(); // Clip to the planet circle

        ctx.fillStyle = 'rgba(0,0,0,0.5)'; // Dark shadow color
        ctx.beginPath();
        // Create a shape that masks out a crescent
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.arc(-r * 0.3, -r * 0.3, r * 1.1, 0, Math.PI * 2, true); // Offset arc carved outwards
        ctx.fill();
        ctx.restore();

        // Optional Rings (Front half)
        if (this.hasRings) {
            ctx.save();
            ctx.rotate(0.2);
            ctx.strokeStyle = (this.accentColor || this.color) + 'dd';
            ctx.lineWidth = 12;
            ctx.beginPath();
            ctx.ellipse(0, 0, r * 1.6, r * 0.4, 0, 0, Math.PI); // Bottom half over planet
            ctx.stroke();

            // Inner faint ring
            ctx.strokeStyle = '#ffffff66';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(0, 0, r * 1.3, r * 0.3, 0, 0, Math.PI);
            ctx.stroke();
            ctx.restore();
        }
    }

    _drawNebula(ctx) {
        const r = this.radius;

        // Simplify nebula to just overlapping glowing circles
        const layers = [
            { offset: { x: 0, y: 0 }, scale: 1.0, alpha: '44' },
            { offset: { x: r * 0.3, y: -r * 0.2 }, scale: 0.7, alpha: '55' },
            { offset: { x: -r * 0.2, y: r * 0.3 }, scale: 0.8, alpha: '33' },
            { offset: { x: -r * 0.4, y: -r * 0.1 }, scale: 0.5, alpha: '66' }
        ];

        layers.forEach(l => {
            const grad = ctx.createRadialGradient(
                l.offset.x, l.offset.y, 0,
                l.offset.x, l.offset.y, r * l.scale
            );

            grad.addColorStop(0, this.color + l.alpha);
            grad.addColorStop(0.5, this.color + '15');
            grad.addColorStop(1, 'transparent');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(l.offset.x, l.offset.y, r * l.scale, 0, Math.PI * 2);
            ctx.fill();
        });

        // Bright core stars
        ctx.fillStyle = '#ffffff66';
        ctx.beginPath();
        ctx.arc(-r * 0.1, -r * 0.1, 4, 0, Math.PI * 2);
        ctx.arc(r * 0.2, r * 0.1, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawStar(ctx) {
        const r = this.radius * 0.4;
        const spikes = 6;

        // Outer halo
        const halo = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 2.5);
        halo.addColorStop(0, this.color + '88');
        halo.addColorStop(0.4, this.color + '22');
        halo.addColorStop(1, 'transparent');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, r * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Spike silhouette (pulses slightly)
        const pulseOuter = 1 + Math.sin(this._tick * 0.05) * 0.1;
        ctx.fillStyle = this.color;

        ctx.save();
        ctx.rotate(this._tick * 0.005); // slow spin
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
            const rad = i % 2 === 0 ? r * pulseOuter : r * 0.35;
            const px = Math.cos(angle) * rad;
            const py = Math.sin(angle) * rad;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Bright core
        const coreRatio = 0.5;
        const core = ctx.createRadialGradient(0, 0, 0, 0, 0, r * coreRatio);
        core.addColorStop(0, '#ffffff');
        core.addColorStop(1, this.color);
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(0, 0, r * coreRatio, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawStation(ctx) {
        const t = this._tick * 0.005; // slow rotation angle
        const s = this.radius / 250; // visual scale factor (base was 250)

        ctx.save();
        ctx.rotate(t); // rotate whole station slowly

        const armLen = 55 * s;
        const armW = 8 * s;
        const hubs = 4;

        // Solar panel arms
        for (let i = 0; i < hubs; i++) {
            const angle = (i / hubs) * Math.PI * 2;
            ctx.save();
            ctx.rotate(angle);

            // Strut
            ctx.fillStyle = '#334455';
            ctx.fillRect(-armW / 2, 0, armW, armLen);

            // Wing panel
            ctx.fillStyle = '#1a3a5c';
            ctx.strokeStyle = this.color + 'aa';
            ctx.lineWidth = 1 * s;
            const wingW = 36 * s;
            const wingH = 14 * s;
            ctx.fillRect(-wingW / 2, armLen - wingH - (4 * s), wingW, wingH);
            ctx.strokeRect(-wingW / 2, armLen - wingH - (4 * s), wingW, wingH);

            // Nav light at tip
            const pulse = 0.5 + 0.5 * Math.sin(this._tick * 0.05 + i);
            ctx.fillStyle = i % 2 === 0
                ? `rgba(255, 50, 50, ${pulse})`
                : `rgba(50, 200, 255, ${pulse})`;
            ctx.beginPath();
            ctx.arc(0, armLen + (4 * s), 4 * s, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Central hub ring
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3 * s;
        ctx.beginPath();
        ctx.arc(0, 0, 20 * s, 0, Math.PI * 2);
        ctx.stroke();

        // Hub body
        ctx.fillStyle = '#1a2a3a';
        ctx.beginPath();
        ctx.arc(0, 0, 18 * s, 0, Math.PI * 2);
        ctx.fill();

        // Bright glowing core
        const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 14 * s);
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.4, this.color);
        coreGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 14 * s, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    _drawArtifact(ctx) {
        const t = this._tick * 0.01;
        const r = this.radius * 0.4;

        ctx.save();
        ctx.rotate(t);

        // Glowing aura
        const aura = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.5);
        aura.addColorStop(0, this.color + 'aa');
        aura.addColorStop(1, 'transparent');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Metallic geometric shape (e.g. Diamond / Obelisk)
        ctx.fillStyle = '#223344';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r * 0.6, 0);
        ctx.lineTo(0, r);
        ctx.lineTo(-r * 0.6, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner glowing core
        ctx.fillStyle = this.color;
        ctx.beginPath();
        const pulse = Math.abs(Math.sin(this._tick * 0.05));
        ctx.arc(0, 0, r * 0.2 + pulse * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
