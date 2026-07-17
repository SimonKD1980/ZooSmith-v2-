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

    // Capture start-of-day state
    const startMoney = state.money;
    const startRating = state.zooRating;

    // Order matters!
    processStaff();       // Pay staff salaries
    processWildlife();    // Food, health, breeding, pregnancy, aging
    processFacilities();  // Construction, upkeep, fences, cleanliness
    const visitorData = processVisitors();    // Visitors, spending, complaints
    processRating();      // Calculate zoo rating
    processEconomy();     // Money

    // Calculate daily P&L
    const endMoney = state.money;
    const netProfit = endMoney - startMoney;
    
    // Generate daily report
    const dailyReport = {
        day: state.day,
        date: new Date().toISOString(),
        visitors: state.dailyVisitors || 0,
        income: {
            tickets: state.visitorSpending?.tickets || 0,
            amenities: state.visitorSpending?.amenities || 0,
            total: (state.visitorSpending?.tickets || 0) + (state.visitorSpending?.amenities || 0)
        },
        expenses: {
            staff: state.dailyReport?.staffExpense || 0,
            food: state.dailyReport?.foodExpense || 0,
            upkeep: state.dailyReport?.upkeepExpense || 0,
            maintenance: state.dailyReport?.maintenanceExpense || 0,
            total: (state.dailyReport?.staffExpense || 0) + 
                   (state.dailyReport?.foodExpense || 0) + 
                   (state.dailyReport?.upkeepExpense || 0) + 
                   (state.dailyReport?.maintenanceExpense || 0)
        },
        netProfit: netProfit,
        rating: state.zooRating,
        ratingChange: state.zooRating - startRating,
        animalCount: getTotalAnimalCount(),
        staffCount: state.hiredStaff?.length || 0,
        ticketPrice: state.ticketPrice || 20
    };
    
    // Add to reports array and limit to max
    state.dailyReports.push(dailyReport);
    if (state.dailyReports.length > state.maxDailyReports) {
        state.dailyReports.shift();
    }

    state.day++;
    state.daysSinceNewAnimal++;

    eventBus.emit('DAY_ADVANCED');
    eventBus.emit('DAILY_REPORT_GENERATED', dailyReport);
}

function getTotalAnimalCount() {
    return Object.values(state.exhibits || {}).reduce((total, exhibit) => {
        return total + (exhibit.animals?.length || 0);
    }, 0);
}
