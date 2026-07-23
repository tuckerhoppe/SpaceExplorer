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
    { id: 'evasive_maneuvers', name: 'Evasive Maneuvers', desc: 'Perform a fast dash with ARROW KEYS to evade attacks. 3 Charges, rechargeable.', cost: 2000, sciLevel: 6 },
    { id: 'fleet_double_laser', name: 'Tactical Spread Lasers', desc: 'Upgrades all fleet escort vessels to fire double parallel laser spreads.', cost: 30000, sciLevel: 7 },
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
        shipCargo: 100,      // base cargo capacity
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
        shipCargo: 300,
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
        shipCargo: 800,
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
        shipCargo: 1500,
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
        shipCargo: 2400,
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
        shipCargo: 5000,
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
    },
    {
        id: 'ship_battlecruiser',
        name: 'Battle Cruiser',
        desc: 'A heavy capital ship with dual automatic lasers and primary torpedo launchers.',
        cost: 6000,
        sciLevel: 10,
        recommendedLevel: 12,
        shipRadius: 82,
        shipZoom: 0.65,
        shipCargo: 3000,
        stats: { engine: 2, booster: 2, hull: 22, weapons: 12, magnet: 3 },
        accelMultiplier: 0.25,
        turnRateMultiplier: 0.25,
        drawShape: (ctx, radius) => {
            // Inherits the default vector style colors (navy fill, cyan stroke)

            // 1. Triangular Arrowhead Outer Hull with Side Hangar Notches
            ctx.beginPath();
            ctx.moveTo(radius * 1.8, 0); // Front nose tip

            // Left flank forward edge
            ctx.lineTo(radius * 0.5, -radius * 0.5);
            // Left flank notch (side hangar indentation)
            ctx.lineTo(radius * 0.2, -radius * 0.45);
            ctx.lineTo(-radius * 0.1, -radius * 0.45);
            ctx.lineTo(-radius * 0.4, -radius * 0.7);

            // Left rear corner
            ctx.lineTo(-radius * 1.3, -radius * 0.85);

            // Rear engine deck edge
            ctx.lineTo(-radius * 1.4, -radius * 0.5);
            ctx.lineTo(-radius * 1.4, radius * 0.5);

            // Right rear corner
            ctx.lineTo(-radius * 1.3, radius * 0.85);

            // Right flank notch
            ctx.lineTo(-radius * 0.4, radius * 0.7);
            ctx.lineTo(-radius * 0.1, radius * 0.45);
            ctx.lineTo(radius * 0.2, radius * 0.45);
            ctx.lineTo(radius * 0.5, radius * 0.5);

            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // 2. Central Spinal Ridge / Flight Deck Stripe
            ctx.beginPath();
            ctx.moveTo(radius * 1.5, 0);
            ctx.lineTo(-radius * 0.5, -radius * 0.08);
            ctx.lineTo(-radius * 0.5, radius * 0.08);
            ctx.closePath();
            ctx.stroke();

            // 3. Twin Command Bridges (Iconic double towers at the rear center)
            // Left Bridge tower
            ctx.beginPath();
            ctx.rect(-radius * 0.9, -radius * 0.22, radius * 0.35, radius * 0.12);
            ctx.fill(); ctx.stroke();
            // Right Bridge tower
            ctx.beginPath();
            ctx.rect(-radius * 0.9, radius * 0.1, radius * 0.35, radius * 0.12);
            ctx.fill(); ctx.stroke();

            // Connecting pylon base
            ctx.beginPath();
            ctx.rect(-radius * 0.75, -radius * 0.15, radius * 0.25, radius * 0.3);
            ctx.fill(); ctx.stroke();

            // 4. Large Rear Engine Cluster (4 main rectangular thrusters with cyan glow)
            ctx.save();
            ctx.fillStyle = '#00f0ff';

            // Upper outer main thruster
            ctx.fillRect(-radius * 1.52, -radius * 0.46, radius * 0.12, radius * 0.2);

            // Upper inner main thruster
            ctx.fillRect(-radius * 1.52, -radius * 0.22, radius * 0.12, radius * 0.15);

            // Lower inner main thruster
            ctx.fillRect(-radius * 1.52, radius * 0.07, radius * 0.12, radius * 0.15);

            // Lower outer main thruster
            ctx.fillRect(-radius * 1.52, radius * 0.26, radius * 0.12, radius * 0.2);

            ctx.restore();
        }
    },
    {
        id: 'ship_solarsailor',
        name: 'Solar Sailor',
        desc: 'UNSC Charon-class light frigate layout. Highly durable exploration model.',
        cost: 5000,
        sciLevel: 9,
        recommendedLevel: 10,
        shipRadius: 52,
        shipZoom: 0.78,
        shipCargo: 2500,
        stats: { engine: 3, booster: 3, hull: 11, weapons: 5, magnet: 3 },
        drawShape: (ctx, radius) => {
            // Colors for UNSC Charon-class Frigate "Forward Unto Dawn"
            const unscrab = '#475143';    // UNSC Military Olive Drab
            const steelGray = '#3f4856';  // Gunmetal structural panels
            const darkMetal = '#1e2530';  // Deep chassis base
            const amberLight = '#f59e0b'; // Amber running lights
            const engineCyan = '#38bdf8'; // Hot fusion thruster exhaust

            ctx.strokeStyle = '#2d332a';
            ctx.lineWidth = 2;

            // 1. Lateral Hangar / Weapon Pods (Mid-section outriggers)
            ctx.fillStyle = steelGray;

            // Left Outrigger Pod
            ctx.beginPath();
            ctx.rect(-radius * 0.9, -radius * 0.8, radius * 0.7, radius * 0.35);
            ctx.fill(); ctx.stroke();

            // Left outrigger angled support pylon
            ctx.beginPath();
            ctx.moveTo(-radius * 0.9, -radius * 0.45);
            ctx.lineTo(-radius * 1.2, -radius * 0.8);
            ctx.lineTo(-radius * 1.0, -radius * 0.8);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // Right Outrigger Pod
            ctx.beginPath();
            ctx.rect(-radius * 0.9, radius * 0.45, radius * 0.7, radius * 0.35);
            ctx.fill(); ctx.stroke();

            // Right outrigger angled support pylon
            ctx.beginPath();
            ctx.moveTo(-radius * 0.9, radius * 0.45);
            ctx.lineTo(-radius * 1.2, radius * 0.8);
            ctx.lineTo(-radius * 1.0, radius * 0.8);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // 2. Heavy Engine Block (Large blocky structure at rear)
            ctx.fillStyle = darkMetal;
            ctx.beginPath();
            ctx.rect(-radius * 1.5, -radius * 0.4, radius * 0.6, radius * 0.8);
            ctx.fill(); ctx.stroke();

            // 3. Main Frigate Slab Hull (Olive drab armor plates)
            ctx.fillStyle = unscrab;
            ctx.beginPath();
            ctx.moveTo(radius * 0.7, -radius * 0.25);
            ctx.lineTo(-radius * 1.4, -radius * 0.28);
            ctx.lineTo(-radius * 1.4, radius * 0.28);
            ctx.lineTo(radius * 0.7, radius * 0.25);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // 4. Split Nose Prongs (The MAC Gun Channel)
            // Left Nose Prong
            ctx.beginPath();
            ctx.moveTo(radius * 0.6, -radius * 0.25);
            ctx.lineTo(radius * 1.6, -radius * 0.25);
            ctx.lineTo(radius * 1.6, -radius * 0.08);
            ctx.lineTo(radius * 0.6, -radius * 0.08);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // Right Nose Prong
            ctx.beginPath();
            ctx.moveTo(radius * 0.6, radius * 0.08);
            ctx.lineTo(radius * 1.6, radius * 0.08);
            ctx.lineTo(radius * 1.6, radius * 0.25);
            ctx.lineTo(radius * 0.6, radius * 0.25);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // Central MAC Gun Barrel (dark recessed core tube)
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(radius * 0.2, -radius * 0.05, radius * 1.2, radius * 0.1);

            // Amber warning decals / lights on structural components
            ctx.fillStyle = amberLight;
            ctx.beginPath();
            ctx.arc(radius * 1.3, -radius * 0.18, radius * 0.04, 0, Math.PI * 2);
            ctx.arc(radius * 1.3, radius * 0.18, radius * 0.04, 0, Math.PI * 2);
            ctx.arc(-radius * 0.4, -radius * 0.7, radius * 0.03, 0, Math.PI * 2);
            ctx.arc(-radius * 0.4, radius * 0.7, radius * 0.03, 0, Math.PI * 2);
            ctx.fill();

            // 5. Triple Fusion Engine Thrusters (Glowing cyan blocks/nozzles at rear)
            ctx.fillStyle = engineCyan;
            // Left main fusion engine exhaust
            ctx.fillRect(-radius * 1.55, -radius * 0.3, radius * 0.08, radius * 0.15);
            // Right main fusion engine exhaust
            ctx.fillRect(-radius * 1.55, radius * 0.15, radius * 0.08, radius * 0.15);
            // Central emergency thruster port
            ctx.beginPath();
            ctx.arc(-radius * 1.52, 0, radius * 0.07, 0, Math.PI * 2);
            ctx.fill();
        }
    },
    {
        id: 'ship_firefly',
        name: 'Firefly',
        desc: 'A mid-sized cargo transport ship modeled after a firefly silhouette. Uniform vector-style plating.',
        cost: 3000,
        sciLevel: 7,
        recommendedLevel: 8,
        shipRadius: 24,
        shipZoom: 0.95,
        shipCargo: 1500,
        stats: { engine: 4, booster: 3, hull: 8, weapons: 4, magnet: 3 },
        drawShape: (ctx, radius) => {
            // 1. Rotating VTOL Engine Pods (Sides, extending outwards)
            // Left engine pod pylon
            ctx.beginPath();
            ctx.moveTo(radius * 0.1, -radius * 0.25);
            ctx.lineTo(-radius * 0.1, -radius * 1.0);
            ctx.lineTo(-radius * 0.4, -radius * 1.0);
            ctx.lineTo(-radius * 0.2, -radius * 0.25);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // Right engine pod pylon
            ctx.beginPath();
            ctx.moveTo(radius * 0.1, radius * 0.25);
            ctx.lineTo(-radius * 0.1, radius * 1.0);
            ctx.lineTo(-radius * 0.4, radius * 1.0);
            ctx.lineTo(-radius * 0.2, radius * 0.25);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // Symmetrical Cylindrical Engine Pods on tips (Nacelles)
            ctx.beginPath();
            ctx.rect(-radius * 0.6, -radius * 1.2, radius * 0.85, radius * 0.4);
            ctx.rect(-radius * 0.6, radius * 0.8, radius * 0.85, radius * 0.4);
            ctx.fill(); ctx.stroke();

            // Thrust glowing rings inside pods
            ctx.save();
            ctx.fillStyle = '#00f0ff'; // matching cyan thrust
            ctx.beginPath();
            ctx.arc(-radius * 0.6, -radius * 1.0, radius * 0.1, 0, Math.PI * 2);
            ctx.arc(-radius * 0.6, radius * 1.0, radius * 0.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // 2. Bulbous Nose Bridge Section (Firefly head)
            ctx.beginPath();
            ctx.moveTo(radius * 1.8, 0); // nose tip
            ctx.bezierCurveTo(
                radius * 1.45, -radius * 0.55,
                radius * 0.85, -radius * 0.55,
                radius * 0.7, -radius * 0.3
            );
            ctx.lineTo(radius * 0.7, radius * 0.3);
            ctx.bezierCurveTo(
                radius * 0.85, radius * 0.55,
                radius * 1.45, radius * 0.55,
                radius * 1.8, 0
            );
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // Cockpit Window (Wrap-around glass canopy)
            ctx.save();
            ctx.fillStyle = '#38bdf8'; // Blue glass glow
            ctx.beginPath();
            ctx.moveTo(radius * 1.7, 0);
            ctx.lineTo(radius * 1.45, -radius * 0.22);
            ctx.lineTo(radius * 1.4, 0);
            ctx.lineTo(radius * 1.4, radius * 0.22);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            // Neck structural plates
            ctx.fillRect(radius * 0.4, -radius * 0.22, radius * 0.35, radius * 0.44);
            ctx.strokeRect(radius * 0.4, -radius * 0.22, radius * 0.35, radius * 0.44);

            // 3. Wide Mid-cargo Bay Hull
            ctx.beginPath();
            ctx.ellipse(0, 0, radius * 0.6, radius * 0.42, 0, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();

            // 4. Tail Section tapering to glowing bulbous firefly engine (Sleeker tail)
            ctx.beginPath();
            ctx.moveTo(-radius * 0.4, -radius * 0.2);
            ctx.lineTo(-radius * 1.3, -radius * 0.12);
            ctx.lineTo(-radius * 1.3, radius * 0.12);
            ctx.lineTo(-radius * 0.4, radius * 0.2);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // Glowing Firefly Drive at the end of the tail section (restored size)
            ctx.save();
            ctx.fillStyle = '#00f0ff'; // Cyan thrust glow matching the active theme
            ctx.beginPath();
            ctx.ellipse(-radius * 1.4, 0, radius * 0.24, radius * 0.18, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    },
    {
        id: 'ship_cruiser',
        name: 'Cruiser',
        desc: 'A fast Republic-class frigate with a high booster rating and triple-engine propulsion.',
        cost: 3500,
        sciLevel: 8,
        recommendedLevel: 9,
        shipRadius: 48,
        shipZoom: 0.8,
        shipCargo: 3000,
        stats: { engine: 3, booster: 8, hull: 8, weapons: 4, magnet: 2 },
        drawShape: (ctx, radius) => {
            // Inherits the default vector style colors (navy fill, cyan stroke)

            // 1. Thin Front Nose/Cockpit Section (Ends in a flat rectangle)
            ctx.beginPath();
            ctx.rect(radius * 0.7, -radius * 0.16, radius * 0.7, radius * 0.32);
            ctx.fill(); ctx.stroke();

            // Cockpit viewport (Flat window bar near front)
            ctx.save();
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(radius * 1.15, -radius * 0.1, radius * 0.1, radius * 0.2);
            ctx.restore();

            // Connecting corridor neck
            ctx.beginPath();
            ctx.rect(radius * 0.2, -radius * 0.12, radius * 0.5, radius * 0.24);
            ctx.fill(); ctx.stroke();

            // 2. Medium-sized Bulbous Middle Hull
            ctx.beginPath();
            ctx.ellipse(-radius * 0.25, 0, radius * 0.55, radius * 0.38, 0, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();

            // Central dorsal ridge / antenna line
            ctx.beginPath();
            ctx.moveTo(radius * 0.2, 0);
            ctx.lineTo(-radius * 0.7, 0);
            ctx.stroke();

            // Side lateral thruster pods or shields
            ctx.beginPath();
            ctx.rect(-radius * 0.5, -radius * 0.45, radius * 0.4, radius * 0.1);
            ctx.rect(-radius * 0.5, radius * 0.35, radius * 0.4, radius * 0.1);
            ctx.fill(); ctx.stroke();

            // 3. Wide Blocky Rear Engine Frame
            ctx.beginPath();
            ctx.moveTo(-radius * 0.8, -radius * 0.3);
            ctx.lineTo(-radius * 1.3, -radius * 0.75);
            ctx.lineTo(-radius * 1.3, radius * 0.75);
            ctx.lineTo(-radius * 0.8, radius * 0.3);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // 4. Three Rectangular Engine Thrusters (Wider engine deck)
            ctx.save();
            ctx.fillStyle = '#00f0ff';
            
            // Left rectangular engine
            ctx.fillRect(-radius * 1.4, -radius * 0.55, radius * 0.1, radius * 0.18);
            // Center rectangular engine
            ctx.fillRect(-radius * 1.4, -radius * 0.12, radius * 0.1, radius * 0.24);
            // Right rectangular engine
            ctx.fillRect(-radius * 1.4, radius * 0.37, radius * 0.1, radius * 0.18);

            ctx.restore();
        }
    }
];
