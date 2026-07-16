// js/engine/systems/EconomySystem.js
import { state } from '../GameState.js';
import { eventBus } from '../EventBus.js';

export function processEconomy() {
    // 1. Reset daily trackers
    state.dailyReport.ticketIncome = 0;
    state.dailyReport.amenityIncome = 0;
    state.dailyReport.staffExpense = 0;
    
    // 2. Calculate Ticket Income (NOW USES REAL VISITOR COUNT!)
    const visitorsToday = state.dailyVisitors || 0;
    const ticketPrice = state.ticketPrice || 20;
    const ticketIncome = visitorsToday * ticketPrice;
    
    state.money += ticketIncome;
    state.dailyReport.ticketIncome = ticketIncome;
    state.dailyReport.amenityIncome = state.visitorSpending?.total || 0;

    // 3. Calculate Staff Expenses
    let staffCost = 0;
    // Placeholder: Let's say we have 2 staff members costing $50 each
    staffCost = 2 * 50;
    state.money -= staffCost;
    state.dailyReport.staffExpense = staffCost;

    // 4. Calculate Net Profit (NO MORE "PLUG" VARIABLES!)
    state.dailyReport.netProfit = ticketIncome + state.dailyReport.amenityIncome - staffCost;

    // 5. Emit an event so other systems (or the UI) know the day finished
    eventBus.emit('ECONOMY_PROCESSED', { 
        profit: state.dailyReport.netProfit,
        totalMoney: state.money,
        visitors: visitorsToday
    });
    
    console.log(`💰 Economy processed. Visitors: ${visitorsToday}, Net: $${state.dailyReport.netProfit}`);
}
