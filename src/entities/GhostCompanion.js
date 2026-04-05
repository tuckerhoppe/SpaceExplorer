import { Utils } from '../utils.js';

export class GhostCompanion {
    constructor(player) {
        this.player = player;
        this.x = player.x;
        this.y = player.y;
        this.radius = 5;
        this.color = '#ffffff';
        this.angle = 0; // angle to closest stellar object
        this._tick = 0;

        // New features
        this.scannedIds = new Set();
        this.scanTarget = null;
        this.scanProgress = 0;
        this.proximityIntensity = 0; // 0 to 1 based on nearness to point of interest
        this.messages = [];
        this.currentMessage = null;
        this.messageTimer = 0;
        this.trail = [];
        this.lastSayTick = 0;
        this.lastDockedId = null;
    }

    _lerpAngle(a, b, t) {
        const d = b - a;
        const delta = ((d + Math.PI) % (Math.PI * 2)) - Math.PI;
        return a + delta * t;
    }

    say(text, duration = 180) {
        this.messages.push({ text, duration });
    }

    update(game) {
        if (this.player.health <= 0) return;
        this._tick++;

        // 1. Keep up with player velocity (pre-move to reduce lag)
        this.x += this.player.vx;
        this.y += this.player.vy;

        // 2. Trail logic
        if (this._tick % 2 === 0) {
            this.trail.unshift({ x: this.x, y: this.y, life: 1.0 });
            if (this.trail.length > 15) this.trail.pop();
        }
        for (const t of this.trail) t.life -= 0.05;

        // 3. Find closest stellar object relative to player
        let closestObj = null;
        let minDist = Infinity;

        for (const obj of game.sectorManager.objects) {
            const isDiscovered = game.sectorManager.discoveredIds.has(obj.id);
            const isScanned = this.scannedIds.has(obj.id);
            const hasParasite = !!obj.parasite;
            const d = Utils.dist(this.player.x, this.player.y, obj.x, obj.y);

            // The Ghost targets:
            // 1. Undiscovered objects (to aid exploration)
            // 2. Discovered but unscanned objects ONLY if the player is very close (to aid science)
            // 3. Discovered objects with parasites ONLY if the player is nearby (to alert to hazards)
            const isTarget = (!isDiscovered) || (!isScanned && d < 250) || (hasParasite && d < 800);
            if (!isTarget) continue;

            // Only skip the last docked object if we are still very close to it.
            if (obj.id === this.lastDockedId && d < 1200) continue;

            if (d < minDist) {
                minDist = d;
                closestObj = obj;
            }
        }

        // 4. Proximity Intensity (Metal Detector)
        // High intensity if close to undiscovered objects or objects with parasites
        if (closestObj) {
            const isUndiscovered = !game.sectorManager.discoveredIds.has(closestObj.id);
            const hasParasite = !!closestObj.parasite;
            const threshold = 800;
            if ((isUndiscovered || hasParasite) && minDist < threshold) {
                this.proximityIntensity = 1.0 - (minDist / threshold);
            } else {
                this.proximityIntensity *= 0.95;
            }
        } else {
            this.proximityIntensity *= 0.95;
        }

        // 5. Scanning Logic
        if (closestObj && minDist < 200 && !this.scannedIds.has(closestObj.id)) {
            this.scanTarget = closestObj;
            this.scanProgress += 0.005; // ~3.3 seconds to scan at 60fps
            if (this.scanProgress >= 1.0) {
                this.scannedIds.add(closestObj.id);
                this.scanProgress = 0;
                this.scanTarget = null;
                const spAmount = 5 + Math.floor(Math.random() * 6);
                this.player.addScience(spAmount);
                this.say(`Scan complete! Analysis identifies this as ${closestObj.name}. Reward: +${spAmount} SP`, 240);
                if (game.hud) {
                    game.hud.showFloatingReward(`+${spAmount} 🔬`, '#00ffcc');
                }
            } else if (this._tick % 60 === 0 && this.scanProgress > 0.1) {
                // Occasional scanning updates
                const dots = '.'.repeat(Math.floor(this.scanProgress * 4) + 1);
                this.say(`Scanning ${closestObj.name}${dots}`, 60);
            }
        } else {
            this.scanProgress = 0;
            this.scanTarget = null;
        }

        // 6. Dialogue System
        if (game.settings.ghostDialogue) {
            if (this.currentMessage) {
                this.messageTimer--;
                if (this.messageTimer <= 0) this.currentMessage = null;
            } else if (this.messages.length > 0) {
                this.currentMessage = this.messages.shift();
                this.messageTimer = this.currentMessage.duration;
            } else if (this._tick - this.lastSayTick > 1200) { // ~20 seconds fluff
                this.lastSayTick = this._tick;
                this.sayRandomFluff(game);
            }
        } else {
            this.currentMessage = null;
            this.messages = [];
        }

        // Contextual checks
        if (this._tick % 60 === 0) {
            if (this.player.health < this.player.maxHealth * 0.3 && Math.random() < 0.1) {
                this.say("Critical hull damage! Please seek repairs immediately.", 180);
            }
        }

        // 7. Movement: Determine shifted orbit center (move forward at high speeds)
        const speed = Math.hypot(this.player.vx, this.player.vy);
        const velAngle = Math.atan2(this.player.vy, this.player.vx);
        const shiftAmount = Math.min(25, speed * 3); 
        
        const orbitCenterX = this.player.x + (speed > 0.5 ? Math.cos(velAngle) * shiftAmount : 0);
        const orbitCenterY = this.player.y + (speed > 0.5 ? Math.sin(velAngle) * shiftAmount : 0);

        const orbitRadius = 45;
        const lerpSpeed = 0.1; 
        
        if (closestObj) {
            const targetAngle = Utils.ang(this.player.x, this.player.y, closestObj.x, closestObj.y);
            this.angle = this._lerpAngle(this.angle, targetAngle, 0.1);
        } else {
            this.angle += 0.02;
        }

        const targetX = orbitCenterX + Math.cos(this.angle) * orbitRadius;
        const targetY = orbitCenterY + Math.sin(this.angle) * orbitRadius;

        this.x += (targetX - this.x) * lerpSpeed;
        this.y += (targetY - this.y) * lerpSpeed;
    }

    sayRandomFluff(game) {
        const lines = [
            "Sensors indicate stable warp currents in this sector.",
            "I wonder what lies beyond the neighboring stars.",
            "Maintaining active navigation buoy sync...",
            "Your piloting remains within nominal parameters.",
            "The cosmic background radiation is quite soothing today.",
            "I'm detecting faint echoes from the Great Collapse.",
            "Have you considered upgrading the main deflector array?"
        ];
        this.say(lines[Math.floor(Math.random() * lines.length)]);
    }

    draw(ctx, game) {
        if (this.player.health <= 0) return;

        // Draw Trail
        ctx.save();
        for (const t of this.trail) {
            if (t.life <= 0) continue;
            ctx.globalAlpha = t.life * 0.4;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.radius * t.life, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        ctx.save();
        ctx.translate(this.x, this.y);

        // Subtle floating animation
        const hover = Math.sin(this._tick * 0.05) * 2;
        ctx.translate(0, hover);

        // Glow effect (influenced by proximity intensity)
        const pulse = 1.0 + Math.sin(this._tick * (0.1 + this.proximityIntensity * 0.4)) * (0.2 + this.proximityIntensity * 0.5);
        ctx.shadowBlur = (10 + this.proximityIntensity * 15) * pulse;
        ctx.shadowColor = this.proximityIntensity > 0.5 ? '#ffcc00' : '#ffffff';

        // Main orb body
        ctx.fillStyle = this.proximityIntensity > 0.5 ? '#ffcc00' : this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Scanning visual
        if (this.scanTarget) {
            ctx.strokeStyle = '#00ffcc';
            ctx.lineWidth = 1;
            const scanR = 10 + Math.sin(this._tick * 0.2) * 5;
            ctx.beginPath();
            ctx.arc(0, 0, scanR, 0, Math.PI * 2);
            ctx.stroke();

            // Progress bar
            ctx.strokeStyle = 'rgba(0, 255, 204, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = '#00ffcc';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 4, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * this.scanProgress));
            ctx.stroke();
        }

        // Directional pointer
        ctx.rotate(this.angle);
        ctx.beginPath();
        ctx.moveTo(this.radius + 1, -2);
        ctx.lineTo(this.radius + 6, 0);
        ctx.lineTo(this.radius + 1, 2);
        ctx.fillStyle = this.proximityIntensity > 0.5 ? '#ffcc00' : '#ffffff';
        ctx.fill();

        ctx.restore();

        // Dialogue Rendering
        if (this.currentMessage) {
            ctx.save();
            ctx.translate(this.x, this.y - 15 + hover);
            ctx.font = '12px "Outfit", sans-serif';
            const metrics = ctx.measureText(this.currentMessage.text);
            const padding = 6;
            const w = metrics.width + padding * 2;
            const h = 20;

            // Bubble background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(-w/2, -30, w, h, 4);
            ctx.fill();
            ctx.stroke();

            // Text
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(this.currentMessage.text, 0, -16);
            ctx.restore();
        }
    }
}
