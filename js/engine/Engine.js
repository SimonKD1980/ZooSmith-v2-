// js/engine/Engine.js
import { state } from './GameState.js';
import { eventBus } from './EventBus.js';
import { processEconomy } from './systems/EconomySystem.js';
import { processWildlife } from './systems/WildlifeSystem.js';

// 🔥 Import RatingSystem JUST to register its event listeners
import './systems/RatingSystem.js';

export function advanceDay() {
    console.log(`--- Advancing to Day ${state.day} ---`);
    
    // 1. Run all simulation systems in order
    processWildlife(); // Ages animals, kills them, fires events
    processEconomy();  // Calculates money
    
    // 2. Advance the calendar
    state.day++;
    
    // 3. Tell the UI to redraw based on the new state
    eventBus.emit('DAY_ADVANCED');
}
