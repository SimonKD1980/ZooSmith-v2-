import { state } from '../GameState.js';
import { eventBus } from '../EventBus.js';

export function processEconomy() {
    // 1. Reset daily trackers
    state.dailyReport.ticketIncome = 0;
    state.dailyReport.staffExpense = 0;
    
    // 2. Calculate Ticket Income
    // (In the future, this will call VisitorSystem to get actual visitor count)
    const visitorsToday = 50; // Placeholder
    const ticketIncome = visitorsToday * 20; 
    state.money += ticketIncome;
    state.dailyReport.ticketIncome = ticketIncome;

    // 3. Calculate Staff Expenses
    let staffCost = 0;
    // Placeholder: Let's say we have 2 staff members costing $50 each
    staffCost = 2 * 50; 
    state.money -= staffCost;
    state.dailyReport.staffExpense = staffCost;

    // 4. Calculate Net Profit (NO MORE "PLUG" VARIABLES!)
    state.dailyReport.netProfit = ticketIncome - staffCost;

    // 5. Emit an event so other systems (or the UI) know the day finished
    eventBus.emit('ECONOMY_PROCESSED', { 
        profit: state.dailyReport.netProfit,
        totalMoney: state.money 
    });
    
    console.log(`💰 Economy processed. Net: $${state.dailyReport.netProfit}`);
}
