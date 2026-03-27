// Regions are defined as coordinate-space predicates + spawn caps.
// coordX = worldX / 1000, coordY = -worldY / 1000 (Y is inverted on canvas)

export const REGIONS = [
    {
        name: 'The Badlands',
        icon: '💀',
        color: '#ff6a00',
        description: 'A lawless expanse of dense asteroid belts and desperate scavengers.',
        gemReward: 100,
        // Bottom-left quadrant: negative X and negative Y coords
        test: (cx, cy) => cx < -3 && cy < -3 && cx > -14 && cy > -11,
        center: { worldX: -8000, worldY: 8000 },
        difficulty: 1.5,
        bgColor: '#150a00',
        particleType: 'dust',
        caps: {
            asteroids: 120,
            fighters: 8,
            battleships: 0,   // no battleships — just relentless rock fields
            neutrals: 6,
            dreadnoughts: 0,
        }
    },
    {
        name: 'Blob Space',
        icon: '',
        color: '#09ab29ff',
        description: 'Mysterious and dangerous species known as the Blobs inhabit this region.',
        gemReward: 150,
        // Bottom-right quadrant: positive X and negative Y coords
        test: (cx, cy) => cx > 4 && cy < -10,
        center: { worldX: 8000, worldY: 14000 },
        difficulty: 3.0,
        bgColor: '#001505',
        particleType: 'spore',
        caps: {
            asteroids: 60,
            fighters: 12,
            battleships: 5,
            neutrals: 0,
            dreadnoughts: 0,
        }
    },
    {
        name: 'Star Empire',
        icon: '⚔️',
        color: '#ff2244',
        description: 'Imperial warships patrol these contested star lanes. Trespassers are destroyed on sight.',
        gemReward: 150,
        // Top-left quadrant: negative X and positive Y coords
        test: (cx, cy) => cx < -5 && cy > 10,
        center: { worldX: -9000, worldY: -14000 },
        difficulty: 10.0,
        bgColor: 'rgba(28, 0, 0, 1)',
        particleType: 'ember',
        caps: {
            asteroids: 60,
            fighters: 12,
            battleships: 5,
            neutrals: 2,
            dreadnoughts: 3,
        }
    },
    {
        name: 'Uncharted Space',
        icon: '☄️',
        color: '#640a6fff',
        description: 'Mysterious discoveries await in this region.',
        gemReward: 150,
        // Top-Right quadrant: positive X and positive Y coords
        test: (cx, cy) => cx >= 4 && cy > 2 && cy < 9,
        center: { worldX: 5000, worldY: -5000 },
        difficulty: 1.0,
        bgColor: '#10002cff',
        particleType: 'rift',
        caps: {
            asteroids: 60,
            fighters: 3,
            battleships: 0,
            neutrals: 2,
            dreadnoughts: 0,
        }
    },
    {
        name: 'Home Region',
        icon: '🏠',
        color: '#ffdd00',
        description: 'Your home sector. It seems surprisingly quiet... or is it?',
        gemReward: 0,
        // 3x3 region: -3.2 to -0.2 in X, 0.2 to 3.2 in Y. Close to Star Empire but not touching 0,0.
        test: (cx, cy) => cx > -8 && cx < -4 && cy > -1 && cy < 4,
        center: { worldX: -6000, worldY: -1500 },
        difficulty: 1.0,
        bgColor: '#050a15',
        particleType: 'dust',
        caps: {
            asteroids: 60,
            fighters: 40,    // High density for ambush
            battleships: 12, // High density for ambush
            neutrals: 0,
            dreadnoughts: 4,
        }
    },
    {
        name: 'Robo Space',
        icon: '🤖',
        color: '#00ccff',
        description: 'A sector dominated by automated drones and robotic outposts.',
        gemReward: 200,
        // (cx, cy) => cx < -6 && cy < -10
        test: (cx, cy) => cx < -6 && cy < -10,
        center: { worldX: -10000, worldY: 15000 },
        difficulty: 5.0,
        bgColor: '#000810',
        particleType: 'ember',
        caps: {
            asteroids: 40,
            fighters: 15,
            battleships: 8,
            neutrals: 0,
            dreadnoughts: 2,
        }
    },
    {
        name: 'The Great Barrier',
        icon: '🚧',
        color: '#ffaa00',
        description: 'An extremely dense field of ancient debris and unstable nebulas. Navigation is treacherous.',
        gemReward: 250,
        // (cx, cy) => cx > -2 && cy < -10 && cx < 2 && cy > -20
        test: (cx, cy) => cx > -3 && cy < -10 && cx < 3 && cy > -20,
        center: { worldX: 0, worldY: 15000 },
        difficulty: 4.0,
        bgColor: '#0a0500',
        particleType: 'dust',
        caps: {
            asteroids: 350, // LOTS of asteroids
            fighters: 5,
            battleships: 2,
            neutrals: 0,
            dreadnoughts: 0,
        }
    },
    {
        name: 'The Ionized Shallows',
        icon: '⚡',
        color: '#a022ff',
        description: 'A region of high electrical activity and shimmering ion clouds. Sensors are often scrambled.',
        gemReward: 150,
        // (cx, cy) => cx > -3 && cy > -10 && cx < 4 && cy < -5
        test: (cx, cy) => cx >= -3 && cy >= -10 && cx <= 4 && cy <= -5,
        center: { worldX: 500, worldY: 7500 },
        difficulty: 2.5,
        bgColor: '#050015',
        particleType: 'ember',
        caps: {
            asteroids: 50,
            fighters: 10,
            battleships: 2,
            neutrals: 5,
            dreadnoughts: 0,
        }
    },
    {
        name: 'The Rust Belt',
        icon: '⚙️',
        color: '#cc6600',
        description: 'A graveyard of ancient industry. Rust-colored dust and derelict stations float in the void.',
        gemReward: 200,
        // (cx, cy) => cx > 4 && cy > -8 && cx < 10 && cy < -3
        test: (cx, cy) => cx > 4 && cy > -8 && cx < 10 && cy < -3,
        center: { worldX: 7000, worldY: 5500 },
        difficulty: 3.5,
        bgColor: '#100800',
        particleType: 'dust',
        caps: {
            asteroids: 100,
            fighters: 8,
            battleships: 4,
            neutrals: 2,
            dreadnoughts: 1,
        }
    },
    {
        name: 'The Verdant Reach',
        icon: '🌿',
        color: '#00cc66',
        description: 'A surprisingly lush sector where bioluminescent flora-like organisms drift through space.',
        gemReward: 200,
        // (cx, cy) => cx > 5 && cy > -3 && cx < 15 && cy < 2
        test: (cx, cy) => cx > 5 && cy > -3 && cx < 15 && cy < 2,
        center: { worldX: 10000, worldY: -500 },
        difficulty: 1.5,
        bgColor: '#000a05',
        particleType: 'spore',
        caps: {
            asteroids: 30,
            fighters: 5,
            battleships: 0,
            neutrals: 10,
            dreadnoughts: 0,
        }
    },
    {
        name: 'Trade Federation',
        icon: '💵',
        color: '#4db8ff',
        description: 'The commercial heart of the galaxy. Trade lanes are heavily patrolled by Federation escorts.',
        gemReward: 150,
        // (cx, cy) => cx > 5 && cy > 7 && cx < 12 && cy < 14
        test: (cx, cy) => cx > 5 && cy > 7 && cx < 12 && cy < 14,
        center: { worldX: 8500, worldY: -10500 },
        difficulty: 2.0,
        bgColor: '#00081a',
        particleType: 'dust',
        caps: {
            asteroids: 20,
            fighters: 4,
            battleships: 2,
            neutrals: 15, // Lots of neutral traders
            dreadnoughts: 1,
        }
    },
    {
        name: 'Spectral Graveyard',
        icon: '👻',
        color: '#ffffff',
        description: 'An eerily quiet expanse where the remnants of a lost fleet drift. Spooky whispers echo through the void.',
        gemReward: 300,
        // (cx, cy) => cx > -1 && cy > 12 && cx < 5 && cy < 17
        test: (cx, cy) => cx > -1 && cy > 12 && cx < 5 && cy < 17,
        center: { worldX: 2000, worldY: -14500 },
        difficulty: 6.0,
        bgColor: '#101010', // Dark gray for spectral pop
        particleType: 'spectral',
        caps: {
            asteroids: 10,
            fighters: 2,
            battleships: 1,
            neutrals: 0,
            dreadnoughts: 2,
        }
    },
    {
        name: 'Imperial Shipyards',
        icon: '🏗️',
        color: '#ff2244',
        description: 'A massive industrial zone where the Star Empire constructs its largest warships. Extreme danger.',
        gemReward: 300,
        // (cx, cy) => cx > -5 && cy > 12 && cx < -1 && cy < 17
        test: (cx, cy) => cx > -5 && cy > 12 && cx < -1 && cy < 17,
        center: { worldX: -3000, worldY: -14500 },
        difficulty: 10.0,
        bgColor: '#100000',
        particleType: 'ember',
        caps: {
            asteroids: 10,
            fighters: 2,
            battleships: 0,
            neutrals: 0,
            dreadnoughts: 20, // High dreadnought density as requested
        }
    },
    {
        name: 'The Frozen Expanse',
        icon: '🧊',
        color: '#aaddff',
        description: 'A frigid, desolate region of space filled with ice-coated debris and pale blue light.',
        gemReward: 200,
        // (cx, cy) => cx > -5 && cy > 8 && cx < -1 && cy < 12
        test: (cx, cy) => cx > -5 && cy > 8 && cx < -1 && cy < 12,
        center: { worldX: -3000, worldY: -10000 },
        difficulty: 4.0,
        bgColor: '#000a15',
        particleType: 'dust',
        caps: {
            asteroids: 150, // Lots of "ice" (asteroids)
            fighters: 5,
            battleships: 2,
            neutrals: 2,
            dreadnoughts: 0,
        }
    },
    {
        name: 'The Crimson Veil',
        icon: '🏮',
        color: '#ff0000',
        description: 'A thick, red-tinted nebula where visibility is low and sensors struggle to penetrate the veil.',
        gemReward: 200,
        // (cx, cy) => cx > -12 && cy > 5 && cx < -7 && cy < 10
        test: (cx, cy) => cx > -12 && cy > 5 && cx < -7 && cy < 10,
        center: { worldX: -9500, worldY: -7500 },
        difficulty: 5.5,
        bgColor: '#150000',
        particleType: 'ember',
        caps: {
            asteroids: 60,
            fighters: 12,
            battleships: 4,
            neutrals: 0,
            dreadnoughts: 1,
        }
    },
    {
        name: 'The Obsidian Marches',
        icon: '🖤',
        color: '#2a2a2a',
        description: 'A desolate, shadow-drenched corridor between the Badlands and the Crimson Veil.',
        gemReward: 200,
        // (cx, cy) => cx >= -13 && cx <= -4 && cy >= -3 && cy <= 12
        test: (cx, cy) => cx >= -13 && cx <= -4 && cy >= -3 && cy <= 12,
        center: { worldX: -8500, worldY: -4500 },
        difficulty: 4.5,
        bgColor: '#080808',
        particleType: 'rift',
        caps: {
            asteroids: 80,
            fighters: 10,
            battleships: 5,
            neutrals: 2,
            dreadnoughts: 1,
        }
    }
];

export const DEFAULT_REGION = {
    name: 'Neutral Space',
    icon: '🌌',
    color: '#00f0ff',
    description: 'Open frontier space. No allegiances, no guarantees.',
    difficulty: 1.0,
    center: { worldX: 0, worldY: 0 },
    test: () => true, // Fallback predicate
    bgColor: '#03040b',
    particleType: 'none',
    caps: {
        asteroids: 60,
        fighters: 8,
        battleships: 3,
        neutrals: 6,
        dreadnoughts: 0,
    }
};
