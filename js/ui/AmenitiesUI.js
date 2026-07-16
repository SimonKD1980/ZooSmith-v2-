// js/ui/AmenitiesUI.js
import { state } from '../engine/GameState.js';
import { eventBus } from '../engine/EventBus.js';
import { data } from '../engine/data.js';

export function renderAmenities() {
    const amenitiesEl = document.getElementById('amenities');
    if (!amenitiesEl) return;

    if (!data.amenities || Object.keys(data.amenities).length === 0) {
        amenitiesEl.innerHTML = '<div style="text-align:center; padding:40px; color:#9ca3af;">Loading amenities...</div>';
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

        // Build stats badges
        let statsHTML = '';
        if (amenity.revenue > 0) {
            statsHTML += `<span style="background: rgba(34, 197, 94, 0.1); color: #22c55e; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">💰 Earns $${amenity.revenue}/visitor</span>`;
        }
        if (amenity.capacity > 0) {
            statsHTML += `<span style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">👥 Capacity: ${amenity.capacity}</span>`;
        }
        if (amenity.maxCustomers > 0) {
            statsHTML += `<span style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">📊 Max ${amenity.maxCustomers}/day</span>`;
        }
        if (amenity.maintenanceCost > 0) {
            statsHTML += `<span style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">🧹 $${amenity.maintenanceCost}/day upkeep</span>`;
        }

        html += `
            <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #334155, #1e293b); padding: 15px; text-align: center;">
                    <span style="font-size: 3rem;">${amenity.icon || '🏪'}</span>
                    <h3 style="margin: 8px 0 4px; color: #e5e7eb;">${amenity.name}</h3>
                    <div style="font-size: 0.85rem; color: #9ca3af;">${count} built</div>
                </div>
                <div style="padding: 15px;">
                    <p style="color: #9ca3af; font-size: 0.9rem; margin: 0 0 10px;">${amenity.description || 'A useful addition to your zoo.'}</p>
                    <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px;">
                        ${statsHTML}
                    </div>
                    <div style="font-size: 1.4rem; font-weight: 800; color: #22c55e; margin: 10px 0; text-align: center; background: rgba(34, 197, 94, 0.1); padding: 8px; border-radius: 8px; border: 1px solid rgba(34, 197, 94, 0.2);">
                        💰 $${amenity.cost.toLocaleString()}
                    </div>
                    <button onclick="window.buyAmenity('${id}')" style="width: 100%; padding: 10px; background: #22c55e; color: #000; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 1rem;">
                        Build ${amenity.name}
                    </button>
                </div>
            </div>
        `;
    }

    html += `</div>`;
    amenitiesEl.innerHTML = html;
}

export function buyAmenity(amenityId) {
    const amenity = data.amenities[amenityId];
    if (!amenity) {
        alert("Amenity not found!");
        return;
    }

    if (state.money < amenity.cost) {
        alert(`Not enough money! Need $${amenity.cost}`);
        return;
    }

    // Deduct money
    state.money -= amenity.cost;

    // Add amenity
    if (!state.amenities[amenityId]) state.amenities[amenityId] = 0;
    state.amenities[amenityId]++;

    eventBus.emit('AMENITY_BUILT', {
        amenityName: amenity.name,
        cost: amenity.cost
    });

    renderAmenities();
    eventBus.emit('DAY_ADVANCED'); // Trigger UI refresh
}

// Expose to window for onclick handlers
window.buyAmenity = buyAmenity;
