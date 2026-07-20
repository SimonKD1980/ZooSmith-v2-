// js/engine/GameState.js
export const state = {
    // Core Time
    money: 10000,
    day: 1,
    month: 1,
    year: 1,
    daysInMonth: 30, // Simplified: 30 days per month, 360 days per year

    // Zoo Data
    zooName: "My Zoo",
    zooRating: 0,
    visitorSatisfaction: 0,
    unnaturalDeaths: 0,
    totalDeaths: 0,
    bredAnimals: 0,
    ratingBreakdown: null,
    tiersReached: [], 

    // Research Objects
    researchCompleted: [],
    researchInProgress: null,
    researchDaysRemaining: 0,

    // Food Inventory (FIXED: closed properly now!)
    food: {
        hay: 0,
        meat: 0,
        produce: 0
    },

    // Visitor Data
    dailyVisitors: 0,
    guestHappiness: 0,
    visitorSpending: { tickets: 0, amenities: 0, food: 0, gifts: 0, total: 0 },
    visitorComplaints: [],
    ticketPrice: 20,
    ticketPriceImpact: 0,
    ticketSatisfactionImpact: 0,
    daysSinceNewAnimal: 0,

    // Reporting
    dailyReports: [],
    maxDailyReports: 30,

    // Exhibits
    exhibits: {},
    builtEnclosures: {},

    // Staff
    hiredStaff: [],

    // Amenities
    amenities: {
        bin: 0,
        restroom: 0,
        bench: 0,
        food_stand: 0
    },

    // Maintenance
    maintenance: { dailyMaintenanceCost: 0 },

    // Daily Tracking
    dailyReport: {
        ticketIncome: 0,
        amenityIncome: 0,
        staffExpense: 0,
        upkeepExpense: 0,
        maintenanceExpense: 0,
        researchExpense: 0,
        neglectFines: 0,
        neglectDeaths: 0,
        animalPurchases: [],
        netProfit: 0
    }
};

// =====================================================================
// 🌸☀️🍂❄️ SEASONAL HELPERS
// =====================================================================
export function getSeason() {
    const m = state.month;
    if (m === 12 || m === 1 || m === 2) return 'winter';
    if (m === 3 || m === 4 || m === 5) return 'spring';
    if (m === 6 || m === 7 || m === 8) return 'summer';
    return 'fall';
}

export function getSeasonEmoji() {
    const season = getSeason();
    const emojis = {
        winter: '❄️',
        spring: '🌸',
        summer: '☀️',
        fall: '🍂'
    };
    return emojis[season];
}
