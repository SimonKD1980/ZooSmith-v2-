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
    bredAnimals: 0,

    // Food Inventory (NEW!)
    food: {
        hay: 30,
        meat: 20,
        produce: 15
    },

    // Visitor Data
    dailyVisitors: 0,
    guestHappiness: 50,
    visitorSpending: { food: 0, gifts: 0, total: 0 },
    visitorComplaints: [],
    ticketPrice: 20,
    ticketPriceImpact: 0,
    ticketSatisfactionImpact: 0,
    daysSinceNewAnimal: 0,

    // Exhibits
    exhibits: {
        'exhibit_1': {
            id: 'exhibit_1',
            name: 'Savanna',
            size: 'medium',
            type: 'terrestrial',
            animals: [
                {
                    id: 'lion', name: 'Leo', gender: 'male',
                    ageDays: 400, health: 100, sick: false,
                    diet: 'Carnivore', foodAmount: 3,
                    requiredExhibitSize: 'medium', attractionValue: 15
                },
                {
                    id: 'lion', name: 'Leah', gender: 'female',
                    ageDays: 380, health: 100, sick: false,
                    diet: 'Carnivore', foodAmount: 3,
                    requiredExhibitSize: 'medium', attractionValue: 15
                },
                {
                    id: 'zebra', name: 'Stripey', gender: 'female',
                    ageDays: 650, health: 100, sick: false,
                    diet: 'Herbivore', foodAmount: 2,
                    requiredExhibitSize: 'small', attractionValue: 10
                }
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

    // Amenities
    amenities: {
        bin: 2,
        restroom: 1,
        bench: 1,
        food_stand: 1
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
