# Regional Quest Plan

This document outlines the special regional quests for each sector of the galaxy.

---

## ☄️ Uncharted Space
*Status: [ALREADY IMPLEMENTED]*
- **Quest ID**: `region_uncharted_discovery`
- **Title**: Mapping the Unknown
- **Description**: Discover 6 stellar objects within Uncharted Space.
- **Trigger**: Automatic Hail at Deep Space 2 (Neutral Space) after clearing parasites.
- **Objectives**: Discover 6 objects (Regional counter).
- **Rewards**: 500 Gems, 100 Science.

---

## 🏗️ Imperial Shipyards
*Status: [ALREADY IMPLEMENTED]*
- **Quest ID**: `region_imperial_shipyard_threat`
- **Title**: Imperial Juggernauts
- **Description**: Destroy 5 Imperial Dreadnoughts roaming the Imperial Shipyards.
- **Trigger**: Governor Vane at Planet Krystos (Frozen Expanse).
- **Objectives**: Destroy 5 Dreadnoughts.
- **Rewards**: 1000 Gems, 200 Science.

---

## 💀 The Badlands
- **Quest ID**: `region_badlands_scavenge`
- **Title**: Scrap Metal Run
- **Description**: Collect 200 Gems from the debris-rich Badlands.
- **Trigger NPC**: Scavenger Jax
- **Trigger Location**: Station DS1 (Neutral Space)
- **Trigger Dialogue**: "The Badlands is full of junk, but one man's trash is another man's profit. Bring me 200 gems from the scrap there, and I'll make it worth your while."
- **Objectives**: 
  - [ ] Type: `collect` | Target: `gems` | Count: 200
- **Rewards**: 400 Gems, 50 Science
- **Completion Message**: "Good haul, pilot. Here is your cut."

---

## 🟢 Blob Space
- **Quest ID**: `region_blob_research`
- **Title**: Slime Samples
- **Description**: Perform 3 successful science scans on structures in Blob Space.
- **Trigger NPC**: Dr. Aris
- **Trigger Location**: Planet Vulcan (Neutral Space)
- **Trigger Dialogue**: "The biological properties of the Blobs are fascinating. I need more data from their home sector. Perform three scans and bring the results back."
- **Objectives**: 
  - [ ] Type: `science` | Target: `Blob Space` | Count: 3
- **Rewards**: 300 Gems, 150 Science
- **Completion Message**: "Fascinating data! This will advance our understanding of the Blobs significantly."

---

## ⚔️ Star Empire
- **Quest ID**: `region_empire_recon`
- **Title**: Behind Enemy Lines
- **Description**: Infiltrate the Capital Planet of the Star Empire.
- **Trigger NPC**: Resistance Liaison
- **Trigger Location**: Station Frontier
- **Trigger Dialogue**: "We need eyes on the capital. Get close enough to the Capital Planet to ping their sensor grid, then get out of there."
- **Objectives**: 
  - [ ] Type: `reach` | Target: `planet_se_capital` | Count: 1
- **Rewards**: 600 Gems, 100 Science
- **Completion Message**: "Data received. You're lucky to have made it out alive."

---

## 🏠 Home Region
- **Quest ID**: `region_home_defense`
- **Title**: Defend the Homestead
- **Description**: Destroy 10 Fighters in the Home Region.
- **Trigger NPC**: Commodore Reed
- **Trigger Location**: Automated Message (Proximity to Home Region)
- **Trigger Dialogue**: "This is Commodore Reed. We are under ambush in the Home Region! All available pilots, eliminate the hostiles immediately!"
- **Objectives**: 
  - [ ] Type: `destroy` | Target: `fighter` | Count: 10
- **Rewards**: 500 Gems, 50 Science
- **Completion Message**: "Threat neutralized. Thank you, Commander. The sector is safe again."

---

## 🤖 Robo Space
- **Quest ID**: `region_robo_virus`
- **Title**: Glitch in the Matrix
- **Description**: Destroy 15 Robotic Drones in Robo Space.
- **Trigger NPC**: Unit 734
- **Trigger Location**: Deep Space 3 (Neutral Space)
- **Trigger Dialogue**: "My brethren have been infected with a logic virus. Decommission 15 drones in Robo Space to contain the spread."
- **Objectives**: 
  - [ ] Type: `destroy` | Target: `fighter` | Count: 15
- **Rewards**: 700 Gems, 100 Science
- **Completion Message**: "Spread halted. Logic restored. Thank you, carbon-based lifeform."

---

## 🚧 The Great Barrier
- **Quest ID**: `region_barrier_navigation`
- **Title**: The Debris Run
- **Description**: Discover the three major Derelict Stations hidden within the Great Barrier.
- **Trigger NPC**: Navigator Sol
- **Trigger Location**: Station Frontier
- **Trigger Dialogue**: "The Barrier is a graveyard of stations. Find the three largest ones and map their locations."
- **Objectives**: 
  - [ ] Type: `reach` | Target: `Great Barrier` | Count: 3
- **Rewards**: 800 Gems, 200 Science
- **Completion Message**: "Excellent navigation. Those stations will make good outposts."

---

## ⚡ The Ionized Shallows
- **Quest ID**: `region_shallows_charge`
- **Title**: High Voltage
- **Description**: Perform a science scan on the main Ion Cloud in the Shallows.
- **Trigger NPC**: Chief Engineer
- **Trigger Location**: Deep Space 1 (Neutral Space)
- **Trigger Dialogue**: "The ion clouds are surging. We need a reading from the center of the Shallows to calibrate our shields."
- **Objectives**: 
  - [ ] Type: `science` | Target: `nebula_shallows_1` | Count: 1
- **Rewards**: 300 Gems, 150 Science
- **Completion Message**: "Shields calibrated. That was close!"

---

## ⚙️ The Rust Belt
- **Quest ID**: `region_rust_salvage`
- **Title**: Industrial Salvage
- **Description**: Discover 4 industrial artifacts in the Rust Belt.
- **Trigger NPC**: Scrap King
- **Trigger Location**: Trade Federation Station
- **Trigger Dialogue**: "The Rust Belt is full of history. Find four unique artifacts from the old industrial days."
- **Objectives**: 
  - [ ] Type: `reach` | Target: `Rust Belt` | Count: 4
- **Rewards**: 500 Gems, 100 Science
- **Completion Message**: "A fine collection of history. These will fetch a good price."

---

## 🌿 The Verdant Reach
- **Quest ID**: `region_verdant_biomass`
- **Title**: Flora Hunter
- **Description**: Scan the Bioluminescent Nebula in the Verdant Reach.
- **Trigger NPC**: Botanist Lea
- **Trigger Location**: Planet Vulcan
- **Trigger Dialogue**: "The flora in the Reach is unique. Scan the bioluminescent nebula to see how they thrive in the void."
- **Objectives**: 
  - [ ] Type: `science` | Target: `nebula_verdant_1` | Count: 1
- **Rewards**: 200 Gems, 200 Science
- **Completion Message**: "Amazing! Their energy source is entirely different from anything we've seen."

---

## 💵 Trade Federation
- **Quest ID**: `region_trade_escort`
- **Title**: Commercial Hubs
- **Description**: Visit all 4 major Trade Stations in the Federation.
- **Trigger NPC**: Trade Minister
- **Trigger Location**: Trade Federation Capital
- **Trigger Dialogue**: "Efficiency is key. Visit all four of our major hubs to confirm our supply lines are clear."
- **Objectives**: 
  - [ ] Type: `reach` | Target: `Trade Federation` | Count: 4
- **Rewards**: 1000 Gems, 100 Science
- **Completion Message**: "Supply lines confirmed. The Federation thanks you for your diligence."

---

## 👻 Spectral Graveyard
- **Quest ID**: `region_spectral_ghosts`
- **Title**: Ghost in the Machine
- **Description**: Destroy 3 Spectral Dreadnoughts in the Graveyard.
- **Trigger NPC**: The Oracle
- **Trigger Location**: Mystery Artifact (Neutral Space)
- **Trigger Dialogue**: "The ghosts of the lost fleet are restless. Silence three of their largest echoes."
- **Objectives**: 
  - [ ] Type: `destroy` | Target: `dreadnought` | Count: 3
- **Rewards**: 1200 Gems, 300 Science
- **Completion Message**: "The silence returns. Rest easy, Commander."

---

## 🧊 The Frozen Expanse
- **Quest ID**: `region_frozen_ice`
- **Title**: Ice Breaker
- **Description**: Destroy 50 Ice-coated Asteroids in the Frozen Expanse.
- **Trigger NPC**: Miner Sam
- **Trigger Location**: Station DS2
- **Trigger Dialogue**: "The ice is thick out there. Clear out 50 of those frozen rocks so our haulers can get through."
- **Objectives**: 
  - [ ] Type: `destroy` | Target: `asteroid` | Count: 50
- **Rewards**: 400 Gems, 50 Science
- **Completion Message**: "Lanes are clear! Back to work for us."

---

## 🏮 The Crimson Veil
- **Quest ID**: `region_veil_artifact`
- **Title**: Seeing Red
- **Description**: Find the hidden Crimson Artifact within the Veil.
- **Trigger NPC**: Artifact Hunter Roy
- **Trigger Location**: Deep Space 1
- **Trigger Dialogue**: "There's a red artifact hidden deep inside the Veil. The sensor interference is high, so you'll have to fly close to find it."
- **Objectives**: 
  - [ ] Type: `reach` | Target: `artifact_crimson` | Count: 1
- **Rewards**: 500 Gems, 250 Science
- **Completion Message**: "You found it! This is a relic from the first explorers."
