import { state } from './GameState.js';
import { eventBus } from './EventBus.js';
import { processEconomy } from './systems/EconomySystem.js';

export function advanceDay() {
    console.log(`--- Advancing to Day ${state.day} ---`);
    
    // 1. Run all simulation systems in order
    processEconomy();
    // processWildlife(); // We will add this next
    // processFacilities();
    
    // 2. Advance the calendar
    state.day++;
    
    // 3. Tell the UI to redraw based on the new state
    eventBus.emit('DAY_ADVANCED');
}
