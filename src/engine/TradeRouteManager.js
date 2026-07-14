import { TRADE_ROUTES_CONFIG } from '../data/tradeRoutes.js';
import { Utils } from '../utils.js';
import { Particle } from '../entities/Particle.js';

class TradeShip {
    constructor(route, progress = Math.random(), direction = Math.random() < 0.5 ? 1 : -1) {
        this.route = route;
        this.progress = progress; // 0 to 1 along the line
        this.direction = direction; // 1: A -> B, -1: B -> A
        this.speed = Utils.rand(3.5, 5.5); // constant speed in pixels per frame
        this.radius = 16;
        this.x = 0;
        this.y = 0;
        this.angle = 0;
        this._tick = Utils.randInt(0, 100);
    }

    update() {
        this._tick++;
        const pA = this.route.planetA;
        const pB = this.route.planetB;
        const dist = Utils.dist(pA.x, pA.y, pB.x, pB.y);

        if (dist === 0) return;

        // Move along the segment
        const delta = this.speed / dist;
        this.progress += delta * this.direction;

        // Bounce back / turn around on reaching endpoints
        if (this.progress >= 1.0) {
            this.progress = 1.0;
            this.direction = -1;
        } else if (this.progress <= 0.0) {
            this.progress = 0.0;
            this.direction = 1;
        }

        // Base segment interpolation
        let targetX = pA.x + (pB.x - pA.x) * this.progress;
        let targetY = pA.y + (pB.y - pA.y) * this.progress;

        // Apply a lane offset depending on flight direction:
        // Forward (A -> B, direction 1) stays in the top lane (offset -30)
        // Backward (B -> A, direction -1) stays in the bottom lane (offset +30)
        const angle = Utils.ang(pA.x, pA.y, pB.x, pB.y);
        const perpAngle = angle + Math.PI / 2;
        const laneOffset = this.direction === 1 ? -30 : 30;

        this.x = targetX + Math.cos(perpAngle) * laneOffset;
        this.y = targetY + Math.sin(perpAngle) * laneOffset;

        // Orient ship in direction of travel
        this.angle = this.direction === 1 ? angle : angle + Math.PI;
    }

    draw(ctx, camera) {
        // Viewport culling
        if (this.x + 30 < camera.x || this.x - 30 > camera.x + camera.viewW ||
            this.y + 30 < camera.y || this.y - 30 > camera.y + camera.viewH) {
            return;
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const r = this.radius;

        // 1. Sleek freighter hull (reusable premium vector asset)
        ctx.fillStyle = '#060a12';
        ctx.strokeStyle = this.route.color;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(r * 1.3, 0);
        ctx.lineTo(-r * 0.4, -r * 0.75);
        ctx.lineTo(-r * 1.1, -r * 0.45);
        ctx.lineTo(-r * 1.1, r * 0.45);
        ctx.lineTo(-r * 0.4, r * 0.75);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 2. Glowing cargo bays (tinted with route color)
        ctx.fillStyle = this.route.color + 'aa';
        ctx.fillRect(-r * 0.6, -r * 0.35, r * 0.7, r * 0.7);

        // 3. Engine exhaust flare (pulsing cyan/white glow)
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.4 + 0.5 * Math.sin(this._tick * 0.12);
        ctx.beginPath();
        ctx.arc(-r * 1.2, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

export class TradeRouteManager {
    constructor() {
        this.config = TRADE_ROUTES_CONFIG;
        this.activeRoutes = [];
        this.shipsByRoute = new Map(); // routeId -> Array of TradeShip
        this._tick = 0;
    }

    update(game) {
        this._tick++;
        this.activeRoutes = [];
        const activeIds = new Set();

        // Check if endpoints are cleared of parasites
        for (const route of this.config) {
            const planetA = game.sectorManager.objects.find(obj => obj.id === route.planetAId);
            const planetB = game.sectorManager.objects.find(obj => obj.id === route.planetBId);

            if (planetA && planetB) {
                const isPlanetAClear = !planetA.parasite;
                const isPlanetBClear = !planetB.parasite;

                if (isPlanetAClear && isPlanetBClear) {
                    const activeRoute = {
                        ...route,
                        planetA,
                        planetB
                    };
                    this.activeRoutes.push(activeRoute);
                    activeIds.add(route.id);

                    // Initialize ambient ships for this route if not already done
                    if (!this.shipsByRoute.has(route.id)) {
                        const ships = [
                            new TradeShip(activeRoute, 0.1, 1),
                            new TradeShip(activeRoute, 0.4, -1),
                            new TradeShip(activeRoute, 0.7, 1)
                        ];
                        this.shipsByRoute.set(route.id, ships);
                    }
                }
            }
        }

        // Prune ships for routes that are no longer active
        for (const key of this.shipsByRoute.keys()) {
            if (!activeIds.has(key)) {
                this.shipsByRoute.delete(key);
            }
        }

        // Update all active trade ships
        for (const ships of this.shipsByRoute.values()) {
            for (const ship of ships) {
                ship.update();
            }
        }

        // Check player collision with active routes
        let playerOnRoute = false;
        let activeMultiplier = 1.0;
        let activeColor = '#00f0ff';

        const px = game.player.x;
        const py = game.player.y;

        for (const route of this.activeRoutes) {
            const d = Utils.distToSegment(
                px, py,
                route.planetA.x, route.planetA.y,
                route.planetB.x, route.planetB.y
            );

            if (d <= route.width / 2) {
                // If player is within the docking radius of either endpoint, cut off the speed boost immediately
                const distA = Utils.dist(px, py, route.planetA.x, route.planetA.y);
                const distB = Utils.dist(px, py, route.planetB.x, route.planetB.y);
                if (distA <= route.planetA.dockRadius || distB <= route.planetB.dockRadius) {
                    game.player.tradeRouteSpeedBoostValue = 1.0;
                    game.player.tradeRouteCharged = false;
                    game.player.tradeRouteTimeOn = 0;
                    game.player.tradeRouteTimeOff = 60; // reset grace period
                    break;
                }

                playerOnRoute = true;
                activeMultiplier = route.speedMultiplier;
                activeColor = route.color;

                // Spawn trade route boost particles around the player
                const playerSpeed = Math.hypot(game.player.vx, game.player.vy);
                if (playerSpeed > 0.5 && Math.random() < 0.25) {
                    const angle = Math.atan2(game.player.vy, game.player.vx) + Math.PI + Utils.rand(-0.4, 0.4);
                    game.particles.push(Particle.get(
                        px + Utils.rand(-10, 10),
                        py + Utils.rand(-10, 10),
                        Math.cos(angle) * Utils.rand(1, 4),
                        Math.sin(angle) * Utils.rand(1, 4),
                        route.color,
                        Utils.randInt(15, 30)
                    ));
                }
                break;
            }
        }

        game.player.onTradeRoute = playerOnRoute;
        game.player.tradeRouteMultiplier = activeMultiplier;
        game.player.tradeRouteColor = activeColor;
    }

    draw(ctx, camera) {
        // Draw each active trade route corridor
        for (const route of this.activeRoutes) {
            const { planetA, planetB, color, width } = route;

            const camCenterX = camera.x + camera.viewW / 2;
            const camCenterY = camera.y + camera.viewH / 2;
            const distToRoute = Utils.distToSegment(
                camCenterX, camCenterY,
                planetA.x, planetA.y,
                planetB.x, planetB.y
            );

            const viewRadius = Math.max(camera.viewW, camera.viewH) * 1.2;
            if (distToRoute > viewRadius) continue;

            ctx.save();
            
            const angle = Utils.ang(planetA.x, planetA.y, planetB.x, planetB.y);
            const dist = Utils.dist(planetA.x, planetA.y, planetB.x, planetB.y);

            ctx.translate(planetA.x, planetA.y);
            ctx.rotate(angle);

            // 1. Sleek corridor gradient
            const grad = ctx.createLinearGradient(0, -width / 2, 0, width / 2);
            grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            grad.addColorStop(0.2, color + '08');
            grad.addColorStop(0.5, color + '15');
            grad.addColorStop(0.8, color + '08');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = grad;
            ctx.fillRect(0, -width / 2, dist, width);

            // 2. Animated outer dashed borders
            ctx.strokeStyle = color + '44';
            ctx.lineWidth = 3;
            ctx.setLineDash([20, 20]);
            
            ctx.lineDashOffset = -this._tick * 1.5;
            ctx.beginPath();
            ctx.moveTo(0, -width / 2);
            ctx.lineTo(dist, -width / 2);
            ctx.stroke();

            ctx.lineDashOffset = this._tick * 1.5;
            ctx.beginPath();
            ctx.moveTo(0, width / 2);
            ctx.lineTo(dist, width / 2);
            ctx.stroke();

            // 3. Central pulsing energy lane
            ctx.strokeStyle = color + '66';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([30, 60]);
            ctx.lineDashOffset = -this._tick * 4.0;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(dist, 0);
            ctx.stroke();

            // 4. Two-way chevrons (arrows) showing path direction
            ctx.fillStyle = color + '22';
            const arrowSpacing = 220;
            
            const fOffset = (this._tick * 1.8) % arrowSpacing;
            for (let d = fOffset; d < dist; d += arrowSpacing) {
                ctx.beginPath();
                ctx.moveTo(d - 10, -40);
                ctx.lineTo(d + 5, -30);
                ctx.lineTo(d - 10, -20);
                ctx.lineTo(-5 + d, -20);
                ctx.lineTo(10 + d, -30);
                ctx.lineTo(-5 + d, -40);
                ctx.closePath();
                ctx.fill();
            }

            const bOffset = (arrowSpacing - ((this._tick * 1.8) % arrowSpacing)) % arrowSpacing;
            for (let d = bOffset; d < dist; d += arrowSpacing) {
                ctx.beginPath();
                ctx.moveTo(d + 10, 20);
                ctx.lineTo(d - 5, 30);
                ctx.lineTo(d + 10, 40);
                ctx.lineTo(5 + d, 40);
                ctx.lineTo(-10 + d, 30);
                ctx.lineTo(5 + d, 20);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();
        }

        // Draw all active trade ships
        for (const ships of this.shipsByRoute.values()) {
            for (const ship of ships) {
                ship.draw(ctx, camera);
            }
        }
    }
}
