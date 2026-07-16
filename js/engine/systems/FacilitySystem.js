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
    // ... (keep existing code)
}

function processUpkeep() {
    // ... (keep existing code)
}

function processFenceDegradation() {
    const staffEffects = getStaffEffects();
    const maintenanceLevel = staffEffects.maintenanceLevel || 0;
    
    for (const id in state.exhibits) {
        const exhibit = state.exhibits[id];
        if (exhibit.buildDaysRemaining > 0) continue;
        
        const oldCondition = exhibit.fenceCondition;
        
        // Calculate degradation
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
        
        // 🔥 NEW: Log fence changes
        if (Math.abs(oldCondition - exhibit.fenceCondition) > 0.1) {
            console.log(`🔧 ${exhibit.name} fence: ${oldCondition.toFixed(1)}% → ${exhibit.fenceCondition.toFixed(1)}%`);
        }
        
        // Check for escape
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
        
        // Animals make it dirty
        let dirtAmount = 0;
        exhibit.animals.forEach(animalInstance => {
            const baseAnimal = data.animals.find(a => a.id === animalInstance.id);
            const dirtLevel = baseAnimal ? (baseAnimal.dirtiness || 2) : 2;
            dirtAmount += dirtLevel;
        });
        
        exhibit.cleanliness -= dirtAmount;
        
        // Keepers clean it
        const assignedKeepers = state.hiredStaff.filter(s =>
            s.assignments &&
            s.assignments.includes(exhibit.id) &&
            isKeeperRole(s.typeId)
        );
        const keeperCleaningBonus = assignedKeepers.length * 2;
        exhibit.cleanliness += keeperCleaningBonus;
        
        // Janitors clean it
        if (janitorCleaningPower > 0) {
            exhibit.cleanliness += janitorCleaningPower;
        }
        
        exhibit.cleanliness = Math.max(0, Math.min(100, exhibit.cleanliness));
        
        // 🔥 NEW: Log cleanliness changes
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

function getStaffEffects() {
    // ... (keep existing code)
}

function isKeeperRole(typeId) {
    // ... (keep existing code)
}
