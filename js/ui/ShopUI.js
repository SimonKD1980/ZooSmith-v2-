// js/ui/ShopUI.js
import { state } from '../engine/GameState.js';
import { eventBus } from '../engine/EventBus.js';
import { data } from '../engine/data.js';

export function renderShop() {
    const shopEl = document.getElementById('shop');
    if (!shopEl) return;

    let html = `
        <div class="status-panel">
            <h3>🛒 Animal Shop</h3>
            <p style="color: #9ca3af; margin-bottom: 15px;">Buy animals to populate your exhibits.</p>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;">
    `;

    if (!data.animals || data.animals.length === 0) {
        html += '<p style="color: #9ca3af;">No animals found in data/animals.json</p>';
    } else {
        data.animals.forEach(animal => {
            const canAfford = state.money >= animal.cost;
            const reqType = animal.requiredExhibitType || 'standard_exhibit';
            const reqSize = animal.requiredExhibitSize || 'small';
            
            // Capitalize for display
            const displaySize = reqSize.charAt(0).toUpperCase() + reqSize.slice(1);
            const displayName = reqType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

            html += `
                <div style="background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 15px; display: flex; flex-direction: column;">
                    <div style="text-align: center; font-size: 2.5rem; margin-bottom: 5px;">${animal.icon || '🐾'}</div>
                    <h4 style="margin: 0 0 4px; color: #e5e7eb; text-align: center; font-size: 1.1rem;">${animal.name}</h4>
                    <p style="color: #9ca3af; font-size: 0.8rem; text-align: center; margin: 0 0 10px; flex-grow: 1;">
                        Diet: ${animal.diet}<br>
                        Requires: <strong style="color: #fbbf24;">${displaySize} ${displayName}</strong>
                    </p>
                    <div style="font-size: 1.2rem; font-weight: 800; color: #22c55e; text-align: center; margin-bottom: 10px;">
                        💰 $${animal.cost.toLocaleString()}
                    </div>
                    <button onclick="window.openBuyModal('${animal.id}')" 
                        style="width: 100%; padding: 10px; background: ${canAfford ? '#22c55e' : '#475569'}; color: ${canAfford ? '#000' : '#9ca3af'}; border: none; border-radius: 8px; font-weight: 700; cursor: ${canAfford ? 'pointer' : 'not-allowed'}; font-size: 0.95rem;"
                        ${!canAfford ? 'disabled' : ''}>
                        ${canAfford ? '🛒 Buy' : '💸 Can\'t Afford'}
                    </button>
                </div>
            `;
        });
    }

    html += `</div></div>`;
    shopEl.innerHTML = html;
}

export function openBuyModal(animalId) {
    const existingModal = document.querySelector('div[style*="position: fixed"]');
    if (existingModal) existingModal.remove();

    const animalData = data.animals.find(a => a.id === animalId);
    if (!animalData) return;

    if (state.money < animalData.cost) {
        alert(`Not enough money! Need $${animalData.cost}`);
        return;
    }

    const compatibleExhibits = [];

    // 🔥 FIXED MATH: Get size hierarchy dynamically from your new JSON
    const firstTypeKey = Object.keys(data.exhibitTypes)[0];
    const allSizes = Object.keys(data.exhibitTypes[firstTypeKey].sizes);
    const sizeRank = {};
    allSizes.forEach((size, index) => sizeRank[size] = index + 1);
    const requiredIndex = sizeRank[animalData.requiredExhibitSize] || 1;

    for (const id in state.exhibits) {
        const exhibit = state.exhibits[id];
        if (exhibit.buildDaysRemaining > 0) continue;
        if (exhibit.type !== animalData.requiredExhibitType) continue;

        // 🔥 FIXED MATH: Look up the specific size data inside the exhibit's type
        const typeData = data.exhibitTypes[exhibit.type];
        if (!typeData || !typeData.sizes[exhibit.size]) continue;
        
        const sizeData = typeData.sizes[exhibit.size];
        const exhibitIndex = sizeRank[exhibit.size] || 1;
        
        if (exhibitIndex < requiredIndex) continue;
        
        //  FIXED MATH: Check against the maxAnimals from the JSON
        if (exhibit.animals.length >= sizeData.maxAnimals) continue;

        compatibleExhibits.push({
            id: id,
            name: exhibit.name,
            size: exhibit.size,
            type: exhibit.type,
            animals: exhibit.animals.length,
            maxAnimals: sizeData.maxAnimals
        });
    }

    // --- ORIGINAL VISUAL LAYOUT ---
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; justify-content: center; align-items: center;';

    let exhibitsHTML = '';
    if (compatibleExhibits.length === 0) {
        exhibitsHTML = `<p style="color: #9ca3af; text-align: center; padding: 20px;">No compatible exhibits available.<br><small>This ${animalData.name} requires a ${animalData.requiredExhibitSize} ${animalData.requiredExhibitType} exhibit.</small></p>`;
    } else {
        compatibleExhibits.forEach(ex => {
            exhibitsHTML += `
                <div style="background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 12px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s;" 
                    onclick="window.confirmBuyAnimal('${animalData.id}', '${ex.id}')"
                    onmouseover="this.style.borderColor='#3b82f6'" 
                    onmouseout="this.style.borderColor='#334155'">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 700; color: #e5e7eb;">${ex.name}</div>
                            <div style="font-size: 0.85rem; color: #9ca3af;">${ex.size} • ${ex.animals}/${ex.maxAnimals} animals</div>
                        </div>
                        <div style="color: #3b82f6; font-weight: 700;">→</div>
                    </div>
                </div>
            `;
        });
    }

    modal.innerHTML = `
        <div style="background: #1e293b; padding: 30px; border-radius: 12px; max-width: 500px; width: 90%; border: 2px solid #334155; max-height: 90vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                <div>
                    <h2 style="margin: 0; color: #e5e7eb;">🛒 Buy ${animalData.name}</h2>
                    <p style="margin: 4px 0 0; color: #9ca3af; font-size: 0.9rem;">Cost: $${animalData.cost.toLocaleString()}</p>
                </div>
                <button onclick="this.closest('div[style*=fixed]').remove()" style="background: #ef4444; color: #fff; border: none; border-radius: 6px; padding: 6px 12px; cursor: pointer; font-weight: 700;">✕</button>
            </div>
            <h3 style="color: #e5e7eb; margin-bottom: 10px;">Select Destination Exhibit:</h3>
            ${exhibitsHTML}
        </div>
    `;

    document.body.appendChild(modal);
}

export function confirmBuyAnimal(animalId, exhibitId) {
    const animalData = data.animals.find(a => a.id === animalId);
    const exhibit = state.exhibits[exhibitId];

    if (!animalData || !exhibit) return;

    if (state.money < animalData.cost) {
        alert("Not enough money!");
        return;
    }

    const customName = prompt(`Name your new ${animalData.name}:`, animalData.name);
    if (customName === null) return; 
    const finalName = customName.trim() || animalData.name;

    state.money -= animalData.cost;

    const gender = Math.random() < 0.5 ? 'male' : 'female';
    const newAnimal = {
        uid: 'animal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        id: animalData.id,
        name: finalName,
        gender: gender,
        ageDays: 365,
        health: 100,
        sick: false,
        wasHungry: false,
        isPregnant: false,
        daysUntilBirth: 0,
        bornInZoo: false,
        diet: animalData.diet,
        foodAmount: animalData.foodAmount || 1
    };

    exhibit.animals.push(newAnimal);

    const modal = document.querySelector('div[style*="position: fixed"]');
    if (modal) modal.remove();

    eventBus.emit('ANIMAL_PURCHASED', { animal: finalName, species: animalData.name, cost: animalData.cost });
    eventBus.emit('MONEY_CHANGED');
    
    // Re-render both tabs so the UI updates immediately
    renderShop();
    if (typeof window.renderExhibits === 'function') {
        window.renderExhibits();
    }
}

// Expose to window for inline onclick handlers
window.openBuyModal = openBuyModal;
window.confirmBuyAnimal = confirmBuyAnimal;
