// js/engine/GameState.js
export const state = {
    // Core
    money: 10000,
    day: 1,
    month: 1,
    year: 1,
    
    // Zoo Data
    zooName: "My Zoo",
    zooRating: 50,
    visitorSatisfaction: 80,
    unnaturalDeaths: 0,
    totalDeaths: 0,
    
    // Visitor Data (NEW!)
    dailyVisitors: 0,
    guestHappiness: 50,
    visitorSpending: { food: 0, gifts: 0, total: 0 },
    visitorComplaints: [],
    ticketPrice: 20,
    ticketPriceImpact: 0,
    ticketSatisfactionImpact: 0,
    daysSinceNewAnimal: 0,
    
    // Exhibits & Facilities
    exhibits: {
        'exhibit_1': {
            id: 'exhibit_1',
            name: 'Savanna',
            size: 'medium',
            type: 'terrestrial',
            animals: [
                { id: 'lion', name: 'Leo', ageDays: 100, health: 100, sick: false, requiredExhibitSize: 'medium', attractionValue: 15 },
                { id: 'zebra', name: 'Stripey', ageDays: 650, health: 100, sick: false, requiredExhibitSize: 'small', attractionValue: 10 }
            ],
            upgrades: [],
            buildDaysRemaining: 0,
            fenceCondition: 100,
            cleanliness: 100
        }
    },
    builtEnclosures: { 'exhibit_1': true },
    
    // Staff
    hiredStaff: [],
    
    // Amenities (counts)
    amenities: {
        bin: 2,
        restroom: 0,
        bench: 1,
        food_stand: 1
    },
    
    // Maintenance tracking
    maintenance: {
        dailyMaintenanceCost: 0
    },

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
