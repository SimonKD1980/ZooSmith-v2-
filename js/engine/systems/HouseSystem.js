// js/engine/systems/HouseSystem.js
import { state } from '../GameState.js';
import { eventBus } from '../EventBus.js';
import { data } from '../data.js';

export function processHouses() {
    if (!state.houses) state.houses = {};
    
    let totalHouseUpkeep = 0;

    Object.values(state.houses).forEach(house => {
        const houseData = data.houses.find(h => h.id === house.dataId);
        if (!houseData) return;

        // 🔥 HANDLE CONSTRUCTION COUNTDOWN
        if (house.buildDaysRemaining > 0) {
            house.buildDaysRemaining--;
            if (house.buildDaysRemaining <= 0) {
                house.buildDaysRemaining = 0;
                eventBus.emit('HOUSE_COMPLETED', { name: house.name });
            }
            return; // Skip processing for houses under construction
        }

        // 🔥 Process indoor exhibits construction
        if (house.exhibits) {
            Object.values(house.exhibits).forEach(exhibit => {
                if (exhibit.buildDaysRemaining > 0) {
                    exhibit.buildDaysRemaining--;
                    if (exhibit.buildDaysRemaining <= 0) {
                        exhibit.buildDaysRemaining = 0;
                        eventBus.emit('INDOOR_EXHIBIT_COMPLETED', { 
                            name: exhibit.name || 'Indoor Exhibit',
                            houseName: house.name
                        });
                    }
                    return;
                }

                // Cleanliness decay for completed exhibits
                const exData = data.indoor_exhibits.find(e => e.id === exhibit.dataId);
                if (exData) {
                    const animalCount = (exhibit.animals || []).length;
                    const cleanDecay = 1 + (animalCount * 0.8);
                    exhibit.cleanliness = Math.max(0, (exhibit.cleanliness || 100) - cleanDecay);
                }
            });
        }

        // Daily upkeep cost (only for completed houses)
        totalHouseUpkeep += houseData.dailyUpkeep || 0;

        // Cleanliness decay for the house itself
        house.cleanliness = Math.max(0, (house.cleanliness || 100) - 1);
    });

    // Apply house upkeep costs
    if (totalHouseUpkeep > 0) {
        state.money -= totalHouseUpkeep;
        if (!state.dailyReport) state.dailyReport = {};
        state.dailyReport.upkeepExpense = (state.dailyReport.upkeepExpense || 0) + totalHouseUpkeep;
        eventBus.emit('UPKEEP_COST', { amount: totalHouseUpkeep, source: 'houses' });
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
