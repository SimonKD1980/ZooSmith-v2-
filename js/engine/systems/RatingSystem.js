// js/engine/systems/RatingSystem.js
import { state } from '../GameState.js';
import { eventBus } from '../EventBus.js';
import { data } from '../data.js';

// =====================================================================
// TIER DEFINITIONS
// =====================================================================
export const RATING_TIERS = [
    { min: 81, name: 'World-Class', emoji: '🏆', bonus: 15000, color: '#fbbf24' },
    { min: 61, name: 'Excellent', emoji: '🌟', bonus: 5000, color: '#22c55e' },
    { min: 41, name: 'Good', emoji: '✅', bonus: 2000, color: '#3b82f6' },
    { min: 21, name: 'Developing', emoji: '🌱', bonus: 500, color: '#a855f7' },
    { min: 0, name: 'Struggling', emoji: '🏚️', bonus: 0, color: '#ef4444' }
];

export function getTier(score) {
    return RATING_TIERS.find(t => score >= t.min) || RATING_TIERS[RATING_TIERS.length - 1];
}

// =====================================================================
// MAIN RATING PROCESSOR
// =====================================================================
export function processRating() {
    const breakdown = calculateRatingBreakdown();
    
    // Calculate final score (capped 0-100)
    const rawScore = breakdown.positive - breakdown.negative;
    const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));
    
    // Determine tier
    const currentTier = getTier(finalScore);
    const previousTier = getTier(state.zooRating || 0);
    
    // Update rating in state
    state.zooRating = finalScore;
    state.ratingBreakdown = breakdown;
    
    // Check for tier upgrade (award bonus ONCE per tier)
    if (currentTier.min > previousTier.min && currentTier.bonus > 0) {
        if (!state.tiersReached) state.tiersReached = [];
        
        if (!state.tiersReached.includes(currentTier.name)) {
            state.tiersReached.push(currentTier.name);
            state.money += currentTier.bonus;
            
            eventBus.emit('TIER_UPGRADED', {
                tier: currentTier.name,
                emoji: currentTier.emoji,
                bonus: currentTier.bonus,
                previousTier: previousTier.name,
                score: finalScore
            });
        }
    }
    
    // Emit rating update event
    eventBus.emit('RATING_UPDATED', {
        score: finalScore,
        tier: currentTier,
        breakdown
    });
}

// =====================================================================
// CALCULATE ALL FACTORS
// =====================================================================
function calculateRatingBreakdown() {
    const factors = {
        positive: {
            animalCare: calculateAnimalCare(),
            zooQuality: calculateZooQuality(),
            visitorExperience: calculateVisitorExperience()
        },
        negative: {
            neglect: calculateNeglect(),
            poorFacilities: calculatePoorFacilities()
        }
    };
    
    const positive = factors.positive.animalCare.total + 
                     factors.positive.zooQuality.total + 
                     factors.positive.visitorExperience.total;
    
    const negative = factors.negative.neglect.total + 
                     factors.negative.poorFacilities.total;
    
    return {
        positive,
        negative,
        factors,
        details: {
            animalCare: factors.positive.animalCare,
            zooQuality: factors.positive.zooQuality,
            visitorExperience: factors.positive.visitorExperience,
            neglect: factors.negative.neglect,
            poorFacilities: factors.negative.poorFacilities
        }
    };
}

// =====================================================================
// FACTOR 1: ANIMAL CARE (40 points max)
// =====================================================================
function calculateAnimalCare() {
    const allAnimals = getAllAnimals();
    
    if (allAnimals.length === 0) {
        return { total: 0, max: 40, health: 0, happiness: 0, count: 0 };
    }
    
    // Average health (20 points max)
    const avgHealth = allAnimals.reduce((sum, a) => sum + (a.health ?? 100), 0) / allAnimals.length;
    const healthPoints = Math.round((avgHealth / 100) * 20);
    
    // Average happiness (20 points max)
    const avgHappiness = allAnimals.reduce((sum, a) => sum + getAnimalHappiness(a), 0) / allAnimals.length;
    const happinessPoints = Math.round((avgHappiness / 100) * 20);
    
    return {
        total: healthPoints + happinessPoints,
        max: 40,
        health: Math.round(avgHealth),
        happiness: Math.round(avgHappiness),
        healthPoints,
        happinessPoints,
        count: allAnimals.length
    };
}

// =====================================================================
// FACTOR 2: ZOO QUALITY (30 points max)
// =====================================================================
function calculateZooQuality() {
    const allAnimals = getAllAnimals();
    
    // Variety: unique species (15 points max)
    const uniqueSpecies = new Set(allAnimals.map(a => a.id)).size;
    const varietyPoints = Math.min(15, uniqueSpecies * 3);
    
    // Breeding: babies born (15 points max)
    const babiesBorn = state.bredAnimals || 0;
    const breedingPoints = Math.min(15, babiesBorn * 3);
    
    return {
        total: varietyPoints + breedingPoints,
        max: 30,
        uniqueSpecies,
        babiesBorn,
        varietyPoints,
        breedingPoints
    };
}

// =====================================================================
// FACTOR 3: VISITOR EXPERIENCE (30 points max)
// =====================================================================
function calculateVisitorExperience() {
    // Visitor satisfaction (15 points max)
    const satisfaction = state.visitorSatisfaction || 0;
    const satisfactionPoints = Math.round((satisfaction / 100) * 15);
    
    // Amenities present (15 points max)
    const essentialAmenities = ['restroom', 'bin', 'food_stand', 'bench', 'gift_shop'];
    const presentCount = essentialAmenities.filter(id => (state.amenities[id] || 0) > 0).length;
    const amenityPoints = Math.min(15, presentCount * 3);
    
    return {
        total: satisfactionPoints + amenityPoints,
        max: 30,
        satisfaction: Math.round(satisfaction),
        presentAmenities: presentCount,
        totalEssential: essentialAmenities.length,
        satisfactionPoints,
        amenityPoints
    };
}

// =====================================================================
// FACTOR 4: NEGLECT (Negative)
// =====================================================================
function calculateNeglect() {
    const allAnimals = getAllAnimals();
    
    // Deaths penalty (-5 each)
    const deaths = state.unnaturalDeaths || 0;
    const deathPenalty = deaths * 5;
    
    // Unhappy animals penalty (-2 each, below 50% happiness)
    const unhappyAnimals = allAnimals.filter(a => getAnimalHappiness(a) < 50);
    const unhappyPenalty = unhappyAnimals.length * 2;
    
    return {
        total: deathPenalty + unhappyPenalty,
        deaths,
        deathPenalty,
        unhappyCount: unhappyAnimals.length,
        unhappyPenalty
    };
}

// =====================================================================
// FACTOR 5: POOR FACILITIES (Negative)
// =====================================================================
function calculatePoorFacilities() {
    let penalty = 0;
    const details = {
        dirtyExhibits: 0,
        dirtyAmenities: 0,
        missingEssentials: 0
    };
    
    // Dirty exhibits (-3 each, below 50% cleanliness)
    for (const id in state.exhibits) {
        const exhibit = state.exhibits[id];
        if (exhibit.buildDaysRemaining > 0) continue;
        if ((exhibit.cleanliness ?? 100) < 50) {
            penalty += 3;
            details.dirtyExhibits++;
        }
    }
    
    // Dirty amenities (-3 each, below 50% cleanliness)
    if (state.amenityCleanliness) {
        for (const id in state.amenityCleanliness) {
            if (state.amenityCleanliness[id] < 50 && (state.amenities[id] || 0) > 0) {
                penalty += 3;
                details.dirtyAmenities++;
            }
        }
    }
    
    // Missing essential amenities (-5 each)
    const essentialAmenities = ['restroom', 'bin', 'food_stand', 'bench'];
    const missingEssentials = essentialAmenities.filter(id => !(state.amenities[id] > 0));
    penalty += missingEssentials.length * 5;
    details.missingEssentials = missingEssentials.length;
    details.missingList = missingEssentials;
    
    return {
        total: penalty,
        ...details
    };
}

// =====================================================================
// HELPERS
// =====================================================================
function getAllAnimals() {
    return Object.values(state.exhibits).flatMap(ex => ex.animals || []);
}

function getAnimalHappiness(animal) {
    let happiness = 50;
    
    // Health factor
    const health = animal.health ?? 100;
    happiness += (health - 50) * 0.4;
    
    // Hunger penalty
    if (animal.wasHungry) happiness -= 30;
    
    // Sickness penalty
    if (animal.sick) happiness -= 20;
    
    return Math.max(0, Math.min(100, happiness));
}
