// js/engine/systems/WildlifeSystem.js
import { state } from '../GameState.js';
import { eventBus } from '../EventBus.js';

export function processWildlife() {
    const deaths = [];

    // 1. Age animals and check for death
    for (const exhibitId in state.exhibits) {
        const exhibit = state.exhibits[exhibitId];
        
        for (const animal of exhibit.animals) {
            animal.ageDays = (animal.ageDays || 0) + 1;
            
            let died = false;
            let cause = '';

            // Old age (10% chance after 600 days old)
            if (animal.ageDays > 600 && Math.random() < 0.1) {
                died = true;
                cause = 'old age';
            }
            // Sickness
            else if (animal.sick && Math.random() < 0.05) {
                died = true;
                cause = 'sickness';
            }
            // Neglect
            else if (animal.health !== undefined && animal.health <= 0) {
                died = true;
                cause = 'neglect';
            }

            if (died) {
                deaths.push({ animal, exhibitId, cause });
            }
        }
    }

    // 2. Remove dead animals and fire events
    for (const death of deaths) {
        const exhibit = state.exhibits[death.exhibitId];
        exhibit.animals = exhibit.animals.filter(a => a !== death.animal);
        
        // 🔥 THE MAGIC: We just shout into the void. 
        // This system doesn't know about money, rating, or UI.
        eventBus.emit('ANIMAL_DIED', { 
            animal: death.animal, 
            cause: death.cause,
            exhibitName: exhibit.name 
        });
    }
}
