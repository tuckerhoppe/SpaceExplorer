export const QUESTS = {
    'tut_flight': {
        id: 'tut_flight',
        title: "Flight Training",
        description: "Verify basic flight systems: W (Thrust), A/D (Turn).",
        objectives: [
            { id: 'thrust', type: 'input', key: 'w', count: 1, current: 0 },
            { id: 'turn', type: 'input', key: 'a', count: 1, current: 0 }
        ],
        hail: {
            text: "Thanks for coming with me to this new Nebula, I really appreciate it",
            options: [
                { text: "Of course, I’m excited to finally see one for myself!", reply: "Oh man, you’re going to love it! Why don’t we do a quick systems check. Press W to go forward and a or d to turn" }
            ]
        },
        nextQuest: 'tut_combat'
    },
    'tut_combat': {
        id: 'tut_combat',
        title: "Weapons Practice",
        description: "Target and destroy 5 asteroids to calibrate weapon systems.",
        objectives: [
            { id: 'destroy_asteroids', type: 'destroy', target: 'asteroid', count: 5, current: 0 }
        ],
        hail: {
            text: "Your engines are working great! There are some asteroids near by here, perfect for a weapons check. Aim with where you want to shoot your mouse, and click to fire!",
            options: [
                { text: "Lets do it!", reply: "You got it! Remember: running into asteroids can hurt your ship. When you destroy them, they drop gems which you'll need for upgrades eventually!" }
            ]
        },
        nextQuest: 'tut_hostile'
    },
    'tut_hostile': {
        id: 'tut_hostile',
        title: "Dogfight Training",
        description: "Engage and destroy the nearby hostile drone.",
        objectives: [
            { id: 'destroy_enemy', type: 'destroy', target: 'enemy', count: 1, current: 0 }
        ],
        hail: {
            text: "Woah Incoming! Red blips on the scanner. That's a Star Empire scout. It's fast and it bites. Evade its phasers with your keyboard and fire at it with your mouse!",
            options: [
                { text: "The Star Empire?!", reply: "They’re the most powerful military force in the quadrant! We have to be careful. Take him out before he calls for backup!" }
            ]
        },
        nextQuest: 'tut_science'
    },
    'tut_science': {
        id: 'tut_science',
        title: "Scientific Research",
        description: "Dock at the Training Nebula and collect all available research data (30 SP).",
        objectives: [
            { id: 'perform_science', type: 'science', target: 'nebula_tutorial', count: 30, current: 0 }
        ],
        hail: {
            text: "Nice shot! It looks like he was the only one phew! I marked the nebula in your Nav Computer. Let's head there and I'll show you how to scan it for data!",
            options: [
                { text: "How do I scan it?", reply: "Just fly right on top of a stellar object to begin scanning automatically. A sensor skill check will appear—hit the targets to speed up the process and gather Science Points!" }
            ]
        },
        nextQuest: 'tut_boost'
    },
    'tut_boost': {
        id: 'tut_boost',
        title: "Engine Overdrive",
        description: "Engage the boost engine to clear distance quickly.",
        objectives: [
            { id: 'use_boost', type: 'boost', count: 580, current: 0 } // A few seconds of boost
        ],
        hail: {
            text: "Nice job! Now that we have all of that data, lets have some FUN! Activate your booster engines",
            options: [
                { text: "Booster engines?", reply: "Oh right, my bad its your first time out here. Booster engines decrease turning speed but INCREASE forward speed so that you can get distant places quicker. It takes a second to charge up but then you’ll punch it! If you let go you’ll have to re-charge the engine before you get going again, so be careful especially in combat situations" }
            ]
        },
        nextQuest: 'tut_home'
    },
    'tut_home': {
        id: 'tut_home',
        title: "Return Home",
        description: "Instruction complete. Return to your home sector for final debrief.",
        objectives: [
            { id: 'reach_home_region', type: 'reach', region: 'Home Region', count: 1, current: 0 }
        ],
        hail: {
            text: "Nice job! OK I guess we should get that data back home. I haven’t heard from planetary command recently, I hope everything is alright…",
            options: [
                { text: "I'm sure it's fine. Let's go.", reply: "You’re probably right, not much ever happens in our quiet corner of the quadrant. Follow the icon I put in your nav computer, and we’ll be home in no time." }
            ]
        },
        nextQuest: 'tut_final'
    },
    'tut_final': {
        id: 'tut_final',
        title: "Tutorial Complete",
        description: "Survive the ambush and prove your worth.",
        objectives: [],
        hail: {
            text: "OH…Oh no! They’re mounting a full invasion!! We have to help!",
            options: [
                { text: "For our home!", reply: "Stick close to me, take evasive maneuvers, and fire every last shot you have! We have to protect the planet!" }
            ]
        },
    },
    'story_find_station': {
        id: 'story_find_station',
        title: "New Beginnings",
        description: "Locate a Frontier Station to repair and upgrade your ship.",
        objectives: [
            { id: 'reach_station', type: 'reach', targetType: 'station', count: 1, current: 0 }
        ],
        hail: {
            text: "Wakey wakey!! Wow, you were out for a while. I wasn't sure if you'd wake up after that explosion... What a piece of junk you're flying now!! Hehehe!",
            options: [
                {
                    text: "Who are you? What happened to me?",
                    reply: "Lets just say I'm your NEW best friend. I was floating around and saw your ship get obliterated. Your old 'best friend'? Yeah, he's space-dust now. Hehehe!",
                    next: [
                        { 
                            text: "How am I even alive right now?", 
                            reply: "That's my little secret! I can pull a consciousness back from the brink of the void. Every time you 'die', I grab your essence and shove it into a fresh clone ship. It’s messy, and it costs a few gems, but hey, immortality isn’t free! Hehehe!",
                            next: [
                                { text: "We need to go back and help!", reply: "Noble, but stupid! You wouldn't last five seconds in a HUNK OF JUNK like this. There's a station nearby—let's get you fixed up before you explode for real. Hehehe!" }
                            ]
                        }
                    ]
                }
            ]
        }
    },
    'asteroid_init': {
        id: 'asteroid_init',
        title: "Target Practice",
        description: "Clear the nearby space of hazardous asteroids to ensure safe passage.",
        objectives: [
            { id: 'destroy_asteroids', type: 'destroy', target: 'asteroid', count: 3, current: 0 }
        ],
        rewards: { gems: 150, sci: 25 },
        completionMessage: "Great shooting! The sector is looking a bit safer already. I've transferred some gems and research data to your systems."
    },
    'region_uncharted_discovery': {
        id: 'region_uncharted_discovery',
        title: "Mapping the Unknown",
        description: "Discover 6 stellar objects within Uncharted Space.",
        category: 'region',
        regionId: 'Uncharted Space',
        objectives: [
            { id: 'discovery_count', type: 'reach', region: 'Uncharted Space', count: 6, current: 0 }
        ],
        rewards: { gems: 500, sci: 100 },
        completionMessage: "Incredible work! The cartographers are thrilled with this data. The rewards have been deposited to your account."
    },
    'region_imperial_shipyard_threat': {
        id: 'region_imperial_shipyard_threat',
        title: "Imperial Juggernauts",
        description: "Destroy 5 Imperial Dreadnoughts roaming the Imperial Shipyards.",
        category: 'region',
        regionId: 'Imperial Shipyards',
        objectives: [
            { id: 'destroy_dreadnoughts', type: 'destroy', target: 'dreadnought', count: 5, current: 0 }
        ],
        rewards: { gems: 1000, sci: 200 },
        completionMessage: "The threat to the outer sectors has been neutralized. The Imperial expansion has been halted, for now. Remarkable piloting, Commander!"
    },
    'region_badlands_scavenge': {
        id: 'region_badlands_scavenge',
        title: "Scrap Metal Run",
        description: "Collect 200 Gems from the debris-rich Badlands.",
        category: 'region',
        regionId: 'The Badlands',
        objectives: [
            { id: 'scavenge_gems', type: 'collect', target: 'gems', count: 200, current: 0 }
        ],
        rewards: { gems: 400, sci: 50 },
        completionMessage: "Good haul, pilot. Jax will be pleased with this scrap."
    },
    'region_blob_research': {
        id: 'region_blob_research',
        title: "Slime Samples",
        description: "Perform 3 successful science scans on structures in Blob Space.",
        category: 'region',
        regionId: 'Blob Space',
        objectives: [
            { id: 'blob_scans', type: 'science', target: 'Blob Space', count: 3, current: 0 }
        ],
        rewards: { gems: 300, sci: 150 },
        completionMessage: "Fascinating data! This will advance our understanding of the Blobs significantly."
    },
    'region_empire_recon': {
        id: 'region_empire_recon',
        title: "Behind Enemy Lines",
        description: "Infiltrate the Capital Planet of the Star Empire.",
        category: 'region',
        regionId: 'Star Empire',
        objectives: [
            { id: 'recon_capital', type: 'reach', target: 'planet_se_capital', count: 1, current: 0 }
        ],
        rewards: { gems: 600, sci: 100 },
        completionMessage: "Data received. You're lucky to have made it out of Imperial airspace alive."
    },
    'region_home_defense': {
        id: 'region_home_defense',
        title: "Defend the Homestead",
        description: "Destroy 10 Fighters in the Home Region.",
        category: 'region',
        regionId: 'Home Region',
        objectives: [
            { id: 'home_fighters', type: 'destroy', target: 'fighter', count: 10, current: 0 }
        ],
        rewards: { gems: 500, sci: 50 },
        completionMessage: "Threat neutralized. Thank you, Commander. The sector is safe again."
    },
    'region_robo_virus': {
        id: 'region_robo_virus',
        title: "Glitch in the Matrix",
        description: "Destroy 15 Robotic Drones in Robo Space.",
        category: 'region',
        regionId: 'Robo Space',
        objectives: [
            { id: 'robo_drones', type: 'destroy', target: 'fighter', count: 15, current: 0 }
        ],
        rewards: { gems: 700, sci: 100 },
        completionMessage: "Spread halted. Logic restored. Thank you, carbon-based lifeform."
    },
    'region_barrier_navigation': {
        id: 'region_barrier_navigation',
        title: "The Debris Run",
        description: "Discover 3 major structures hidden within the Great Barrier.",
        category: 'region',
        regionId: 'The Great Barrier',
        objectives: [
            { id: 'barrier_discoveries', type: 'reach', region: 'The Great Barrier', count: 3, current: 0 }
        ],
        rewards: { gems: 800, sci: 200 },
        completionMessage: "Excellent navigation. Those coordinates will be vital for future exploration."
    },
    'region_shallows_charge': {
        id: 'region_shallows_charge',
        title: "High Voltage",
        description: "Perform a science scan on a nebula in the Ionized Shallows.",
        category: 'region',
        regionId: 'The Ionized Shallows',
        objectives: [
            { id: 'shallows_scan', type: 'science', region: 'The Ionized Shallows', count: 1, current: 0 }
        ],
        rewards: { gems: 300, sci: 150 },
        completionMessage: "Shields calibrated! Those ion readings were off the charts."
    },
    'region_rust_salvage': {
        id: 'region_rust_salvage',
        title: "Industrial Salvage",
        description: "Discover 4 industrial artifacts in the Rust Belt.",
        category: 'region',
        regionId: 'The Rust Belt',
        objectives: [
            { id: 'rust_artifacts', type: 'reach', region: 'The Rust Belt', count: 4, current: 0 }
        ],
        rewards: { gems: 500, sci: 100 },
        completionMessage: "A fine collection of history. These will fetch a good price at the museum."
    },
    'region_verdant_biomass': {
        id: 'region_verdant_biomass',
        title: "Flora Hunter",
        description: "Scan the bioluminescent biomass in the Verdant Reach.",
        category: 'region',
        regionId: 'The Verdant Reach',
        objectives: [
            { id: 'verdant_scan', type: 'science', region: 'The Verdant Reach', count: 1, current: 0 }
        ],
        rewards: { gems: 200, sci: 200 },
        completionMessage: "Amazing! Their energy source is entirely different from anything we've seen."
    },
    'region_trade_escort': {
        id: 'region_trade_escort',
        title: "Commercial Hubs",
        description: "Visit 4 major Trade Stations in the Federation.",
        category: 'region',
        regionId: 'Trade Federation',
        objectives: [
            { id: 'trade_hubs', type: 'reach', region: 'Trade Federation', targetType: 'station', count: 4, current: 0 }
        ],
        rewards: { gems: 1000, sci: 100 },
        completionMessage: "Supply lines confirmed. The Federation thanks you for your diligence."
    },
    'region_spectral_ghosts': {
        id: 'region_spectral_ghosts',
        title: "Ghost in the Machine",
        description: "Destroy 3 Spectral Dreadnoughts in the Graveyard.",
        category: 'region',
        regionId: 'Spectral Graveyard',
        objectives: [
            { id: 'spectral_kills', type: 'destroy', region: 'Spectral Graveyard', target: 'dreadnought', count: 3, current: 0 }
        ],
        rewards: { gems: 1200, sci: 300 },
        completionMessage: "The silence returns. The ghosts of the lost fleet rest easy once more."
    },
    'region_frozen_ice': {
        id: 'region_frozen_ice',
        title: "Ice Breaker",
        description: "Destroy 50 Ice-coated Asteroids in the Frozen Expanse.",
        category: 'region',
        regionId: 'The Frozen Expanse',
        objectives: [
            { id: 'ice_asteroids', type: 'destroy', region: 'The Frozen Expanse', target: 'asteroid', count: 50, current: 0 }
        ],
        rewards: { gems: 400, sci: 50 },
        completionMessage: "Lanes are clear! The haulers can finally move through the expanse."
    },
    'region_veil_artifact': {
        id: 'region_veil_artifact',
        title: "Seeing Red",
        description: "Find the hidden Crimson Artifact within the Veil.",
        category: 'region',
        regionId: 'The Crimson Veil',
        objectives: [
            { id: 'veil_artifact', type: 'reach', region: 'The Crimson Veil', targetType: 'artifact', count: 1, current: 0 }
        ],
        rewards: { gems: 500, sci: 250 },
        completionMessage: "You found it! This relic is a piece of history from the first explorers."
    },
    'region_obsidian_echoes': {
        id: 'region_obsidian_echoes',
        title: "Echoes of the Obsidian",
        description: "Discover all major landmarks in the Obsidian Marches.",
        category: 'region',
        regionId: 'The Obsidian Marches',
        objectives: [
            { id: 'obsidian_discoveries', type: 'reach', region: 'The Obsidian Marches', count: 3, current: 0 }
        ],
        rewards: { gems: 500, sci: 150 },
        completionMessage: "The Obsidian Marches have been documented. The council acknowledges your persistence, explorer."
    }
};
