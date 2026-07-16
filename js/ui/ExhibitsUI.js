// js/ui/ExhibitsUI.js
import { state } from '../engine/GameState.js';
import { eventBus } from '../engine/EventBus.js';
import { data } from '../engine/data.js';
import { EXHIBIT_TYPES, getLifeStage } from '../engine/constants.js';

export function renderExhibits() {
    const exhibitsEl = document.getElementById('exhibits');
    if (!exhibitsEl) return;

    let html = '';

    // =====================================================================
    // SECTION 1: Build New Exhibit
    // =====================================================================
    html += `
        <div class="status-panel">
            <h3>🏗️ Build New Exhibit</h3>
            <p style="color: #9ca3af; margin-bottom: 15px;">Expand your zoo with new habitats for your animals.</p>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;">
    `;

    for (const size in EXHIBIT_TYPES) {
        const exhibitType = EXHIBIT_TYPES[size];
        const canAfford = state.money >= exhibitType.cost;

        html += `
            <div style="background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 15px;">
                <div style="text-align: center; font-size: 2.5rem; margin-bottom: 8px;">${exhibitType.icon}</div>
                <h4 style="margin: 0 0 6px; color: #e5e7eb;">${exhibitType.name}</h4>
                <p style="color: #9ca3af; font-size: 0.85rem; margin: 0 0 10px; min-height: 40px;">${exhibitType.description}</p>
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #9ca3af; margin-bottom: 10px;">
                    <span>📅 ${exhibitType.buildDays} days</span>
                    <span>🐾 Max ${exhibitType.maxAnimals} animals</span>
                </div>
                <div style="font-size: 1.2rem; font-weight: 800; color: #22c55e; text-align: center; margin-bottom: 10px;">
                    💰 $${exhibitType.cost.toLocaleString()}
                </div>
                <button onclick="window.buildExhibit('${size}')" 
                    style="width: 100%; padding: 10px; background: ${canAfford ? '#22c55e' : '#475569'}; color: ${canAfford ? '#000' : '#9ca3af'}; border: none; border-radius: 8px; font-weight: 700; cursor: ${canAfford ? 'pointer' : 'not-allowed'}; font-size: 0.95rem;"
                    ${!canAfford ? 'disabled' : ''}>
                    ${canAfford ? '🏗️ Build' : '💸 Can\'t Afford'}
                </button>
            </div>
        `;
    }

    html += `
            </div>
        </div>
    `;

    // =====================================================================
    // SECTION 2: Current Exhibits
    // =====================================================================
    html += `<div class="status-panel"><h3>🏞️ Your Exhibits</h3>`;

    if (Object.keys(state.exhibits).length === 0) {
        html += '<p style="color: #9ca3af;">No exhibits yet. Build one above to get started!</p>';
    } else {
        for (const id in state.exhibits) {
            const exhibit = state.exhibits[id];
            const fence = exhibit.fenceCondition ?? 100;
            const cleanliness = exhibit.cleanliness ?? 100;
            const fenceColor = fence >= 70 ? '#22c55e' : fence >= 50 ? '#f59e0b' : fence >= 30 ? '#ef4444' : '#dc2626';
            const cleanColor = cleanliness >= 70 ? '#22c55e' : cleanliness >= 50 ? '#f59e0b' : cleanliness >= 30 ? '#ef4444' : '#dc2626';
            
            const isUnderConstruction = exhibit.buildDaysRemaining > 0;
            const exhibitType = EXHIBIT_TYPES[exhibit.size] || EXHIBIT_TYPES.small;
            const repairCost = Math.ceil((100 - fence) * 2);

            html += `
                <div style="background: #0f172a; border: 1px solid ${isUnderConstruction ? '#f59e0b' : '#334155'}; border-radius: 10px; padding: 15px; margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;">
                        <div>
                            <h4 style="margin: 0; color: #e5e7eb; font-size: 1.2rem;">
                                ${exhibitType.icon} ${exhibit.name}
                                ${isUnderConstruction ? '<span style="background: #f59e0b; color: #000; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; margin-left: 8px;">🚧 Building</span>' : ''}
                            </h4>
                            <div style="color: #9ca3af; font-size: 0.85rem; margin-top: 4px;">
                                ${exhibitType.name} • ${exhibit.animals.length}/${exhibitType.maxAnimals} animals • $${exhibitType.upkeep}/day upkeep
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            ${!isUnderConstruction && fence < 100 ? `
                                <button onclick="window.repairFence('${id}')" 
                                    style="padding: 6px 12px; background: #3b82f6; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.85rem;">
                                    🔧 Repair ($${repairCost})
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    ${isUnderConstruction ? `
                        <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid #f59e0b; border-radius: 6px; padding: 10px; margin-bottom: 10px;">
                            <div style="color: #fbbf24; font-weight: 700; margin-bottom: 4px;">🚧 Under Construction</div>
                            <div style="color: #e5e7eb; font-size: 0.9rem;">${exhibit.buildDaysRemaining} day${exhibit.buildDaysRemaining !== 1 ? 's' : ''} remaining</div>
                            <div style="height: 6px; background: #1e293b; border-radius: 3px; margin-top: 6px; overflow: hidden;">
                                <div style="height: 100%; width: ${((exhibitType.buildDays - exhibit.buildDaysRemaining) / exhibitType.buildDays) * 100}%; background: #f59e0b;"></div>
                            </div>
                        </div>
                    ` : `
                        <div style="display: flex; gap: 15px; font-size: 0.9rem; margin-bottom: 10px; flex-wrap: wrap;">
                            <div>🔧 Fence: <strong style="color: ${fenceColor}">${fence.toFixed(1)}%</strong></div>
                            <div>✨ Clean: <strong style="color: ${cleanColor}">${cleanliness.toFixed(1)}%</strong></div>
                        </div>
                    `}
                    
                    <div style="border-top: 1px solid #1e293b; padding-top: 10px;">
                        <div style="font-weight: 700; color: #e5e7eb; margin-bottom: 8px;">🐾 Animals (${exhibit.animals.length})</div>
                        ${exhibit.animals.length === 0 ? 
                            '<p style="color: #9ca3af; font-size: 0.9rem;">No animals yet. Buy some from the Shop!</p>' :
                            `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px;">
                                ${exhibit.animals.map(animal => renderAnimalCard(animal, id)).join('')}
                            </div>`
                        }
                    </div>
                </div>
            `;
        }
    }

    html += `</div>`;
    exhibitsEl.innerHTML = html;
}

function renderAnimalCard(animal, exhibitId) {
    const stage = getLifeStage(animal.ageDays || 0);
    const health = animal.health ?? 100;
    const healthColor = health >= 70 ? '#22c55e' : health >= 40 ? '#f59e0b' : '#ef4444';
    
    const genderEmoji = animal.gender === 'male' ? '♂️' : '♀️';
    const genderColor = animal.gender === 'male' ? '#3b82f6' : '#ec4899';
    
    const statusBadges = [];
    if (animal.sick) statusBadges.push('<span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 2px 6px; border-radius: 8px; font-size: 0.7rem;">🤒 Sick</span>');
    if (animal.isPregnant) statusBadges.push(`<span style="background: rgba(236, 72, 153, 0.2); color: #ec4899; padding: 2px 6px; border-radius: 8px; font-size: 0.7rem;">🤰 ${animal.daysUntilBirth}d</span>`);
    if (animal.wasHungry) statusBadges.push('<span style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; padding: 2px 6px; border-radius: 8px; font-size: 0.7rem;">🍖 Hungry</span>');

    return `
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px; cursor: pointer;" onclick="window.showAnimalDetails('${exhibitId}', '${animal.name}')">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 6px;">
                <div style="font-weight: 700; color: #e5e7eb; font-size: 0.95rem;">${animal.name}</div>
                <span style="color: ${genderColor}; font-size: 0.9rem;">${genderEmoji}</span>
            </div>
            <div style="font-size: 0.8rem; color: #9ca3af; margin-bottom: 6px;">
                ${stage.emoji} ${stage.label} • ${animal.ageDays || 0} days old
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="font-size: 0.75rem; color: #9ca3af;">❤️ Health</span>
                <span style="font-size: 0.8rem; font-weight: 700; color: ${healthColor};">${Math.round(health)}%</span>
            </div>
            <div style="height: 4px; background: #0f172a; border-radius: 2px; overflow: hidden;">
                <div style="height: 100%; width: ${health}%; background: ${healthColor};"></div>
            </div>
            ${statusBadges.length > 0 ? `
                <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 6px;">
                    ${statusBadges.join('')}
                </div>
            ` : ''}
        </div>
    `;
}

// =====================================================================
// ACTIONS
// =====================================================================

export function buildExhibit(size) {
    const exhibitType = EXHIBIT_TYPES[size];
    if (!exhibitType) {
        alert("Unknown exhibit type!");
        return;
    }

    if (state.money < exhibitType.cost) {
        alert(`Not enough money! Need $${exhibitType.cost}`);
        return;
    }

    const name = prompt(`Name your new ${exhibitType.name}:`, `Exhibit ${Object.keys(state.exhibits).length + 1}`);
    if (!name) return;

    state.money -= exhibitType.cost;

    const newId = 'exhibit_' + Date.now();
    state.exhibits[newId] = {
        id: newId,
        name: name,
        size: exhibitType.size,
        type: 'terrestrial',
        animals: [],
        upgrades: [],
        buildDaysRemaining: exhibitType.buildDays,
        fenceCondition: 100,
        cleanliness: 100
    };

    eventBus.emit('EXHIBIT_BUILD_STARTED', {
        name: name,
        size: exhibitType.size,
        cost: exhibitType.cost,
        days: exhibitType.buildDays
    });

    renderExhibits();
    eventBus.emit('DAY_ADVANCED');
}

export function repairFence(exhibitId) {
    const exhibit = state.exhibits[exhibitId];
    if (!exhibit) {
        alert("Exhibit not found!");
        return;
    }

    const fence = exhibit.fenceCondition ?? 100;
    if (fence >= 100) {
        alert("Fence is already in perfect condition!");
        return;
    }

    const repairCost = Math.ceil((100 - fence) * 2);

    if (state.money < repairCost) {
        alert(`Not enough money! Need $${repairCost}`);
        return;
    }

    if (!confirm(`Repair fence for $${repairCost}?`)) return;

    state.money -= repairCost;
    exhibit.fenceCondition = 100;

    eventBus.emit('FENCE_REPAIRED', {
        exhibitName: exhibit.name,
        cost: repairCost
    });

    renderExhibits();
    eventBus.emit('DAY_ADVANCED');
}

export function showAnimalDetails(exhibitId, animalName) {
    const exhibit = state.exhibits[exhibitId];
    if (!exhibit) return;

    const animal = exhibit.animals.find(a => a.name === animalName);
    if (!animal) return;

    const stage = getLifeStage(animal.ageDays || 0);
    const health = animal.health ?? 100;
    const genderEmoji = animal.gender === 'male' ? '♂️ Male' : '♀️ Female';
    const speciesData = data.animals.find(a => a.id === animal.id);

    const alertBox = document.createElement('div');
    alertBox.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; justify-content: center; align-items: center;';
    
    alertBox.innerHTML = `
        <div style="background: #1e293b; padding: 30px; border-radius: 12px; max-width: 500px; width: 90%; border: 2px solid #334155; max-height: 90vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                <div>
                    <h2 style="margin: 0; color: #e5e7eb;">${animal.name}</h2>
                    <p style="margin: 4px 0 0; color: #9ca3af; font-style: italic;">${speciesData?.scienceName || speciesData?.name || animal.id}</p>
                </div>
                <button onclick="this.closest('div[style*=fixed]').remove()" style="background: #ef4444; color: #fff; border: none; border-radius: 6px; padding: 6px 12px; cursor: pointer; font-weight: 700;">✕</button>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                <div style="background: #0f172a; padding: 10px; border-radius: 6px;">
                    <div style="font-size: 0.75rem; color: #9ca3af;">Gender</div>
                    <div style="font-weight: 700; color: #e5e7eb;">${genderEmoji}</div>
                </div>
                <div style="background: #0f172a; padding: 10px; border-radius: 6px;">
                    <div style="font-size: 0.75rem; color: #9ca3af;">Life Stage</div>
                    <div style="font-weight: 700; color: #e5e7eb;">${stage.emoji} ${stage.label}</div>
                </div>
                <div style="background: #0f172a; padding: 10px; border-radius: 6px;">
                    <div style="font-size: 0.75rem; color: #9ca3af;">Age</div>
                    <div style="font-weight: 700; color: #e5e7eb;">${animal.ageDays || 0} days</div>
                </div>
                <div style="background: #0f172a; padding: 10px; border-radius: 6px;">
                    <div style="font-size: 0.75rem; color: #9ca3af;">Diet</div>
                    <div style="font-weight: 700; color: #e5e7eb;">${animal.diet || 'Unknown'}</div>
                </div>
            </div>
            
            <div style="background: #0f172a; padding: 12px; border-radius: 6px; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="color: #9ca3af;">❤️ Health</span>
                    <span style="font-weight: 700; color: ${health >= 70 ? '#22c55e' : health >= 40 ? '#f59e0b' : '#ef4444'};">${Math.round(health)}%</span>
                </div>
                <div style="height: 8px; background: #1e293b; border-radius: 4px; overflow: hidden;">
                    <div style="height: 100%; width: ${health}%; background: ${health >= 70 ? '#22c55e' : health >= 40 ? '#f59e0b' : '#ef4444'};"></div>
                </div>
            </div>
            
            ${animal.isPregnant ? `
                <div style="background: rgba(236, 72, 153, 0.1); border: 1px solid #ec4899; padding: 10px; border-radius: 6px; margin-bottom: 15px;">
                    <div style="color: #ec4899; font-weight: 700;">🤰 Pregnant</div>
                    <div style="color: #e5e7eb; font-size: 0.9rem;">Baby due in ${animal.daysUntilBirth} day${animal.daysUntilBirth !== 1 ? 's' : ''}</div>
                    ${animal.babyFather ? `<div style="color: #9ca3af; font-size: 0.85rem;">Father: ${animal.babyFather}</div>` : ''}
                </div>
            ` : ''}
            
            ${animal.sick ? `
                <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; padding: 10px; border-radius: 6px; margin-bottom: 15px;">
                    <div style="color: #ef4444; font-weight: 700;">🤒 Sick</div>
                    <div style="color: #e5e7eb; font-size: 0.9rem;">This animal needs medical attention!</div>
                </div>
            ` : ''}
            
            <div style="background: #0f172a; padding: 10px; border-radius: 6px; font-size: 0.85rem; color: #9ca3af;">
                <strong style="color: #e5e7eb;">Exhibit:</strong> ${exhibit.name}<br>
                <strong style="color: #e5e7eb;">Born in Zoo:</strong> ${animal.bornInZoo ? 'Yes 🏠' : 'No (imported)'}
            </div>
        </div>
    `;
    
    document.body.appendChild(alertBox);
}

// Expose to window
window.buildExhibit = buildExhibit;
window.repairFence = repairFence;
window.showAnimalDetails = showAnimalDetails;
