# Core Game Specification: Space Explorer

## 1. Overview
- **Genre**: 2D Top-Down Action/Exploration
- **Setting**: Deep Space
- **Core Loop**: Explore -> Discover/Destroy -> Earn Gems -> Upgrade Ship -> Explore Further

## 2. Gameplay Mechanics
### 2.1 Exploration
- The player pilots a spaceship from a top-down perspective through an expansive (potentially procedurally generated) universe.
- Navigation relies on thrust and rotational controls, dealing with deep space inertia.

### 2.2 Core Currency: Gems
Gems are the lifeblood of the game's progression system.
- **Earning Gems via Discovery**:
  - **Planets**: Locating and entering the orbit of uncharted planets.
  - **Nebulas**: Navigating into dense, colorful gas clouds.
  - **Comets**: Chasing down fast-moving or elusive comets traversing across sectors.
- **Earning Gems via Destruction**:
  - **Asteroids**: Blasting space rocks into debris to harvest hidden gem clusters.
  - **Enemies**: Engaging and destroying hostile alien vessels or space pirates.

### 2.3 Ship Upgrades
Gems can be spent at Space Stations or via an onboard upgrade menu to improve the ship's capabilities:
- **Thrusters & Engine**: Increases top speed, acceleration, and maneuverability.
- **Scanner/Radar**: Expands the fog-of-war reveal radius and highlights points of interest (planets, asteroids) from further away.
- **Weapons Systems**: Upgrades base laser damage, increases rate of fire, or unlocks secondary weapons (e.g., homing missiles or spread shots).
- **Hull & Shields**: Increases total hit points and shield regeneration rate to survive enemy encounters and asteroid collisions.
- **Gem Magnet**: Increases the pickup radius for dropped gems from destroyed asteroids/enemies.

## 3. Entities & Hazards
- **Planets**: Large static celestial bodies. Different biomes (Ice, Fire, Toxic, Earth-like) yield varying amounts of discovery gems.
- **Nebulas**: Environmental zones. They grant discovery gems but might interfere with the ship's radar, drain shields, or slow down movement speed while inside.
- **Comets**: Rare, high-velocity objects. Hard to catch but yield a massive gem payout upon scanning/discovery.
- **Asteroids**: Range in size from small (destroyed in one hit) to massive (require sustained fire and split into smaller rocks).
- **Enemies**: AI-controlled ships spanning multiple tiers (scouts, fighters, heavily armored cruisers) that drop varying amounts of gems upon destruction.

## 4. Input & Controls (PC Target)
- **W** / **Up Arrow**: Main Thruster (Forward)
- **S** / **Down Arrow**: Reverse Thruster / Brake
- **A** / **Left Arrow**: Rotate Ship Left
- **D** / **Right Arrow**: Rotate Ship Right
- **Mouse / Aim**: Aim weapons independently of ship rotation
- **Left Mouse Click**: Fire Primary Weapon
- **Right Mouse Click / Spacebar**: Fire Secondary Weapon / Dash

## 5. Visuals & Audio Direction
- **Art Style**: Top-down 2D. Clean, vibrant pixel art or smooth modern vector graphics. Uses parallax scrolling for background starfields to create a sense of depth.
- **Audio**: Ambient, synth-heavy atmospheric space music. Crisp sound effects for thruster engine burns, laser fire, rock crunches, and rewarding chimes when discovering new celestial bodies.
