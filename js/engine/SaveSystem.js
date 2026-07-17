// js/engine/SaveSystem.js
import { state } from './GameState.js';
import { eventBus } from './EventBus.js';

const SAVE_PREFIX = 'zoosmith_v2_';

export function saveGame(slotName = 'autosave') {
    try {
        // Create a clean copy of state to save
        const saveData = {
            ...state,
            savedAt: new Date().toISOString(),
            version: '2.0'
        };
        localStorage.setItem(SAVE_PREFIX + slotName, JSON.stringify(saveData));
        eventBus.emit('GAME_SAVED', { slot: slotName });
        return true;
    } catch (e) {
        console.error('❌ Failed to save game:', e);
        return false;
    }
}

export function loadGame(slotName = 'autosave') {
    try {
        const savedData = localStorage.getItem(SAVE_PREFIX + slotName);
        if (!savedData) return false;

        const parsed = JSON.parse(savedData);
        
        // Clear current state and load new state safely
        Object.keys(state).forEach(key => delete state[key]);
        Object.assign(state, parsed);
        
        // Ensure defaults for any new fields added in updates
        if (!state.tiersReached) state.tiersReached = [];
        if (!state.amenityCleanliness) state.amenityCleanliness = {};
        if (!state.food) state.food = { hay: 0, meat: 0, produce: 0 };
        
        eventBus.emit('GAME_LOADED', { slot: slotName });
        return true;
    } catch (e) {
        console.error('❌ Failed to load game:', e);
        return false;
    }
}

export function getSaveSlots() {
    const slots = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(SAVE_PREFIX) && key !== SAVE_PREFIX + 'settings') {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                const slotName = key.replace(SAVE_PREFIX, '');
                slots.push({
                    slot: slotName,
                    day: data.day || 1,
                    money: data.money || 0,
                    rating: data.zooRating || 0,
                    date: data.savedAt || 'Unknown'
                });
            } catch (e) {
                console.warn('⚠️ Corrupted save file:', key);
            }
        }
    }
    // Sort by date descending (newest first)
    return slots.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function deleteSave(slotName) {
    if (slotName === 'default') {
        alert("Cannot delete the default starter save!");
        return;
    }
    if (confirm(`Are you sure you want to delete the "${slotName}" save? This cannot be undone.`)) {
        localStorage.removeItem(SAVE_PREFIX + slotName);
        eventBus.emit('SAVE_DELETED', { slot: slotName });
    }
}

export function exportSave(slotName = 'autosave') {
    const savedData = localStorage.getItem(SAVE_PREFIX + slotName);
    if (!savedData) {
        alert('No save data found to export!');
        return;
    }
    const blob = new Blob([savedData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zoosmith_save_${slotName}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function importSave(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const parsed = JSON.parse(e.target.result);
            if (!parsed.day || !parsed.money) {
                throw new Error('Invalid save file format');
            }
            
            // Generate a unique slot name for imported saves
            const importSlot = 'imported_' + Date.now();
            localStorage.setItem(SAVE_PREFIX + importSlot, JSON.stringify(parsed));
            
            eventBus.emit('GAME_IMPORTED', { slot: importSlot });
            alert(`Save file imported successfully as "${importSlot}"!`);
        } catch (err) {
            alert('Failed to import save file: ' + err.message);
        }
    };
    reader.readAsText(file);
}
