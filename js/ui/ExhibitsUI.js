// js/ui/ExhibitsUI.js
import { state } from '../engine/GameState.js';
import { eventBus } from '../engine/EventBus.js';
import { data } from '../engine/data.js';
import { getLifeStage } from '../engine/constants.js';
import { attemptBreeding, renameBaby } from '../engine/systems/WildlifeSystem.js';
import { getCleanerCapacity } from '../engine/systems/StaffSystem.js';
import { getAvailableUpgrades, canInstallUpgrade, getExhibitEffects } from '../engine/systems/UpgradeSystem.js';

let currentZoneFilter = 'all';

export function renderExhibits() {
    const exhibitsEl = document.getElementById('exhibits');
    if (!exhibitsEl) return;

    let html = '';

    // 1. Dynamic Zone Filter Bar
    const uniqueZones = getUniqueZones();
    html += `
        <div class="status-panel" style="padding: 15px;">
            <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                <span style="font-weight: 700; color: #e5e7eb; margin-right: 10px;">🗺️ Filter by Zone:</span>
                <button onclick="window.setZoneFilter('all')" 
                    style="padding: 6px 12px; background: ${currentZoneFilter === 'all' ? '#22c55e' : '#1e293b'}; color: ${currentZoneFilter === 'all' ? '#000' : '#e5e7eb'}; border: 1px solid #334155; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    All Zones
                </button>
                ${uniqueZones.map(zone => `
                    <button onclick="window.setZoneFilter('${zone}')" 
                        style="padding: 6px 12px; background: ${currentZoneFilter === zone ? getZoneColor(zone) : '#1e293b'}; color: ${currentZoneFilter === zone ? '#000' : '#e5e7eb'}; border: 1px solid #334155; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        ${zone}
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    // 2. Build New Exhibit Section (Nested Loop: Type -> Sizes)
    html += `
        <div class="status-panel">
            <h3>🏗️ Build New Exhibit</h3>
            <p style="color: #9ca3af; margin-bottom: 15px;">Choose a habitat type and size.</p>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px;">
    `;

    for (const typeKey in data.exhibitTypes) {
        const typeData = data.exhibitTypes[typeKey];
        
        for (const sizeKey in typeData.sizes) {
            const sizeData = typeData.sizes[sizeKey];
            const canAfford = state.money >= sizeData.cost;

            html += `
                <div style="background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 15px; display: flex; flex-direction: column;">
                    <div style="text-align: center; font-size: 2rem; margin-bottom: 5px;">${typeData.icon}</div>
                    <h4 style="margin: 0 0 4px; color: #e5e7eb; text-align: center; font-size: 1rem;">${sizeKey.charAt(0).toUpperCase() + sizeKey.slice(1)} ${typeData.name}</h4>
                    <p style="color: #9ca3af; font-size: 0.75rem; margin: 0 0 10px; text-align: center; flex-grow: 1;">${typeData.description}</p>
                    <div style="font-size: 0.8rem; color: #9ca3af; text-align: center; margin-bottom: 4px;">
                        🐾 Max ${sizeData.maxAnimals} • 📅 ${sizeData.buildDays} days
                    </div>
                    <div style="font-size: 1.1rem; font-weight: 800; color: #22c55e; text-align: center; margin-bottom: 10px;">
                        💰 $${sizeData.cost.toLocaleString()}
                    </div>
                    <button onclick="window.buildExhibit('${sizeKey}', '${typeKey}')" 
                        style="width: 100%; padding: 8px; background: ${canAfford ? '#22c55e' : '#475569'}; color: ${canAfford ? '#000' : '#9ca3af'}; border: none; border-radius: 8px; font-weight: 700; cursor: ${canAfford ? 'pointer' : 'not-allowed'}; font-size: 0.9rem;"
                        ${!canAfford ? 'disabled' : ''}>
                        ${canAfford ? '️ Build' : '💸 Can\'t Afford'}
                    </button>
                </div>
            `;
        }
    }
    html += `</div></div>`;

    // 3. Current Exhibits Section
    html += `<div class="status-panel"><h3>🏞️ Your Exhibits</h3>`;

    const filteredExhibitIds = Object.keys(state.exhibits).filter(id => {
        if (currentZoneFilter === 'all') return true;
        return state.exhibits[id].zone === currentZoneFilter;
    });

    if (filteredExhibitIds.length === 0) {
        html += '<p style="color: #9ca3af;">No exhibits found for this filter.</p>';
    } else {
        filteredExhibitIds.forEach(id => {
            const exhibit = state.exhibits[id];
            
            // 🔥 Look up data from the nested JSON
            const typeData = data.exhibitTypes[exhibit.type] || { name: 'Unknown', icon: '❓', sizes: {} };
            const sizeData = typeData.sizes[exhibit.size] || { maxAnimals: 0, upkeep: 0, buildDays: 0 };
            
            const fence = exhibit.fenceCondition ?? 100;
            const cleanliness = exhibit.cleanliness ?? 100;
            const fenceColor = fence >= 70 ? '#22c55e' : fence >= 50 ? '#f59e0b' : fence >= 30 ? '#ef4444' : '#dc2626';
            const cleanColor = cleanliness >= 70 ? '#22c55e' : cleanliness >= 50 ? '#f59e0b' : cleanliness >= 30 ? '#ef4444' : '#dc2626';
            const isUnderConstruction = exhibit.buildDaysRemaining > 0;
            
            const repairCost = Math.ceil((100 - fence) * 2);
            const breedingInfo = getBreedingOpportunities(exhibit);
            const hasJanitors = getCleanerCapacity() > 0;

            const zoneName = exhibit.zone || 'General';
            const zoneColor = getZoneColor(zoneName);
            
            const typeBadge = `<span style="background: ${exhibit.type === 'vivarium' ? '#f59e0b' : exhibit.type === 'aquarium' ? '#3b82f6' : '#22c55e'}; color: #000; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; margin-left: 8px;">${typeData.icon} ${typeData.name}</span>`;

            html += `
                <div style="background: #0f172a; border: 1px solid ${isUnderConstruction ? '#f59e0b' : '#334155'}; border-radius: 10px; padding: 15px; margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;">
                        <div>
                            <h4 style="margin: 0; color: #e5e7eb; font-size: 1.2rem;">
                                ${typeData.icon} ${exhibit.name}
                                ${typeBadge}
                                ${isUnderConstruction ? '<span style="background: #f59e0b; color: #000; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; margin-left: 8px;">🚧 Building</span>' : ''}
                            </h4>
                            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                                <span style="background: ${zoneColor}22; color: ${zoneColor}; border: 1px solid ${zoneColor}; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 700;">
                                    🗺️ ${zoneName}
                                </span>
                                <button onclick="window.renameExhibitZone('${id}')" style="background: transparent; border: none; color: #9ca3af; cursor: pointer; font-size: 0.9rem;" title="Rename Zone">️</button>
                            </div>
                            <div style="color: #9ca3af; font-size: 0.85rem; margin-top: 4px;">
                                ${sizeKey.charAt(0).toUpperCase() + sizeKey.slice(1)} • ${exhibit.animals.length}/${sizeData.maxAnimals} animals • $${sizeData.upkeep}/day upkeep
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
                            <div style="color: #fbbf24; font-weight: 700; margin-bottom: 4px;"> Under Construction</div>
                            <div style="color: #e5e7eb; font-size: 0.9rem;">${exhibit.buildDaysRemaining} day${exhibit.buildDaysRemaining !== 1 ? 's' : ''} remaining</div>
                            <div style="height: 6px; background: #1e293b; border-radius: 3px; margin-top: 6px; overflow: hidden;">
                                <div style="height: 100%; width: ${((sizeData.buildDays - exhibit.buildDaysRemaining) / sizeData.buildDays) * 100}%; background: #f59e0b;"></div>
                            </div>
                        </div>
                    ` : `
                        <div style="display: flex; gap: 15px; font-size: 0.9rem; margin-bottom: 10px; flex-wrap: wrap;">
                            <div>🔧 Fence: <strong style="color: ${fenceColor}">${fence.toFixed(1)}%</strong></div>
                            <div>✨ Clean: <strong style="color: ${cleanColor}">${cleanliness.toFixed(1)}%</strong></div>
                        </div>
                    `}
                    <div style="border-top: 1px solid #1e293b; padding-top: 10px; margin-top: 10px;">
                        <div style="font-weight: 700; color: #e5e7eb; margin-bottom: 8px;">🐾 Animals (${exhibit.animals.length}/${sizeData.maxAnimals})</div>
                        ${exhibit.animals.length === 0 ? 
                            '<p style="color: #9ca3af; font-size: 0.9rem;">No animals yet. Buy some from the Shop!</p>' :
                            `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px;">
                                ${exhibit.animals.map(animal => renderAnimalCard(animal, id)).join('')}
                            </div>`
                        }
                    </div>
                </div>
            `;
        });
    }
    html += `</div>`;
    exhibitsEl.innerHTML = html;
}

// Helper functions for breeding and animal cards (kept brief for space, assume existing logic)
function getBreedingOpportunities(exhibit) { return { canBreed: false, pairs: [] }; } // Replace with your actual logic
function renderAnimalCard(animal, exhibitId) { return `<div>${animal.name}</div>`; } // Replace with your actual logic
function getPregnancyProgress(animal) { return 0; }

// =====================================================================
// ACTIONS
// =====================================================================
export function buildExhibit(size, type) {
    const typeData = data.exhibitTypes[type];
    const sizeData = typeData.sizes[size];
    
    if (!typeData || !sizeData) return;
    
    if (state.money < sizeData.cost) {
        alert(`Not enough money! Need $${sizeData.cost}`);
        return;
    }
    
    const name = prompt(`Name your new ${size} ${typeData.name}:`, `${typeData.name} ${Object.keys(state.exhibits).length + 1}`);
    if (!name) return;

    const zoneName = prompt(`What Zone does this belong to?`, "General");
    const finalZone = zoneName ? zoneName.trim() : "General";

    state.money -= sizeData.cost;

    const newId = 'exhibit_' + Date.now();
    state.exhibits[newId] = {
        id: newId,
        name: name,
        size: size,
        type: type,
        zone: finalZone, 
        animals: [],
        upgrades: [],
        buildDaysRemaining: sizeData.buildDays,
        fenceCondition: 100,
        cleanliness: 100
    };

    eventBus.emit('EXHIBIT_BUILD_STARTED', { name: name, size: size, type: type, cost: sizeData.cost, days: sizeData.buildDays });
    renderExhibits();
    eventBus.emit('DAY_ADVANCED');
}

export function repairFence(exhibitId) {
    // ... keep your existing repair logic ...
}

export function showAnimalDetails(exhibitId, animalIdentifier) {
    // ... keep your existing details logic ...
}

export function openTransferModal(currentExhibitId, animalIdentifier) {
    const existingModal = document.querySelector('div[style*="position: fixed"]');
    if (existingModal) existingModal.remove();

    const currentExhibit = state.exhibits[currentExhibitId];
    if (!currentExhibit) return;

    let animal = currentExhibit.animals.find(a => a.uid === animalIdentifier);
    if (!animal) animal = currentExhibit.animals.find(a => a.name === animalIdentifier);
    if (!animal) return;

    const speciesData = data.animals.find(a => a.id === animal.id);
    const requiredSize = speciesData?.requiredExhibitSize || 'small';
    const requiredType = speciesData?.requiredExhibitType || 'standard_exhibit';
    const compatibleExhibits = [];

    const sizeRank = { small: 1, medium: 2, large: 3 };
    const requiredIndex = sizeRank[requiredSize];

    for (const id in state.exhibits) {
        if (id === currentExhibitId) continue;
        const exhibit = state.exhibits[id];
        if (exhibit.buildDaysRemaining > 0) continue;
        if (exhibit.type !== requiredType) continue;
        
        const typeData = data.exhibitTypes[exhibit.type];
        const sizeData = typeData.sizes[exhibit.size];
        if (!sizeData) continue;
        
        const exhibitIndex = sizeRank[exhibit.size];
        if (exhibitIndex < requiredIndex) continue;
        if (exhibit.animals.length >= sizeData.maxAnimals) continue;

        compatibleExhibits.push({ id: id, name: exhibit.name, size: exhibit.size, type: exhibit.type, animals: exhibit.animals.length, maxAnimals: sizeData.maxAnimals });
    }

    // ... keep your existing modal rendering logic ...
}

export function transferAnimal(fromExhibitId, toExhibitId, animalIdentifier) {
    // ... keep your existing transfer logic ...
}

// Zone Helpers
function getUniqueZones() {
    const zones = new Set();
    Object.values(state.exhibits).forEach(ex => { if (ex.zone) zones.add(ex.zone); });
    return Array.from(zones);
}

function getZoneColor(zoneName) {
    if (!zoneName) return '#64748b';
    let hash = 0;
    for (let i = 0; i < zoneName.length; i++) hash = zoneName.charCodeAt(i) + ((hash << 5) - hash);
    const colors = ['#f59e0b', '#22c55e', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e', '#eab308'];
    return colors[Math.abs(hash) % colors.length];
}

export function renameExhibitZone(exhibitId) {
    const exhibit = state.exhibits[exhibitId];
    if (!exhibit) return;
    const newName = prompt(`Rename the zone for "${exhibit.name}":`, exhibit.zone || "General");
    if (newName && newName.trim() !== '') { exhibit.zone = newName.trim(); renderExhibits(); }
}

window.setZoneFilter = (zoneId) => { currentZoneFilter = zoneId; renderExhibits(); };

// Expose to window
window.buildExhibit = buildExhibit;
window.repairFence = repairFence;
window.showAnimalDetails = showAnimalDetails;
window.openTransferModal = openTransferModal;
window.transferAnimal = transferAnimal;
window.renameExhibitZone = renameExhibitZone;
