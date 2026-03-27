export const NPC_MESSAGES = {
    neutral: [
        "Greetings, traveler.",
        "Nice ship you got there.",
        "Watch out for space pirates!",
        "May your engines run cool and your cargo bays be full.",
        "Just out here scanning for anomalies.",
        "The hyperspace lanes have been quiet lately.",
        "We're transmitting some localized navigation data.",
        "Stay clear of sector 4, pirate activity detected.",
        "Need any supplies? We're heading to the nearest station."
    ],
    station: [
        "Docking bays are open, commander.",
        "Welcome to the station. Please observe local laws.",
        "All systems nominal. Hull repair services available.",
        "Transmitting trade manifests. Have a look around.",
        "Good to see a friendly face out here."
    ],
    planet: [
        "Atmospheric entry vectors transmitted.",
        "Welcome to the colony.",
        "Sensors show clear skies today.",
        "We have rare gems for trade, if you have the credits.",
        "Watch your heat shielding on approach."
    ],
    hostile: [ // for potential future use or if we add hostile comms later
        "Drop your cargo and prepare to be boarded!",
        "You've wandered into the wrong sector.",
        "Target lock acquired."
    ]
};

export const HAIL_MESSAGES = {
    liberation: [
        {
            text: "Commander, thank you for destroying that parasite! Our people are free. We were trapped under its suppression field for cycles.",
            options: [
                { text: "Just doing my job. Stay safe out there.", reply: "We won't forget this. Good luck, Commander.", reward: 50 },
                { text: "I expect some compensation for my trouble.", reply: "Of course. We've transferred some gems to your ship systems.", reward: 150 }
            ]
        },
        {
            text: "Sensors show the oppressor orb has detonated! We've regained control of our orbit. You have our eternal gratitude.",
            options: [
                { text: "Glad I could help. The sector is safer now.", reply: "We're transmitting some recovered navigational data to your log.", reward: 75 },
                { text: "Don't let your guard down, there are more out there.", reply: "Understood. Our defense grids are coming back online as we speak.", reward: 100 }
            ]
        }
    ]
};

export const SPECIFIC_HAILS = {
    'station_ds1': {
        text: "This is Deep Space 1. We thought we were done for when that blob showed up. Thank you, Commander.",
        options: [
            { text: "Happy to help.", reply: "Transferring a reward to your account.", reward: 100 },
            { text: "Stay safe out here.", reply: "We will try. The frontier is a dangerous place.", reward: 50 }
        ]
    },
    'station_ds2': {
        text: "Deep Space 2 operations restored. We thought we were done for! Would you be willing to help us map the surrounding Uncharted Space? Our cartography sensors are finally back online.",
        options: [
            { 
                text: "I'll map it out.", 
                reply: "Excellent! Your nav computer objectives have been updated with the targeted signatures. Good luck out there!",
                action: (game) => game.questManager.acceptQuest('region_uncharted_discovery')
            },
            { text: "Maybe later.", reply: "We'll be here when you're ready. Safe travels.", reward: 50 }
        ]
    },
    'station_ds3': {
        text: "Deep Space 3 here. The suppression field has fallen! We owe you our lives.",
        options: [
            { text: "The sector is clear.", reply: "We've sent some gems to your ship systems.", reward: 125 },
            { text: "Be careful next time.", reply: "We'll bolster our defenses immediately.", reward: 75 }
        ]
    },
    'home_region_ambush': {
        sender: "COMMODORE REED",
        text: "Attention all pilots! This is Commodore Reed. We are under ambush in the Home Region! Eliminate 10 enemy fighters to secure the sector.",
        options: [
            { 
                text: "Reporting for duty.", 
                reply: "Good. Engage those ships immediately. Good luck!",
                action: (game) => game.questManager.acceptQuest('region_home_defense')
            },
            { text: "I'm just passing through.", reply: "Understood. Watch your six out there." }
        ]
    }
};
