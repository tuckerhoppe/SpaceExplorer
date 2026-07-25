// Regions are defined as coordinate-space predicates + spawn caps.
// coordX = worldX / 1000, coordY = -worldY / 1000 (Y is inverted on canvas)

export const REGIONS = [
    {
        "name": "The Void",
        "icon": "🌌",
        "color": "#00f0ff",
        "test": (cx, cy) => Math.abs(cx) > 45 || Math.abs(cy) > 45,
        "description": "You have strayed too far from the galactic core. The void awaits.",
        "center": {
            "worldX": 0,
            "worldY": 0
        },
        "difficulty": 1,
        "isVoid": true,
        "bgColor": "#000105",
        "particleType": "none",
        "caps": {
            "gravityWells": 2,
            "comets": 3,
            "cargoTrains": 0,
            "mines": 0,
            "derelicts": 0,
            "asteroids": 0,
            "fighters": 0,
            "battleships": 0,
            "neutrals": 0,
            "dreadnoughts": 0
        }
    },
    {
        "name": "The Badlands",
        "icon": "💀",
        "color": "#ff6a00",
        "test": (cx, cy) => cx >= -10 && cx <= 2 && cy >= -10 && cy <= -2.5,
        "description": "A lawless expanse of dense asteroid belts and desperate scavengers.",
        "gemReward": 100,
        "bounds": {
            "minX": -10,
            "maxX": 2,
            "minY": -10,
            "maxY": -2.5
        },
        "center": {
            "worldX": -4000,
            "worldY": 6250
        },
        "difficulty": 2,
        "bgColor": "#150a00",
        "particleType": "dust",
        "caps": {
            "gravityWells": 1,
            "comets": 1,
            "cargoTrains": 2,
            "mines": 8,
            "derelicts": 80,
            "asteroids": 120,
            "fighters": 6,
            "battleships": 0,
            "neutrals": 6,
            "dreadnoughts": 0
        }
    },
    {
        "name": "Blob Space",
        "icon": "",
        "color": "#09ab29ff",
        "test": (cx, cy) => cx > 4 && cy < -10,
        "description": "Mysterious and dangerous species known as the Blobs inhabit this region.",
        "gemReward": 150,
        "bounds": {
            "minX": 27.5,
            "maxX": 43.5,
            "minY": -38,
            "maxY": -23
        },
        "center": {
            "worldX": 35500,
            "worldY": 30500
        },
        "difficulty": 5,
        "bgColor": "#001505",
        "particleType": "spore",
        "caps": {
            "gravityWells": 2,
            "comets": 2,
            "cargoTrains": 1,
            "mines": 3,
            "derelicts": 5,
            "asteroids": 60,
            "fighters": 12,
            "battleships": 5,
            "neutrals": 0,
            "dreadnoughts": 0
        }
    },
    {
        "name": "Star Empire",
        "icon": "⚔️",
        "color": "#ff2244",
        "test": (cx, cy) => cx >= -41 && cx <= -34 && cy >= 29 && cy <= 36,
        "description": "Imperial warships patrol these contested star lanes. Trespassers are destroyed on sight.",
        "gemReward": 150,
        "bounds": {
            "minX": -41,
            "maxX": -34,
            "minY": 29,
            "maxY": 36
        },
        "center": {
            "worldX": -37500,
            "worldY": -32500
        },
        "difficulty": 12,
        "bgColor": "rgba(28, 0, 0, 1)",
        "particleType": "ember",
        "caps": {
            "gravityWells": 1,
            "comets": 1,
            "cargoTrains": 1,
            "mines": 2,
            "derelicts": 4,
            "asteroids": 60,
            "fighters": 12,
            "battleships": 5,
            "neutrals": 2,
            "dreadnoughts": 3
        }
    },
    {
        "name": "Uncharted Space",
        "icon": "☄️",
        "color": "#ff00ee",
        "test": (cx, cy) => cx >= 24.5 && cx <= 40.5 && cy >= 24 && cy <= 37,
        "description": "Mysterious discoveries await in this region.",
        "gemReward": 150,
        "bounds": {
            "minX": 24.5,
            "maxX": 40.5,
            "minY": 24,
            "maxY": 37
        },
        "center": {
            "worldX": 32500,
            "worldY": -30500
        },
        "difficulty": 7,
        "bgColor": "#1a001a",
        "particleType": "rift",
        "caps": {
            "gravityWells": 1,
            "comets": 2,
            "cargoTrains": 1,
            "mines": 4,
            "derelicts": 5,
            "asteroids": 60,
            "fighters": 3,
            "battleships": 0,
            "neutrals": 2,
            "dreadnoughts": 0
        }
    },
    {
        "name": "Home Region",
        "icon": "🏠",
        "color": "#ffdd00",
        "test": (cx, cy) => cx >= -10 && cx <= -2 && cy >= -2.5 && cy <= 5.5,
        "description": "Your home sector. It seems surprisingly quiet... or is it?",
        "gemReward": 0,
        "bounds": {
            "minX": -10,
            "maxX": -2,
            "minY": -2.5,
            "maxY": 5.5
        },
        "center": {
            "worldX": -6000,
            "worldY": -1500
        },
        "difficulty": 1,
        "bgColor": "#050a15",
        "particleType": "dust",
        "caps": {
            "gravityWells": 1,
            "comets": 1,
            "cargoTrains": 1,
            "mines": 2,
            "derelicts": 4,
            "asteroids": 60,
            "fighters": 25,
            "battleships": 8,
            "neutrals": 0,
            "dreadnoughts": 2
        }
    },
    {
        "name": "Robo Space",
        "icon": "🤖",
        "color": "#00ccff",
        "test": (cx, cy) => cx < -6 && cy < -10,
        "description": "A sector dominated by automated drones and robotic outposts.",
        "gemReward": 200,
        "bounds": {
            "minX": -47.5,
            "maxX": -33.5,
            "minY": -36,
            "maxY": -21
        },
        "center": {
            "worldX": -40500,
            "worldY": 28500
        },
        "difficulty": 9,
        "bgColor": "#000810",
        "particleType": "ember",
        "caps": {
            "gravityWells": 1,
            "comets": 3,
            "cargoTrains": 1,
            "mines": 3,
            "derelicts": 4,
            "asteroids": 40,
            "fighters": 15,
            "battleships": 8,
            "neutrals": 0,
            "dreadnoughts": 2
        }
    },
    {
        "name": "The Great Barrier",
        "icon": "🚧",
        "color": "#ffaa00",
        "test": (cx, cy) => cx > -3 && cy < -10 && cx < 3 && cy > -20,
        "description": "An extremely dense field of ancient debris and unstable nebulas. Navigation is treacherous.",
        "gemReward": 250,
        "bounds": {
            "minX": -33.5,
            "maxX": -27.5,
            "minY": -26,
            "maxY": -16
        },
        "center": {
            "worldX": -30500,
            "worldY": 21000
        },
        "difficulty": 7,
        "bgColor": "#0a0500",
        "particleType": "dust",
        "caps": {
            "gravityWells": 1,
            "comets": 1,
            "cargoTrains": 2,
            "mines": 8,
            "derelicts": 10,
            "asteroids": 350,
            "fighters": 5,
            "battleships": 2,
            "neutrals": 0,
            "dreadnoughts": 0
        }
    },
    {
        "name": "The Ionized Shallows",
        "icon": "⚡",
        "color": "#a022ff",
        "test": (cx, cy) => cx >= -40.5 && cx <= -33.5 && cy >= -21 && cy <= -16,
        "description": "A region of high electrical activity and shimmering ion clouds. Sensors are often scrambled.",
        "gemReward": 150,
        "bounds": {
            "minX": -40.5,
            "maxX": -33.5,
            "minY": -21,
            "maxY": -16
        },
        "center": {
            "worldX": -37000,
            "worldY": 18500
        },
        "difficulty": 4,
        "bgColor": "#050015",
        "particleType": "ember",
        "caps": {
            "gravityWells": 1,
            "comets": 2,
            "cargoTrains": 1,
            "mines": 3,
            "derelicts": 5,
            "asteroids": 50,
            "fighters": 10,
            "battleships": 2,
            "neutrals": 5,
            "dreadnoughts": 0
        }
    },
    {
        "name": "The Rust Belt",
        "icon": "⚙️",
        "color": "#cc6600",
        "test": (cx, cy) => cx >= 21.5 && cx <= 27.5 && cy >= -24.5 && cy <= -17,
        "description": "A graveyard of ancient industry. Rust-colored dust and derelict stations float in the void.",
        "gemReward": 200,
        "bounds": {
            "minX": 21.5,
            "maxX": 27.5,
            "minY": -24.5,
            "maxY": -17
        },
        "center": {
            "worldX": 24500,
            "worldY": 20750
        },
        "difficulty": 6,
        "bgColor": "#100800",
        "particleType": "dust",
        "caps": {
            "gravityWells": 1,
            "comets": 1,
            "cargoTrains": 2,
            "mines": 5,
            "derelicts": 6,
            "asteroids": 100,
            "fighters": 8,
            "battleships": 4,
            "neutrals": 2,
            "dreadnoughts": 1
        }
    },
    {
        "name": "The Verdant Reach",
        "icon": "🌿",
        "color": "#00cc66",
        "test": (cx, cy) => cx >= 2 && cx <= 13 && cy >= -7 && cy <= 2,
        "description": "A surprisingly lush sector where bioluminescent flora-like organisms drift through space.",
        "gemReward": 200,
        "bounds": {
            "minX": 2,
            "maxX": 13,
            "minY": -7,
            "maxY": 2
        },
        "center": {
            "worldX": 7500,
            "worldY": 2500
        },
        "difficulty": 2,
        "bgColor": "#000a05",
        "particleType": "spore",
        "caps": {
            "gravityWells": 1,
            "comets": 1,
            "cargoTrains": 1,
            "mines": 2,
            "derelicts": 4,
            "asteroids": 30,
            "fighters": 10,
            "battleships": 0,
            "neutrals": 10,
            "dreadnoughts": 0
        }
    },
    {
        "name": "Trade Federation",
        "icon": "💵",
        "color": "#4db8ff",
        "test": (cx, cy) => cx >= 22.5 && cx <= 30.5 && cy >= 18 && cy <= 24,
        "description": "The commercial heart of the galaxy. Trade lanes are heavily patrolled by Federation escorts.",
        "gemReward": 150,
        "bounds": {
            "minX": 22.5,
            "maxX": 30.5,
            "minY": 18,
            "maxY": 24
        },
        "center": {
            "worldX": 26500,
            "worldY": -21000
        },
        "difficulty": 6,
        "bgColor": "#00081a",
        "particleType": "dust",
        "caps": {
            "gravityWells": 1,
            "comets": 1,
            "cargoTrains": 3,
            "mines": 2,
            "derelicts": 4,
            "asteroids": 20,
            "fighters": 4,
            "battleships": 2,
            "neutrals": 15,
            "dreadnoughts": 1
        }
    },
    {
        "name": "Spectral Graveyard",
        "icon": "👻",
        "color": "#ffffff",
        "test": (cx, cy) => cx >= 10.5 && cx <= 16.5 && cy >= 27 && cy <= 32,
        "description": "An eerily quiet expanse where the remnants of a lost fleet drift. Spooky whispers echo through the void.",
        "gemReward": 300,
        "bounds": {
            "minX": 10.5,
            "maxX": 16.5,
            "minY": 27,
            "maxY": 32
        },
        "center": {
            "worldX": 13500,
            "worldY": -29500
        },
        "difficulty": 5,
        "bgColor": "#101010",
        "particleType": "spectral",
        "caps": {
            "gravityWells": 2,
            "comets": 3,
            "cargoTrains": 1,
            "mines": 6,
            "derelicts": 8,
            "asteroids": 10,
            "fighters": 2,
            "battleships": 1,
            "neutrals": 0,
            "dreadnoughts": 2
        }
    },
    {
        "name": "Imperial Shipyards",
        "icon": "🏗️",
        "color": "#ffd700",
        "test": (cx, cy) => cx >= -34 && cx <= -30 && cy >= 29 && cy <= 36,
        "description": "A massive industrial zone where the Star Empire constructs its largest warships. Extreme danger.",
        "gemReward": 300,
        "bounds": {
            "minX": -34,
            "maxX": -30,
            "minY": 29,
            "maxY": 36
        },
        "center": {
            "worldX": -32000,
            "worldY": -32500
        },
        "difficulty": 12,
        "bgColor": "#100000",
        "particleType": "ember",
        "caps": {
            "gravityWells": 1,
            "comets": 1,
            "cargoTrains": 1,
            "mines": 2,
            "derelicts": 3,
            "asteroids": 10,
            "fighters": 2,
            "battleships": 0,
            "neutrals": 0,
            "dreadnoughts": 20
        }
    },
    {
        "name": "The Frozen Expanse",
        "icon": "🧊",
        "color": "#aaddff",
        "test": (cx, cy) => cx >= -23 && cx <= -16 && cy >= 20 && cy <= 26,
        "description": "A frigid, desolate region of space filled with ice-coated debris and pale blue light.",
        "gemReward": 200,
        "bounds": {
            "minX": -23,
            "maxX": -16,
            "minY": 20,
            "maxY": 26
        },
        "center": {
            "worldX": -19500,
            "worldY": -23000
        },
        "difficulty": 7,
        "bgColor": "#000a15",
        "particleType": "dust",
        "caps": {
            "gravityWells": 1,
            "comets": 3,
            "cargoTrains": 1,
            "mines": 3,
            "derelicts": 4,
            "asteroids": 150,
            "fighters": 5,
            "battleships": 2,
            "neutrals": 2,
            "dreadnoughts": 0
        }
    },
    {
        "name": "The Crimson Veil",
        "icon": "🏮",
        "color": "#ff0000",
        "test": (cx, cy) => cx >= -41 && cx <= -33 && cy >= 20 && cy <= 25,
        "description": "A thick, red-tinted nebula where visibility is low and sensors struggle to penetrate the veil.",
        "gemReward": 200,
        "bounds": {
            "minX": -41,
            "maxX": -33,
            "minY": 20,
            "maxY": 25
        },
        "center": {
            "worldX": -37000,
            "worldY": -22500
        },
        "difficulty": 10,
        "bgColor": "#150000",
        "particleType": "ember",
        "caps": {
            "gravityWells": 1,
            "comets": 2,
            "cargoTrains": 1,
            "mines": 4,
            "derelicts": 5,
            "asteroids": 60,
            "fighters": 12,
            "battleships": 4,
            "neutrals": 0,
            "dreadnoughts": 1
        }
    },
    {
        "name": "The Obsidian Marches",
        "icon": "🖤",
        "color": "#aaaaaa",
        "test": (cx, cy) => cx >= -29 && cx <= -23 && cy >= 20 && cy <= 29,
        "description": "A desolate, shadow-drenched corridor between the Badlands and the Crimson Veil.",
        "gemReward": 200,
        "bounds": {
            "minX": -29,
            "maxX": -23,
            "minY": 20,
            "maxY": 29
        },
        "center": {
            "worldX": -26000,
            "worldY": -24500
        },
        "difficulty": 8,
        "bgColor": "#050505",
        "particleType": "rift",
        "caps": {
            "gravityWells": 1,
            "comets": 1,
            "cargoTrains": 2,
            "mines": 5,
            "derelicts": 6,
            "asteroids": 80,
            "fighters": 10,
            "battleships": 5,
            "neutrals": 2,
            "dreadnoughts": 1
        }
    },
    {
        "name": "Imperial Proving Grounds",
        "icon": "🎯",
        "color": "#ffaa00",
        "test": (cx, cy) => cx >= -30 && cx <= -23 && cy >= 29 && cy <= 36,
        "description": "Elite imperial pilots conduct live-fire drills in this heavily monitored sector.",
        "gemReward": 200,
        "bounds": {
            "minX": -30,
            "maxX": -23,
            "minY": 29,
            "maxY": 36
        },
        "center": {
            "worldX": -26500,
            "worldY": -32500
        },
        "difficulty": 10,
        "bgColor": "#1a0a00",
        "particleType": "ember",
        "caps": {
            "gravityWells": 1,
            "comets": 1,
            "cargoTrains": 1,
            "mines": 6,
            "derelicts": 3,
            "asteroids": 30,
            "fighters": 15,
            "battleships": 6,
            "neutrals": 0,
            "dreadnoughts": 2
        }
    },
    {
        "name": "The Northern Gate",
        "icon": "⛩️",
        "color": "#4db8ff",
        "test": (cx, cy) => cx >= -23 && cx <= -16 && cy >= 26 && cy <= 36,
        "description": "A major thoroughfare for trade fleets bypassing the core systems.",
        "gemReward": 150,
        "bounds": {
            "minX": -23,
            "maxX": -16,
            "minY": 26,
            "maxY": 36
        },
        "center": {
            "worldX": -19500,
            "worldY": -31000
        },
        "difficulty": 7,
        "bgColor": "#000a1a",
        "particleType": "dust",
        "caps": {
            "gravityWells": 1,
            "comets": 2,
            "cargoTrains": 1,
            "mines": 3,
            "derelicts": 5,
            "asteroids": 50,
            "fighters": 8,
            "battleships": 2,
            "neutrals": 10,
            "dreadnoughts": 0
        }
    },
    {
        "name": "The Obsidian Approach",
        "icon": "🌑",
        "color": "#555555",
        "test": (cx, cy) => cx >= -35 && cx <= -29 && cy >= 25 && cy <= 29,
        "description": "The lighting dims as the space becomes choked with dark obsidian dust.",
        "gemReward": 200,
        "bounds": {
            "minX": -35,
            "maxX": -29,
            "minY": 25,
            "maxY": 29
        },
        "center": {
            "worldX": -32000,
            "worldY": -27000
        },
        "difficulty": 9,
        "bgColor": "#050505",
        "particleType": "rift",
        "caps": {
            "gravityWells": 1,
            "comets": 2,
            "cargoTrains": 1,
            "mines": 3,
            "derelicts": 5,
            "asteroids": 60,
            "fighters": 10,
            "battleships": 4,
            "neutrals": 2,
            "dreadnoughts": 1
        }
    },
    {
        "name": "The Shadow Reach",
        "icon": "🦇",
        "color": "#aa22ff",
        "test": (cx, cy) => cx >= -41 && cx <= -35 && cy >= 25 && cy <= 29,
        "description": "Strange energy rifts bridge the gap between the Crimson Veil and the Star Empire.",
        "gemReward": 250,
        "bounds": {
            "minX": -41,
            "maxX": -35,
            "minY": 25,
            "maxY": 29
        },
        "center": {
            "worldX": -38000,
            "worldY": -27000
        },
        "difficulty": 11,
        "bgColor": "#0a0015",
        "particleType": "rift",
        "caps": {
            "gravityWells": 1,
            "comets": 2,
            "cargoTrains": 1,
            "mines": 4,
            "derelicts": 5,
            "asteroids": 40,
            "fighters": 12,
            "battleships": 5,
            "neutrals": 0,
            "dreadnoughts": 2
        }
    },
    {
        "name": "The Slate Spires",
        "icon": "⛰️",
        "color": "#778899",
        "test": (cx, cy) => cx >= -32 && cx <= -26 && cy >= 15 && cy <= 20,
        "description": "Jagged monoliths of dark rock drift through this cold, shadow-covered sector.",
        "gemReward": 150,
        "bounds": {
            "minX": -32,
            "maxX": -26,
            "minY": 15,
            "maxY": 20
        },
        "center": {
            "worldX": -29000,
            "worldY": -17500
        },
        "difficulty": 6,
        "bgColor": "#0a0a0a",
        "particleType": "dust",
        "caps": {
            "gravityWells": 1,
            "comets": 3,
            "cargoTrains": 2,
            "mines": 4,
            "derelicts": 6,
            "asteroids": 100,
            "fighters": 6,
            "battleships": 1,
            "neutrals": 4,
            "dreadnoughts": 0
        }
    },
    {
        "name": "The Glacial Outwash",
        "icon": "❄️",
        "color": "#b0e0e6",
        "test": (cx, cy) => cx >= -41 && cx <= -32 && cy >= 15 && cy <= 20,
        "description": "Frigid winds and ice crystals flow out from the Frozen Expanse into this transition zone.",
        "gemReward": 150,
        "bounds": {
            "minX": -41,
            "maxX": -32,
            "minY": 15,
            "maxY": 20
        },
        "center": {
            "worldX": -36500,
            "worldY": -17500
        },
        "difficulty": 7,
        "bgColor": "#00080f",
        "particleType": "dust",
        "caps": {
            "gravityWells": 1,
            "comets": 2,
            "cargoTrains": 1,
            "mines": 2,
            "derelicts": 4,
            "asteroids": 80,
            "fighters": 8,
            "battleships": 2,
            "neutrals": 5,
            "dreadnoughts": 0
        }
    },
    {
        "name": "The Dusty Corridor",
        "icon": "🌫️",
        "color": "#d2b48c",
        "test": (cx, cy) => cx >= -26 && cx <= -19 && cy >= 15 && cy <= 20,
        "description": "A low-visibility passage choked with fine metallic dust and ancient industrial debris.",
        "gemReward": 100,
        "bounds": {
            "minX": -26,
            "maxX": -19,
            "minY": 15,
            "maxY": 20
        },
        "center": {
            "worldX": -22500,
            "worldY": -17500
        },
        "difficulty": 5,
        "bgColor": "#0f0a05",
        "particleType": "dust",
        "caps": {
            "gravityWells": 1,
            "comets": 1,
            "cargoTrains": 2,
            "mines": 4,
            "derelicts": 6,
            "asteroids": 60,
            "fighters": 5,
            "battleships": 1,
            "neutrals": 6,
            "dreadnoughts": 0
        }
    },
    {
        "name": "The Tranquil Gap",
        "icon": "🕊️",
        "color": "#f0fff0",
        "test": (cx, cy) => cx >= -19 && cx <= -13 && cy >= 15 && cy <= 20,
        "description": "A surprisingly calm and clear sector on the edge of the deeper reaches.",
        "gemReward": 50,
        "bounds": {
            "minX": -19,
            "maxX": -13,
            "minY": 15,
            "maxY": 20
        },
        "center": {
            "worldX": -16000,
            "worldY": -17500
        },
        "difficulty": 2,
        "bgColor": "#050a05",
        "particleType": "none",
        "caps": {
            "gravityWells": 1,
            "comets": 1,
            "cargoTrains": 1,
            "mines": 2,
            "derelicts": 3,
            "asteroids": 20,
            "fighters": 2,
            "battleships": 0,
            "neutrals": 12,
            "dreadnoughts": 0
        }
    },
    {
        "name": "The Aurora Belt",
        "icon": "🌌",
        "color": "#ff88ff",
        "test": (cx, cy) => cx >= 16.5 && cx <= 24.5 && cy >= 24 && cy <= 32,
        "description": "A shimmering curtain of light dances across the void, marking the edge of the Uncharted mapping zone.",
        "gemReward": 150,
        "bounds": {
            "minX": 16.5,
            "maxX": 24.5,
            "minY": 24,
            "maxY": 32
        },
        "center": {
            "worldX": 20500,
            "worldY": -28000
        },
        "difficulty": 6,
        "bgColor": "#100010",
        "particleType": "none",
        "caps": {
            "gravityWells": 1,
            "comets": 2,
            "cargoTrains": 1,
            "mines": 3,
            "derelicts": 4,
            "asteroids": 60,
            "fighters": 6,
            "battleships": 1,
            "neutrals": 5,
            "dreadnoughts": 0
        }
    },
    {
        "name": "Merchant's Way",
        "icon": "🛒",
        "color": "#ffd700",
        "test": (cx, cy) => cx >= 16.5 && cx <= 22.4 && cy >= 19 && cy <= 23.9,
        "description": "A prosperous trade route where merchant fleets carry goods between the core systems.",
        "gemReward": 100,
        "bounds": {
            "minX": 16.5,
            "maxX": 22.4,
            "minY": 19,
            "maxY": 23.9
        },
        "center": {
            "worldX": 19450,
            "worldY": -21450
        },
        "difficulty": 5,
        "bgColor": "#0a0a00",
        "particleType": "dust",
        "caps": {
            "gravityWells": 1,
            "comets": 1,
            "cargoTrains": 3,
            "mines": 2,
            "derelicts": 4,
            "asteroids": 50,
            "fighters": 5,
            "battleships": 1,
            "neutrals": 10,
            "dreadnoughts": 0
        }
    },
    {
        "name": "The Quiet Reach",
        "icon": "🤫",
        "color": "#88aaff",
        "test": (cx, cy) => cx >= 10.5 && cx <= 16.5 && cy >= 21 && cy <= 27,
        "description": "A vast, empty sector known for its unnerving stillness and lack of chatter.",
        "gemReward": 100,
        "bounds": {
            "minX": 10.5,
            "maxX": 16.5,
            "minY": 21,
            "maxY": 27
        },
        "center": {
            "worldX": 13500,
            "worldY": -24000
        },
        "difficulty": 4,
        "bgColor": "#00000a",
        "particleType": "none",
        "caps": {
            "gravityWells": 1,
            "comets": 1,
            "cargoTrains": 1,
            "mines": 2,
            "derelicts": 3,
            "asteroids": 30,
            "fighters": 4,
            "battleships": 0,
            "neutrals": 8,
            "dreadnoughts": 0
        }
    },
    {
        "name": "The Gilded Path",
        "icon": "✨",
        "color": "#ffffff",
        "test": (cx, cy) => cx >= 10.5 && cx <= 16.5 && cy >= 16 && cy <= 21,
        "description": "A safe and well-traveled lane illuminated by the light of distant star clusters.",
        "gemReward": 100,
        "bounds": {
            "minX": 10.5,
            "maxX": 16.5,
            "minY": 16,
            "maxY": 21
        },
        "center": {
            "worldX": 13500,
            "worldY": -18500
        },
        "difficulty": 3,
        "bgColor": "#0a0a0a",
        "particleType": "none",
        "caps": {
            "gravityWells": 1,
            "comets": 1,
            "cargoTrains": 2,
            "mines": 2,
            "derelicts": 4,
            "asteroids": 20,
            "fighters": 3,
            "battleships": 0,
            "neutrals": 15,
            "dreadnoughts": 0
        }
    },
    {
        "name": "The Sentinel's Post",
        "icon": "⚔️",
        "color": "#ff4444",
        "test": (cx, cy) => cx >= -4 && cx <= 0 && cy >= 30 && cy <= 33,
        "description": "A fortified imperial sector guarded by an elite commander. Entry is considered a hostile act.",
        "gemReward": 300,
        "bounds": {
            "minX": -4,
            "maxX": 0,
            "minY": 30,
            "maxY": 33
        },
        "center": {
            "worldX": -2000,
            "worldY": -31500
        },
        "difficulty": 3,
        "bgColor": "#1a0000",
        "particleType": "ember",
        "caps": {
            "gravityWells": 1,
            "comets": 1,
            "cargoTrains": 1,
            "mines": 2,
            "derelicts": 3,
            "asteroids": 20,
            "fighters": 10,
            "battleships": 3,
            "neutrals": 0,
            "dreadnoughts": 1
        }
    },
    {
        "name": "The Sunlit Plains",
        "icon": "☀️",
        "color": "#fff5d0",
        "test": (cx, cy) => cx >= -2 && cx <= 10 && cy >= 2 && cy <= 7,
        "description": "A bright and open sector where the light of the galactic core shines clearly.",
        "gemReward": 100,
        "bounds": {
            "minX": -2,
            "maxX": 10,
            "minY": 2,
            "maxY": 7
        },
        "center": {
            "worldX": 4000,
            "worldY": -4500
        },
        "difficulty": 2,
        "bgColor": "#0f0f00",
        "particleType": "none",
        "caps": {
            "gravityWells": 1,
            "comets": 1,
            "cargoTrains": 1,
            "mines": 1,
            "derelicts": 3,
            "asteroids": 40,
            "fighters": 18,
            "battleships": 0,
            "neutrals": 12,
            "dreadnoughts": 0
        }
    },
    {
        "name": "The Jovian Graveyard",
        "icon": "🪦",
        "color": "#a9a9a9",
        "test": (cx, cy) => cx >= 23 && cx <= 29 && cy >= 6.5 && cy <= 12.5,
        "description": "The shattered remains of ancient moons and gas-giant debris drift silently here.",
        "gemReward": 200,
        "bounds": {
            "minX": 23,
            "maxX": 29,
            "minY": 6.5,
            "maxY": 12.5
        },
        "center": {
            "worldX": 26000,
            "worldY": -9500
        },
        "difficulty": 4,
        "bgColor": "#0a0a0a",
        "particleType": "dust",
        "caps": {
            "gravityWells": 1,
            "comets": 2,
            "cargoTrains": 1,
            "mines": 5,
            "derelicts": 7,
            "asteroids": 100,
            "fighters": 5,
            "battleships": 1,
            "neutrals": 4,
            "dreadnoughts": 0
        }
    },
    {
        "name": "The Sunken Reach",
        "icon": "⚓",
        "color": "#4682b4",
        "test": (cx, cy) => cx >= 27.5 && cx <= 33.5 && cy >= -23 && cy <= -17,
        "description": "A deep, heavy sector where space feels thick with metallic dust and magnetic anomalies.",
        "gemReward": 250,
        "bounds": {
            "minX": 27.5,
            "maxX": 33.5,
            "minY": -23,
            "maxY": -17
        },
        "center": {
            "worldX": 30500,
            "worldY": 20000
        },
        "difficulty": 5,
        "bgColor": "#00050f",
        "particleType": "dust",
        "caps": {
            "gravityWells": 1,
            "comets": 2,
            "cargoTrains": 1,
            "mines": 3,
            "derelicts": 5,
            "asteroids": 70,
            "fighters": 6,
            "battleships": 2,
            "neutrals": 3,
            "dreadnoughts": 0
        }
    },
    {
        "name": "The Trade Outskirts",
        "icon": "🚚",
        "color": "#daa520",
        "test": (cx, cy) => cx >= 16.5 && cx <= 22.5 && cy >= 13 && cy <= 19,
        "description": "A secondary trade corridor frequented by independent haulers and fringe merchants.",
        "gemReward": 150,
        "bounds": {
            "minX": 16.5,
            "maxX": 22.5,
            "minY": 13,
            "maxY": 19
        },
        "center": {
            "worldX": 19500,
            "worldY": -16000
        },
        "difficulty": 4,
        "bgColor": "#0a0500",
        "particleType": "none",
        "caps": {
            "gravityWells": 1,
            "comets": 1,
            "cargoTrains": 2,
            "mines": 2,
            "derelicts": 4,
            "asteroids": 30,
            "fighters": 4,
            "battleships": 1,
            "neutrals": 15,
            "dreadnoughts": 0
        }
    },
    {
        "name": "Federation Approach",
        "icon": "🛂",
        "color": "#0f5922ff",
        "test": (cx, cy) => cx >= 22.5 && cx <= 30.5 && cy >= 13 && cy <= 18,
        "description": "A strictly patrolled sector serving as the primary gateway to the Trade Federation Hub.",
        "gemReward": 200,
        "bounds": {
            "minX": 22.5,
            "maxX": 30.5,
            "minY": 13,
            "maxY": 18
        },
        "center": {
            "worldX": 26500,
            "worldY": -15500
        },
        "difficulty": 5,
        "bgColor": "#00081a",
        "particleType": "dust",
        "caps": {
            "gravityWells": 1,
            "comets": 1,
            "cargoTrains": 1,
            "mines": 2,
            "derelicts": 4,
            "asteroids": 50,
            "fighters": 8,
            "battleships": 3,
            "neutrals": 8,
            "dreadnoughts": 0
        }
    },
    {
        "name": "The Corsair Coast",
        "icon": "🏴‍☠️",
        "color": "#ffaa00",
        "test": (cx, cy) => cx >= 30.5 && cx <= 40.5 && cy >= 20 && cy <= 24,
        "description": "A lawless expanse ruled by scavenger fleets and notorious pirate lords.",
        "gemReward": 350,
        "bounds": {
            "minX": 30.5,
            "maxX": 40.5,
            "minY": 20,
            "maxY": 24
        },
        "center": {
            "worldX": 35500,
            "worldY": -22000
        },
        "difficulty": 6,
        "bgColor": "#1a0d00",
        "particleType": "ember",
        "caps": {
            "gravityWells": 1,
            "comets": 1,
            "cargoTrains": 2,
            "mines": 6,
            "derelicts": 8,
            "asteroids": 40,
            "fighters": 15,
            "battleships": 5,
            "neutrals": 0,
            "dreadnoughts": 2
        }
    },
    {
        "name": "Orbit Test Sector",
        "icon": "💫",
        "color": "#ff8000",
        "test": (cx, cy) => cx >= 26.5 && cx <= 35.5 && cy >= -11 && cy <= -2,
        "description": "A specialized testing ground containing a star system with structured planetary orbits.",
        "gemReward": 100,
        "bounds": {
            "minX": 26.5,
            "maxX": 35.5,
            "minY": -11,
            "maxY": -2
        },
        "center": {
            "worldX": 31000,
            "worldY": 6500
        },
        "difficulty": 4,
        "bgColor": "#080400",
        "particleType": "ember",
        "caps": {
            "gravityWells": 1,
            "comets": 1,
            "cargoTrains": 1,
            "mines": 3,
            "derelicts": 4,
            "asteroids": 20,
            "fighters": 2,
            "battleships": 0,
            "neutrals": 4,
            "dreadnoughts": 0
        }
    },
    {
        "name": "Ranger Headquarters",
        "icon": "🚀",
        "color": "#00ffaa",
        "test": (cx, cy) => cx >= -2 && cx <= 2 && cy >= -2.5 && cy <= 2,
        "description": "HeadQuarters of the space ranger corps",
        "gemReward": 0,
        "bounds": {
            "minX": -2,
            "maxX": 2,
            "minY": -2.5,
            "maxY": 2
        },
        "center": {
            "worldX": 0,
            "worldY": 250
        },
        "difficulty": 1,
        "bgColor": "#000805",
        "particleType": "none",
        "caps": {
            "gravityWells": 1,
            "comets": 1,
            "cargoTrains": 0,
            "mines": 2,
            "derelicts": 4,
            "asteroids": 30,
            "fighters": 4,
            "battleships": 0,
            "neutrals": 4,
            "dreadnoughts": 0
        }
    },
    {
        "name": "Iron Foundry",
        "icon": "🪐",
        "color": "#00ffaa",
        "test": (cx, cy) => cx >= -33 && cx <= -29 && cy >= 20 && cy <= 25,
        "description": "An uncharted new boundary.",
        "gemReward": 0,
        "bounds": {
            "minX": -33,
            "maxX": -29,
            "minY": 20,
            "maxY": 25
        },
        "center": {
            "worldX": -31000,
            "worldY": -22500
        },
        "difficulty": 7,
        "bgColor": "#000805",
        "particleType": "none",
        "caps": {
            "gravityWells": 1,
            "comets": 1,
            "cargoTrains": 0,
            "mines": 2,
            "derelicts": 4,
            "asteroids": 30,
            "fighters": 4,
            "battleships": 0,
            "neutrals": 4,
            "dreadnoughts": 0
        }
    }
];

export const DEFAULT_REGION = {
    name: "Neutral Space",
    icon: "🌌",
    color: "#00f0ff",
    test: () => true,
    description: "Open frontier space. No allegiances, no guarantees.",
    difficulty: 1,
    center: {
        "worldX": 0,
        "worldY": 0
    },
    bgColor: "#03040b",
    particleType: "none",
    caps: {
        "gravityWells": 1,
        "comets": 2,
        "cargoTrains": 1,
        "mines": 2,
        "derelicts": 4,
        "asteroids": 60,
        "fighters": 8,
        "battleships": 3,
        "neutrals": 6,
        "dreadnoughts": 0
    }
};
