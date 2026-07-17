import { Enemy } from './Enemy.js';
import { Battleship } from './Battleship.js';
import { Dreadnought } from './Dreadnought.js';
import { Projectile } from './Projectile.js';
import { Utils } from '../utils.js';

export class Squad {
    constructor(config, region) {
        this.config = config;
        this.id = config.id;
        this.name = config.name;
        this.formation = config.formation;
        this.region = region;
        
        this.ships = [];
        this.offsets = [];
        this.leaderX = 0;
        this.leaderY = 0;
        this.vx = 0;
        this.vy = 0;
        this.isAggroed = false;

        this.calculateOffsets();
    }

    calculateOffsets() {
        const count = this.config.members.length;
        if (this.formation === 'v_formation') {
            for (let i = 0; i < count; i++) {
                const side = i % 2 === 0 ? 1 : -1;
                const depth = Math.floor(i / 2) + 1;
                this.offsets.push({ x: -depth * 45, y: side * depth * 40 });
            }
        } else if (this.formation === 'column') {
            for (let i = 0; i < count; i++) {
                this.offsets.push({ x: -(i + 1) * 55, y: 0 });
            }
        } else if (this.formation === 'line') {
            for (let i = 0; i < count; i++) {
                const side = i % 2 === 0 ? 1 : -1;
                const col = Math.floor(i / 2) + 1;
                this.offsets.push({ x: 0, y: side * col * 55 });
            }
        } else if (this.formation === 'diamond') {
            const size = 55;
            let layer = 1;
            while (this.offsets.length < count) {
                const points = [
                    { x: layer * size, y: 0 },
                    { x: -layer * size, y: 0 },
                    { x: 0, y: layer * size },
                    { x: 0, y: -layer * size }
                ];
                for (let j = 1; j < layer; j++) {
                    const offsetVal = j * size;
                    const remVal = (layer - j) * size;
                    points.push({ x: offsetVal, y: remVal });
                    points.push({ x: offsetVal, y: -remVal });
                    points.push({ x: -offsetVal, y: remVal });
                    points.push({ x: -offsetVal, y: -remVal });
                }
                for (const pt of points) {
                    if (this.offsets.length < count) {
                        this.offsets.push(pt);
                    }
                }
                layer++;
            }
        } else if (this.formation === 'arrowhead') {
            let row = 1;
            while (this.offsets.length < count) {
                const x = -row * 50;
                const yOffsets = [0];
                for (let col = 1; col <= row; col++) {
                    yOffsets.push(col * 45);
                    yOffsets.push(-col * 45);
                }
                for (const y of yOffsets) {
                    if (this.offsets.length < count) {
                        this.offsets.push({ x, y });
                    }
                }
                row++;
            }
        } else {
            // Default spacing
            for (let i = 0; i < count; i++) {
                this.offsets.push({ x: -55, y: (i - (count - 1) / 2) * 55 });
            }
        }
    }

    spawn(game) {
        const startX = this.region.center.worldX;
        const startY = this.region.center.worldY;
        this.leaderX = startX;
        this.leaderY = startY;
        this.vx = Utils.rand(-1, 1);
        this.vy = Utils.rand(-1, 1);
        this.ships = [];
        this.isAggroed = false;

        // 1. Leader
        const leaderShip = this.createShip(game, this.config.leader, startX, startY);
        leaderShip.isSquadLeader = true;
        this.ships.push(leaderShip);

        // 2. Members
        for (let i = 0; i < this.config.members.length; i++) {
            const offset = this.offsets[i];
            const type = this.config.members[i];
            const ship = this.createShip(game, type, startX + offset.x, startY + offset.y);
            ship.isSquadLeader = false;
            this.ships.push(ship);
        }

        // Tag all members
        for (const ship of this.ships) {
            ship.isPatrolSquadMember = true;
            ship.squadId = this.id;
        }
    }

    createShip(game, type, x, y) {
        const diff = this.region.difficulty || 1.0;
        const color = this.config.color || '#ffff00';
        let ship;
        if (type === 'fighter') {
            ship = new Enemy(x, y, diff, null, color);
            game.enemies.push(ship);
        } else if (type === 'battleship') {
            ship = new Battleship(x, y, diff, color);
            game.battleships.push(ship);
        } else if (type === 'dreadnought') {
            ship = new Dreadnought(x, y, diff, color);
            game.dreadnoughts.push(ship);
        }
        return ship;
    }

    update(game) {
        // Filter dead members
        this.ships = this.ships.filter(ship => {
            if (ship.maxHealth && ship.health <= 0) return false;
            
            // Verify they still exist in game lists
            const exists = game.enemies.includes(ship) || 
                           game.battleships.includes(ship) || 
                           game.dreadnoughts.includes(ship);
            return exists;
        });

        if (this.ships.length === 0) return;

        const leaderShip = this.ships.find(s => s.isSquadLeader) || this.ships[0];
        if (!leaderShip) return;

        const px = game.player.x;
        const py = game.player.y;
        const distToPlayer = Utils.dist(leaderShip.x, leaderShip.y, px, py);

        // Determine aggro range based on leader ship characteristics
        let aggroRange = 900;
        let maxSpeed = 3.5;
        let accel = 0.12;
        let turnSpeed = 0.08;

        if (leaderShip.radius > 40) { // Dreadnought
            aggroRange = 1500;
            maxSpeed = 1.0;
            accel = 0.04;
            turnSpeed = 0.025; // standard is 0.015, make it more responsive
        } else if (leaderShip.radius > 20) { // Battleship
            aggroRange = 1200;
            maxSpeed = 1.6;
            accel = 0.06;
            turnSpeed = 0.045; // standard is 0.03
        }

        // Manage aggro state
        if (game.player.health > 0 && distToPlayer < aggroRange) {
            this.isAggroed = true;
        } else if (distToPlayer > aggroRange * 1.5 || game.player.health <= 0) {
            this.isAggroed = false;
        }

        // Leader movement & steering
        if (this.isAggroed) {
            // Chase player
            const targetAngle = Utils.ang(leaderShip.x, leaderShip.y, px, py);
            let da = targetAngle - leaderShip.angle;
            while (da > Math.PI) da -= Math.PI * 2;
            while (da < -Math.PI) da += Math.PI * 2;

            leaderShip.angle += Math.sign(da) * Math.min(Math.abs(da), turnSpeed);

            const stopDist = leaderShip.radius > 20 ? (leaderShip.radius > 40 ? 400 : 300) : 200;
            if (distToPlayer > stopDist) {
                leaderShip.vx += Math.cos(leaderShip.angle) * accel;
                leaderShip.vy += Math.sin(leaderShip.angle) * accel;
            } else if (distToPlayer < stopDist - 50) {
                // Back off slightly if too close
                leaderShip.vx -= Math.cos(leaderShip.angle) * accel * 0.5;
                leaderShip.vy -= Math.sin(leaderShip.angle) * accel * 0.5;
            }
            
            const speed = Math.hypot(leaderShip.vx, leaderShip.vy);
            if (speed > maxSpeed) {
                leaderShip.vx = (leaderShip.vx / speed) * maxSpeed;
                leaderShip.vy = (leaderShip.vy / speed) * maxSpeed;
            }
        } else {
            // Wandering / Patrol inside region boundaries
            const testX = leaderShip.x;
            const testY = leaderShip.y;
            const isInside = this.region.test(testX / 1000, -testY / 1000);
            const patrolMaxSpeed = maxSpeed * 0.5;

            if (!isInside) {
                // Strong steering back to center of region
                const centerWX = this.region.center.worldX;
                const centerWY = this.region.center.worldY;
                const targetAngle = Math.atan2(centerWY - leaderShip.y, centerWX - leaderShip.x);
                let da = targetAngle - leaderShip.angle;
                while (da > Math.PI) da -= Math.PI * 2;
                while (da < -Math.PI) da += Math.PI * 2;
                
                // Turn faster to go back
                leaderShip.angle += Math.sign(da) * Math.min(Math.abs(da), turnSpeed * 1.5);
                leaderShip.vx += Math.cos(leaderShip.angle) * accel * 1.5;
                leaderShip.vy += Math.sin(leaderShip.angle) * accel * 1.5;
            } else {
                // Wandering inside region
                if (this.targetWanderAngle === undefined) {
                    this.targetWanderAngle = leaderShip.angle;
                }
                this.targetWanderAngle += (Math.random() - 0.5) * 0.1;
                
                let da = this.targetWanderAngle - leaderShip.angle;
                while (da > Math.PI) da -= Math.PI * 2;
                while (da < -Math.PI) da += Math.PI * 2;
                
                leaderShip.angle += Math.sign(da) * Math.min(Math.abs(da), turnSpeed * 0.5);
                leaderShip.vx += Math.cos(leaderShip.angle) * accel * 0.6;
                leaderShip.vy += Math.sin(leaderShip.angle) * accel * 0.6;
            }

            const speed = Math.hypot(leaderShip.vx, leaderShip.vy);
            const limitSpeed = !isInside ? maxSpeed : patrolMaxSpeed;
            if (speed > limitSpeed) {
                leaderShip.vx = (leaderShip.vx / speed) * limitSpeed;
                leaderShip.vy = (leaderShip.vy / speed) * limitSpeed;
            }
        }

        // Apply friction and move leader
        leaderShip.vx *= 0.97;
        leaderShip.vy *= 0.97;
        leaderShip.x += leaderShip.vx;
        leaderShip.y += leaderShip.vy;
        leaderShip.inSquadFormation = true;

        // Keep squad virtual tracking properties updated
        this.leaderX = leaderShip.x;
        this.leaderY = leaderShip.y;
        this.vx = leaderShip.vx;
        this.vy = leaderShip.vy;

        // Align formation to heading direction (leaderShip's angle) and steer members naturally
        const headingAngle = leaderShip.angle;
        let memberIdx = 0;
        for (const ship of this.ships) {
            if (ship === leaderShip) continue;
            const offset = this.offsets[memberIdx] || { x: 0, y: 0 };
            
            const rx = offset.x * Math.cos(headingAngle) - offset.y * Math.sin(headingAngle);
            const ry = offset.x * Math.sin(headingAngle) + offset.y * Math.cos(headingAngle);

            const tx = leaderShip.x + rx;
            const ty = leaderShip.y + ry;

            this.steerShipTo(ship, tx, ty, leaderShip);
            ship.inSquadFormation = true;
            
            memberIdx++;
        }

        // Firing and aiming logic: rotate to point at player and fire if in range, otherwise face heading/formation angle
        for (const ship of this.ships) {
            ship._frame = (ship._frame || 0) + 1;
            const distToPlayer = Utils.dist(ship.x, ship.y, px, py);
            const attackRange = ship.radius > 20 ? (ship.radius > 40 ? 900 : 700) : 500;
            const fireRate = ship.radius > 20 ? (ship.radius > 40 ? 280 : 220) : 140;

            if (distToPlayer < attackRange && game.player.health > 0) {
                const targetAngle = Utils.ang(ship.x, ship.y, px, py);
                let da = targetAngle - ship.angle;
                while (da > Math.PI) da -= Math.PI * 2;
                while (da < -Math.PI) da += Math.PI * 2;
                
                // Aim turning rate
                let shipTurnSpeed = 0.05;
                if (ship.radius > 40) shipTurnSpeed = 0.025;
                else if (ship.radius > 20) shipTurnSpeed = 0.04;
                ship.angle += Math.sign(da) * Math.min(Math.abs(da), shipTurnSpeed);

                // Fire
                if (Math.abs(da) < 0.35 && ship._frame - (ship.lastFireFrame || 0) > fireRate) {
                    ship.lastFireFrame = ship._frame;
                    if (ship.radius > 40) { // Dreadnought triple salvo
                        const shootOffsets = [-0.15, 0, 0.15];
                        shootOffsets.forEach(offset => {
                            game.enemyProjectiles.push(new Projectile(
                                ship.x + Math.cos(ship.angle) * ship.radius,
                                ship.y + Math.sin(ship.angle) * ship.radius,
                                ship.angle + offset, 7, ship.damage, ship.color
                            ));
                        });
                    } else if (ship.radius > 20) { // Battleship double salvo
                        const spread = 0.08;
                        game.enemyProjectiles.push(new Projectile(
                            ship.x + Math.cos(ship.angle) * ship.radius,
                            ship.y + Math.sin(ship.angle) * ship.radius,
                            ship.angle - spread, 6, ship.damage, ship.color
                        ));
                        game.enemyProjectiles.push(new Projectile(
                            ship.x + Math.cos(ship.angle) * ship.radius,
                            ship.y + Math.sin(ship.angle) * ship.radius,
                            ship.angle + spread, 6, ship.damage, ship.color
                        ));
                    } else { // Fighter single shot
                        game.enemyProjectiles.push(new Projectile(
                            ship.x + Math.cos(ship.angle) * ship.radius,
                            ship.y + Math.sin(ship.angle) * ship.radius,
                            ship.angle, 8, ship.damage, ship.color
                        ));
                    }
                }
            } else {
                // Return to heading/leader angle if not attacking
                const targetHeading = ship === leaderShip ? Math.atan2(leaderShip.vy, leaderShip.vx) : leaderShip.angle;
                let da = targetHeading - ship.angle;
                while (da > Math.PI) da -= Math.PI * 2;
                while (da < -Math.PI) da += Math.PI * 2;
                
                let shipTurnSpeed = 0.05;
                if (ship.radius > 40) shipTurnSpeed = 0.025;
                else if (ship.radius > 20) shipTurnSpeed = 0.04;
                ship.angle += Math.sign(da) * Math.min(Math.abs(da), shipTurnSpeed);
            }
        }
    }

    steerShipTo(ship, tx, ty, leaderShip) {
        const dist = Utils.dist(ship.x, ship.y, tx, ty);
        
        let maxSpeed = 3.5;
        let accel = 0.12;
        let turnSpeed = 0.08;
        if (ship.radius > 40) {
            maxSpeed = 1.0;
            accel = 0.04;
            turnSpeed = 0.025;
        } else if (ship.radius > 20) {
            maxSpeed = 1.6;
            accel = 0.06;
            turnSpeed = 0.045;
        }

        if (dist > 15) {
            const targetAngle = Utils.ang(ship.x, ship.y, tx, ty);
            let da = targetAngle - ship.angle;
            while (da > Math.PI) da -= Math.PI * 2;
            while (da < -Math.PI) da += Math.PI * 2;

            // Turn towards target slot (faster when catching up)
            const catchUpFactor = dist > 250 ? 1.5 : 1.0;
            ship.angle += Math.sign(da) * Math.min(Math.abs(da), turnSpeed * catchUpFactor);

            // Set velocity towards target slot (using targetAngle to slot, so formation stays robust regardless of visual aim)
            const targetSpeed = Math.min(maxSpeed * catchUpFactor, dist * 0.08);
            ship.vx += (Math.cos(targetAngle) * targetSpeed - ship.vx) * 0.15;
            ship.vy += (Math.sin(targetAngle) * targetSpeed - ship.vy) * 0.15;
        } else {
            // Arrived at slot, match leader's velocity and angle smoothly
            ship.angle += (leaderShip.angle - ship.angle) * 0.15;
            ship.vx += (leaderShip.vx - ship.vx) * 0.2;
            ship.vy += (leaderShip.vy - ship.vy) * 0.2;
        }

        // Apply friction and move
        ship.vx *= 0.95;
        ship.vy *= 0.95;
        ship.x += ship.vx;
        ship.y += ship.vy;
    }

    despawn(game) {
        for (const ship of this.ships) {
            let idx = game.enemies.indexOf(ship);
            if (idx !== -1) game.enemies.splice(idx, 1);

            idx = game.battleships.indexOf(ship);
            if (idx !== -1) game.battleships.splice(idx, 1);

            idx = game.dreadnoughts.indexOf(ship);
            if (idx !== -1) game.dreadnoughts.splice(idx, 1);
        }
        this.ships = [];
    }

    isDefeated() {
        return this.ships.length === 0;
    }
}
