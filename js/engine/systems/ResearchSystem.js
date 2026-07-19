// js/engine/systems/ResearchSystem.js
import { state } from '../GameState.js';
import { eventBus } from '../EventBus.js';
import { data } from '../data.js';

export function processResearch() {
    if (!state.researchInProgress) return;

    state.researchDaysRemaining--;

    // 🔥 Emit an event so the UI knows to update the progress bar
    eventBus.emit('RESEARCH_PROGRESS', {
        daysRemaining: state.researchDaysRemaining
    });

    if (state.researchDaysRemaining <= 0) {
        // Research complete!
        const researchId = state.researchInProgress;
        const researchData = data.research.find(r => r.id === researchId);
        
        if (researchData) {
            state.researchCompleted.push(researchId);
            
            eventBus.emit('RESEARCH_COMPLETED', {
                researchName: researchData.name,
                icon: researchData.icon,
                unlocks: researchData.unlocks
            });
        }
        
        state.researchInProgress = null;
        state.researchDaysRemaining = 0;
    }
}

export function startResearch(researchId) {
    const researchData = data.research.find(r => r.id === researchId);
    
    if (!researchData) return false;
    if (state.researchCompleted.includes(researchId)) {
        alert("Already researched!");
        return false;
    }
    if (state.researchInProgress) {
        alert("Already researching something! Wait for it to complete.");
        return false;
    }

    if (researchData.requires && researchData.requires.length > 0) {
        const missing = researchData.requires.filter(req => !state.researchCompleted.includes(req));
        if (missing.length > 0) {
            alert("Missing prerequisites! Complete other research first.");
            return false;
        }
    }

    if (state.money < researchData.cost) {
        alert(`Not enough money! Need $${researchData.cost}`);
        return false;
    }

    // 🔥 1. Deduct money
    state.money -= researchData.cost;
    
    // 🔥 2. Track in daily report expenses
    if (!state.dailyReport) state.dailyReport = {};
    state.dailyReport.researchExpense = (state.dailyReport.researchExpense || 0) + researchData.cost;

    // 🔥 3. Start the research
    state.researchInProgress = researchId;
    state.researchDaysRemaining = researchData.researchDays;

    eventBus.emit('RESEARCH_STARTED', {
        researchName: researchData.name,
        icon: researchData.icon,
        days: researchData.researchDays,
        cost: researchData.cost
    });

    return true;
}
export function isUnlocked(itemId) {
    // 🔥 1. Check if this item is gated by ANY research in the entire game
    const isGatedByResearch = data.research.some(r => 
        r.unlocks && r.unlocks.includes(itemId)
    );

    // 🔥 2. If it is NOT gated by research, it is unlocked by default!
    // (This covers starter animals like lions/zebras, and basic staff like keeper/janitor)
    if (!isGatedByResearch) {
        return true;
    }

    // 🔥 3. If it IS gated, check if the player has actually completed that research
    return data.research.some(r => 
        state.researchCompleted.includes(r.id) && 
        r.unlocks && r.unlocks.includes(itemId)
    );
}

export function getResearchRequirements(researchId) {
    const researchData = data.research.find(r => r.id === researchId);
    if (!researchData || !researchData.requires) return [];
    
    return researchData.requires.map(reqId => {
        const req = data.research.find(r => r.id === reqId);
        return {
            id: reqId,
            name: req?.name || reqId,
            completed: state.researchCompleted.includes(reqId)
        };
    });
}
