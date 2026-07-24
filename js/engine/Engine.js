// js/engine/Engine.js
import { state, getSeason, generateUniqueId, canPlaceAnimalInIndoorExhibit } from './GameState.js';
import { eventBus } from './EventBus.js';
import { processEconomy } from './systems/EconomySystem.js';
import { processWildlife } from './systems/WildlifeSystem.js';
import { processFacilities } from './systems/FacilitySystem.js';
import { processVisitors } from './systems/VisitorSystem.js';
import { processStaff } from './systems/StaffSystem.js';
import { processRating } from './systems/RatingSystem.js';
import { processResearch } from './systems/ResearchSystem.js';

// =====================================================================
// 🆕 UNIVERSAL DATA HOLDERS (Loaded via fetch)
// =====================================================================
export let housesData = [];
export let indoorExhibitsData = [];
export let animalsData = [];

/**
 * Fetches all JSON data files. Call this ONCE when the game starts.
 * (Adjust the paths if your folder structure is different!)
 */
export async function loadGameData() {
    try {
        const [housesRes, indoorRes, animalsRes] = await Promise.all([
            fetch('../../data/houses.json'),
            fetch('../../data/indoor_exhibits.json'),
            fetch('../../data/animals.json')
        ]);
        
        housesData = await housesRes.json();
        indoorExhibitsData = await indoorRes.json();
        animalsData = await animalsRes.json();
        
        console.log('✅ All JSON data loaded successfully!');
    } catch (error) {
        console.error('❌ Failed to load game data:', error);
    }
}

// =====================================================================
// 🆕 UNIVERSAL HELPERS (Outdoor + Indoor)
// =====================================================================

/**
 * Gets EVERY animal object in the zoo, regardless of where it is housed.
 */
export function getAllAnimals() {
    const allAnimals = [];
    
    // 1. Grab outdoor animals
    Object.values(state.exhibits || {}).forEach(exhibit => {
        if (exhibit.animals) allAnimals.push(...exhibit.animals);
    });
    
    // 2. Grab indoor animals (nested inside houses)
    Object.values(state.houses || {}).forEach(house => {
        Object.values(house.exhibits || {}).forEach(exhibit => {
            if (exhibit.animals) allAnimals.push(...exhibit.animals);
        });
    });
    
    return allAnimals;
}

/**
 * Gets EVERY exhibit in the zoo, flagging whether it is indoor or outdoor.
 */
export function getAllExhibits() {
    const allExhibits = [];
    
    // 1. Outdoor exhibits
    Object.values(state.exhibits || {}).forEach(exhibit => {
        allExhibits.push({ ...exhibit, isIndoor: false });
    });
    
    // 2. Indoor exhibits (nested inside houses)
    Object.values(state.houses || {}).forEach(house => {
        const houseData = housesData.find(h => h.id === house.dataId);
        Object.values(house.exhibits || {}).forEach(exhibit => {
            allExhibits.push({ 
                ...exhibit, 
                isIndoor: true, 
                parentHouseId: house.id,
                parentHouseDataId: house.dataId,
                houseUpkeep: houseData ? houseData.dailyUpkeep : 0
            });
        });
    });
    
    return allExhibits;
}

// =====================================================================
// ⏱️ CORE DAY ADVANCEMENT
// =====================================================================

export function advanceDay() {
    console.log(`\n========== ADVANCING TO DAY ${state.day} ==========`);
    
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

    const startMoney = state.money;
    const startRating = state.zooRating;

    // 🔥 Track each step
    processStaff();
    processWildlife();
    processFacilities();
    processVisitors();
    processRating();
    processResearch();
    processEconomy();

    // 🔥 FINAL SAFETY CHECK: Force staff to 0 if no staff hired
    if (!state.hiredStaff || state.hiredStaff.length === 0) {
        if (state.dailyReport.staffExpense !== 0) {
            state.dailyReport.staffExpense = 0;
        }
    }

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
        exhibits: Object.keys(state.exhibits || {}).length + Object.keys(state.houses || {}).length,
        neglectDeaths: state.dailyReport?.neglectDeaths || 0
    };
    
    state.dailyReports.push(dailyReport);
    if (state.dailyReports.length > state.maxDailyReports) {
        state.dailyReports.shift();
    }

    state.day++;
    state.daysSinceNewAnimal++;

    // 🔥 Handle Month and Year rollovers
    if (state.day > state.daysInMonth) {
        state.day = 1;
        state.month++;

        if (state.month > 12) {
            state.month = 1;
            state.year++;
            eventBus.emit('YEAR_ADVANCED', { year: state.year });
        }
        
        eventBus.emit('MONTH_ADVANCED', { 
            month: state.month, 
            season: getSeason() 
        });
    }

    eventBus.emit('DAY_ADVANCED');
    eventBus.emit('DAILY_REPORT_GENERATED', dailyReport);
}

// =====================================================================
// 📊 REPORTING HELPERS
// =====================================================================

function getAnimalBreakdown() {
    const breakdown = {};
    let total = 0;
    
    // 🆕 Use the universal helper to get ALL animals (indoor + outdoor)
    const allAnimals = getAllAnimals();
    
    allAnimals.forEach(animal => {
        const speciesName = animal.speciesName || animal.name || animal.id;
        if (!breakdown[speciesName]) {
            breakdown[speciesName] = 0;
        }
        breakdown[speciesName]++;
        total++;
    });
    
    return {
        total,
        breakdown
    };
}
