export const NPC_ROSTER = {
    'cpt_yates': {
        name: "Captain Yates",
        locationId: 'station_ds2',
        role: "Station Commander",
        dialogues: [
            {
                condition: (game) => !game.questManager.completedQuestIds.has('region_uncharted_discovery') && 
                                     !game.questManager.activeQuests.find(q => q.id === 'region_uncharted_discovery'),
                text: "Thank you again for clearing those oppressors out. Are you ready to help us map Uncharted Space?",
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
                condition: (game) => game.sectorManager.discoveredIds.has('planet_vulcan'),
                text: "I heard you found Vulcan, good job! I hope the heat shielding on your ship held up.",
                options: [
                    { text: "It was getting pretty hot out there.", reply: "I bet! Well, safe travels, Commander." },
                    { text: "No problem at all.", reply: "Glad to hear it. Stop by anytime." }
                ]
            },
            {
                condition: () => true,
                text: "I heard there is a planet called Vulcan somewhere around here, near coordinate [2,2]. Let me know if you find it.",
                options: [
                    { text: "I'll keep an eye out.", reply: "Thanks. It's supposed to be a hostile environment." },
                    { text: "I've got my own mission right now.", reply: "Understood. The frontier is vast." }
                ]
            }
        ]
    },
    'dr_arisa': {
        name: "Dr. Arisa",
        locationId: 'station_ds1',
        role: "Chief Researcher",
        dialogues: [
            {
                condition: (game) => game.sectorManager.discoveredIds.has('nebula_johnson'),
                text: "Ah, the readings from Johnson's Nebula you sent are fascinating. The ionized gas composition is unlike anything we've seen.",
                options: [
                    { text: "Glad the data is useful.", reply: "Incredibly useful! We might find a new energy source." },
                    { text: "That place gives me the creeps.", reply: "Science is often unsettling at first. Safe journeys." }
                ]
            },
            {
                condition: () => true,
                text: "We're currently studying anomalous energy readings from somewhere in the deep sectors. We think it might be a Nebula.",
                options: [
                    { text: "I'll let you know if I see one.", reply: "Please do! The data would be invaluable." },
                    { text: "Sounds dangerous.", reply: "Discovery often is, sadly. Stay safe out there." }
                ]
            }
        ]
    },
    'eng_tark': {
        name: "Engineer Tark",
        locationId: 'station_ds3',
        role: "Head Mechanic",
        dialogues: [
            {
                condition: (game) => game.player.totalGemsCollected >= 500,
                text: "Looks like you've been busy! With that many gems, you should be able to upgrade your ship nicely. You can hit [ESC] to check your systems.",
                options: [
                    { text: "Thanks for the tip.", reply: "Anytime. Keep those engines running hot!" },
                    { text: "I prefer to hoard them.", reply: "Haha, suit yourself! Let me know if you need repairs." }
                ]
            },
            {
                condition: () => true,
                text: "Welcome to Deep Space 3. If you find enough gems out there, remember you can upgrade your ship using your onboard terminal [ESC].",
                options: [
                    { text: "I'll keep that in mind.", reply: "Good luck out there." },
                    { text: "My ship is fine as is.", reply: "Suit yourself! But the frontier doesn't forgive mistakes." }
                ]
            }
        ]
    },
    'gov_vane': {
        name: "Governor Vane",
        locationId: 'planet_glacier',
        role: "Planetary Governor",
        dialogues: [
            {
                condition: (game) => !game.questManager.completedQuestIds.has('region_imperial_shipyard_threat') && 
                                     !game.questManager.activeQuests.find(q => q.id === 'region_imperial_shipyard_threat'),
                text: "Welcome to Krystos. You seem like a skilled pilot. To the north, in the Imperial Shipyards, they are mass-producing massive Juggernauts. They're a threat to us all. If you could take out 5 of them, it would go a long way towards ensuring our safety.",
                options: [
                    { 
                        text: "I'll handle it.", 
                        reply: "A bold decision! Be careful, those ships are heavily armed. May the stars guide your aim.",
                        action: (game) => game.questManager.acceptQuest('region_imperial_shipyard_threat')
                    },
                    { text: "Too dangerous for me.", reply: "Understandable. Stay safe in your travels." }
                ]
            },
            {
                condition: () => true,
                text: "The ice on Krystos is miles deep, but it's nothing compared to the cold steel of the Imperial Fleet to our north.",
                options: [
                    { text: "I'll be careful.", reply: "See that you are, Commander." }
                ]
            }
        ]
    },
    'scavenger_jax': {
        name: "Scavenger Jax",
        locationId: 'station_ds1',
        role: "Freelance Scavenger",
        dialogues: [
            {
                condition: (game) => !game.questManager.completedQuestIds.has('region_badlands_scavenge') && 
                                     !game.questManager.activeQuests.find(q => q.id === 'region_badlands_scavenge'),
                text: "The Badlands is full of junk, but one man's trash is another man's profit. Bring me 200 gems from the scrap there, and I'll make it worth your while.",
                options: [
                    { 
                        text: "I'll scavenge it.", 
                        reply: "Good. Watch out for the asteroids—they aren't friendly. Bring the gems back here when you're done.",
                        action: (game) => game.questManager.acceptQuest('region_badlands_scavenge')
                    },
                    { text: "Not interested.", reply: "Suit yourself. More scrap for me." }
                ]
            }
        ]
    },
    'dr_aris': {
        name: "Dr. Aris",
        locationId: 'planet_vulcan',
        role: "Xenobiologist",
        dialogues: [
            {
                condition: (game) => !game.questManager.completedQuestIds.has('region_blob_research') && 
                                     !game.questManager.activeQuests.find(q => q.id === 'region_blob_research'),
                text: "The biological properties of the Blobs are fascinating. I need more data from their home sector. Perform three scans on their structures and bring the results back.",
                options: [
                    { 
                        text: "I'll get the data.", 
                        reply: "Excellent! Your contribution to science will not be forgotten.",
                        action: (game) => game.questManager.acceptQuest('region_blob_research')
                    },
                    { text: "Stay safe, Doctor.", reply: "Always. Discovery is its own reward." }
                ]
            }
        ]
    },
    'resistance_liaison': {
        name: "Resistance Liaison",
        locationId: 'station_frontier',
        role: "Intelligence Officer",
        dialogues: [
            {
                condition: (game) => !game.questManager.completedQuestIds.has('region_empire_recon') && 
                                     !game.questManager.activeQuests.find(q => q.id === 'region_empire_recon'),
                text: "We need eyes on the capital. Get close enough to the Star Empire Capital Planet to ping their sensor grid, then get out of there.",
                options: [
                    { 
                        text: "I'll do it.", 
                        reply: "Good. Don't let their patrols spot you. Good luck, pilot.",
                        action: (game) => game.questManager.acceptQuest('region_empire_recon')
                    },
                    { text: "Too risky.", reply: "We understand. We'll find someone else." }
                ]
            }
        ]
    },
    'unit_734': {
        name: "Unit 734",
        locationId: 'station_ds3',
        role: "Automated Envoy",
        dialogues: [
            {
                condition: (game) => !game.questManager.completedQuestIds.has('region_robo_virus') && 
                                     !game.questManager.activeQuests.find(q => q.id === 'region_robo_virus'),
                text: "My brethren have been infected with a logic virus. Decommission 15 drones in Robo Space to contain the spread.",
                options: [
                    { 
                        text: "Initializing cleanup.", 
                        reply: "Efficiency acknowledged. Procedural cleanup authorized.",
                        action: (game) => game.questManager.acceptQuest('region_robo_virus')
                    },
                    { text: "Standby.", reply: "Waiting for external input." }
                ]
            }
        ]
    },
    'navigator_sol': {
        name: "Navigator Sol",
        locationId: 'station_frontier',
        role: "Lead Cartographer",
        dialogues: [
            {
                condition: (game) => !game.questManager.completedQuestIds.has('region_barrier_navigation') && 
                                     !game.questManager.activeQuests.find(q => q.id === 'region_barrier_navigation'),
                text: "The Barrier is a graveyard of ancient stations. If you can find three of the major structures hidden within that field, it would help us map the region safely.",
                options: [
                    { 
                        text: "I'll find them.", 
                        reply: "Keep your sensors sharp. The debris field is treacherous.",
                        action: (game) => game.questManager.acceptQuest('region_barrier_navigation')
                    },
                    { text: "Maybe later.", reply: "Understood. The stars aren't going anywhere." }
                ]
            }
        ]
    },
    'chief_engineer': {
        name: "Chief Engineer",
        locationId: 'station_ds1',
        role: "Grid Overseer",
        dialogues: [
            {
                condition: (game) => !game.questManager.completedQuestIds.has('region_shallows_charge') && 
                                     !game.questManager.activeQuests.find(q => q.id === 'region_shallows_charge'),
                text: "The ion clouds in the Shallows are surging. We need a reading from a nebula in that region to calibrate our local power grid.",
                options: [
                    { 
                        text: "I'll get a scan.", 
                        reply: "Careful with your electronics out there. Thanks, Commander.",
                        action: (game) => game.questManager.acceptQuest('region_shallows_charge')
                    },
                    { text: "I've got other work.", reply: "Let us know if your schedule clears up." }
                ]
            }
        ]
    },
    'scrap_king': {
        name: "The Scrap King",
        locationId: 'station_ds2',
        role: "Junk Dealer",
        dialogues: [
            {
                condition: (game) => !game.questManager.completedQuestIds.has('region_rust_salvage') && 
                                     !game.questManager.activeQuests.find(q => q.id === 'region_rust_salvage'),
                text: "The Rust Belt is full of industrial history. Find four unique artifacts from the old days, and I'll trade you some prime gear for 'em.",
                options: [
                    { 
                        text: "I'm on it.", 
                        reply: "One man's rust is another man's gold! Bring 'em back to me.",
                        action: (game) => game.questManager.acceptQuest('region_rust_salvage')
                    },
                    { text: "Keep your junk.", reply: "Suit yourself. You're missing out!" }
                ]
            }
        ]
    },
    'botanist_lea': {
        name: "Botanist Lea",
        locationId: 'planet_vulcan',
        role: "Astro-Biologist",
        dialogues: [
            {
                condition: (game) => !game.questManager.completedQuestIds.has('region_verdant_biomass') && 
                                     !game.questManager.activeQuests.find(q => q.id === 'region_verdant_biomass'),
                text: "The flora in the Reach is bioluminescent! Scan the nebula there so I can study their energy signatures.",
                options: [
                    { 
                        text: "I'll scan it.", 
                        reply: "Thank you! I can't wait to see those results.",
                        action: (game) => game.questManager.acceptQuest('region_verdant_biomass')
                    },
                    { text: "Not today.", reply: "I understand. Nature is patient." }
                ]
            }
        ]
    },
    'miner_sam': {
        name: "Miner Sam",
        locationId: 'station_ds2',
        role: "Ice Miner",
        dialogues: [
            {
                condition: (game) => !game.questManager.completedQuestIds.has('region_frozen_ice') && 
                                     !game.questManager.activeQuests.find(q => q.id === 'region_frozen_ice'),
                text: "The ice is thick out in the Expanse. Clear out 50 of those frozen asteroids so my boys can get the haulers through.",
                options: [
                    { 
                        text: "Clear the way.", 
                        reply: "Good on ya! Better you than me out there.",
                        action: (game) => game.questManager.acceptQuest('region_frozen_ice')
                    },
                    { text: "I'm busy.", reply: "Fair enough. Watch out for those drift-rocks." }
                ]
            }
        ]
    },
    'roy_hunter': {
        name: "Artifact Roy",
        locationId: 'station_ds1',
        role: "Treasure Hunter",
        dialogues: [
            {
                condition: (game) => !game.questManager.completedQuestIds.has('region_veil_artifact') && 
                                     !game.questManager.activeQuests.find(q => q.id === 'region_veil_artifact'),
                text: "There's a red artifact hidden deep inside the Crimson Veil. Sensor interference is nuts in there, so you'll have to basically bump into it.",
                options: [
                    { 
                        text: "I'll find it.", 
                        reply: "If you find it, it's a piece of history! Happy hunting.",
                        action: (game) => game.questManager.acceptQuest('region_veil_artifact')
                    },
                    { text: "Sounds like a ghost chase.", reply: "Maybe. But the reward is real!" }
                ]
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
