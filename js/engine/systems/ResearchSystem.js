// js/engine/systems/ResearchSystem.js
import { state } from '../GameState.js';
import { eventBus } from '../EventBus.js';
import { data } from '../data.js';

export function processResearch() {
    if (!state.researchInProgress) return;

    state.researchDaysRemaining--;

    eventBus.emit('RESEARCH_PROGRESS', {
        daysRemaining: state.researchDaysRemaining
    });

    if (state.researchDaysRemaining <= 0) {
        const researchId = state.researchInProgress;
        
        // 🔥 SAFETY: Check if data.research exists before searching it
        const researchData = data.research ? data.research.find(r => r.id === researchId) : null;
        
        if (researchData) {
            if (!state.researchCompleted) state.researchCompleted = [];
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
    // 🔥 SAFETY: Prevent crash if research data isn't loaded yet
    if (!data.research) return false;
    
    const researchData = data.research.find(r => r.id === researchId);
    if (!researchData) return false;
    
    if (!state.researchCompleted) state.researchCompleted = [];
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

    state.money -= researchData.cost;
    
    if (!state.dailyReport) state.dailyReport = {};
    state.dailyReport.researchExpense = (state.dailyReport.researchExpense || 0) + researchData.cost;

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
    // 🔥 SAFETY 1: If research data isn't loaded yet, assume unlocked to prevent crashes
    if (!data.research || !Array.isArray(data.research)) {
        return true;
    }

    // 1. Check if this item is gated by ANY research in the entire game
    const isGatedByResearch = data.research.some(r => 
        r.unlocks && r.unlocks.includes(itemId)
    );

    // 2. If it is NOT gated by research, it is unlocked by default!
    if (!isGatedByResearch) {
        return true;
    }

    // 🔥 SAFETY 2: Prevent crash if researchCompleted array doesn't exist yet
    if (!state.researchCompleted || !Array.isArray(state.researchCompleted)) {
        return false;
    }

    // 3. If it IS gated, check if the player has actually completed that research
    return data.research.some(r => 
        state.researchCompleted.includes(r.id) && 
        r.unlocks && r.unlocks.includes(itemId)
    );
}

export function getResearchRequirements(researchId) {
    if (!data.research) return [];
    
    const researchData = data.research.find(r => r.id === researchId);
    if (!researchData || !researchData.requires) return [];
    
    if (!state.researchCompleted) state.researchCompleted = [];

    return researchData.requires.map(reqId => {
        const req = data.research.find(r => r.id === reqId);
        return {
            id: reqId,
            name: req?.name || reqId,
            completed: state.researchCompleted.includes(reqId)
        };
    });
}
