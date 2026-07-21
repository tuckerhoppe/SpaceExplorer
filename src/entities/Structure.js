import { Utils } from '../utils.js';
import { Particle } from './Particle.js';

export class Structure {
    constructor(type, parent, relativeAngle, relativeDist, locationType, edgeIndex = null, ringName = null) {
        this.type = type || 'mining_station'; // 'mining_station' or 'science_station'
        this.parent = parent; // Planet, LargeAsteroid, Nebula, or Star
        this.relativeAngle = relativeAngle;
        this.relativeDist = relativeDist;
        this.locationType = locationType; // 'planet', 'asteroid', 'nebula', or 'star'
        this.edgeIndex = edgeIndex;
        this.ringName = ringName;
        
        // Science stations produce +1 Science every 10 seconds (600 frames); Mining stations produce +1 Gem every 3 seconds (180 frames)
        this.productionCooldown = this.type === 'science_station' ? 600 : 180;
        
        // Calculate coordinate values
        this.x = 0;
        this.y = 0;
        this.updatePos();
        
        // Animation
        this.spinAngle = Math.random() * Math.PI * 2;
        this.pulse = 0;
        this.id = 'struct_' + Math.random().toString(36).substr(2, 9);
    }

    updatePos() {
        if (!this.parent) return;
        if (this.type === 'shipyard') {
            // Shipyards are stationary within planet orbit (relativeAngle does not increment)
            this.x = this.parent.x + Math.cos(this.relativeAngle) * this.relativeDist;
            this.y = this.parent.y + Math.sin(this.relativeAngle) * this.relativeDist;
        } else if (this.locationType === 'asteroid') {
            // LargeAsteroid rotates! Compute exact surface radius at current rotated angle.
            const totalAngle = this.parent.rotation + this.relativeAngle;
            const dist = typeof this.parent.getSurfaceRadiusAtAngle === 'function'
                ? this.parent.getSurfaceRadiusAtAngle(totalAngle)
                : this.relativeDist;
            this.x = this.parent.x + Math.cos(totalAngle) * dist;
            this.y = this.parent.y + Math.sin(totalAngle) * dist;
        } else if (this.locationType === 'nebula') {
            // Nebula station stays anchored relative to nebula center
            this.x = this.parent.x + Math.cos(this.relativeAngle) * this.relativeDist;
            this.y = this.parent.y + Math.sin(this.relativeAngle) * this.relativeDist;
        } else if (this.locationType === 'star') {
            // Orbiting stars is slower and more majestic
            this.relativeAngle += 0.00015;
            this.x = this.parent.x + Math.cos(this.relativeAngle) * this.relativeDist;
            this.y = this.parent.y + Math.sin(this.relativeAngle) * this.relativeDist;
        } else {
            // Planet orbits star, slowly update its orbit around the planet (slow majestic orbit)
            this.relativeAngle += 0.0004;
            this.x = this.parent.x + Math.cos(this.relativeAngle) * this.relativeDist;
            this.y = this.parent.y + Math.sin(this.relativeAngle) * this.relativeDist;
        }
    }

    update(game) {
        this.updatePos();
        this.spinAngle += 0.004;
        this.pulse += 0.05;

        if (this.type === 'shipyard') {
            const dist = Utils.dist(this.x, this.y, game.player.x, game.player.y);
            this.playerDocked = dist < 120;
            if (this.playerDocked && game.player.health > 0) {
                if (game.player.health < game.player.maxHealth) {
                    game.player.health = Math.min(game.player.maxHealth, game.player.health + 0.4);
                    if (game.hud) game.hud.update(game.player);
                    
                    // Spawn green repair nanite particles
                    if (Math.random() < 0.3 && game.particles) {
                        const pAngle = Math.random() * Math.PI * 2;
                        const pSpeed = Utils.rand(0.5, 2.0);
                        game.particles.push(Particle.get(
                            game.player.x + Math.cos(pAngle) * 15,
                            game.player.y + Math.sin(pAngle) * 15,
                            Math.cos(pAngle) * pSpeed,
                            Math.sin(pAngle) * pSpeed,
                            '#00ff88',
                            Utils.randInt(15, 30)
                        ));
                    }
                }
            }
            return;
        }

        // Passive resource production
        if (this.productionCooldown > 0) {
            this.productionCooldown--;
        } else {
            if (this.type === 'science_station') {
                this.productionCooldown = 600; // 10 seconds
                game.player.addScience(1);
                if (game.hud && typeof game.hud.update === 'function') {
                    game.hud.update(game.player);
                }
                if (game.questManager && typeof game.questManager.notify === 'function') {
                    game.questManager.notify('science', { spGained: 1 });
                }

                if (game.hud && typeof game.hud.showFloatingRewardAt === 'function') {
                    const distToPlayer = Utils.dist(this.x, this.y, game.player.x, game.player.y);
                    if (distToPlayer < 2000) {
                        game.hud.showFloatingRewardAt(this.x, this.y, '+1 🔬', '#00e5ff');
                    }
                }
            } else {
                this.productionCooldown = 180; // 3 seconds
                game.player.gems += 1;
                game.player.gemVault += 1;
                game.player.totalGemsCollected += 1;
                game.player.save();
                
                if (game.hud && typeof game.hud.showFloatingRewardAt === 'function') {
                    const distToPlayer = Utils.dist(this.x, this.y, game.player.x, game.player.y);
                    if (distToPlayer < 2000) {
                        game.hud.showFloatingRewardAt(this.x, this.y, '+1 💎', '#00ffd0');
                    }
                }
            }
        }
    }

    draw(ctx, camera) {
        // Viewport cull (cull radius 250px for large 2x structures)
        const cullRadius = 250;
        if (this.x + cullRadius < camera.x || this.x - cullRadius > camera.x + camera.viewW / camera.zoom ||
            this.y + cullRadius < camera.y || this.y - cullRadius > camera.y + camera.viewH / camera.zoom) {
            return;
        }

        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.type === 'shipyard') {
            const dockAngle = Math.atan2(this.y - this.parent.y, this.x - this.parent.x);
            ctx.rotate(dockAngle);

            // 1. Heavy Base Spine / Backbone Truss
            ctx.fillStyle = '#141c24';
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 3.5;
            ctx.fillRect(-25, -60, 50, 24);
            ctx.strokeRect(-25, -60, 50, 24);

            // 2. Open Drydock Gantry Arms (U-shaped frame extending outwards)
            ctx.fillStyle = '#1a2634';
            ctx.strokeStyle = '#3399aa';
            ctx.lineWidth = 3;

            // Left Gantry Arm
            ctx.fillRect(-55, -60, 24, 110);
            ctx.strokeRect(-55, -60, 24, 110);

            // Right Gantry Arm
            ctx.fillRect(31, -60, 24, 110);
            ctx.strokeRect(31, -60, 24, 110);

            // Cross Support Braces & Gantry Trussing
            ctx.strokeStyle = 'rgba(0, 255, 136, 0.4)';
            ctx.lineWidth = 2;
            for (let y = -40; y <= 30; y += 25) {
                ctx.beginPath();
                ctx.moveTo(-55, y); ctx.lineTo(-31, y + 10);
                ctx.moveTo(31, y); ctx.lineTo(55, y + 10);
                ctx.stroke();
            }

            // 3. Welding & Repair Laser Emitters inside dock channel
            const laserActive = Math.sin(this.pulse * 3.0) > 0;
            if (laserActive) {
                ctx.strokeStyle = '#00ff88';
                ctx.lineWidth = 2 + Math.sin(this.pulse * 5.0);
                ctx.beginPath();
                ctx.moveTo(-31, -10); ctx.lineTo(31, -10);
                ctx.moveTo(-31, 20); ctx.lineTo(31, 20);
                ctx.stroke();

                // Spark sparks in central channel
                ctx.fillStyle = '#ccffaa';
                ctx.beginPath();
                ctx.arc(0, 5, 3.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // 4. Central Healing Docking Aura
            ctx.fillStyle = 'rgba(0, 255, 136, 0.15)';
            ctx.beginPath();
            ctx.ellipse(0, 0, 32, 45, 0, 0, Math.PI * 2);
            ctx.fill();

            // 5. Docking Bay Warning Strobes
            const strobe = Math.floor(Date.now() / 200) % 2 === 0;
            if (strobe) {
                ctx.fillStyle = '#00ff88';
                ctx.beginPath();
                ctx.arc(-43, 48, 4, 0, Math.PI * 2);
                ctx.arc(43, 48, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            // 6. Active Healing Beam tether to Player when docked!
            if (this.playerDocked && camera) {
                ctx.restore();
                ctx.save();
                ctx.strokeStyle = '#00ff88';
                ctx.lineWidth = 3.5 + Math.sin(this.pulse * 4.0) * 1.5;
                ctx.shadowColor = '#00ff88';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                // Draw tether to player position
                ctx.lineTo(this.x, this.y); // Safe fallback
                ctx.stroke();
                ctx.restore();
                ctx.save();
                ctx.translate(this.x, this.y);
            }

        } else if (this.type === 'science_station') {
            if (this.parent) {
                ctx.restore();
                ctx.save();
                ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
                ctx.lineWidth = 2.5;
                ctx.setLineDash([6, 6]);
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.parent.x, this.parent.y);
                ctx.stroke();
                ctx.restore();
                ctx.save();
                ctx.translate(this.x, this.y);
            }

            ctx.rotate(this.spinAngle);

            // 1. Expanding Quantum Radar Scan Wave
            const waveRadius = 20 + ((this.pulse * 20) % 50);
            const waveAlpha = Math.max(0, 1 - waveRadius / 70);
            ctx.strokeStyle = `rgba(0, 229, 255, ${waveAlpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, waveRadius, 0, Math.PI * 2);
            ctx.stroke();

            // 2. Dual Gyroscope Sensor Rings
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 40, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.ellipse(0, 0, 48, 16, this.spinAngle * 1.5, 0, Math.PI * 2);
            ctx.stroke();

            // 3. Four Directional Parabolic Radar / Science Dishes
            for (let i = 0; i < 4; i++) {
                const angle = (i * Math.PI) / 2;
                ctx.save();
                ctx.rotate(angle);

                // Connector strut
                ctx.strokeStyle = '#8888aa';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(36, 0);
                ctx.stroke();

                // Parabolic dish curve
                ctx.fillStyle = '#10172a';
                ctx.strokeStyle = '#00e5ff';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(44, 0, 14, -Math.PI * 0.6, Math.PI * 0.6);
                ctx.fill();
                ctx.stroke();

                // Focal Emitter Tip & Beam
                ctx.fillStyle = '#a855f7';
                ctx.beginPath();
                ctx.arc(36, 0, 4, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            }

            // 4. Central Octagonal Science Observatory Core
            ctx.fillStyle = '#0b1021';
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            const sides = 8;
            for (let s = 0; s < sides; s++) {
                const sAngle = (s / sides) * Math.PI * 2;
                const px = Math.cos(sAngle) * 20;
                const py = Math.sin(sAngle) * 20;
                if (s === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 5. Glowing Quantum Core
            ctx.fillStyle = '#00e5ff';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();

            const coreGlow = 10 + Math.sin(this.pulse) * 4;
            ctx.fillStyle = 'rgba(0, 229, 255, 0.45)';
            ctx.beginPath();
            ctx.arc(0, 0, coreGlow, 0, Math.PI * 2);
            ctx.fill();

            // 6. Telemetry Warning Lights
            const strobe = Math.floor(Date.now() / 200) % 2 === 0;
            if (strobe) {
                ctx.fillStyle = '#ff00cc';
                ctx.beginPath();
                ctx.arc(-35, -35, 3.5, 0, Math.PI * 2);
                ctx.arc(35, 35, 3.5, 0, Math.PI * 2);
                ctx.fill();
            }

        } else if (this.locationType === 'planet' || this.locationType === 'star') {
            // Draw connector line back to parent body
            ctx.restore();
            ctx.save();
            ctx.strokeStyle = this.locationType === 'star' ? 'rgba(255, 153, 0, 0.25)' : 'rgba(0, 255, 208, 0.2)';
            ctx.lineWidth = this.locationType === 'star' ? 4.0 : 3.0;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.parent.x, this.parent.y);
            ctx.stroke();
            
            ctx.translate(this.x, this.y);
            ctx.rotate(this.spinAngle);

            // Draw a neat glowing orbital space station (2x Scale)
            ctx.strokeStyle = '#00ffd0';
            ctx.fillStyle = '#0b1d28';
            ctx.lineWidth = 4;

            // Outer ring structure
            ctx.beginPath();
            ctx.arc(0, 0, 42, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Inner structural spokes
            ctx.strokeStyle = 'rgba(0, 255, 208, 0.5)';
            ctx.lineWidth = 2.5;
            for (let i = 0; i < 4; i++) {
                const angle = (i * Math.PI) / 2;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * 42, Math.sin(angle) * 42);
                ctx.stroke();
            }

            // Solar panel wings (left and right) - 2x Scale
            ctx.fillStyle = '#0066aa';
            ctx.strokeStyle = '#00aaff';
            ctx.lineWidth = 3;
            // Left wing
            ctx.fillRect(-96, -14, 44, 28);
            ctx.strokeRect(-96, -14, 44, 28);
            // Right wing
            ctx.fillRect(52, -14, 44, 28);
            ctx.strokeRect(52, -14, 44, 28);

            // Wing panel grid lines
            ctx.strokeStyle = '#003366';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-74, -14); ctx.lineTo(-74, 14);
            ctx.moveTo(74, -14); ctx.lineTo(74, 14);
            ctx.stroke();

            // Connectors to wings
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(-52, 0); ctx.lineTo(-42, 0);
            ctx.moveTo(42, 0); ctx.lineTo(52, 0);
            ctx.stroke();

            // Center hub core
            ctx.fillStyle = '#0b1d28';
            ctx.strokeStyle = '#00ffd0';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Center glowing core
            ctx.fillStyle = '#00ffd0';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();

            // Glowing light pulse
            const sizePulse = 10 + Math.sin(this.pulse) * 4.0;
            ctx.fillStyle = 'rgba(0, 255, 208, 0.4)';
            ctx.beginPath();
            ctx.arc(0, 0, sizePulse, 0, Math.PI * 2);
            ctx.fill();

            // Blinking navigation beacon lights (red/green)
            const blink = Math.floor(Date.now() / 300) % 2 === 0;
            if (blink) {
                ctx.fillStyle = '#ff3333';
                ctx.beginPath();
                ctx.arc(-38, -25, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#33ff33';
                ctx.beginPath();
                ctx.arc(38, 25, 3.5, 0, Math.PI * 2);
                ctx.fill();
            }

        } else {
            // Surface Factory Complex built directly on asteroid surface edge (2x Scale & Wider)
            const surfaceAngle = Math.atan2(this.y - this.parent.y, this.x - this.parent.x);
            ctx.rotate(surfaceAngle); // Positive X points outwards into space, Y is along edge.

            // 1. Sub-Surface Foundation & Deep Core Drill Shaft (X < 0 into rock)
            ctx.fillStyle = '#140c06';
            ctx.strokeStyle = '#884400';
            ctx.lineWidth = 3.5;

            // Deep rock anchors
            ctx.beginPath();
            ctx.rect(-45, -35, 45, 70);
            ctx.fill();
            ctx.stroke();

            // Heavy Mining Laser / Core Penetrator Beam
            const laserWidth = 5 + Math.sin(this.pulse * 4.0) * 2.5;
            ctx.strokeStyle = '#ff3300';
            ctx.lineWidth = laserWidth;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-55, 0);
            ctx.stroke();

            // Heat Glow / Sparks inside rock entry
            ctx.fillStyle = 'rgba(255, 102, 0, 0.35)';
            ctx.beginPath();
            ctx.arc(0, 0, 28 + Math.sin(this.pulse * 2.0) * 5, 0, Math.PI * 2);
            ctx.fill();

            // 2. Surface Heavy Foundation Steel Plate (Lying flat right on surface edge line X = 0, 150px Wide!)
            ctx.fillStyle = '#2b1a10';
            ctx.strokeStyle = '#ff9900';
            ctx.lineWidth = 4;

            // Main Base Plate lying along Y-axis on X = 0
            ctx.beginPath();
            ctx.rect(-6, -75, 12, 150);
            ctx.fill();
            ctx.stroke();

            // Heavy Rivets / Anchor Bolts along base plate
            ctx.fillStyle = '#ffaa00';
            for (let y = -65; y <= 65; y += 22) {
                ctx.beginPath();
                ctx.arc(0, y, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            // 3. Main Factory Hall Building (Extending outwards into space: X from 0 to 70, Y: -45 to 45)
            ctx.fillStyle = '#1f130b';
            ctx.strokeStyle = '#ff9900';
            ctx.lineWidth = 3.5;

            // Main central factory hall block (X: 0 to 70, Y: -45 to 45)
            ctx.fillRect(0, -45, 70, 90);
            ctx.strokeRect(0, -45, 70, 90);

            // Left Industrial Silo / Processing Tank (X: 0 to 80, Y: -76 to -47)
            ctx.fillStyle = '#362214';
            ctx.fillRect(0, -76, 80, 28);
            ctx.strokeRect(0, -76, 80, 28);

            // Tank Rounded Top Cap
            ctx.beginPath();
            ctx.arc(80, -62, 14, -Math.PI / 2, Math.PI / 2);
            ctx.fill();
            ctx.stroke();

            // Fluid level indicator line on tank
            ctx.strokeStyle = '#00ffd0';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(12, -62); ctx.lineTo(68, -62);
            ctx.stroke();

            // Right Refining Annex Wing (X: 0 to 58, Y: 46 to 74)
            ctx.fillStyle = '#26170d';
            ctx.strokeStyle = '#ff9900';
            ctx.lineWidth = 3;
            ctx.fillRect(0, 46, 58, 28);
            ctx.strokeRect(0, 46, 58, 28);

            // 4. Factory Windows & Interior Warm Glow (2x Grid)
            ctx.fillStyle = '#ffaa00';
            for (let wx = 14; wx <= 54; wx += 18) {
                for (let wy = -32; wy <= 32; wy += 20) {
                    ctx.fillRect(wx, wy, 8, 10);
                }
            }

            // 5. Sawtooth Industrial Roof Structure (X: 70, Y: -45 to 45)
            ctx.fillStyle = '#2e1c0f';
            ctx.strokeStyle = '#ff9900';
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.moveTo(70, -45);
            ctx.lineTo(84, -27); ctx.lineTo(70, -27);
            ctx.lineTo(84, -9); ctx.lineTo(70, -9);
            ctx.lineTo(84, 9); ctx.lineTo(70, 9);
            ctx.lineTo(84, 27); ctx.lineTo(70, 27);
            ctx.lineTo(84, 45); ctx.lineTo(70, 45);
            ctx.fill();
            ctx.stroke();

            // 6. Industrial Exhaust Smokestacks (3 Stacks extending from X: 70 to 105)
            ctx.fillStyle = '#442a18';
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 3;

            // Smokestack 1
            ctx.fillRect(70, -26, 35, 10);
            ctx.strokeRect(70, -26, 35, 10);

            // Smokestack 2
            ctx.fillRect(70, -5, 35, 10);
            ctx.strokeRect(70, -5, 35, 10);

            // Smokestack 3
            ctx.fillRect(70, 16, 35, 10);
            ctx.strokeRect(70, 16, 35, 10);

            // Pulsing Smoke / Energy Clouds at top of stacks (X = 105)
            const smokePulse = Math.sin(this.pulse * 3.0) * 5;
            ctx.fillStyle = 'rgba(255, 153, 0, 0.45)';
            ctx.beginPath();
            ctx.arc(108, -21, 9 + smokePulse, 0, Math.PI * 2);
            ctx.arc(108, 0, 9 + smokePulse, 0, Math.PI * 2);
            ctx.arc(108, 21, 9 + smokePulse, 0, Math.PI * 2);
            ctx.fill();

            // 7. Blinking Hazard / Warning Strobe Beacons on top of stacks
            const strobe = Math.floor(Date.now() / 250) % 2 === 0;
            if (strobe) {
                ctx.fillStyle = '#ff3300';
                ctx.beginPath();
                ctx.arc(106, -21, 4, 0, Math.PI * 2);
                ctx.arc(106, 0, 4, 0, Math.PI * 2);
                ctx.arc(106, 21, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }
}
