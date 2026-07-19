// js/engine/GameState.js
export const state = {
    // Core
    money: 10000,
    day: 1,
    month: 1,
    year: 1,

    // Zoo Data
    zooName: "My Zoo",
    zooRating: 0,
    visitorSatisfaction: 0,
    unnaturalDeaths: 0,
    totalDeaths: 0,
    bredAnimals: 0,

    // Research Objects
    researchCompleted: [],  // Array of research IDs that are completed
    researchInProgress: null,  // Current research being worked on
    researchDaysRemaining: 0,  // Days until current research completes

    
    // Food Inventory
    food: {
        hay: 0,
        meat: 0,
        produce: 0,

    zooRating: 0,
    ratingBreakdown: null,
    tiersReached: [] // Tracks which tiers have been awarded bonuses
    },

    // Visitor Data
    dailyVisitors: 0,
    guestHappiness: 0,
    visitorSpending: { food: 0, gifts: 0, total: 0 },
    visitorComplaints: [],
    ticketPrice: 20,
    ticketPriceImpact: 0,
    ticketSatisfactionImpact: 0,
    daysSinceNewAnimal: 0,

    //Reporting
    dailyReports: [],  // Array of daily report objects
    maxDailyReports: 30,  // Keep last 30 days

    // Exhibits
    exhibits: {},
    builtEnclosures: {},

    // Staff (NEW!)
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
        netProfit: 0
    }
};
