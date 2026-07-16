// js/ui/AmenitiesUI.js
import { state } from '../engine/GameState.js';
import { eventBus } from '../engine/EventBus.js';
import { data } from '../engine/data.js';

export function renderAmenities() {
    const amenitiesEl = document.getElementById('amenities');
    if (!amenitiesEl) return;

    // 🔍 DEBUG
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

        // 🔥 FIX: Safely get all properties with fallbacks
        const cost = amenity.cost ?? amenity.price ?? 0;
        const revenue = amenity.revenue ?? 0;
        const capacity = amenity.capacity ?? 0;
        const maxCustomers = amenity.maxCustomers ?? 0;
        const maintenanceCost = amenity.maintenanceCost ?? 0;

        // Build stats badges
        let statsHTML = '';
        if (revenue > 0) {
            statsHTML += `<span style="background: rgba(34, 197, 94, 0.1); color: #22c55e; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">💰 Earns $${revenue}/visitor</span>`;
        }
        if (capacity > 0) {
            statsHTML += `<span style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">👥 Capacity: ${capacity}</span>`;
        }
        if (maxCustomers > 0) {
            statsHTML += `<span style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">📊 Max ${maxCustomers}/day</span>`;
        }
        if (maintenanceCost > 0) {
            statsHTML += `<span style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">🧹 $${
