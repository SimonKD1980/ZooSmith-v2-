// js/engine/systems/StaffSystem.js
import { state } from '../GameState.js';
import { eventBus } from '../EventBus.js';
import { data } from '../data.js';

export function processStaff() {
    // Calculate staff expenses
    let totalSalary = 0;
    
    state.hiredStaff.forEach(staffInstance => {
        const staffData = data.staff.find(s => s.id === staffInstance.typeId);
        if (staffData) {
            totalSalary += staffData.salary || 0;
        }
    });
    
    state.money -= totalSalary;
    state.dailyReport.staffExpense = totalSalary;
    
    if (totalSalary > 0) {
        eventBus.emit('STAFF_EXPENSE', { amount: totalSalary });
    }
    
    // Check if understaffed
    const keeperCapacity = getKeeperCapacity();
    const keeperDemand = getKeeperDemand();
    const cleanerCapacity = getCleanerCapacity();
    const cleanerDemand = getCleanerDemand();
    
    if (keeperDemand > keeperCapacity || cleanerDemand > cleanerCapacity) {
        eventBus.emit('UNDERSTAFFED', {
            keeperCapacity,
            keeperDemand,
            cleanerCapacity,
            cleanerDemand
        });
    }
}

export function getKeeperCapacity() {
    let capacity = 0;
    state.hiredStaff.forEach(instance => {
        const staffData = data.staff.find(s => s.id === instance.typeId);
        const slots = staffData?.keeperSlots ?? 0;
        if (staffData?.role?.toLowerCase().includes('keeper') || slots > 0) {
            capacity += slots;
        }
    });
    return capacity;
}

export function getKeeperDemand() {
    let demand = 0;
    for (const id in state.exhibits) {
        const exhibit = state.exhibits[id];
        if (exhibit.buildDaysRemaining > 0) continue;
        
        const size = exhibit.size || 'small';
        if (size === 'large') demand += 3;
        else if (size === 'medium') demand += 2;
        else demand += 1;
    }
    return demand;
}

export function getCleanerCapacity() {
    let capacity = 0;
    state.hiredStaff.forEach(instance => {
        const staffData = data.staff.find(s => s.id === instance.typeId);
        const slots = staffData?.cleanerSlots ?? 0;
        if (staffData?.role?.toLowerCase().includes('cleaner') || 
            staffData?.role?.toLowerCase().includes('janitor') || 
            slots > 0) {
            capacity += slots;
        }
    });
    return capacity;
}

export function getCleanerDemand() {
    let demand = 0;
    
    // Bins = 1 slot, Toilets = 2 slots
    if (state.amenities['bin'] > 0) demand += (state.amenities['bin'] * 1);
    if (state.amenities['restroom'] > 0) demand += (state.amenities['restroom'] * 2);
    
    return demand;
}

export function isUnderstaffed() {
    return getKeeperDemand() > getKeeperCapacity() || 
           getCleanerDemand() > getCleanerCapacity();
}

export function isKeepersUnderstaffed() {
    return getKeeperDemand() > getKeeperCapacity();
}

// 🔥 UPDATED: Added cleanAmenities to effects
export function getStaffEffects() {
    const effects = {
        visitorHappiness: 0,
        animalHappiness: 0,
        breedingBonus: 0,
        cleanPark: 0,
        cleanExhibits: 0, // ← Keepers only (assigned to specific exhibits)
        cleanAmenities: 0, // ← NEW: Janitors clean amenities
        maintenanceLevel: 0
    };
    
    state.hiredStaff.forEach(staffInstance => {
        const staff = data.staff.find(s => s.id === staffInstance.typeId);
        if (staff && staff.effects) {
            for (const effect in staff.effects) {
                if (effect !== 'maxStaff' && 
                    effect !== 'keeperSlots' && 
                    effect !== 'cleanerSlots' && 
                    effects[effect] !== undefined) {
                    effects[effect] += staff.effects[effect];
                }
            }
        }
    });
    
    return effects;
}

export function isKeeperRole(typeId) {
    const s = data.staff.find(x => x.id === typeId);
    return s && (s.role?.toLowerCase().includes('keeper') || s.keeperSlots);
}

export function isCleanerRole(typeId) {
    const s = data.staff.find(x => x.id === typeId);
    return s && (s.role?.toLowerCase().includes('cleaner') || 
                 s.role?.toLowerCase().includes('janitor') || 
                 s.cleanerSlots);
}
