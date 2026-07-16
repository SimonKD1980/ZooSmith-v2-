// js/engine/systems/VisitorSystem.js
import { state } from '../GameState.js';
import { eventBus } from '../EventBus.js';
import { data } from '../data.js';
import { getStaffEffects } from './StaffSystem.js'; // ← Imported from StaffSystem

export function processVisitors() {
    // 1. Calculate attraction score
    const attraction = calculateAttraction();
    
    // 2. Generate actual visitor count
    const visitors = generateVisitors(attraction);
    state.dailyVisitors = visitors;
    
    // 3. Process visitor behavior (spending, complaints, satisfaction)
    processVisitorBehavior(visitors);
    
    // 4. Calculate guest happiness
    const guestHappiness = calculateGuestHappiness();
    state.guestHappiness = guestHappiness;
    
    // 5. Emit event for UI
    eventBus.emit('VISITORS_PROCESSED', {
        attraction,
        visitors,
        guestHappiness,
        spending: state.visitorSpending,
        complaints: state.visitorComplaints
    });
}

function calculateAttraction() {
    let score = 0;
    
    for (const id in state.exhibits) {
        const exhibit = state.exhibits[id];
        if (exhibit.buildDaysRemaining > 0) continue;
        
        exhibit.animals.forEach(animal => {
            score += animal.attractionValue || 10;
        });
        
        score += getExhibitHappiness(exhibit) * 0.5;
    }
    
    return score;
}

function generateVisitors(attraction) {
    if (attraction <= 0) return 0;
    
    const hasRestroom = (state.amenities.restroom || 0) > 0;
    const hasFood = (state.amenities.food_stand || 0) > 0 || 
                    (state.amenities.cafe || 0) > 0 || 
                    (state.amenities.restaurant || 0) > 0;
    
    let baseVisitors;
    if (hasRestroom && hasFood) {
        baseVisitors = 10;
    } else if (hasRestroom || hasFood) {
        baseVisitors = 2;
    } else {
        baseVisitors = 0;
    }
    
    let visitors = baseVisitors + Math.floor(1.2 * Math.sqrt(attraction));
    
    const decayFactor = Math.min(1, (state.daysSinceNewAnimal || 0) / 20);
    visitors = Math.floor(visitors * (1 - (decayFactor * 0.4)));
    
    const priceImpact = state.ticketPriceImpact || 0;
    const priceMultiplier = Math.max(0.1, 1 + (priceImpact / 100));
    visitors = Math.floor(visitors * priceMultiplier);
    
    visitors = Math.max(0, Math.floor(visitors * ((state.visitorSatisfaction || 100) / 100)));
    
    return visitors;
}

function processVisitorBehavior(visitors) {
    state.visitorComplaints = [];
    state.visitorSpending = { food: 0, gifts: 0, total: 0 };
    
    const staffEffects = getStaffEffects();
    const cleanlinessFactor = Math.min(0.8, (staffEffects.cleanPark || 0) / 100);
    
    if (visitors >= 5) {
        if (!(state.amenities.restroom > 0)) {
            const complaint = { icon: '🚻', text: 'Visitors are asking where the restrooms are!', type: 'warning' };
            state.visitorComplaints.push(complaint);
            state.visitorSatisfaction = Math.max(0, (state.visitorSatisfaction || 100) - 5);
            console.log(`⚠️ Complaint: ${complaint.icon} ${complaint.text}`);
        }
        
        if (!(state.amenities.bench > 0)) {
            const complaint = { icon: '🪑', text: 'Tired visitors have nowhere to sit.', type: 'info' };
            state.visitorComplaints.push(complaint);
            state.visitorSatisfaction = Math.max(0, (state.visitorSatisfaction || 100) - 3);
            console.log(`⚠️ Complaint: ${complaint.icon} ${complaint.text}`);
        }
        
        if (!(state.amenities.bin > 0)) {
            const complaint = { icon: '🗑️', text: 'No bins! Trash is starting to pile up.', type: 'info' };
            state.visitorComplaints.push(complaint);
            state.visitorSatisfaction = Math.max(0, (state.visitorSatisfaction || 100) - 3);
            console.log(`⚠️ Complaint: ${complaint.icon} ${complaint.text}`);
        }
        
        const hasFood = (state.amenities.food_stand || 0) > 0 || 
                        (state.amenities.cafe || 0) > 0 || 
                        (state.amenities.restaurant || 0) > 0;
        if (!hasFood) {
            const complaint = { icon: '🍔', text: 'Hungry visitors can\'t find anywhere to eat!', type: 'warning' };
            state.visitorComplaints.push(complaint);
            state.visitorSatisfaction = Math.max(0, (state.visitorSatisfaction || 100) - 5);
            console.log(`⚠️ Complaint: ${complaint.icon} ${complaint.text}`);
        }
    }
    
    for (const id in data.amenities) {
        const amenity = data.amenities[id];
        const count = state.amenities[id] || 0;
        
        if (amenity.capacity > 0 && count > 0) {
            const totalCapacity = count * amenity.capacity;
            
            if (id === 'restroom') {
                if (totalCapacity * 15 < Math.ceil(visitors * 0.8)) {
                    state.visitorComplaints.push({ icon: amenity.icon, text: `Long ${amenity.name.toLowerCase()} lines!`, type: "warning" });
                    state.visitorSatisfaction = Math.max(0, (state.visitorSatisfaction || 100) - 2 * (1 - cleanlinessFactor));
                }
            } else if (id === 'bin') {
                if (count < Math.ceil(visitors / amenity.capacity) && visitors > 8) {
                    state.visitorComplaints.push({ icon: amenity.icon, text: `Trash overflowing!`, type: "warning" });
                    state.visitorSatisfaction = Math.max(0, (state.visitorSatisfaction || 100) - 3 * (1 - cleanlinessFactor));
                }
            } else {
                if (totalCapacity < Math.ceil(visitors * 0.20) * 0.5) {
                    state.visitorComplaints.push({ icon: amenity.icon, text: `Some tired visitors couldn't find a seat.`, type: "warning" });
                    state.visitorSatisfaction = Math.max(0, (state.visitorSatisfaction || 100) - 3 * (1 - cleanlinessFactor));
                }
            }
        }
    }
    
    for (const id in data.amenities) {
        const amenity = data.amenities[id];
        const count = state.amenities[id] || 0;
        
        if (amenity.revenue > 0 && count > 0) {
            let buyerPercentage = 0.3;
            if (id.includes('food') || id.includes('restaurant') || id.includes('cafe')) buyerPercentage = 0.50;
            else if (id.includes('gift') || id.includes('shop') || id.includes('store')) buyerPercentage = 0.20;
            
            const actualBuyers = Math.min(Math.floor(visitors * buyerPercentage), count * (amenity.maxCustomers || 50));
            const revenue = actualBuyers * amenity.revenue;
            
            if (revenue > 0) {
                if (id.includes('food') || id.includes('restaurant') || id.includes('cafe')) {
                    state.visitorSpending.food += revenue;
                } else {
                    state.visitorSpending.gifts += revenue;
                }
                state.money += revenue;
            }
        }
    }
    
    state.visitorSpending.total = state.visitorSpending.food + state.visitorSpending.gifts;
    
    let baseSatisfaction = 0;
    if ((state.amenities.restroom || 0) > 0) baseSatisfaction += 20;
    if ((state.amenities.bin || 0) > 0) baseSatisfaction += 15;
    if ((state.amenities.bench || 0) > 0) baseSatisfaction += 15;
    if ((state.amenities.food_stand || 0) > 0) baseSatisfaction += 20;
    if ((state.amenities.gift_shop || 0) > 0) baseSatisfaction += 10;
    
    baseSatisfaction += Math.min(20, Object.values(state.amenities).reduce((sum, count) => sum + count, 0) * 2);
    
    const penalty = state.visitorComplaints.reduce((sum, c) => 
        sum + (c.type === 'warning' ? 5 : c.type === 'info' ? 2 : 3), 0
    );
    
    const priceSatisfactionImpact = state.ticketSatisfactionImpact || 0;
    state.visitorSatisfaction = Math.max(0, Math.min(100, baseSatisfaction - penalty + priceSatisfactionImpact));
}

function calculateGuestHappiness() {
    let happiness = 50;
    
    if (calculateAttraction() > 50) happiness += 10;
    
    let avgAnimalHappiness = 0;
    const exhibitCount = Object.keys(state.exhibits).length;
    
    if (exhibitCount > 0) {
        let totalHappiness = 0;
        for (const id in state.exhibits) {
            totalHappiness += getExhibitHappiness(state.exhibits[id]);
        }
        avgAnimalHappiness = totalHappiness / exhibitCount;
    }
    
    if (avgAnimalHappiness > 80) happiness += 15;
    
    const staffEffects = getStaffEffects();
    happiness += (staffEffects.visitorHappiness || 0) + (staffEffects.cleanPark || 0) * 0.3;
    
    return Math.max(0, Math.min(100, Math.round(happiness)));
}

function getExhibitHappiness(exhibit) {
    if (!exhibit || !exhibit.animals?.length) return 0;
    
    let totalHappiness = 0;
    
    exhibit.animals.forEach(animal => {
        let happiness = 50; // Base
        
        const health = animal.health ?? 100;
        happiness += (health / 10);
        
        if (animal.wasHungry) {
            happiness -= 30;
        }
        
        const cleanliness = exhibit.cleanliness ?? 100;
        if (cleanliness < 50) {
            happiness -= (50 - cleanliness) * 0.5;
        }
        
        totalHappiness += happiness;
    });
    
    return Math.max(0, Math.min(100, Math.round(totalHappiness / exhibit.animals.length)));
}

// ✅ NO MORE DUPLICATE FUNCTIONS HERE! 
// getStaffEffects is cleanly imported from StaffSystem.js at the top.
