// js/engine/systems/HouseSystem.js
import { state } from '../GameState.js';
import { eventBus } from '../EventBus.js';
import { data } from '../data.js';

export function processHouses() {
    let totalHouseUpkeep = 0;

    Object.values(state.houses || {}).forEach(house => {
        const houseData = data.houses.find(h => h.id === house.dataId);
        if (!houseData) return;

        // Daily upkeep cost
        totalHouseUpkeep += houseData.dailyUpkeep || 0;

        // Cleanliness decay for the house itself
        house.cleanliness = Math.max(0, (house.cleanliness || 100) - 1);

        // Process each indoor exhibit
        Object.values(house.exhibits || {}).forEach(exhibit => {
            const exData = data.indoor_exhibits.find(e => e.id === exhibit.dataId);
            if (!exData) return;

            // Cleanliness decay (slower than outdoor since it's indoors)
            const animalCount = (exhibit.animals || []).length;
            const cleanDecay = 1 + (animalCount * 0.8);
            exhibit.cleanliness = Math.max(0, (exhibit.cleanliness || 100) - cleanDecay);
        });
    });

    // Apply house upkeep costs
    if (totalHouseUpkeep > 0) {
        state.money -= totalHouseUpkeep;
        if (!state.dailyReport) state.dailyReport = {};
        state.dailyReport.upkeepExpense = (state.dailyReport.upkeepExpense || 0) + totalHouseUpkeep;
        if (totalHouseUpkeep > 0) eventBus.emit('UPKEEP_COST', { amount: totalHouseUpkeep, source: 'houses' });
    }
}

export function getHouseCount() {
    return Object.keys(state.houses || {}).length;
}

export function getTotalIndoorExhibits() {
    let count = 0;
    Object.values(state.houses || {}).forEach(house => {
        count += Object.keys(house.exhibits || {}).length;
    });
    return count;
}
