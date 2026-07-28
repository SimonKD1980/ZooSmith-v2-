// js/engine/GameState.js
export const state = {
    // Core Time
    money: 10000,
    day: 1,
    month: 1,
    year: 1,
    daysInMonth: 30,

    // Zoo Data
    zooName: "My Zoo",
    zooRating: 0,
    visitorSatisfaction: 0,
    unnaturalDeaths: 0,
    totalDeaths: 0,
    bredAnimals: 0,
    ratingBreakdown: null,
    tiersReached: [],

    // Marketing
    marketing: {
        weeklyBudget: 0,
        totalSpent: 0,
        onlineReach: 0,
        socialMediaFollowers: 0,
        websiteVisitors: 0,
        brandAwareness: 0,
        activeCampaigns: [],
        campaignHistory: []
    },

    // Research Objects
    researchCompleted: [],
    researchInProgress: null,
    researchDaysRemaining: 0,

    // Food Inventory
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

    // Houses (NEW)
    houses: {},

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
// SEASONAL HELPERS
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

// =====================================================================
// UNIQUE ID GENERATOR
// =====================================================================
export function generateUniqueId(prefix) {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
}

// =====================================================================
// INDOOR EXHIBIT VALIDATION
// =====================================================================
export function canPlaceAnimalInIndoorExhibit(animalData, exhibitData, currentCount) {
    if (currentCount >= exhibitData.maxAnimals) {
        return { valid: false, reason: 'Exhibit is full' };
    }

    const requiredSize = animalData.requiredExhibitSize || 'small';
    const requiredType = animalData.requiredExhibitType || 'terrestrial';

    const SIZE_RANK = { small: 1, medium: 2, large: 3 };
    if (SIZE_RANK[exhibitData.size] < SIZE_RANK[requiredSize]) {
        return { valid: false, reason: `Exhibit too small (needs ${requiredSize})` };
    }

    if (exhibitData.type !== requiredType) {
        return { valid: false, reason: `Wrong exhibit type (needs ${requiredType})` };
    }

    return { valid: true };
}

// =====================================================================
// GET ALL ANIMALS (including indoor exhibits)
// =====================================================================
export function getAllAnimals() {
    const animals = [];

    // Regular exhibits
    Object.values(state.exhibits || {}).forEach(exhibit => {
        (exhibit.animals || []).forEach(animal => {
            animals.push({ animal, exhibit, location: 'outdoor' });
        });
    });

    // Indoor exhibits in houses
    Object.values(state.houses || {}).forEach(house => {
        Object.values(house.exhibits || {}).forEach(exhibit => {
            (exhibit.animals || []).forEach(animalId => {
                // Find the actual animal data
                const animalData = findAnimalById(animalId);
                if (animalData) {
                    animals.push({ animal: animalData, exhibit, location: 'indoor', house });
                }
            });
        });
    });

    return animals;
}

function findAnimalById(animalId) {
    // Search in regular exhibits
    for (const exhibit of Object.values(state.exhibits || {})) {
        const found = (exhibit.animals || []).find(a => a.uid === animalId || a.id === animalId);
        if (found) return found;
    }
    // Search in indoor exhibits (stored as IDs referencing animals in regular exhibits)
    for (const house of Object.values(state.houses || {})) {
        for (const exhibit of Object.values(house.exhibits || {})) {
            if ((exhibit.animals || []).includes(animalId)) {
                // Find the actual animal object
                for (const regExhibit of Object.values(state.exhibits || {})) {
                    const found = (regExhibit.animals || []).find(a => a.uid === animalId);
                    if (found) return found;
                }
            }
        }
    }
    return null;
}
