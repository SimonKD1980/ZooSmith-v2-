// js/engine/systems/VisitorSystem.js
import { state } from '../GameState.js';
import { eventBus } from '../EventBus.js';
import { data } from '../data.js';
import { getMarketingMultiplier } from './systems/MarketingSystem.js';

export function processVisitors() {

    const marketingMultiplier = getMarketingMultiplier();
const finalVisitors = Math.round(baseVisitors * marketingMultiplier * otherMultipliers);
    // Calculate base visitor attraction from animals
    let baseAttraction = 0;
    let animalCount = 0;
    
    Object.values(state.exhibits).forEach(exhibit => {
        exhibit.animals.forEach(animal => {
            const animalData = data.animals.find(a => a.id === animal.id);
            baseAttraction += animalData?.attractionValue || 10;
            animalCount++;
        });
    });

    // 🔥 FIX: No animals = almost no visitors (only 5 base curiosity visitors)
    const baseVisitors = animalCount > 0 ? (10 + (baseAttraction * 2)) : 5;

    // Calculate ticket price impact
    const ticketPrice = state.ticketPrice || 20;
    const optimalPrice = 20;
    
    let priceMultiplier = 1;
    if (ticketPrice > optimalPrice) {
        priceMultiplier = Math.max(0.3, 1 - ((ticketPrice - optimalPrice) / 100));
    } else {
        priceMultiplier = 1 + ((optimalPrice - ticketPrice) / 40);
    }

    // Calculate ticket satisfaction impact from price
    let priceSatisfactionImpact = 0;
    if (ticketPrice > 30) {
        priceSatisfactionImpact = -20;
    } else if (ticketPrice > 25) {
        priceSatisfactionImpact = -10;
    } else if (ticketPrice < 10) {
        priceSatisfactionImpact = -5;
    } else if (ticketPrice >= 15 && ticketPrice <= 25) {
        priceSatisfactionImpact = 5;
    }

    // 🔥 FIX: Calculate amenities impact with stronger penalties
    let amenityBonus = 0;
    const amenityCount = Object.values(state.amenities || {}).reduce((sum, count) => sum + count, 0);
    amenityBonus += Math.min(20, amenityCount * 2);

    // Check for essential amenities
    const hasRestroom = (state.amenities?.restroom || 0) > 0;
    const hasFood = (state.amenities?.food_stand || 0) > 0 || (state.amenities?.cafe || 0) > 0;
    const hasBin = (state.amenities?.bin || 0) > 0;
    
    // 🔥 STRONGER PENALTIES for missing essentials
    if (!hasRestroom) amenityBonus -= 25; // Was -15
    if (!hasFood) amenityBonus -= 15;     // Was -10
    if (!hasBin) amenityBonus -= 10;      // Was -5

    // 🔥 FIX: If no animals AND no amenities, heavy penalty
    if (animalCount === 0 && amenityCount === 0) {
        amenityBonus -= 30; // Empty zoo penalty
    }

    // Calculate final visitor satisfaction
    const baseSatisfaction = 50;
    let finalSatisfaction = baseSatisfaction + priceSatisfactionImpact + amenityBonus;
    finalSatisfaction = Math.max(0, Math.min(100, finalSatisfaction));
    state.visitorSatisfaction = Math.round(finalSatisfaction);
    state.guestHappiness = Math.round(finalSatisfaction);

    // 🔥 FIX: Apply satisfaction to visitor count
    const satisfactionMultiplier = finalSatisfaction / 100;
    
    // Calculate visitor count
    const adjustedVisitors = Math.round(baseVisitors * priceMultiplier * satisfactionMultiplier);
    const finalVisitors = Math.max(0, Math.min(500, adjustedVisitors));
    
    state.dailyVisitors = finalVisitors;

    // Calculate ticket revenue
    const ticketRevenue = finalVisitors * ticketPrice;

    // Calculate amenity spending
    const amenitySpending = calculateAmenitySpending(finalVisitors, finalSatisfaction);
    
    state.visitorSpending = {
        tickets: ticketRevenue,
        amenities: amenitySpending,
        total: ticketRevenue + amenitySpending
    };

    // Generate complaints if satisfaction is low
    state.visitorComplaints = [];
    if (finalSatisfaction < 40) {
        if (!hasRestroom) {
            state.visitorComplaints.push({
                icon: '🚻',
                text: 'No restrooms available!'
            });
        }
        if (!hasFood) {
            state.visitorComplaints.push({
                icon: '🍔',
                text: 'No food options!'
            });
        }
        if (ticketPrice > 30) {
            state.visitorComplaints.push({
                icon: '💸',
                text: 'Tickets are too expensive!'
            });
        }
        if (animalCount === 0) {
            state.visitorComplaints.push({
                icon: '🦁',
                text: 'No animals to see!'
            });
        }
    }

    eventBus.emit('VISITORS_PROCESSED', {
        visitors: finalVisitors,
        satisfaction: finalSatisfaction,
        spending: state.visitorSpending,
        complaints: state.visitorComplaints
    });

    return {
        visitors: finalVisitors,
        satisfaction: finalSatisfaction,
        spending: state.visitorSpending
    };
}

function calculateAmenitySpending(visitors, satisfaction) {
    if (visitors === 0) return 0;

    let spending = 0;
    
    const baseSpending = 5 + (satisfaction / 10);
    
    const foodStands = (state.amenities?.food_stand || 0) + 
                       (state.amenities?.cafe || 0) * 2 + 
                       (state.amenities?.restaurant || 0) * 3;
    spending += Math.min(visitors * 0.3, foodStands * 50) * baseSpending;
    
    const giftShops = (state.amenities?.gift_shop || 0);
    spending += Math.min(visitors * 0.2, giftShops * 40) * (baseSpending * 0.8);
    
    return Math.round(spending);
}
