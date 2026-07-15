export const state = {
    // Core
    money: 10000,
    day: 1,
    
    // Zoo Data
    zooName: "My Zoo",
    zooRating: 50,
    
    // Daily Tracking (Calculated by systems, read by UI)
    dailyReport: {
        ticketIncome: 0,
        amenityIncome: 0,
        staffExpense: 0,
        upkeepExpense: 0,
        netProfit: 0
    }
};
