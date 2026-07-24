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

    // Exhibits & Enclosures
    exhibits: {},
    builtEnclosures: {},

    // 🆕 Houses & Indoor Exhibits (The new feature!)
    houses: {},
    /* 
      Example structure of a house inside this object:
      "house_1": {
          id: "house_1",
          dataId: "reptile_house",       // Links to houses.json
          name: "Reptile House",
          cleanliness: 100,
          exhibits: {                    // Nested indoor exhibits
              "indoor_ex_1": {
                  id: "indoor_ex_1",
                  dataId: "small_terrarium", // Links to indoor_exhibits.json
                  animals: ["animal_3"],     // Array of animal IDs
                  cleanliness: 100
              }
          }
      }
    */

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

// =====================================================================
// 🏠 🆕 HOUSE HELPERS
// =====================================================================

/**
 * Generates a unique ID for a new house or indoor exhibit
 */
export function generateUniqueId(prefix) {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

/**
 * Checks if an animal can be placed in a specific indoor exhibit
 */
export function canPlaceAnimalInIndoorExhibit(animalData, exhibitData, currentAnimalsCount) {
    // 1. Check capacity (you can adjust maxAnimals based on exhibitData)
    const maxAnimals = exhibitData.maxAnimals || 3; 
    if (currentAnimalsCount >= maxAnimals) {
        return { valid: false, reason: "Exhibit is at maximum capacity." };
    }

    // 2. Check size requirement
    if (animalData.requiredExhibitSize !== exhibitData.size) {
        return { valid: false, reason: `Animal requires a ${animalData.requiredExhibitSize} exhibit.` };
    }

    // 3. Check type requirement (Aquatic vs Terrestrial)
    if (animalData.requiredExhibitType !== exhibitData.type) {
        return { valid: false, reason: `Animal requires a ${animalData.requiredExhibitType} environment.` };
    }

    return { valid: true };
}

window.state = state;
