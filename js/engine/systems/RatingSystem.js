// js/engine/systems/RatingSystem.js
import { state } from '../GameState.js';
import { eventBus } from '../EventBus.js';

// This listener waits for the WildlifeSystem to shout "ANIMAL_DIED"
eventBus.on('ANIMAL_DIED', (data) => {
    state.totalDeaths = (state.totalDeaths || 0) + 1;
    
    // Natural deaths don't penalize your rating
    if (data.cause !== 'old age') {
        state.unnaturalDeaths = (state.unnaturalDeaths || 0) + 1;
        
        // Apply penalties automatically!
        state.zooRating = Math.max(0, state.zooRating - 5);
        state.visitorSatisfaction = Math.max(0, state.visitorSatisfaction - 10);
        
        console.log(`📉 Rating penalty applied for ${data.cause} death.`);
    }
});
