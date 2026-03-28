export const NPC_ROSTER = {
    // --- DEEP SPACE 1 (0, 3) ---
    'cmd_ds1': {
        name: "Cmdr. Vahl",
        locationId: 'station_ds1',
        role: "Station Commander",
        dialogues: [
            {
                condition: (game) => !game.questManager.isQuestCompletedOrActive('region_obsidian_echoes'),
                text: "The Obsidian Marches have always been a dark spot on our charts. If you're looking for work, help us map focusing on those black corridors.",
                options: [
                    { 
                        text: "I'll map them.", 
                        reply: "Good. Bring back data on any landmarks you find. Be careful—it's easy to get lost in the shadows.",
                        action: (game) => game.questManager.acceptQuest('region_obsidian_echoes')
                    },
                    { text: "Maybe later.", reply: "Stay safe out there." }
                ]
            },
            {
                condition: () => true,
                text: "Stay sharp, pilot. The Marches aren't friendly to the unprepared.",
                options: [{ text: "Understood.", reply: "Safe travels." }]
            }
        ]
    },
    'sci_ds1': {
        name: "Researcher Aris",
        locationId: 'station_ds1',
        role: "Science Officer",
        dialogues: [
            {
                condition: () => true,
                text: "The Badlands region is far to the South-West of here. It's a localized chaos of asteroids and debris.",
                options: [{ text: "Thanks for the hint.", reply: "Always happy to assist a fellow explorer." }]
            }
        ]
    },

    // --- DEEP SPACE 2 (3, 6) ---
    'cpt_yates': {
        name: "Cmdr. Yates",
        locationId: 'station_ds2',
        role: "Station Commander",
        dialogues: [
            {
                condition: (game) => !game.questManager.isQuestCompletedOrActive('region_uncharted_discovery'),
                text: "Are you ready to help us map Uncharted Space? We need someone with a fast ship and a sharp eye.",
                options: [
                    { 
                        text: "I'm ready now.", 
                        reply: "Excellent! Good luck out there, Commander.",
                        action: (game) => game.questManager.acceptQuest('region_uncharted_discovery')
                    },
                    { text: "Still busy.", reply: "Understood. The frontier waits for no one." }
                ]
            },
            {
                condition: () => true,
                text: "Mapping the void is a noble pursuit. Let me know what you find.",
                options: [{ text: "Will do.", reply: "Safe journeys." }]
            }
        ]
    },
    'sci_ds2': {
        name: "Navist Sol",
        locationId: 'station_ds2',
        role: "Navigation Officer",
        dialogues: [
            {
                condition: () => true,
                text: "If you're looking for the Trade Federation hubs, head due East. You'll see the cargo traffic picking up soon.",
                options: [{ text: "East, got it.", reply: "May your flight be smooth." }]
            }
        ]
    },

    // --- DEEP SPACE 3 (1, 10) ---
    'cmd_ds3': {
        name: "Cmdr. Krell",
        locationId: 'station_ds3',
        role: "Station Commander",
        dialogues: [
            {
                condition: (game) => !game.questManager.isQuestCompletedOrActive('region_spectral_ghosts'),
                text: "There are... echoes in the Spectral Graveyard that shouldn't be there. We need those ghosts silenced.",
                options: [
                    { 
                        text: "I'll do it.", 
                        reply: "Good. Don't listen to the whispers. Just focus on your targets.",
                        action: (game) => game.questManager.acceptQuest('region_spectral_ghosts')
                    },
                    { text: "Sounds spooky.", reply: "It is. Come back when you've found your courage." }
                ]
            },
            {
                condition: () => true,
                text: "The graveyard is no place for the faint of heart.",
                options: [{ text: "I'm aware.", reply: "Then carry on." }]
            }
        ]
    },
    'sci_ds3': {
        name: "Eng. Tark",
        locationId: 'station_ds3',
        role: "Maintenance Lead",
        dialogues: [
            {
                condition: () => true,
                text: "The Spectral Graveyard is directly North of here. If your sensors start acting up, you're getting close.",
                options: [{ text: "Thanks, Tark.", reply: "Don't mention it. Keep those shields up." }]
            }
        ]
    },

    // --- DEEP SPACE 4 (4.5, 3.5) ---
    'cmd_ds4': {
        name: "Cmdr. Elara",
        locationId: 'station_ds4',
        role: "Sector Warden",
        dialogues: [
            {
                condition: (game) => !game.questManager.isQuestCompletedOrActive('region_verdant_biomass'),
                text: "The Verdant Reach is a biological wonder, but its biomass is getting out of control. We need a scan of the central nebula.",
                options: [
                    { 
                        text: "I'll scan it.", 
                        reply: "Watch out for the spores—they tend to clog the filters. Appreciate the help.",
                        action: (game) => game.questManager.acceptQuest('region_verdant_biomass')
                    },
                    { text: "My filters are clean.", reply: "Suit yourself. It's a beautiful sight, though." }
                ]
            },
            {
                condition: () => true,
                text: "The Reach is beautiful, but it's still space. Don't drop your guard.",
                options: [{ text: "Copy that.", reply: "Safe flight." }]
            }
        ]
    },
    'sci_ds4': {
        name: "Sci-Officer Lex",
        locationId: 'station_ds4',
        role: "Botany Expert",
        dialogues: [
            {
                condition: () => true,
                text: "The Verdant Reach is to the South-East. Just look for where the space starts looking like a giant garden.",
                options: [{ text: "A garden in space?", reply: "You'll see what I mean. It's quite the sight." }]
            }
        ]
    },

    // --- DEEP SPACE 4 ALT (-5, 8) ---
    'cmd_ds4_alt': {
        name: "Cmdr. Frost",
        locationId: 'station_ds4_alt',
        role: "Northern Commander",
        dialogues: [
            {
                condition: (game) => !game.questManager.isQuestCompletedOrActive('region_imperial_shipyard_threat'),
                text: "The Empire is massing Juggernauts in the shipyards to our North. We need those facilities disrupted.",
                options: [
                    { 
                        text: "I'll handle it.", 
                        reply: "A bold decision! Be careful, those ships are heavily armed.",
                        action: (game) => game.questManager.acceptQuest('region_imperial_shipyard_threat')
                    },
                    { text: "Too dangerous.", reply: "Understood. The chill here is better than Imperial fire." }
                ]
            },
            {
                condition: () => true,
                text: "The North is cold and unforgiving. Much like the Empire.",
                options: [{ text: "Staying warm.", reply: "Good." }]
            }
        ]
    },
    'sci_ds4_alt': {
        name: "Dr. Hek",
        locationId: 'station_ds4_alt',
        role: "Glaciologist",
        dialogues: [
            {
                condition: () => true,
                text: "The Imperial Shipyards are due North. If you see massive hulls blocking out the stars, you're there.",
                options: [{ text: "Duly noted.", reply: "Safe travels through the ice." }]
            }
        ]
    },

    // --- DEEP SPACE 5 (-8, -3) ---
    'cmd_ds5': {
        name: "Cmdr. Jax",
        locationId: 'station_ds5',
        role: "Frontier Marshal",
        dialogues: [
            {
                condition: (game) => !game.questManager.isQuestCompletedOrActive('region_badlands_scavenge'),
                text: "The Badlands are full of scrap that should belong to us. Bring me 200 gems from there.",
                options: [
                    { 
                        text: "I'll scavenge it.", 
                        reply: "Good. Watch out for the asteroids—they're the real 'law' out there.",
                        action: (game) => game.questManager.acceptQuest('region_badlands_scavenge')
                    },
                    { text: "Not today.", reply: "Suit yourself. Someone else will get the profit." }
                ]
            },
            {
                condition: () => true,
                text: "The law doesn't extend far into the Badlands. Keep your eyes open.",
                options: [{ text: "Will do.", reply: "Good luck." }]
            }
        ]
    },
    'sci_ds5': {
        name: "Nav-Officer Rin",
        locationId: 'station_ds5',
        role: "Scout Hub",
        dialogues: [
            {
                condition: () => true,
                text: "The Obsidian Marches start just to the West. It's a shadow corridor that most pilots avoid.",
                options: [{ text: "The West, okay.", reply: "Better you than me, pilot." }]
            }
        ]
    },

    // --- DEEP SPACE 6 (-4, -14) ---
    'cmd_ds6': {
        name: "Cmdr. Unit 9",
        locationId: 'station_ds6',
        role: "Station Overseer",
        dialogues: [
            {
                condition: (game) => !game.questManager.isQuestCompletedOrActive('region_robo_virus'),
                text: "Robo Space is undergoing a logic corruption. We need 15 drone units decommissioned to stop the spread.",
                options: [
                    { 
                        text: "Initializing cleanup.", 
                        reply: "Efficiency acknowledged. Procedural cleanup authorized.",
                        action: (game) => game.questManager.acceptQuest('region_robo_virus')
                    },
                    { text: "Standby.", reply: "Waiting for external input." }
                ]
            },
            {
                condition: () => true,
                text: "Logic is the only universal constant. Except in Robo Space.",
                options: [{ text: "Fascinating.", reply: "Carry on." }]
            }
        ]
    },
    'sci_ds6': {
        name: "Sci-Officer Bit",
        locationId: 'station_ds6',
        role: "Logic Analyst",
        dialogues: [
            {
                condition: () => true,
                text: "If you head East, you'll encounter the Great Barrier. It's a wall of debris that tests even the best sensors.",
                options: [{ text: "East for the Barrier.", reply: "Calculation correct. Stay safe." }]
            }
        ]
    },

    // --- DEEP SPACE 7 (11, -3) ---
    'cmd_ds7': {
        name: "Cmdr. Thorne",
        locationId: 'station_ds7',
        role: "Industrial Guard",
        dialogues: [
            {
                condition: (game) => !game.questManager.isQuestCompletedOrActive('region_rust_salvage'),
                text: "The Rust Belt is an industrial graveyard. We need four unique artifacts recovered from the debris.",
                options: [
                    { 
                        text: "I'll hunt them down.", 
                        reply: "Good. One man's rust is another's gold! Keep 'em coming.",
                        action: (game) => game.questManager.acceptQuest('region_rust_salvage')
                    },
                    { text: "My hold is full.", reply: "Then clear it out and come back!" }
                ]
            },
            {
                condition: () => true,
                text: "There's a lot of history in that rust. Try not to break anything.",
                options: [{ text: "Promise.", reply: "We'll see." }]
            }
        ]
    },
    'sci_ds7': {
        name: "Eng. Rust",
        locationId: 'station_ds7',
        role: "Salvage Specialist",
        dialogues: [
            {
                condition: () => true,
                text: "The Rust Belt is to the West. Just follow the trail of orange dust and broken machinery.",
                options: [{ text: "West for the Rust.", reply: "Exactly. It's hard to miss." }]
            }
        ]
    },

    // --- DEEP SPACE 8 (4, -3) ---
    'cmd_ds8': {
        name: "Cmdr. Orion",
        locationId: 'station_ds8',
        role: "Customs Chief",
        dialogues: [
            {
                condition: (game) => !game.questManager.isQuestCompletedOrActive('region_shallows_charge'),
                text: "The Ionized Shallows are surging. Scan a nebula in that region so we can calibrate our shields.",
                options: [
                    { 
                        text: "I'll scan it.", 
                        reply: "Careful with your electronics out there. Thanks, Commander.",
                        action: (game) => game.questManager.acceptQuest('region_shallows_charge')
                    },
                    { text: "I'm not equipped.", reply: "Come back when your sensors are ready." }
                ]
            },
            {
                condition: () => true,
                text: "The Shallows can fry your circuits if you're not careful.",
                options: [{ text: "Noted.", reply: "Safe journeys." }]
            }
        ]
    },
    'sci_ds8': {
        name: "Dr. Spark",
        locationId: 'station_ds8',
        role: "Ion Physicist",
        dialogues: [
            {
                condition: () => true,
                text: "The Ionized Shallows are to our West. Keep a close eye on your sensor grid—things get fuzzy in there.",
                options: [{ text: "West for the Shallows.", reply: "Correct. Good luck with the static!" }]
            }
        ]
    },

    // --- DEEP SPACE 9 (13, -7) ---
    'cmd_ds9': {
        name: "Cmdr. Sisko",
        locationId: 'station_ds9',
        role: "Frontier Marshal",
        dialogues: [
            {
                condition: (game) => !game.questManager.isQuestCompletedOrActive('region_blob_research'),
                text: "The Blobs in the South-West are getting restless. We need more scan data from their structures.",
                options: [
                    { 
                        text: "I'll get it.", 
                        reply: "Good. Your data helps keep this whole sector safe.",
                        action: (game) => game.questManager.acceptQuest('region_blob_research')
                    },
                    { text: "I'm busy.", reply: "The frontier never stops, Marshall." }
                ]
            },
            {
                condition: () => true,
                text: "The Blobs are a threat to every living thing. Remember that.",
                options: [{ text: "I will.", reply: "Dismissed." }]
            }
        ]
    },
    'sci_ds9': {
        name: "Sci-Officer Odo",
        locationId: 'station_ds9',
        role: "Surveillance Lead",
        dialogues: [
            {
                condition: () => true,
                text: "Blob Space is to the South-West. That neon-green hue on the horizon is the only beacon you'll get.",
                options: [{ text: "South-West. Thanks.", reply: "Hmph. Just stay out of trouble." }]
            }
        ]
    },

    // --- DEEP SPACE 10 (ex-S5) (-8, 13) ---
    'cmd_ds10': {
        name: "Cmdr. Zark",
        locationId: 'station_se_5',
        role: "Military Provost",
        dialogues: [
            {
                condition: (game) => !game.questManager.isQuestCompletedOrActive('region_empire_recon'),
                text: "The High Command needs a ping from the Capital Planet in the West. It's a dangerous mission, but the pay is good.",
                options: [
                    { 
                        text: "I'll do it.", 
                        reply: "Brave or foolish, I care not. Just get the data.",
                        action: (game) => game.questManager.acceptQuest('region_empire_recon')
                    },
                    { text: "Pass.", reply: "Then move along." }
                ]
            },
            {
                condition: () => true,
                text: "Glory to the Empire. Or whatever you mercenaries believe in.",
                options: [{ text: "Mercenary work pays.", reply: "Indeed." }]
            }
        ]
    },
    'sci_ds10': {
        name: "Intel-Officer Kira",
        locationId: 'station_se_5',
        role: "Infiltration Expert",
        dialogues: [
            {
                condition: () => true,
                text: "The Star Empire Capital is due West. If you see more dreadnoughts than stars, you've found it.",
                options: [{ text: "West for the Capital.", reply: "Good luck. You'll need it." }]
            }
        ]
    },

    // --- DEEP SPACE 11 (ex-S3) (8, -14) ---
    'cmd_ds11': {
        name: "Cmdr. Gloop",
        locationId: 'station_blob_3',
        role: "Slime Warden",
        dialogues: [
            {
                condition: (game) => !game.questManager.isQuestCompletedOrActive('region_barrier_navigation'),
                text: "The Great Barrier is a graveyard of dreams. We need three major structures located to secure the lane.",
                options: [
                    { 
                        text: "I'll find them.", 
                        reply: "Appreciate it. Don't let the debris crush you on the way.",
                        action: (game) => game.questManager.acceptQuest('region_barrier_navigation')
                    },
                    { text: "No thanks.", reply: "Wise. Most don't come back." }
                ]
            },
            {
                condition: () => true,
                text: "The Barrier swallows everything eventually.",
                options: [{ text: "I'll be careful.", reply: "See that you are." }]
            }
        ]
    },
    'sci_ds11': {
        name: "Dr. Slime",
        locationId: 'station_blob_3',
        role: "Anomaly Researcher",
        dialogues: [
            {
                condition: () => true,
                text: "The Great Barrier is to our West. It's a literal wall of ancient industrial salvage and cosmic dust.",
                options: [{ text: "West for the Barrier.", reply: "Stay safe. It's thick in there." }]
            }
        ]
    },

    // --- REMAINING NPC'S ---
    'gov_vane': {
        name: "Governor Vane",
        locationId: 'planet_glacier',
        role: "Planetary Governor",
        dialogues: [
            {
                condition: () => true,
                text: "The ice on Krystos is miles deep, but it's nothing compared to the cold steel of the Imperial Fleet.",
                options: [{ text: "I'll be careful.", reply: "See that you are, Commander." }]
            }
        ]
    },
    'dr_aris': {
        name: "Dr. Aris",
        locationId: 'planet_vulcan',
        role: "Xenobiologist",
        dialogues: [
            {
                condition: () => true,
                text: "The biological properties of the Blobs are fascinating. Their evolution is... aggressive.",
                options: [{ text: "Stay safe, Doctor.", reply: "Science is my shield." }]
            }
        ]
    },
    'resistance_liaison': {
        name: "Resistance Liaison",
        locationId: 'station_frontier',
        role: "Intelligence Officer",
        dialogues: [
            {
                condition: () => true,
                text: "The Frontier is the only place left that hasn't bowed to the Empire. Keep it that way.",
                options: [{ text: "I will.", reply: "Good." }]
            }
        ]
    },
    'navigator_sol': {
        name: "Navigator Sol",
        locationId: 'station_frontier',
        role: "Lead Cartographer",
        dialogues: [
            {
                condition: () => true,
                text: "The galaxy is vast, but with a good map, no one is truly lost.",
                options: [{ text: "Wise words.", reply: "Carry on." }]
            }
        ]
    },
    'botanist_lea': {
        name: "Botanist Lea",
        locationId: 'planet_vulcan',
        role: "Astro-Biologist",
        dialogues: [
            {
                condition: () => true,
                text: "Even on a molten world, life finds a way. It's beautiful, isn't it?",
                options: [{ text: "In its own way.", reply: "I agree." }]
            }
        ]
    }
};

export function getGenericShipContact() {
    return {
        name: "Trader Captain",
        role: "Freelance Hauler",
        dialogues: [
            {
                condition: () => true,
                text: "Just out here scanning for anomalies and hauling cargo. The hyperspace lanes have been quiet lately.",
                options: [
                    { text: "Have you seen any pirates?", reply: "Stay clear of Sector 4. Hostile activity detected." },
                    { text: "Good luck out there.", reply: "May your engines run cool, Commander." }
                ]
            }
        ]
    };
}
