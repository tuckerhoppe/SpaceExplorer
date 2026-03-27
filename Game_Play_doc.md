# Game Play Doc

The player is in space and has a ship that flies around, shoots asteroids, and explores space.

---

## 1. Narrative & Tutorial
The game begins with a narrative-driven tutorial set in the **Home Region**.

### The Backstory
- **Space Ranger Brothers**: The player and their brother are practicing for the "Space Ranger Exam." The brother flies ahead in his own ship, providing guidance and dialogue during the flight, combat, and science training phases.
- **The Ambush**: After completing the initial training, the player returns to the home planet only to be ambushed by an **Imperial Invasion**.
- **Transformation**: The player's ship is destroyed in the ambush. Upon "respawning" with half health, the player is under the guidance of an invisible **Ghost Companion** (their "new best friend"). The player receives a new objective to find the frontier station. The brother is missing or presumed lost to the Empire.

### Tutorial Flow
1.  **Flight Training**: Basic movement (W, A, D).
2.  **Weapons Practice**: Destroying 5 asteroids to calibrate lasers.
3.  **Scientific Research**: Docking at a Training Nebula to perform a science check.
4.  **Engine Overdrive**: Using the Boost Engine (TAB to toggle, hold W).
5.  **The Return/Ambush**: Reaching the home planet and surviving the Imperial ambush.

---

## 2. Core Gameplay
The player explores an infinite-feeling procedural space divided into distinct coordinate-based regions.

### Key Features
- **Exploration**: Discover regions and stellar objects (planets, nebulas, stars, stations, artifacts) to earn gems and science points.
- **Combat**: Shoot asteroids for gems, fight off hostile fighters and battleships, and destroy **Parasites** (giant space-worms) or **Oppressors** (enemy stations) controlling stellar objects.
- **Death Penalty**: Upon dying, players lose half of their currently accumulated gems.
- **Docking & Science Mini-Game**: 
  - Fly over an object to "dock." 
  - **Repairs**: Stations restore health.
  - **Gems**: Inhabited planets provide gems.
  - **Science Checks**: At nebulas, stars, and artifacts, players perform a **Timing-Based Skill Check Mini-Game** (hit [SPACE] when the spinning needle is in the green zone to score Great/Good/Miss) to earn Science Points (SP).
  - **Data Caps**: Each object has a `maxScience` limit (e.g., 20/20 SP). Once charted, it no longer provides SP.
- **Ship Progression**: Buy upgrades and new ships (like the Klingon Warbird or Millennium Starship) using gems, gated by your **Science Level**.

---

## 3. Regions & Environments
The galaxy is divided into regions, each with its own visual style, difficulty, and hazards.

| Region Name | Icon | Difficulty | Hazards / Traits |
| :--- | :--- | :--- | :--- |
| **Neutral Space** | 🌌 | 1.0 | The starting open frontier. Balanced spawns (Safe Zone during tutorial). |
| **The Badlands** | 💀 | 1.5 | Dense asteroid fields (120+), low visibility. |
| **Blob Space** | 🟢 | 3.0 | Home to the Blobs. No neutral ships, high fighter count. |
| **Star Empire** | ⚔️ | 10.0 | Highly hostile. Spawns **Dreadnoughts**. |
| **Uncharted Space**| ☄️ | 1.0 | Focused on exploration and discovery. |
| **Home Region** | 🏠 | 1.0 | Site of the tutorial ambush. High enemy density. |

### Environmental Effects
- **Backgrounds**: The space background color shifts dynamically as you cross region boundaries.
- **Particles**: Each region has unique ambient particles: `dust` (Badlands), `spores` (Blob Space), `embers` (Empire), and `rifts` (Uncharted).

---

## 4. Advanced Entities
- **Dreadnoughts**: Massive, rare capital ships found in Imperial space. They have high health and devastating fire output.
- **Battleships**: Mid-tier heavy hitters that spawn in most regions.
- **Neutral Ships**: Non-hostile traders and travelers. They can be hailed for dialogue or attacked (which turns them hostile).
- **Parasites & Oppressors**: These entities "latch" onto stellar objects. While present, they block docking benefits. Destroying them "liberates" the object.

---


## 5. Ship Upgrades & Economy

### Science Progression
Science Level determines what upgrades and ships are available for purchase.
- **Formula**: `Level = floor(sqrt(SciencePoints / 10))`
- **Gating**: Most high-tier upgrades require a specific Science Level (e.g., Boost Engine requires Level 3).

### Upgrade Formulas
Upgrade Formula: `Base + ((Upgrade Level + Ship Bonus) * Multiplier)`

- **Health**: `40 + ((Level + Ship Bonus) * 20)`
- **Weapons DMG**: `10 + ((Level + Ship Bonus) * 5)`
- **Weapons Fire Rate**: `Math.max(80, 250 - ((Level + Ship Bonus) * 30))`
- **Engine Speed**: `1.0 + ((Level + Ship Bonus) * 1.5)`
- **Engine Acceleration**: `0.08 + ((Level + Ship Bonus) * 0.04)`
- **Boost Speed**: `9.0 + ((Level + Ship Bonus) * 2.5)`

---

## 6. Meta Systems
- **Nav Hints**: Visual indicators (arrows/icons) appear on the screen edge to guide you toward discovered stellar objects or regions.
- **Coordinate Map**: Press **[M]** to open the map of discovered space. There are multiple map viewing modes implemented (Plan A: Interactive Canvas, Plan B: SVG Map, Plan C: Holographic Projection with stylized visuals and procedural nebulae).
- **Dynamic Zoom**: The camera zooms out automatically during high-speed boosts to provide a better field of view.
- **Dev Mode**: A toggleable setting that provides a starting boost of 5000 gems and 1000 science points for testing.

---

## 8. Communications

### 1. Passive Proximity Messages
- **Triggered by**: Neutral ships (`NeutralShip.js`).
- **Condition**: When the player is within **350px** of a neutral ship.
- **Behavior**: Every 15 seconds (900 frames) while in range, a random message from the `NPC_MESSAGES.neutral` library appears in your comms log. 
- **Content**: General world-building fluff like "Greetings, traveler" or "Watch out for space pirates!"

### 2. Active Incoming Hails (The "HAIL" Indicator)
- **Triggered by**: Major events, specifically **liberating a planet or station** by destroying its parasite.
- **Condition**: 1.5 seconds after a parasite's explosion, if the object hasn't been hailed yet.
- **Behavior**: A brief incoming hail popup appears. After a short delay, the hail dialog automatically opens without requiring player input (no manual accept/decline needed).
- **Content**: Uses specific messages (`SPECIFIC_HAILS`) for named stations (like Deep Space 1) or random liberation messages for other planets.
- **Interaction**: Opens a full-screen modal with two choice-based response options, often leading to gem rewards or data updates.

### 3. Manual Hailing (The "Contacts" Tab)
- **Triggered by**: The player manually opening the **Comms** tab in the HUD.
- **Condition**: Scanning for nearby NPCs every 6 frames.
  - **Stations/Planets**: Within **1200px**. It looks up named NPCs (like Captain Yates or Dr. Arisa) from the `NPC_ROSTER`.
  - **Neutral Ships**: Within **350px**. It generates a "Trader Captain" contact.
- **Behavior**: You can click the "HAIL" button next to any contact name to initiate a manual conversation.
- **Interaction**: Opens the same choice-based modal as the active hails.

---

## 8. Visuals & Immersion
The game uses several systems to create a rich, immersive space environment.

### The Star Field
- **Parallax Layers**: Stars are rendered in multiple layers. Denser, brighter stars move slower (parallax depth), creating a 3D sense of movement.
- **Foreground Parallax Layer**: Large, blurred debris objects spawn on a layer above the player, moving at 1.5x the player's velocity in the opposite direction to enhance the illusion of speed.
- **Grayscale Depth**: Instead of being semi-transparent, stars are assigned a solid grayscale color based on their depth. This ensures they remain visible against any background color without being tinted.

### Dynamic Environments
- **Background Lerping**: The space background color shifts smoothly as you transition between regions (e.g., from the deep blue of Neutral Space to the toxic green of Blob Space).
- **Ambient Particles**: To further define regions, unique ambient particles are spawned around the player:
    - `Dust`: For the Badlands and Home regions.
    - `Spores`: For Blob Space.
    - `Embers`: For the Star Empire.
    - `Rifts`: For Uncharted Space.

### Stellar Object Aesthetics
- **Planets**: Rendered with sharp 2D aesthetics including **Crescent Shadows**, **Accent Bands**, and **Tilted Rings**.
- **Stars (Suns)**: Feature a **Pulsing Outer Halo** and a rotating space silhouette around a bright glowing core.
- **Mega-Landmarks**: Unique persistent visual structures like the **Shattered Moon**, composed of jagged shards with transparent gaps allowing stars to be seen through it.
- **Stations**: Use **Nav Lights** (red/blue) that pulse at different intervals.

### Camera & Feedback
- **Dynamic Zoom**: The camera pulls back as you maintain high-speed boost, emphasizing the sense of scale and velocity.
- **Screen Shake**: The camera shakes during low-health states or explosions, heightening the impact of damage.

---

## 9. Future Development & Readiness

To make the game completely ready and fully playable as a finished product, the following additions and polish passes are highly recommended:

1. **Audio & Sound Effects**
   - Add sound effects for all weapons, boosting, UI interactions, and taking damage.
   - Implement dynamic background music that changes based on the current region or combat state.
   - Voiced lines (or garbled radio chatter sounds) for the hailing system to bring NPCs to life.

2. **Expanded User Interface**
   - Provide a fully-featured Main Menu with "New Game", "Continue", and "Settings".
   - Include a proper Pause menu and actual configurable settings (volume, control binding, visual quality toggles).
   - Enhance the Game Over screen with more statistics on the run before respawning.

3. **In-Depth Quest & Mission System**
   - Build upon the current tutorial quests to introduce dynamic, repeatable missions (bounty hunting, escorts, supply deliveries).
   - Add narrative branches that change based on dialogue choices in hails.

4. **Persistent Save System**
   - Implement `localStorage` or backend saving so progress, ship upgrades, map discoveries, and gems survive page refreshes.

5. **Economy & Progression Polish**
   - Balance gem sink vs. gain. Higher-tier enemies should drop varied loot (like specific salvage parts).
   - Ensure the progression between Science Levels feels rewarding and correctly paced instead of abruptly halting.

6. **Content Diversity & Scaling Difficulty**
   - Introduce varying strengths of enemies instead of fixed stats (scaling enemy ship classes).
   - Add new types of stellar anomalies like black holes or localized asteroid storms that genuinely impact flight mechanics.



## 10. Game Loop / Max fun

Objective Loop: NPC introduces an objective, based on a region. That region then shows up everytime you are in that region. For example, Deep Space 6 introduces a problem in the verdant reach, then everytime you enter the verdant reach, you will see a the given objective and the progress. This can all be seen in Story Progress.

## Checklist:
- Add a main story quest for each region.
- Add Barrier for entry for some regions. This could be enemy difficulty, a physical barrier or something else.
- Refine Map
- Add Galactic Side Quests
    - Discover all 6? major landmarks
    - Discover all regions







Exploration
Number of Stellar Objects Discovered in each region
For example Blob Space 4/6 (Maybe in the HUD)







Fighting and Upgrading

Stories
Main Quest:
Story objective: Destroy all parasites, and Destroy 5 Dreadnoughts, 
Find all 10 Space Ranger Stations.
Destroy the Star Empire Capital Ship.
Find Brother.
Liberate or defeat all Regions.

Side Quests:
Discover all 6 Major Landmarks
discover all Regions
Discover all Stellar objects