// js/engine/systems/ResearchSystem.js
import { state } from '../GameState.js';
import { eventBus } from '../EventBus.js';
import { data } from '../data.js';

export function processResearch() {
    if (!state.researchInProgress) return;

    state.researchDaysRemaining--;

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
    
    if (!researchData) {
        alert("Research not found!");
        return false;
    }

    // Check if already completed
    if (state.researchCompleted.includes(researchId)) {
        alert("Already researched!");
        return false;
    }

    // Check if already in progress
    if (state.researchInProgress) {
        alert("Already researching something! Wait for it to complete.");
        return false;
    }

    // Check prerequisites
    if (researchData.requires && researchData.requires.length > 0) {
        const missing = researchData.requires.filter(req => !state.researchCompleted.includes(req));
        if (missing.length > 0) {
            alert("Missing prerequisites! Complete other research first.");
            return false;
        }
    }

    // Check money
    if (state.money < researchData.cost) {
        alert(`Not enough money! Need $${researchData.cost}`);
        return false;
    }

    // Start research
    state.money -= researchData.cost;
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
    // Check if item is in any completed research's unlocks
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
