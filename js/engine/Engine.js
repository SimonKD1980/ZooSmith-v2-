// js/engine/Engine.js
import { state } from './GameState.js';
import { eventBus } from './EventBus.js';
import { processEconomy } from './systems/EconomySystem.js';
import { processWildlife } from './systems/WildlifeSystem.js';
import { processFacilities } from './systems/FacilitySystem.js';

// Import systems that just register event listeners
import './systems/RatingSystem.js';

// 🔥 THIS EXPORT KEYWORD IS REQUIRED!
export function advanceDay() {
    console.log(`--- Advancing to Day ${state.day} ---`);
    
    // 1. Run all simulation systems in order
    processWildlife();    
    processFacilities();  
    processEconomy();     
    
    // 2. Advance the calendar
    state.day++;
    
    // 3. Tell the UI to redraw based on the new state
    eventBus.emit('DAY_ADVANCED');
}
