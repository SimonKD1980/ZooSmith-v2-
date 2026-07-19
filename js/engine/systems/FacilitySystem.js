// js/engine/systems/FacilitySystem.js
import { state } from '../GameState.js';
import { eventBus } from '../EventBus.js';
import { data } from '../data.js';
import { getCleanerCapacity } from './StaffSystem.js';

export function processFacilities() {
    let totalUpkeep = 0;
    let totalMaintenance = 0;
    let dirtyExhibits = 0;

    // 1. Process Exhibits
    Object.values(state.exhibits || {}).forEach(exhibit => {
        // Handle construction
        if (exhibit.buildDaysRemaining > 0) {
            exhibit.buildDaysRemaining--;
            if (exhibit.buildDaysRemaining <= 0) {
                eventBus.emit('EXHIBIT_COMPLETED', { name: exhibit.name });
            }
            return; // Skip processing for exhibits under construction
        }

        // Upkeep cost
        const exhibitType = data.exhibitTypes?.[exhibit.size] || { upkeep: 10 };
        const upkeepCost = exhibitType.upkeep || 10;
        totalUpkeep += upkeepCost;

        // Fence decay (1-2% per day)
        const decay = 1 + Math.random();
        exhibit.fenceCondition = Math.max(0, (exhibit.fenceCondition || 100) - decay);

        // Cleanliness decay (2-4% per day, plus extra per animal)
        const animalCount = exhibit.animals?.length || 0;
        const cleanDecay = 2 + (animalCount * 1.5);
        exhibit.cleanliness = Math.max(0, (exhibit.cleanliness || 100) - cleanDecay);

        if (exhibit.cleanliness < 70) {
            dirtyExhibits++;
        }
    });

    // 2. Process Amenities (Maintenance)
    Object.keys(state.amenities || {}).forEach(amenityId => {
        const count = state.amenities[amenityId];
        if (count > 0) {
            const amenityData = data.amenities[amenityId];
            const maintCost = amenityData?.maintenanceCost || 0;
            totalMaintenance += maintCost * count;
        }
    });

    // 3. Apply Costs
    const totalFacilityCost = totalUpkeep + totalMaintenance;
    if (totalFacilityCost > 0) {
        state.money -= totalFacilityCost;
        
        if (!state.dailyReport) state.dailyReport = {};
        state.dailyReport.upkeepExpense = (state.dailyReport.upkeepExpense || 0) + totalUpkeep;
        state.dailyReport.maintenanceExpense = (state.dailyReport.maintenanceExpense || 0) + totalMaintenance;

        if (totalUpkeep > 0) eventBus.emit('UPKEEP_COST', { amount: totalUpkeep });
        if (totalMaintenance > 0) eventBus.emit('MAINTENANCE_COST', { amount: totalMaintenance });
    } else {
        // Ensure these are 0 if no facilities exist (prevents ghost values from old saves)
        if (!state.dailyReport) state.dailyReport = {};
        state.dailyReport.upkeepExpense = 0;
        state.dailyReport.maintenanceExpense = 0;
    }

    // 4. Emit understaffed warning for cleaning if needed
    const cleanerCapacity = getCleanerCapacity();
    const cleanerDemand = dirtyExhibits; // Simplified demand
    
    if (cleanerDemand > 0 && cleanerCapacity === 0) {
        eventBus.emit('UNDERSTAFFED', {
            keeperCapacity: 0,
            keeperDemand: 0,
            cleanerCapacity: 0,
            cleanerDemand: cleanerDemand
        });
    }
}
