// js/engine/Engine.js
import { state } from './GameState.js';
import { eventBus } from './EventBus.js';

// Import your daily processing systems
// (If you get a new error saying one of these doesn't exist, just comment it out)
import { processWildlife } from './systems/WildlifeSystem.js';
import { processEconomy } from './systems/EconomySystem.js'; 
import { processRating } from './systems/RatingSystem.js';
import { processStaff } from './systems/StaffSystem.js';
import { processFacilities } from './systems/FacilitySystem.js'; // If you have this

// 🔥 THE MISSING EXPORT
export function advanceDay() {
    state.day = (state.day || 0) + 1;
    
    console.log(`\n========== ADVANCING TO DAY ${state.day} ==========`);

    // 1. Initialize daily report if it doesn't exist
    if (!state.dailyReport) {
        state.dailyReport = {
            ticketIncome: 0,
            animalPurchases: [],
            staffExpense: 0,
            upkeepExpense: 0,
            foodExpense: 0
        };
    }

    // 2. Run all daily systems
    try {
        if (typeof processStaff === 'function') processStaff();
        if (typeof processWildlife === 'function') processWildlife();
        if (typeof processFacilities === 'function') processFacilities();
        if (typeof processEconomy === 'function') processEconomy();
        if (typeof processRating === 'function') processRating();
        
        // Note: We removed Houses, so processHouses() is intentionally omitted here.
    } catch (error) {
        console.error("❌ Error running daily systems:", error);
    }

    // 3. Emit events so the UI updates
    eventBus.emit('DAY_ADVANCED');
    eventBus.emit('MONEY_CHANGED');
    eventBus.emit('STATE_UPDATED');
}

// Optional: Helper to reset the game
export function resetGame() {
    state.money = 10000;
    state.day = 1;
    state.exhibits = {};
    state.hiredStaff = [];
    localStorage.clear(); // Clear saved game
    window.location.reload();
}
