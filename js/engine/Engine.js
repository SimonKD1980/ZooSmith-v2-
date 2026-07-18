// js/engine/Engine.js
import { state } from './GameState.js';
import { eventBus } from './EventBus.js';
import { processEconomy } from './systems/EconomySystem.js';
import { processWildlife } from './systems/WildlifeSystem.js';
import { processFacilities } from './systems/FacilitySystem.js';
import { processVisitors } from './systems/VisitorSystem.js';
import { processStaff } from './systems/StaffSystem.js';
import { processRating } from './systems/RatingSystem.js';
import { processResearch } from './systems/ResearchSystem.js'; // 🔥 MUST BE HERE

export function advanceDay() {
    console.log(`--- Advancing to Day ${state.day} ---`);

    const startMoney = state.money;
    const startRating = state.zooRating;

    // 🔥 Order matters! Research must be processed here
    processStaff();
    processWildlife();
    processFacilities();
    processVisitors();
    processRating();
    processResearch();  // 🔥 THIS IS THE ONLY THING THAT COUNTS THE DAYS DOWN
    processEconomy();

    const endMoney = state.money;
    const netProfit = endMoney - startMoney;
    
    const animalBreakdown = getAnimalBreakdown();
    const animalPurchases = state.dailyReport?.animalPurchases || [];
    const animalPurchaseTotal = animalPurchases.reduce((sum, p) => sum + p.cost, 0);
    
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
            animalPurchases: animalPurchaseTotal,
            total: (state.dailyReport?.staffExpense || 0) + 
                   (state.dailyReport?.foodExpense || 0) + 
                   (state.dailyReport?.upkeepExpense || 0) + 
                   (state.dailyReport?.maintenanceExpense || 0) +
                   animalPurchaseTotal
        },
        animalPurchases: animalPurchases,
        netProfit: netProfit,
        rating: state.zooRating,
        ratingChange: state.zooRating - startRating,
        animalCount: animalBreakdown.total,
        animalBreakdown: animalBreakdown.breakdown,
        staffCount: state.hiredStaff?.length || 0,
        ticketPrice: state.ticketPrice || 20,
        exhibits: Object.keys(state.exhibits || {}).length
    };
    
    state.dailyReports.push(dailyReport);
    if (state.dailyReports.length > state.maxDailyReports) {
        state.dailyReports.shift();
    }

    state.dailyReport = {
        staffExpense: 0,
        foodExpense: 0,
        upkeepExpense: 0,
        maintenanceExpense: 0,
        animalPurchases: []
    };

    state.day++;
    state.daysSinceNewAnimal++;

    eventBus.emit('DAY_ADVANCED');
    eventBus.emit('DAILY_REPORT_GENERATED', dailyReport);
}

function getAnimalBreakdown() {
    const breakdown = {};
    let total = 0;
    
    Object.values(state.exhibits || {}).forEach(exhibit => {
        (exhibit.animals || []).forEach(animal => {
            const speciesName = animal.speciesName || animal.name || animal.id;
            if (!breakdown[speciesName]) {
                breakdown[speciesName] = 0;
            }
            breakdown[speciesName]++;
            total++;
        });
    });
    
    return {
        total,
        breakdown
    };
}
