export const UPGRADES = [
    { id: 'engine', name: 'Thruster Speed', desc: 'Increases thruster top speed and acceleration.', baseCost: 100, sciLevel: 0 },
    { id: 'booster', name: 'Boost Engine', desc: 'Increases boost top speed. Boost charges up over ~1 second.', baseCost: 175, sciLevel: 3 },
    { id: 'hull', name: 'Reinforced Hull', desc: 'Increases maximum health.', baseCost: 150, sciLevel: 0 },
    { id: 'weapons', name: 'Laser Systems', desc: 'Increases firing rate and damage.', baseCost: 200, sciLevel: 1 },
    { id: 'magnet', name: 'Collection Magnet', desc: 'Increases gem pickup radius.', baseCost: 100, sciLevel: 0 },
    { id: 'cargo', name: 'Expanded Cargo Bay', desc: 'Increases cargo capacity for collecting more gems.', baseCost: 125, sciLevel: 0 },
    { id: 'healing', name: 'Station Nanobots', desc: 'Increases the rate at which your ship is repaired at space stations.', baseCost: 300, sciLevel: 0 },
];

export const TECH_UPGRADES = [
    { id: 'biometric_filtering', name: 'Biometric Filtering', desc: 'Infected gems now grant 1 Science Point instead of dealing damage.', cost: 1000, sciLevel: 5 },
    { id: 'heat_shield', name: 'Heat Shield', desc: 'Prevents damage from asteroid collisions while boosting.', cost: 1500, sciLevel: 7 },
    { id: 'auto_heal', name: 'Auto-Heal Nanites', desc: 'Slowly repairs your ship while exploring (1 HP every 3 seconds).', cost: 2500, sciLevel: 7 },
    { id: 'proton_torpedo', name: 'Proton Torpedoes', desc: 'Heavy secondary weapon fired with RIGHT-CLICK. Fires towards cursor with 600 DMG and 3s reload.', cost: 3500, sciLevel: 8 },
    { id: 'gravity_laser', name: 'Gravity Beam Emitter', desc: 'Continuous void beam fired with SPACE. Deals massive DPS, especially to asteroids.', cost: 5000, sciLevel: 10 },
];

export const SHIPS = [
    {
        id: 'ship_starter',
        name: 'Starter Rover',
        desc: 'A reliable, mass-produced chassis. No base stat bonuses.',
        cost: 0,
        sciLevel: 0,
        recommendedLevel: 2,
        shipRadius: 18,     // world-space radius (px)
        shipZoom: 1.00,     // base camera zoom at rest
        shipCargo: 50,      // base cargo capacity
        stats: { engine: 0, booster: 0, hull: 0, weapons: 0, magnet: 0 },
        drawShape: (ctx, radius) => {
            ctx.beginPath();
            ctx.moveTo(radius, 0);
            ctx.lineTo(-radius, -radius * 0.8);
            ctx.lineTo(-radius * 0.5, 0);
            ctx.lineTo(-radius, radius * 0.8);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // Cockpit
            ctx.fillStyle = '#ff3c3c';
            ctx.beginPath();
            ctx.arc(radius * 0.1, 0, radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    },
    {
        id: 'ship_cruiser',
        name: 'Astro Cruiser',
        desc: 'Advanced thrusters and reinforced plating provide a solid baseline.',
        cost: 500,
        sciLevel: 3,
        recommendedLevel: 4,
        shipRadius: 22,
        shipZoom: 0.96,
        shipCargo: 150,
        stats: { engine: 1, booster: 1, hull: 2, weapons: 2, magnet: 1 },
        drawShape: (ctx, radius) => {
            // A bulky, wider ship with swept back wings
            ctx.beginPath();
            ctx.moveTo(radius * 1.1, 0);
            ctx.lineTo(radius * 0.4, -radius * 0.4);
            ctx.lineTo(-radius * 0.2, -radius * 1.1);
            ctx.lineTo(-radius * 0.9, -radius * 1.1);
            ctx.lineTo(-radius * 0.5, -radius * 0.3);
            ctx.lineTo(-radius * 0.9, 0);
            ctx.lineTo(-radius * 0.5, radius * 0.3);
            ctx.lineTo(-radius * 0.9, radius * 1.1);
            ctx.lineTo(-radius * 0.2, radius * 1.1);
            ctx.lineTo(radius * 0.4, radius * 0.4);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // Cockpit
            ctx.fillStyle = '#00ffd0';
            ctx.beginPath();
            ctx.ellipse(radius * 0.2, 0, radius * 0.4, radius * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    },
    {
        id: 'ship_voyager',
        name: 'Galaxy Voyager',
        desc: 'State-of-the-art exploration vessel with top-tier modular bays.',
        cost: 2000,
        sciLevel: 6,
        recommendedLevel: 6,
        shipRadius: 27,
        shipZoom: 0.91,
        shipCargo: 400,
        stats: { engine: 2, booster: 2, hull: 5, weapons: 4, magnet: 2 },
        drawShape: (ctx, radius) => {
            // Sleek central fuselage
            ctx.beginPath();
            ctx.moveTo(radius * 1.4, 0);
            ctx.lineTo(radius * 0.3, -radius * 0.3);
            ctx.lineTo(-radius * 1.0, -radius * 0.2);
            ctx.lineTo(-radius * 1.0, radius * 0.2);
            ctx.lineTo(radius * 0.3, radius * 0.3);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // Top side pod
            ctx.beginPath();
            ctx.moveTo(radius * 0.5, -radius * 0.5);
            ctx.lineTo(-radius * 1.2, -radius * 0.5);
            ctx.lineTo(-radius * 1.2, -radius * 0.9);
            ctx.lineTo(radius * 0.1, -radius * 0.9);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // Bottom side pod
            ctx.beginPath();
            ctx.moveTo(radius * 0.5, radius * 0.5);
            ctx.lineTo(-radius * 1.2, radius * 0.5);
            ctx.lineTo(-radius * 1.2, radius * 0.9);
            ctx.lineTo(radius * 0.1, radius * 0.9);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // Sleek cockpit strip
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.moveTo(radius * 0.8, 0);
            ctx.lineTo(radius * 0.2, -radius * 0.1);
            ctx.lineTo(radius * 0.2, radius * 0.1);
            ctx.closePath();
            ctx.fill();
        }
    },

    {
        id: 'ship_millennium',
        name: 'Millennium Starship',
        desc: 'Fastest hunk of junk in the galaxy. Features an off-center cockpit and dual mandibles.',
        cost: 3500,
        sciLevel: 8,
        recommendedLevel: 8,
        shipRadius: 33,
        shipZoom: 0.85,
        shipCargo: 750,
        stats: { engine: 3, booster: 4, hull: 8, weapons: 4, magnet: 2 },
        drawShape: (ctx, radius) => {
            // Main Saucer
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();

            // Right Mandible
            ctx.beginPath();
            ctx.moveTo(radius * 0.4, -radius * 0.3);
            ctx.lineTo(radius * 1.3, -radius * 0.3);
            ctx.lineTo(radius * 1.3, -radius * 0.8);
            ctx.lineTo(radius * 0.6, -radius * 1.0);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // Left Mandible
            ctx.beginPath();
            ctx.moveTo(radius * 0.4, radius * 0.3);
            ctx.lineTo(radius * 1.3, radius * 0.3);
            ctx.lineTo(radius * 1.3, radius * 0.8);
            ctx.lineTo(radius * 0.6, radius * 1.0);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // Middle gap between mandibles
            ctx.beginPath();
            ctx.rect(radius * 0.4, -radius * 0.3, radius * 0.4, radius * 0.6);
            ctx.fill(); ctx.stroke();

            // Off-center Cockpit (Right side)
            ctx.fillStyle = '#444';
            ctx.beginPath();
            ctx.arc(radius * 0.5, -radius * 0.9, radius * 0.25, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();

            // Cockpit Window
            ctx.fillStyle = '#00ffd0';
            ctx.beginPath();
            ctx.arc(radius * 0.6, -radius * 0.9, radius * 0.1, 0, Math.PI * 2);
            ctx.fill();

            // Rectangular detail on saucer top
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.fillRect(-radius * 0.5, -radius * 0.1, radius, radius * 0.2);
        }
    },
    {
        id: 'ship_warbird',
        name: 'Klingon Warbird',
        desc: 'A heavy, cloaking-capable interceptor with a distinct avian silhouette and powerful disruptors.',
        cost: 4000,
        sciLevel: 9,
        recommendedLevel: 10,
        shipRadius: 40,
        shipZoom: 0.79,
        shipCargo: 1200,
        stats: { engine: 3, booster: 3, hull: 12, weapons: 5, magnet: 2 },
        drawShape: (ctx, radius) => {
            // Colors
            const dGreen = '#2d4a27';
            const mGreen = '#3e6d36';
            const vDark = '#1a3316';
            
            // Wings (Attached to the body at the rear)
            ctx.fillStyle = dGreen;
            ctx.strokeStyle = mGreen;
            
            // Right Wing
            ctx.beginPath();
            ctx.moveTo(-radius * 0.5, -radius * 0.4);  // Root back
            ctx.lineTo(-radius * 0.9, -radius * 1.5);  // Tip back
            ctx.lineTo(-radius * 0.3, -radius * 1.6);  // Tip front
            ctx.lineTo(radius * 0.1, -radius * 0.4);   // Root front
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // Left Wing
            ctx.beginPath();
            ctx.moveTo(-radius * 0.5, radius * 0.4);   // Root back
            ctx.lineTo(-radius * 0.9, radius * 1.5);   // Tip back
            ctx.lineTo(-radius * 0.3, radius * 1.6);   // Tip front
            ctx.lineTo(radius * 0.1, radius * 0.4);    // Root front
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            
            // Cannons on wing tips
            ctx.fillStyle = '#444';
            // Right Cannon
            ctx.fillRect(-radius * 0.4, -radius * 1.65, radius * 0.9, radius * 0.2);
            // Left Cannon
            ctx.fillRect(-radius * 0.4, radius * 1.45, radius * 0.9, radius * 0.2);

            // Disruptor Glow at cannon tips
            ctx.fillStyle = '#ff3c3c';
            ctx.beginPath();
            ctx.arc(radius * 0.5, -radius * 1.55, radius * 0.15, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(radius * 0.5, radius * 1.55, radius * 0.15, 0, Math.PI * 2);
            ctx.fill();
            
            // Main Body (Rear Engine Block)
            ctx.fillStyle = vDark;
            ctx.beginPath();
            ctx.rect(-radius * 1.0, -radius * 0.5, radius * 1.2, radius * 1.0);
            ctx.fill(); ctx.stroke();
            
            // Neck
            ctx.beginPath();
            ctx.moveTo(0, -radius * 0.25);
            ctx.lineTo(radius * 1.1, -radius * 0.15);
            ctx.lineTo(radius * 1.1, radius * 0.15);
            ctx.lineTo(0, radius * 0.25);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            
            // Head (Bridge)
            ctx.fillStyle = dGreen;
            ctx.beginPath();
            ctx.moveTo(radius * 0.9, -radius * 0.35);
            ctx.lineTo(radius * 1.6, -radius * 0.15);
            ctx.lineTo(radius * 1.6, radius * 0.15);
            ctx.lineTo(radius * 0.9, radius * 0.35);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            
            // Cockpit Glow
            ctx.fillStyle = '#ff6600'; 
            ctx.beginPath();
            ctx.arc(radius * 1.55, 0, radius * 0.1, 0, Math.PI * 2);
            ctx.fill();
        }
    },
    {
        id: 'ship_federation',
        name: 'Federation Enterprise',
        desc: 'Legendary exploration vessel. Features a saucer section and twin warp nacelles.',
        cost: 5000,
        sciLevel: 10,
        recommendedLevel: 12,
        shipRadius: 48,
        shipZoom: 0.72,
        shipCargo: 2500,
        stats: { engine: 3, booster: 3, hull: 15, weapons: 6, magnet: 3 },
        drawShape: (ctx, radius) => {
            // Pylons
            ctx.beginPath();
            ctx.moveTo(-radius * 0.3, 0);
            ctx.lineTo(-radius * 0.8, -radius * 0.7);
            ctx.lineTo(-radius * 0.6, -radius * 0.7);
            ctx.lineTo(-radius * 0.1, 0);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(-radius * 0.3, 0);
            ctx.lineTo(-radius * 0.8, radius * 0.7);
            ctx.lineTo(-radius * 0.6, radius * 0.7);
            ctx.lineTo(-radius * 0.1, 0);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // Nacelles
            ctx.beginPath();
            ctx.moveTo(-radius * 1.2, -radius * 0.8);
            ctx.lineTo(-radius * 0.3, -radius * 0.8);
            ctx.lineTo(-radius * 0.3, -radius * 0.55);
            ctx.lineTo(-radius * 1.2, -radius * 0.55);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(-radius * 1.2, radius * 0.8);
            ctx.lineTo(-radius * 0.3, radius * 0.8);
            ctx.lineTo(-radius * 0.3, radius * 0.55);
            ctx.lineTo(-radius * 1.2, radius * 0.55);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // Engineering body
            ctx.beginPath();
            ctx.ellipse(-radius * 0.3, 0, radius * 0.6, radius * 0.3, 0, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();

            // Saucer
            ctx.beginPath();
            ctx.ellipse(radius * 0.6, 0, radius * 0.7, radius * 0.6, 0, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();

            // Bussard collectors (red front part of nacelles)
            ctx.fillStyle = '#ff3c3c';
            ctx.beginPath();
            ctx.arc(-radius * 0.3, -radius * 0.675, radius * 0.125, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(-radius * 0.3, radius * 0.675, radius * 0.125, 0, Math.PI * 2);
            ctx.fill();

            // Bridge (Center of saucer)
            ctx.fillStyle = '#00ffd0';
            ctx.beginPath();
            ctx.arc(radius * 0.6, 0, radius * 0.15, 0, Math.PI * 2);
            ctx.fill();
        }
    }
];
