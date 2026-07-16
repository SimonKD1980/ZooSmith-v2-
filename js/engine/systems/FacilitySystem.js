// js/engine/systems/FacilitySystem.js
import { state } from '../GameState.js';
import { eventBus } from '../EventBus.js';
import { data } from '../data.js';

export function processFacilities() {
    processDailyMaintenance();
    processUpkeep();
    processFenceDegradation();
    processExhibitCleanliness();
}

function processDailyMaintenance() {
    // 1. Handle exhibit construction countdowns
    for (const id in state.exhibits) {
        const ex = state.exhibits[id];
        if (ex.buildDaysRemaining > 0) {
            ex.buildDaysRemaining--;
            if (ex.buildDaysRemaining === 0) {
                state.builtEnclosures[id] = true;
                eventBus.emit('EXHIBIT_COMPLETED', { exhibitId: id, name: ex.name });
            }
        }
    }

    // 2. Calculate amenity maintenance costs
    let maintenanceCost = 0;
    for (const id in data.amenities) {
        const count = state.amenities[id] || 0;
        const amenity = data.amenities[id];
        if (count > 0 && amenity.maintenanceCost > 0) {
            maintenanceCost += count * amenity.maintenanceCost;
        }
    }
    
    state.maintenance = state.maintenance || { dailyMaintenanceCost: 0 };
    state.maintenance.dailyMaintenanceCost = maintenanceCost;
    state.money -= maintenanceCost;
    
    if (maintenanceCost > 0) {
        eventBus.emit('MAINTENANCE_COST', { amount: maintenanceCost });
    }
}

function processUpkeep() {
    let totalCost = 0;
    
    for (const id in state.exhibits) {
        const exhibit = state.exhibits[id];
        if (exhibit.buildDaysRemaining > 0) continue;
        
        let base = 5;
        if (exhibit.size === 'medium') base = 15;
        if (exhibit.size === 'large') base = 30;
        
        base += (exhibit.animals.length * 2);
        
        totalCost += base;
    }
    
    state.money -= totalCost;
    
    if (totalCost > 0) {
        eventBus.emit('UPKEEP_COST', { amount: totalCost });
    }
    
    return totalCost;
}

function processFenceDegradation() {
    const staffEffects = getStaffEffects();
    const maintenanceLevel = staffEffects.maintenanceLevel || 0;
    
    for (const id in state.exhibits) {
        const exhibit = state.exhibits[id];
        if (exhibit.buildDaysRemaining > 0) continue;
        
        const oldCondition = exhibit.fenceCondition;
        
        let degradation = 0.5 + exhibit.animals.length * 0.2;
        
        exhibit.animals.forEach(animal => {
            const size = animal.requiredExhibitSize || "small";
            if (size === "large") degradation += 0.3;
            else if (size === "medium") degradation += 0.15;
        });
        
        degradation *= (1 - maintenanceLevel * 0.2);
        
        if (maintenanceLevel >= 2) {
            exhibit.fenceCondition = Math.min(100, exhibit.fenceCondition + maintenanceLevel * 5);
        }
        
        exhibit.fenceCondition = Math.max(0, exhibit.fenceCondition - degradation);
        
        if (Math.abs(oldCondition - exhibit.fenceCondition) > 0.1) {
            console.log(`🔧 ${exhibit.name} fence: ${oldCondition.toFixed(1)}% → ${exhibit.fenceCondition.toFixed(1)}%`);
        }
        
        if (exhibit.fenceCondition < 10 && exhibit.animals.length > 0) {
            triggerEscape(exhibit);
        } else if (exhibit.fenceCondition < 30 && Math.random() < 0.3 && exhibit.animals.length > 0) {
            triggerEscape(exhibit);
        } else if (exhibit.fenceCondition < 50 && Math.random() < 0.1 && exhibit.animals.length > 0) {
            triggerEscape(exhibit);
        }
    }
}

function processExhibitCleanliness() {
    const staffEffects = getStaffEffects();
    const janitorCleaningPower = staffEffects.cleanExhibits || 0;
    
    for (const id in state.exhibits) {
        const exhibit = state.exhibits[id];
        if (exhibit.buildDaysRemaining > 0) continue;
        
        if (exhibit.cleanliness === undefined) exhibit.cleanliness = 100;
        
        const oldCleanliness = exhibit.cleanliness;
        
        let dirtAmount = 0;
        exhibit.animals.forEach(animalInstance => {
            const baseAnimal = data.animals.find(a => a.id === animalInstance.id);
            const dirtLevel = baseAnimal ? (baseAnimal.dirtiness || 2) : 2;
            dirtAmount += dirtLevel;
        });
        
        exhibit.cleanliness -= dirtAmount;
        
        const assignedKeepers = state.hiredStaff.filter(s =>
            s.assignments &&
            s.assignments.includes(exhibit.id) &&
            isKeeperRole(s.typeId)
        );
        const keeperCleaningBonus = assignedKeepers.length * 2;
        exhibit.cleanliness += keeperCleaningBonus;
        
        if (janitorCleaningPower > 0) {
            exhibit.cleanliness += janitorCleaningPower;
        }
        
        exhibit.cleanliness = Math.max(0, Math.min(100, exhibit.cleanliness));
        
        if (Math.abs(oldCleanliness - exhibit.cleanliness) > 0.1) {
            console.log(`✨ ${exhibit.name} cleanliness: ${oldCleanliness.toFixed(1)}% → ${exhibit.cleanliness.toFixed(1)}%`);
        }
    }
}

function triggerEscape(exhibit) {
    if (!exhibit || exhibit.animals.length === 0) return;
    
    const escapedAnimal = exhibit.animals[Math.floor(Math.random() * exhibit.animals.length)];
    exhibit.animals = exhibit.animals.filter(a => a !== escapedAnimal);
    
    eventBus.emit('ANIMAL_ESCAPED', { 
        animal: escapedAnimal, 
        exhibitName: exhibit.name 
    });
}

// 🔥 COMPLETE HELPER FUNCTIONS
function getStaffEffects() {
    const effects = {
        visitorHappiness: 0,
        animalHappiness: 0,
        breedingBonus: 0,
        cleanPark: 0,
        cleanExhibits: 0,
        maintenanceLevel: 0
    };
    
    state.hiredStaff.forEach(staffInstance => {
        const staff = data.staff.find(s => s.id === staffInstance.typeId);
        if (staff && staff.effects) {
            for (const effect in staff.effects) {
                if (effect !== 'maxStaff' && effect !== 'keeperSlots' && effect !== 'cleanerSlots' && effects[effect] !== undefined) {
                    effects[effect] += staff.effects[effect];
                }
            }
        }
    });
    
    return effects;
}

function isKeeperRole(typeId) {
    const s = data.staff.find(x => x.id === typeId);
    return s && (s.role?.toLowerCase().includes('keeper') || s.keeperSlots);
}
