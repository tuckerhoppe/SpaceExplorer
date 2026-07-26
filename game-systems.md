# Core Game Architecture & Systems Spec (GDD Lite)

## 1. High-Level Game Loop
1. **Harvest & Expand:** Destroy asteroids / defeat enemies $\rightarrow$ Collect Gems & Science Points.
2. **Upgrade & Build:** Spend resources on player ship upgrades, new ships, and passive structures (Mining/Science Stations).
3. **Fleet Assembly:** Construct Ship Depots and Shipyards to build and store custom fleets.
4. **Sector Conquest:** Lead fleets into high-difficulty regions $\rightarrow$ Destroy enemy fleets, patrols, and oppressor space stations to liberate stellar objects and secure territory.

---

## 2. Key Entities & Data Models

### Player & Fleet Systems
- **Player Ship:** Direct manual control. Upgradable stats (Engine, Shields, Weapons, Cargo).
- **Fleet Ships:** AI-controlled units produced at Shipyards and stored in Ship Depots. Command types: `Follow`, `Patrol`, `Attack Target`.
- **Resources:** 
  - `Gems`: Core currency (from asteroids, enemy drops, and Mining Stations).
  - `Science Points`: Tech currency (from Science Stations; used for ship/building unlocks).

### World & Map Objects
- **Regions:** Dynamic difficulty zones (`DifficultyTier: 1-10`).
  - *Scaling Impact:* Determines Asteroid Health/Yield, Enemy Health/Damage, and Fleet Density.
  - *Liberation Condition:* Defeat $N$ regional enemies + wipe regional patrols + destroy all Oppressor Space Stations.
- **Stellar Objects:** Fixed locations (Planets, Stars, Nebulas, Space Stations).
  - *State:* `Oppressed` (locked behind enemy station) $\rightarrow$ `Liberated` (grants passive buffs or functional access).
- **Player Structures:** Player-built stations placed near liberated nodes.
  - `Mining Station`: Generates passive Gems.
  - `Science Station`: Generates passive Science Points.
  - `Ship Depot`: Increases Fleet Storage Capacity.
  - `Shipyard`: Constructs AI fleet ships using Gems + Science.

---

## 3. Core Architectural Rules (For Code Generation)

### Combat & Conquest Pipeline
- **Damage Pipeline:** All damage calculations must pass through a central `DamageManager` to apply regional difficulty scaling and shield/armor modifiers before reducing health.
- **Liberation Triggers:** Never directly unlock a Stellar Object's benefits inside an enemy destruction script. Broadcast a `OnStationDestroyed` event through the `RegionManager` to evaluate sector liberation status.

### Production & Economy Rules
- **Passive Income:** Structures use a tick-based generator (`ResourceGenerator.cs`) rather than individual frame timers.
- **Fleet Cap:** Shipyards must query `ShipDepotManager.GetFleetCapacity()` before instantiating new AI fleet units.

### Difficulty Scaling Formula
- Asteroid Size/Yield and Enemy Stats scale programmatically by region tier:
  $$\text{ScaledStat} = \text{BaseStat} \times (1 + \text{RegionTier} \times \text{DifficultyMultiplier})$$