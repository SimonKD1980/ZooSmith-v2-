// js/ui/AmenitiesUI.js
import { state } from '../engine/GameState.js';
import { eventBus } from '../engine/EventBus.js';
import { data } from '../engine/data.js';
import { isUnlocked } from '../engine/systems/ResearchSystem.js';

export function renderAmenities() {
    const amenitiesEl = document.getElementById('amenities');
    if (!amenitiesEl) return;

    console.log('🔍 DEBUG: data.amenities =', data.amenities);

    if (!data.amenities || Object.keys(data.amenities).length === 0) {
        amenitiesEl.innerHTML = `
            <div style="text-align:center; padding:40px; color:#fca5a5;">
                <h3>❌ No Amenities Data Found</h3>
                <p style="color:#9ca3af;">Check your browser console (F12) for details.</p>
            </div>
        `;
        return;
    }

    // Summary of current amenities
    const summaryParts = Object.keys(data.amenities).map(id => {
        const count = state.amenities[id] || 0;
        const amenity = data.amenities[id];
        return `${count} ${amenity.name.toLowerCase()}${count !== 1 ? 's' : ''}`;
    });
    const summary = summaryParts.join(', ') || 'None';

    let html = `
        <div class="status-panel">
            <h3>🏪 Zoo Amenities Overview</h3>
            <p style="color: #9ca3af; margin: 0;">Current: ${summary}</p>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">
    `;
for (const id in data.amenities) {
    const amenity = data.amenities[id];
    const count = state.amenities[id] || 0;
    
    // 🔥 Check if amenity is unlocked
    const isLocked = !isUnlocked(id);

    const cost = amenity.cost ?? amenity.price ?? 0;
    const revenue = amenity.revenue ?? 0;
    const capacity = amenity.capacity ?? 0;
    const maxCustomers = amenity.maxCustomers ?? 0;
    const maintenanceCost = amenity.maintenanceCost ?? 0;

    let statsHTML = '';
    if (revenue > 0) statsHTML += `<span style="background: rgba(34, 197, 94, 0.1); color: #22c55e; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">💰 Earns $${revenue}/visitor</span>`;
    if (capacity > 0) statsHTML += `<span style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">👥 Capacity: ${capacity}</span>`;
    if (maxCustomers > 0) statsHTML += `<span style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">📊 Max ${maxCustomers}/day</span>`;
    if (maintenanceCost > 0) statsHTML += `<span style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">🧹 $${maintenanceCost}/day upkeep</span>`;

    html += `
        <div style="background: #1e293b; border: 1px solid ${isLocked ? '#64748b' : '#334155'}; border-radius: 12px; overflow: hidden; position: relative; ${isLocked ? 'opacity: 0.7;' : ''}">
            ${isLocked ? `
                <div style="position: absolute; top: 10px; right: 10px; background: #64748b; color: #fff; padding: 6px 12px; border-radius: 20px; font-weight: 700; font-size: 0.85rem; z-index: 10;">
                    🔒 LOCKED
                </div>
            ` : ''}
            <div style="background: linear-gradient(135deg, #334155, #1e293b); padding: 15px; text-align: center;">
                <span style="font-size: 3rem; ${isLocked ? 'filter: grayscale(100%);' : ''}">${amenity.icon || '🏪'}</span>
                <h3 style="margin: 8px 0 4px; color: #e5e7eb;">${amenity.name}</h3>
                <div style="font-size: 0.85rem; color: #9ca3af;">${count} built</div>
            </div>
            <div style="padding: 15px;">
                <p style="color: #9ca3af; font-size: 0.9rem; margin: 0 0 10px;">${isLocked ? '🔒 Research required to unlock this amenity.' : (amenity.description || 'A useful addition to your zoo.')}</p>
                <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px;">
                    ${statsHTML}
                </div>
                <div style="font-size: 1.4rem; font-weight: 800; color: ${isLocked ? '#64748b' : '#22c55e'}; margin: 10px 0; text-align: center; background: ${isLocked ? 'rgba(100, 116, 139, 0.1)' : 'rgba(34, 197, 94, 0.1)'}; padding: 8px; border-radius: 8px;">
                    💰 $${cost.toLocaleString()}
                </div>
                <button onclick="${isLocked ? '' : `window.buyAmenity('${id}')`}" 
                    style="width: 100%; padding: 10px; background: ${isLocked ? '#475569' : '#22c55e'}; color: ${isLocked ? '#9ca3af' : '#000'}; border: none; border-radius: 8px; font-weight: 700; cursor: ${isLocked ? 'not-allowed' : 'pointer'}; font-size: 1rem;"
                    ${isLocked ? 'disabled' : ''}>
                    ${isLocked ? '🔒 Locked' : `Build ${amenity.name}`}
                </button>
            </div>
        </div>
    `;
}
    
export function buyAmenity(amenityId) {
    const amenity = data.amenities[amenityId];
    if (!amenity) {
        alert("Amenity not found!");
        return;
    }

    const cost = amenity.cost ?? amenity.price ?? 0;

    if (state.money < cost) {
        alert(`Not enough money! Need $${cost}`);
        return;
    }

    state.money -= cost;

    if (!state.amenities[amenityId]) state.amenities[amenityId] = 0;
    state.amenities[amenityId]++;

    eventBus.emit('AMENITY_BUILT', {
        amenityName: amenity.name,
        cost: cost
    });

    renderAmenities();
    eventBus.emit('DAY_ADVANCED');
}

window.buyAmenity = buyAmenity;
