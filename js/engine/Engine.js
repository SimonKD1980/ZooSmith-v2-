// js/engine/Engine.js
import { state, getSeason } from './GameState.js';
import { eventBus } from './EventBus.js';
import { processEconomy } from './systems/EconomySystem.js';
import { processWildlife } from './systems/WildlifeSystem.js';
import { processFacilities } from './systems/FacilitySystem.js';
import { processVisitors } from './systems/VisitorSystem.js';
import { processStaff } from './systems/StaffSystem.js';
import { processRating } from './systems/RatingSystem.js';
import { processResearch } from './systems/ResearchSystem.js';

export function advanceDay() {
    console.log(`\n========== ADVANCING TO DAY ${state.day} ==========`);
    console.log('🔍 BEFORE RESET - dailyReport:', JSON.stringify(state.dailyReport));
    console.log('🔍 BEFORE RESET - hiredStaff:', state.hiredStaff);

    // 🔥 NUCLEAR RESET: Force everything to 0
    state.dailyReport = {
        staffExpense: 0,
        foodExpense: 0,
        upkeepExpense: 0,
        maintenanceExpense: 0,
        animalPurchases: [],
        researchExpense: 0,
        neglectFines: 0,
        neglectDeaths: 0
    };
    
    console.log('✅ AFTER RESET - dailyReport:', JSON.stringify(state.dailyReport));

    const startMoney = state.money;
    const startRating = state.zooRating;

    // 🔥 Track each step
    console.log('\n--- Running processStaff() ---');
    processStaff();
    console.log('📊 After processStaff - dailyReport.staffExpense:', state.dailyReport.staffExpense);

    console.log('\n--- Running processWildlife() ---');
    processWildlife();
    console.log('📊 After processWildlife - dailyReport.staffExpense:', state.dailyReport.staffExpense);

    console.log('\n--- Running processFacilities() ---');
    processFacilities();
    console.log('📊 After processFacilities - dailyReport.staffExpense:', state.dailyReport.staffExpense);

    console.log('\n--- Running processVisitors() ---');
    processVisitors();
    console.log('📊 After processVisitors - dailyReport.staffExpense:', state.dailyReport.staffExpense);

    console.log('\n--- Running processRating() ---');
    processRating();
    console.log('📊 After processRating - dailyReport.staffExpense:', state.dailyReport.staffExpense);

    console.log('\n--- Running processResearch() ---');
    processResearch();
    console.log('📊 After processResearch - dailyReport.staffExpense:', state.dailyReport.staffExpense);

    console.log('\n--- Running processEconomy() ---');
    processEconomy();
    console.log('📊 After processEconomy - dailyReport.staffExpense:', state.dailyReport.staffExpense);

    // 🔥 FINAL SAFETY CHECK: Force staff to 0 if no staff hired
    if (!state.hiredStaff || state.hiredStaff.length === 0) {
        if (state.dailyReport.staffExpense !== 0) {
            console.log('🚨 BUG DETECTED! staffExpense was', state.dailyReport.staffExpense, 'but no staff hired. FORCING TO 0');
            state.dailyReport.staffExpense = 0;
        }
    }

    const endMoney = state.money;
    const netProfit = endMoney - startMoney;
    
    const animalBreakdown = getAnimalBreakdown();
    const animalPurchases = state.dailyReport?.animalPurchases || [];
    const animalPurchaseTotal = animalPurchases.reduce((sum, p) => sum + p.cost, 0);
    
    console.log('\n📊 FINAL VALUES:');
    console.log('  staffExpense:', state.dailyReport.staffExpense);
    console.log('  hiredStaff.length:', state.hiredStaff?.length);
    
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
            research: state.dailyReport?.researchExpense || 0,
            neglectFines: state.dailyReport?.neglectFines || 0,
            total: (state.dailyReport?.staffExpense || 0) + 
                   (state.dailyReport?.foodExpense || 0) + 
                   (state.dailyReport?.upkeepExpense || 0) + 
                   (state.dailyReport?.maintenanceExpense || 0) +
                   animalPurchaseTotal +
                   (state.dailyReport?.researchExpense || 0) +
                   (state.dailyReport?.neglectFines || 0)
        },
        animalPurchases: animalPurchases,
        netProfit: netProfit,
        rating: state.zooRating,
        ratingChange: state.zooRating - startRating,
        animalCount: animalBreakdown.total,
        animalBreakdown: animalBreakdown.breakdown,
        staffCount: state.hiredStaff?.length || 0,
        ticketPrice: state.ticketPrice || 20,
        exhibits: Object.keys(state.exhibits || {}).length,
        neglectDeaths: state.dailyReport?.neglectDeaths || 0
    };
    
    state.dailyReports.push(dailyReport);
    if (state.dailyReports.length > state.maxDailyReports) {
        state.dailyReports.shift();
    }

    state.day++;
    state.daysSinceNewAnimal++;

    // 🔥 NEW: Handle Month and Year rollovers
    if (state.day > state.daysInMonth) {
        state.day = 1;
        state.month++;

        // New Year!
        if (state.month > 12) {
            state.month = 1;
            state.year++;
            eventBus.emit('YEAR_ADVANCED', { year: state.year });
        }
        
        // New Month / Season Change!
        eventBus.emit('MONTH_ADVANCED', { 
            month: state.month, 
            season: getSeason() 
        });
    }

    console.log('\n✅ FINAL DAILY REPORT:', JSON.stringify(dailyReport.expenses));
    console.log('==========================================\n');

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
