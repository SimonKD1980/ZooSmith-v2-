// js/ui/ExhibitsUI.js
import { state } from '../engine/GameState.js';
import { eventBus } from '../engine/EventBus.js';
import { data } from '../engine/data.js';
import { EXHIBIT_TYPES, getLifeStage } from '../engine/constants.js';
import { attemptBreeding, renameBaby } from '../engine/systems/WildlifeSystem.js';
import { getCleanerCapacity } from '../engine/systems/StaffSystem.js';
import { getAvailableUpgrades, canInstallUpgrade, getExhibitEffects } from '../engine/systems/UpgradeSystem.js';

export function renderExhibits() {
    const exhibitsEl = document.getElementById('exhibits');
    if (!exhibitsEl) return;

    let html = '';

    // SECTION 1: Build New Exhibit
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

    html += `</div></div>`;

    // SECTION 2: Current Exhibits
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

            const breedingInfo = getBreedingOpportunities(exhibit);
            const hasJanitors = getCleanerCapacity() > 0;

            // 🔥 Get upgrade info
            const availableUpgrades = getAvailableUpgrades(exhibit);
            const installedUpgrades = availableUpgrades.filter(u => u.installed);
            const purchasableUpgrades = availableUpgrades.filter(u => u.available);
            const exhibitEffects = getExhibitEffects(exhibit);

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
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            ${!isUnderConstruction && fence < 100 ? `
                                <button onclick="window.repairFence('${id}')" 
                                    style="padding: 6px 12px; background: ${hasJanitors ? '#3b82f6' : '#475569'}; color: ${hasJanitors ? '#fff' : '#9ca3af'}; border: none; border-radius: 6px; font-weight: 600; cursor: ${hasJanitors ? 'pointer' : 'not-allowed'}; font-size: 0.85rem;"
                                    ${!hasJanitors ? 'title="Requires janitor staff"' : ''}>
                                    🔧 Repair ($${repairCost})${!hasJanitors ? ' ⚠️' : ''}
                                </button>
                            ` : ''}
                            ${breedingInfo.canBreed ? `
                                <button onclick="window.attemptBreeding('${id}')" 
                                    style="padding: 6px 12px; background: #ec4899; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.85rem;">
                                    🐾 Breed (${breedingInfo.pairs.length} pair${breedingInfo.pairs.length > 1 ? 's' : ''})
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
                    
                    ${breedingInfo.canBreed ? `
                        <div style="background: rgba(236, 72, 153, 0.1); border: 1px solid #ec4899; border-radius: 6px; padding: 10px; margin-bottom: 10px;">
                            <div style="color: #f9a8d4; font-weight: 700; margin-bottom: 6px;">💕 Breeding Opportunities</div>
                            ${breedingInfo.pairs.map(pair => `
                                <div style="color: #e5e7eb; font-size: 0.85rem; margin-bottom: 2px;">
                                    ${pair.male} ♂️ + ${pair.female} ♀️ (${pair.species})
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <div style="border-top: 1px solid #1e293b; padding-top: 10px; margin-top: 10px;">
                        <div style="font-weight: 700; color: #e5e7eb; margin-bottom: 8px;">🐾 Animals (${exhibit.animals.length})</div>
                        ${exhibit.animals.length === 0 ? 
                            '<p style="color: #9ca3af; font-size: 0.9rem;">No animals yet. Buy some from the Shop!</p>' :
                            `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px;">
                                ${exhibit.animals.map(animal => renderAnimalCard(animal, id)).join('')}
                            </div>`
                        }
                    </div>
                    
                    <!-- 🔥 UPGRADES SECTION -->
                    <div style="border-top: 1px solid #1e293b; padding-top: 12px; margin-top: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="font-weight: 700; color: #e5e7eb;">⬆️ Upgrades</div>
                            <div style="font-size: 0.8rem; color: #9ca3af;">${installedUpgrades.length} installed</div>
                        </div>
                        
                        ${installedUpgrades.length > 0 ? `
                            <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px;">
                                ${installedUpgrades.map(u => `
                                    <div style="background: rgba(34, 197, 94, 0.15); border: 1px solid #22c55e; border-radius: 6px; padding: 4px 8px; display: flex; align-items: center; gap: 4px; font-size: 0.8rem;" title="${u.name}: ${u.description}">
                                        <span>${u.icon}</span>
                                        <span style="color: #e5e7eb;">${u.name}</span>
                                        <button onclick="event.stopPropagation(); window.removeUpgrade('${id}', '${u.id}')" 
                                            style="background: transparent; border: none; color: #ef4444; cursor: pointer; font-size: 0.9rem; padding: 0 2px;" 
                                            title="Remove (30% refund)">✕</button>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        
                        ${exhibitEffects.happiness > 0 || exhibitEffects.attraction > 0 || exhibitEffects.income > 0 ? `
                            <div style="background: #1e293b; padding: 8px; border-radius: 6px; font-size: 0.8rem; margin-bottom: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
                                ${exhibitEffects.happiness > 0 ? `<span style="color: #22c55e;">😊 +${exhibitEffects.happiness} happiness</span>` : ''}
                                ${exhibitEffects.attraction > 0 ? `<span style="color: #fbbf24;">⭐ +${exhibitEffects.attraction} attraction</span>` : ''}
                                ${exhibitEffects.income > 0 ? `<span style="color: #22c55e;">💰 +$${exhibitEffects.income}/day</span>` : ''}
                                ${exhibitEffects.visitorCapacity > 0 ? `<span style="color: #3b82f6;">👥 +${exhibitEffects.visitorCapacity} visitors</span>` : ''}
                                ${exhibitEffects.ratingBonus > 0 ? `<span style="color: #a855f7;">📈 +${exhibitEffects.ratingBonus} rating</span>` : ''}
                                ${exhibitEffects.fenceDecayReduction < 1 ? `<span style="color: #3b82f6;">🛡️ -${Math.round((1-exhibitEffects.fenceDecayReduction)*100)}% fence decay</span>` : ''}
                            </div>
                        ` : ''}
                        
                        ${!isUnderConstruction && purchasableUpgrades.length > 0 ? `
                            <details style="margin-bottom: 8px;">
                                <summary style="cursor: pointer; color: #3b82f6; font-size: 0.9rem; font-weight: 600; padding: 4px 0;">
                                    🛒 Browse Upgrades (${purchasableUpgrades.length} available)
                                </summary>
                                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; margin-top: 8px;">
                                    ${purchasableUpgrades.map(u => `
                                        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px;">
                                            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                                                <span style="font-size: 1.3rem;">${u.icon}</span>
                                                <span style="font-weight: 700; color: #e5e7eb; font-size: 0.9rem;">${u.name}</span>
                                            </div>
                                            <p style="color: #9ca3af; font-size: 0.75rem; margin: 0 0 6px; line-height: 1.3;">${u.description}</p>
                                            <div style="font-size: 0.7rem; color: #64748b; margin-bottom: 6px;">
                                                ${u.effects.happiness ? `😊+${u.effects.happiness} ` : ''}
                                                ${u.effects.attraction ? `⭐+${u.effects.attraction} ` : ''}
                                                ${u.effects.income ? `💰+$${u.effects.income} ` : ''}
                                                ${u.effects.visitorCapacity ? `👥+${u.effects.visitorCapacity} ` : ''}
                                                ${u.effects.ratingBonus ? `📈+${u.effects.ratingBonus} ` : ''}
                                            </div>
                                            <button onclick="window.buyUpgrade('${id}', '${u.id}')" 
                                                style="width: 100%; padding: 6px; background: ${state.money >= u.cost ? '#22c55e' : '#475569'}; color: ${state.money >= u.cost ? '#000' : '#9ca3af'}; border: none; border-radius: 6px; font-weight: 700; cursor: ${state.money >= u.cost ? 'pointer' : 'not-allowed'}; font-size: 0.85rem;"
                                                ${state.money < u.cost ? 'disabled' : ''}>
                                                💰 $${u.cost.toLocaleString()}
                                            </button>
                                        </div>
                                    `).join('')}
                                </div>
                            </details>
                        ` : ''}
                        
                        ${isUnderConstruction ? `
                            <div style="color: #64748b; font-size: 0.85rem; font-style: italic;">🚧 Upgrades available after construction completes.</div>
                        ` : purchasableUpgrades.length === 0 && installedUpgrades.length === 0 ? `
                            <div style="color: #64748b; font-size: 0.85rem; font-style: italic;">No upgrades available for this exhibit type/size.</div>
                        ` : purchasableUpgrades.length === 0 && installedUpgrades.length > 0 ? `
                            <div style="color: #64748b; font-size: 0.85rem; font-style: italic;">✅ All available upgrades installed!</div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
    }

    html += `</div>`;
    exhibitsEl.innerHTML = html;
}

function getBreedingOpportunities(exhibit) {
    if (exhibit.buildDaysRemaining > 0) return { canBreed: false, pairs: [] };
    
    const speciesGroups = {};
    exhibit.animals.forEach(animal => {
        const species = animal.id;
        if (!speciesGroups[species]) speciesGroups[species] = [];
        speciesGroups[species].push(animal);
    });
    
    const pairs = [];
    for (const species in speciesGroups) {
        const group = speciesGroups[species];
        const males = group.filter(a => a.gender === 'male' && getLifeStage(a.ageDays || 0).stage === 'adult');
        const females = group.filter(a => a.gender === 'female' && getLifeStage(a.ageDays || 0).stage === 'adult' && !a.isPregnant);
        
        if (males.length > 0 && females.length > 0) {
            const speciesData = data.animals.find(a => a.id === species);
            pairs.push({
                species: speciesData?.name || species,
                male: males[0].name,
                female: females[0].name
            });
        }
    }
    
    return {
        canBreed: pairs.length > 0,
        pairs: pairs
    };
}

function renderAnimalCard(animal, exhibitId) {
    const stage = getLifeStage(animal.ageDays || 0);
    const health = animal.health ?? 100;
    const healthColor = health >= 70 ? '#22c55e' : health >= 40 ? '#f59e0b' : '#ef4444';
    
    const genderEmoji = animal.gender === 'male' ? '♂️' : '♀️';
    const genderColor = animal.gender === 'male' ? '#3b82f6' : '#ec4899';
    
    const statusBadges = [];
    if (animal.bornInZoo) statusBadges.push('<span style="background: rgba(34, 197, 94, 0.2); color: #22c55e; padding: 2px 6px; border-radius: 8px; font-size: 0.7rem;">🏠 Zoo Born</span>');
    if (animal.sick) statusBadges.push('<span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 2px 6px; border-radius: 8px; font-size: 0.7rem;">🤒 Sick</span>');
    if (animal.wasHungry) statusBadges.push('<span style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; padding: 2px 6px; border-radius: 8px; font-size: 0.7rem;">🍖 Hungry</span>');

    const animalIdentifier = animal.uid || animal.name;

    return `
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px; cursor: pointer;" onclick="window.showAnimalDetails('${exhibitId}', '${animalIdentifier}')">
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
            <div style="height: 4px; background: #0f172a; border-radius: 2px; overflow: hidden; margin-bottom: 4px;">
                <div style="height: 100%; width: ${health}%; background: ${healthColor};"></div>
            </div>
            
            ${animal.isPregnant ? `
                <div style="background: rgba(236, 72, 153, 0.15); border: 1px solid #ec4899; border-radius: 6px; padding: 6px; margin-top: 6px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span style="font-size: 0.75rem; color: #f9a8d4; font-weight: 700;">🤰 Pregnant</span>
                        <span style="font-size: 0.75rem; color: #ec4899; font-weight: 700;">${animal.daysUntilBirth}d left</span>
                    </div>
                    <div style="height: 4px; background: #1e293b; border-radius: 2px; overflow: hidden;">
                        <div style="height: 100%; width: ${getPregnancyProgress(animal)}%; background: linear-gradient(90deg, #ec4899, #f472b6);"></div>
                    </div>
                </div>
            ` : ''}
            
            ${statusBadges.length > 0 ? `
                <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 6px;">
                    ${statusBadges.join('')}
                </div>
            ` : ''}
        </div>
    `;
}

function getPregnancyProgress(animal) {
    if (!animal.isPregnant) return 0;
    const totalGestation = 60;
    const elapsed = totalGestation - animal.daysUntilBirth;
    return Math.min(100, (elapsed / totalGestation) * 100);
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

    const cleanerCapacity = getCleanerCapacity();
    if (cleanerCapacity === 0) {
        alert("You need to hire at least one janitor to repair fences! Go to the Staff tab to hire maintenance workers.");
        return;
    }

    const repairCost = Math.ceil((100 - fence) * 2);

    if (state.money < repairCost) {
        alert(`Not enough money! Need $${repairCost}`);
        return;
    }

    if (!confirm(`Repair fence for $${repairCost}?\n\nThis will use one of your ${cleanerCapacity} janitor(s).`)) return;

    state.money -= repairCost;
    exhibit.fenceCondition = 100;

    eventBus.emit('FENCE_REPAIRED', {
        exhibitName: exhibit.name,
        cost: repairCost
    });

    renderExhibits();
    eventBus.emit('DAY_ADVANCED');
}

export function showAnimalDetails(exhibitId, animalIdentifier) {
    const exhibit = state.exhibits[exhibitId];
    if (!exhibit) {
        console.error('Exhibit not found:', exhibitId);
        return;
    }

    let animal = exhibit.animals.find(a => a.uid === animalIdentifier);
    if (!animal) {
        animal = exhibit.animals.find(a => a.name === animalIdentifier);
    }
    
    if (!animal) {
        console.error('Animal not found:', animalIdentifier);
        alert('Animal not found!');
        return;
    }

    const stage = getLifeStage(animal.ageDays || 0);
    const health = animal.health ?? 100;
    const genderEmoji = animal.gender === 'male' ? '♂️ Male' : '♀️ Female';
    const speciesData = data.animals.find(a => a.id === animal.id);

    let parentInfo = '';
    if (animal.bornInZoo && animal.mother) {
        let motherName = 'Unknown';
        let fatherName = 'Unknown';
        
        for (const ex of Object.values(state.exhibits)) {
            const mom = ex.animals.find(a => a.uid === animal.mother);
            if (mom) motherName = mom.name;
            if (animal.father) {
                const dad = ex.animals.find(a => a.uid === animal.father);
                if (dad) fatherName = dad.name;
            }
        }
        
        parentInfo = `
            <div style="background: #0f172a; padding: 10px; border-radius: 6px; font-size: 0.85rem; color: #9ca3af; margin-bottom: 15px;">
                <strong style="color: #e5e7eb;">👨‍👩‍👧 Family:</strong><br>
                Mother: ${motherName}<br>
                Father: ${fatherName}
            </div>
        `;
    }

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
                    <div style="font-size: 0.75rem; color: #9ca3af;">Born in Zoo</div>
                    <div style="font-weight: 700; color: ${animal.bornInZoo ? '#22c55e' : '#9ca3af'};">${animal.bornInZoo ? 'Yes 🏠' : 'No'}</div>
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
                    <div style="height: 6px; background: #1e293b; border-radius: 3px; overflow: hidden; margin-top: 6px;">
                        <div style="height: 100%; width: ${getPregnancyProgress(animal)}%; background: linear-gradient(90deg, #ec4899, #f472b6);"></div>
                    </div>
                </div>
            ` : ''}
            
            ${parentInfo}
            
            <button onclick="window.openTransferModal('${exhibitId}', '${animal.uid || animal.name}')" 
                style="width: 100%; padding: 12px; background: #3b82f6; color: #fff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 1rem;">
                🔄 Transfer to Another Exhibit
            </button>
        </div>
    `;
    
    document.body.appendChild(alertBox);
}

export function openTransferModal(currentExhibitId, animalIdentifier) {
    const existingModal = document.querySelector('div[style*="position: fixed"]');
    if (existingModal) existingModal.remove();

    const currentExhibit = state.exhibits[currentExhibitId];
    if (!currentExhibit) return;

    let animal = currentExhibit.animals.find(a => a.uid === animalIdentifier);
    if (!animal) {
        animal = currentExhibit.animals.find(a => a.name === animalIdentifier);
    }
    if (!animal) return;

    const speciesData = data.animals.find(a => a.id === animal.id);
    const requiredSize = speciesData?.requiredExhibitSize || 'small';

    const compatibleExhibits = [];
    for (const id in state.exhibits) {
        if (id === currentExhibitId) continue;
        
        const exhibit = state.exhibits[id];
        if (exhibit.buildDaysRemaining > 0) continue;
        
        const exhibitType = EXHIBIT_TYPES[exhibit.size];
        if (!exhibitType) continue;
        
        const sizeOrder = ['small', 'medium', 'large'];
        const requiredIndex = sizeOrder.indexOf(requiredSize);
        const exhibitIndex = sizeOrder.indexOf(exhibit.size);
        
        if (exhibitIndex < requiredIndex) continue;
        if (exhibit.animals.length >= exhibitType.maxAnimals) continue;
        
        compatibleExhibits.push({
            id: id,
            name: exhibit.name,
            size: exhibit.size,
            animals: exhibit.animals.length,
            maxAnimals: exhibitType.maxAnimals
        });
    }

    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; justify-content: center; align-items: center;';
    
    let exhibitsHTML = '';
    if (compatibleExhibits.length === 0) {
        exhibitsHTML = '<p style="color: #9ca3af; text-align: center; padding: 20px;">No compatible exhibits available.</p>';
    } else {
        compatibleExhibits.forEach(ex => {
            exhibitsHTML += `
                <div style="background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 12px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s;" 
                    onclick="window.transferAnimal('${currentExhibitId}', '${ex.id}', '${animal.uid || animal.name}')"
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
                    <h2 style="margin: 0; color: #e5e7eb;">🔄 Transfer ${animal.name}</h2>
                    <p style="margin: 4px 0 0; color: #9ca3af; font-size: 0.9rem;">From: ${currentExhibit.name}</p>
                </div>
                <button onclick="this.closest('div[style*=fixed]').remove()" style="background: #ef4444; color: #fff; border: none; border-radius: 6px; padding: 6px 12px; cursor: pointer; font-weight: 700;">✕</button>
            </div>
            
            <h3 style="color: #e5e7eb; margin-bottom: 10px;">Select Destination:</h3>
            ${exhibitsHTML}
        </div>
    `;
    
    document.body.appendChild(modal);
}

export function transferAnimal(fromExhibitId, toExhibitId, animalIdentifier) {
    const fromExhibit = state.exhibits[fromExhibitId];
    const toExhibit = state.exhibits[toExhibitId];
    
    if (!fromExhibit || !toExhibit) {
        alert("Invalid exhibit!");
        return;
    }

    let animalIndex = fromExhibit.animals.findIndex(a => a.uid === animalIdentifier);
    if (animalIndex === -1) {
        animalIndex = fromExhibit.animals.findIndex(a => a.name === animalIdentifier);
    }
    if (animalIndex === -1) {
        alert("Animal not found!");
        return;
    }

    const animal = fromExhibit.animals[animalIndex];

    fromExhibit.animals.splice(animalIndex, 1);
    toExhibit.animals.push(animal);

    const modal = document.querySelector('div[style*="position: fixed"]');
    if (modal) modal.remove();

    eventBus.emit('ANIMAL_TRANSFERRED', {
        animalName: animal.name,
        fromExhibit: fromExhibit.name,
        toExhibit: toExhibit.name
    });

    renderExhibits();
}

export function showBabyNamingModal(babyInfo) {
    const existingModal = document.getElementById('babyNamingModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'babyNamingModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 2000; display: flex; justify-content: center; align-items: center;';
    
    const defaultName = generateBabyName(babyInfo.species, babyInfo.gender);
    
    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #1e293b, #334155); padding: 40px; border-radius: 16px; max-width: 500px; width: 90%; border: 3px solid #ec4899; text-align: center;">
            <div style="font-size: 4rem; margin-bottom: 10px;">🍼</div>
            <h2 style="margin: 0 0 10px; color: #f9a8d4; font-size: 1.8rem;">A New ${babyInfo.species} is Born!</h2>
            <p style="color: #e5e7eb; margin-bottom: 20px;">
                <strong>${babyInfo.motherName}</strong> has given birth to a ${babyInfo.gender} baby!<br>
                <span style="color: #9ca3af; font-size: 0.9rem;">Father: ${babyInfo.fatherName}</span>
            </p>
            
            <label style="display: block; color: #e5e7eb; font-weight: 700; margin-bottom: 8px; text-align: left;">Name your new baby:</label>
            <input type="text" id="babyNameInput" value="${defaultName}" maxlength="20"
                style="width: 100%; padding: 12px; font-size: 1.1rem; background: #0f172a; color: #e5e7eb; border: 2px solid #ec4899; border-radius: 8px; text-align: center; margin-bottom: 10px;"
                placeholder="Enter a name...">
            
            <button onclick="window.randomizeBabyName('${babyInfo.species}', '${babyInfo.gender}')" 
                style="padding: 6px 12px; background: #334155; color: #e5e7eb; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem; margin-bottom: 20px;">
                🎲 Randomize Name
            </button>
            
            <div style="display: flex; gap: 10px;">
                <button onclick="window.confirmBabyName('${babyInfo.babyUid}')" 
                    style="flex: 1; padding: 12px; background: #22c55e; color: #000; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 1rem;">
                    ✅ Confirm Name
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(() => {
        const input = document.getElementById('babyNameInput');
        if (input) {
            input.focus();
            input.select();
        }
    }, 100);
}

// =====================================================================
// UPGRADE ACTIONS
// =====================================================================

export function buyUpgrade(exhibitId, upgradeId) {
    const exhibit = state.exhibits[exhibitId];
    if (!exhibit) {
        alert("Exhibit not found!");
        return;
    }

    const upgradeData = data.upgrades.find(u => u.id === upgradeId);
    if (!upgradeData) {
        alert("Upgrade not found!");
        return;
    }

    const check = canInstallUpgrade(exhibit, upgradeId);
    if (!check.allowed) {
        alert(`Cannot install: ${check.reason}`);
        return;
    }

    if (state.money < upgradeData.cost) {
        alert(`Not enough money! Need $${upgradeData.cost}`);
        return;
    }

    if (!confirm(`Install ${upgradeData.icon} ${upgradeData.name} for $${upgradeData.cost}?`)) {
        return;
    }

    state.money -= upgradeData.cost;
    if (!exhibit.upgrades) exhibit.upgrades = [];
    exhibit.upgrades.push(upgradeId);

    eventBus.emit('UPGRADE_INSTALLED', {
        exhibitName: exhibit.name,
        upgradeName: upgradeData.name,
        cost: upgradeData.cost
    });

    renderExhibits();
}

export function removeUpgrade(exhibitId, upgradeId) {
    const exhibit = state.exhibits[exhibitId];
    if (!exhibit) return;

    const upgradeData = data.upgrades.find(u => u.id === upgradeId);
    if (!upgradeData) return;

    const refund = Math.floor(upgradeData.cost * 0.3);

    if (!confirm(`Remove ${upgradeData.name}?\nYou'll receive a $${refund} refund (30% of cost).`)) {
        return;
    }

    exhibit.upgrades = exhibit.upgrades.filter(id => id !== upgradeId);
    state.money += refund;

    eventBus.emit('UPGRADE_REMOVED', {
        exhibitName: exhibit.name,
        upgradeName: upgradeData.name,
        refund: refund
    });

    renderExhibits();
}

// =====================================================================
// HELPERS
// =====================================================================

const BABY_MALE_NAMES = ['Cub', 'Junior', 'Tiny', 'Little', 'Baby', 'Prince', 'Duke', 'Sir'];
const BABY_FEMALE_NAMES = ['Cub', 'Junior', 'Tiny', 'Little', 'Baby', 'Princess', 'Duchess', 'Lady'];

function generateBabyName(species, gender) {
    const names = gender === 'male' ? BABY_MALE_NAMES : BABY_FEMALE_NAMES;
    const prefix = names[Math.floor(Math.random() * names.length)];
    return `${species} ${prefix}`;
}

window.randomizeBabyName = (species, gender) => {
    const input = document.getElementById('babyNameInput');
    if (input) {
        input.value = generateBabyName(species, gender);
    }
};

window.confirmBabyName = (babyUid) => {
    const input = document.getElementById('babyNameInput');
    const newName = input?.value.trim();
    
    if (!newName) {
        alert("Please enter a name!");
        return;
    }
    
    if (renameBaby(babyUid, newName)) {
        const modal = document.getElementById('babyNamingModal');
        if (modal) modal.remove();
        
        eventBus.emit('BABY_NAMED', { babyUid, newName });
        renderExhibits();
    }
};

// Expose to window
window.buildExhibit = buildExhibit;
window.repairFence = repairFence;
window.showAnimalDetails = showAnimalDetails;
window.openTransferModal = openTransferModal;
window.transferAnimal = transferAnimal;
window.showBabyNamingModal = showBabyNamingModal;
window.buyUpgrade = buyUpgrade;
window.removeUpgrade = removeUpgrade;
window.attemptBreeding = (exhibitId) => {
    if (attemptBreeding(exhibitId)) {
        renderExhibits();
    }
};
