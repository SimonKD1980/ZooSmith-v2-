// js/engine/Engine.js
import { state } from './GameState.js';
import { eventBus } from './EventBus.js';
import { processEconomy } from './systems/EconomySystem.js';
import { processWildlife } from './systems/WildlifeSystem.js';
import { processFacilities } from './systems/FacilitySystem.js';
import { processVisitors } from './systems/VisitorSystem.js';
import { processStaff } from './systems/StaffSystem.js';
import { processRating } from './systems/RatingSystem.js';

export function advanceDay() {
    console.log(`--- Advancing to Day ${state.day} ---`);

    // Order matters!
    processStaff();       // Pay staff salaries
    processWildlife();    // Food, health, breeding, pregnancy, aging
    processFacilities();  // Construction, upkeep, fences, cleanliness
    processVisitors();    // Visitors, spending, complaints
    processRating();      // Calculate zoo rating ← NEW!
    processEconomy();     // Money

    state.day++;
    state.daysSinceNewAnimal++;

    eventBus.emit('DAY_ADVANCED');
}
