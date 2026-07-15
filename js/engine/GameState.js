// js/engine/GameState.js
export const state = {
    // Core
    money: 10000,
    day: 1,
    
    // Zoo Data
    zooName: "My Zoo",
    zooRating: 50,
    visitorSatisfaction: 80,
    unnaturalDeaths: 0,
    totalDeaths: 0,
    
    // Mock data to test the Wildlife System
    exhibits: {
        'exhibit_1': {
            id: 'exhibit_1',
            name: 'Savanna',
            animals: [
                { id: 'lion', name: 'Leo', ageDays: 100, health: 100, sick: false },
                { id: 'zebra', name: 'Stripey', ageDays: 650, health: 100, sick: false } // Very old!
            ]
        }
    },

    // Daily Tracking
    dailyReport: {
        ticketIncome: 0,
        staffExpense: 0,
        netProfit: 0
    }
};
