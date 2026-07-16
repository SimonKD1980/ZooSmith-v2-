// js/engine/Engine.js
import { state } from './GameState.js';
import { eventBus } from './EventBus.js';
import { processEconomy } from './systems/EconomySystem.js';
import { processWildlife } from './systems/WildlifeSystem.js';
import { processFacilities } from './systems/FacilitySystem.js';
import { processVisitors } from './systems/VisitorSystem.js';
import './systems/RatingSystem.js';

export function advanceDay() {
    console.log(`--- Advancing to Day ${state.day} ---`);
    
    processWildlife();
    processFacilities();
    processVisitors();
    processEconomy();
    
    state.day++;
    state.daysSinceNewAnimal++;
    
    eventBus.emit('DAY_ADVANCED');
}
