# Space Explorer - Architecture Refactoring Specification (V2)

## Goals
Refactor the current monolithic `main.js` into a robust, scalable, and maintainable structure using **ES6 Modules**. This structure follows best practices like Separation of Concerns and Singleton/Manager patterns where appropriate. This document is intended as a guide for AI agents to understand the target architecture.

## Core Directives for AI Agents
1. **Use ES6 Modules**: All JavaScript files must use `import` and `export` statements. Do not rely on global variables. The entry script should be loaded with `<script type="module">`.
2. **Component Isolation**: A class in `src/entities/` should not directly modify the DOM. It should only modify its internal state or request actions via the main `Game` engine.
3. **Decoupled UI**: The `HUD` should provide an API (e.g., `updateHealth`, `updateCoordinates`) that the `Game` instance calls, keeping game logic clean from `document.getElementById` queries.
4. **Data-Driven Design**: Keep balancing numbers (costs, health, speed) out of the logic files and inside a single `config.js` or static data structure.

## Proposed File Structure

### `/index.html`
- Links the main script as a module: `<script type="module" src="./src/main.js"></script>`

### `/src/config.js`
- Central repository for all static game balancing variables.
- Holds: Player base health, asteroid spawn ranges, upgrade base costs, etc.

### `/src/utils.js`
- Pure functions for mathematics: object distances, random ranges, angle calculations.

### `/src/engine/`
Core systems that manage the state and loop.
- **`Game.js`**: The central orchestrator. Holds the main `requestAnimationFrame` loop, collections of entities (`asteroids`, `projectiles`, `gems`), resolves global collisions, and communicates state changes to the UI.
- **`Input.js`**: Tracks mouse positions (translated to world coordinates via the camera) and keyboard states. Exported as a singleton or class instance.
- **`Camera.js`**: Manages viewport coordinates and offsets. Has a `follow(target)` method.

### `/src/entities/`
Individual game objects with their own `update(deltaTime)` and `draw(ctx)` methods.
- **`Player.js`**: Handles thrust math, weapons aiming, recoil, and stats tracking.
- **`Asteroid.js`**: Handles behavior, rotation, and logic for splitting upon destruction.
- **`Gem.js`**: Loot drops scattered on destruction, floats towards the player if within magnet radius.
- **`Projectile.js`**: Linear lasers fired by the player.
- **`Particle.js`**: Visual effects for explosions and engine trails.

### `/src/ui/`
- **`HUD.js`**: A manager for the DOM. Encapsulates all interactions with `index.html` (e.g., `updateHealth(current, max)`, `updateGems(count)`, `updateCoordinates(x, y)`, `renderUpgradeMenu()`).

## Incremental Refactoring Strategy
When an agent is tasked with executing this refactor, follow these steps to ensure stability:
1. **Phase 1 (Setup)**: Create the directories (`src/engine`, `src/entities`, `src/ui`). create `src/main.js` and update `index.html` to point to it as a module.
2. **Phase 2 (Utilities & Engine)**: Extract `Utils`, `Input`, and `Camera`. Set up the bare `Game` class in `src/engine/Game.js`.
3. **Phase 3 (Entities)**: Move classes (`Player`, `Asteroid`, `Gem`, `Projectile`, `Particle`) to their respective files in `src/entities/`. Wire up the imports in `Game.js`.
4. **Phase 4 (UI)**: Extract all `document.getElementById` logic from `main.js` and `Game` into `src/ui/HUD.js`.

## Future Expansion
By adhering to this structure, adding **Persistent Coordinate Storage** (e.g. tracking Planets and Nebulas at specific X/Y locations) becomes as simple as creating a `SectorManager.js` in the engine that loads chunks, and a `Planet.js` entity that extends a base static object class.
