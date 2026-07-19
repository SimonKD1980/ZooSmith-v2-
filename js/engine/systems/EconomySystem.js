// js/engine/systems/EconomySystem.js
import { state } from '../GameState.js';
import { eventBus } from '../EventBus.js';

export function processEconomy() {
    // 1. Calculate total income (already calculated by VisitorSystem)
    const ticketIncome = state.visitorSpending?.tickets || 0;
    const amenityIncome = state.visitorSpending?.amenities || 0;
    const totalIncome = ticketIncome + amenityIncome;

    // 2. Read total expenses (already calculated by StaffSystem, FacilitySystem, WildlifeSystem, etc.)
    // 🔥 NO HARDCODED PLACEHOLDERS! We just read what the other systems wrote to dailyReport.
    const staffExpense = state.dailyReport?.staffExpense || 0;
    const foodExpense = state.dailyReport?.foodExpense || 0;
    const upkeepExpense = state.dailyReport?.upkeepExpense || 0;
    const maintenanceExpense = state.dailyReport?.maintenanceExpense || 0;
    const researchExpense = state.dailyReport?.researchExpense || 0;
    const neglectFines = state.dailyReport?.neglectFines || 0;
    
    const totalExpenses = staffExpense + foodExpense + upkeepExpense + maintenanceExpense + researchExpense + neglectFines;

    // 3. Calculate net profit
    const netProfit = totalIncome - totalExpenses;

    // 4. Emit event with full breakdown for the log/UI
    eventBus.emit('ECONOMY_PROCESSED', {
        visitors: state.dailyVisitors || 0,
        income: totalIncome,
        expenses: totalExpenses,
        profit: netProfit,
        breakdown: {
            ticketIncome,
            amenityIncome,
            staffExpense,
            foodExpense,
            upkeepExpense,
            maintenanceExpense,
            researchExpense,
            neglectFines
        }
    });

    return {
        income: totalIncome,
        expenses: totalExpenses,
        profit: netProfit
    };
}
