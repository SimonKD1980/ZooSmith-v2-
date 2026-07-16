// js/engine/systems/EconomySystem.js
import { state } from '../GameState.js';
import { eventBus } from '../EventBus.js';

export function processEconomy() {
    // 🔥 SAFETY: Ensure money is valid
    if (typeof state.money !== 'number' || isNaN(state.money)) {
        console.warn('⚠️ Money was NaN, resetting to 0');
        state.money = 0;
    }
    
    // 1. Reset daily trackers
    state.dailyReport.ticketIncome = 0;
    state.dailyReport.amenityIncome = 0;
    state.dailyReport.staffExpense = 0;
    
    // 2. Calculate Ticket Income
    const visitorsToday = state.dailyVisitors || 0;
    const ticketPrice = state.ticketPrice || 20;
    
    // 🔥 SAFETY: Ensure these are numbers
    if (typeof visitorsToday !== 'number' || typeof ticketPrice !== 'number') {
        console.error('❌ Invalid visitor/ticket data:', { visitorsToday, ticketPrice });
        return;
    }
    
    const ticketIncome = visitorsToday * ticketPrice;
    state.money += ticketIncome;
    state.dailyReport.ticketIncome = ticketIncome;
    state.dailyReport.amenityIncome = state.visitorSpending?.total || 0;

    // 3. Calculate Staff Expenses
    let staffCost = 0;
    staffCost = 2 * 50; // Placeholder
    state.money -= staffCost;
    state.dailyReport.staffExpense = staffCost;

    // 4. Calculate Net Profit
    state.dailyReport.netProfit = ticketIncome + state.dailyReport.amenityIncome - staffCost;

    // 🔥 SAFETY: Final check before emitting
    if (isNaN(state.money)) {
        console.error('❌ Money became NaN after economy processing!');
        state.money = 0;
    }

    eventBus.emit('ECONOMY_PROCESSED', { 
        profit: state.dailyReport.netProfit,
        totalMoney: state.money,
        visitors: visitorsToday
    });
    
    console.log(`💰 Economy processed. Visitors: ${visitorsToday}, Net: $${state.dailyReport.netProfit}`);
}
