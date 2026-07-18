// js/ui/StaffUI.js
import { state } from '../engine/GameState.js';
import { eventBus } from '../engine/EventBus.js';
import { data } from '../engine/data.js';
import { 
    getKeeperCapacity, 
    getKeeperDemand, 
    getCleanerCapacity, 
    getCleanerDemand,
    isUnderstaffed 
} from '../engine/systems/StaffSystem.js';
import { isUnlocked } from '../engine/systems/ResearchSystem.js';

export function renderStaff() {
    const staffEl = document.getElementById('staff');
    if (!staffEl) return;

    const keeperCapacity = getKeeperCapacity();
    const keeperDemand = getKeeperDemand();
    const cleanerCapacity = getCleanerCapacity();
    const cleanerDemand = getCleanerDemand();
    const understaffed = isUnderstaffed();

    // Calculate total daily salary
    const totalSalary = state.hiredStaff.reduce((sum, staffInstance) => {
        const staffData = data.staff.find(s => s.id === staffInstance.typeId);
        return sum + (staffData?.salary || 0);
    }, 0);

    let html = `
        <div class="status-panel">
            <h3>👷 Staff Overview</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 15px;">
                <div style="background: #0f172a; padding: 12px; border-radius: 6px; text-align: center;">
                    <div style="font-size: 0.8rem; color: #9ca3af;">🧤 Keeper Slots</div>
                    <div style="font-size: 1.5rem; font-weight: 800; color: ${keeperCapacity >= keeperDemand ? '#22c55e' : '#ef4444'};">
                        ${keeperCapacity} / ${keeperDemand}
                    </div>
                    <div style="font-size: 0.75rem; color: #9ca3af; margin-top: 4px;">
                        ${keeperCapacity - keeperDemand >= 0 ? '✅ Adequate' : '⚠️ Need more!'}
                    </div>
                </div>
                <div style="background: #0f172a; padding: 12px; border-radius: 6px; text-align: center;">
                    <div style="font-size: 0.8rem; color: #9ca3af;">🧹 Cleaner Slots</div>
                    <div style="font-size: 1.5rem; font-weight: 800; color: ${cleanerCapacity >= cleanerDemand ? '#22c55e' : '#ef4444'};">
                        ${cleanerCapacity} / ${cleanerDemand}
                    </div>
                    <div style="font-size: 0.75rem; color: #9ca3af; margin-top: 4px;">
                        ${cleanerCapacity - cleanerDemand >= 0 ? '✅ Adequate' : '⚠️ Need more!'}
                    </div>
                </div>
                <div style="background: #0f172a; padding: 12px; border-radius: 6px; text-align: center;">
                    <div style="font-size: 0.8rem; color: #9ca3af;">💰 Daily Salaries</div>
                    <div style="font-size: 1.5rem; font-weight: 800; color: #fbbf24;">
                        $${totalSalary}
                    </div>
                    <div style="font-size: 0.75rem; color: #9ca3af; margin-top: 4px;">
                        ${state.hiredStaff.length} staff hired
                    </div>
                </div>
            </div>
            ${understaffed ? `
                <div style="padding: 10px; background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; border-radius: 6px; text-align: center;">
                    <div style="color: #fca5a5; font-weight: 700;">⚠️ UNDERSTAFFED</div>
                    <div style="color: #e5e7eb; font-size: 0.85rem; margin-top: 4px;">
                        Animals may go hungry and facilities may get dirty!
                    </div>
                </div>
            ` : ''}
        </div>

        <div class="status-panel">
            <h3>👥 Available Staff</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">
    `;

    // Render each staff type
    data.staff.forEach(staff => {
        // 🔥 Check if staff type is unlocked via research
        const isLocked = staff.id && !isUnlocked(staff.id);
        
        const hiredInstances = state.hiredStaff.filter(s => s.typeId === staff.id);
        const hiredCount = hiredInstances.length;
        const maxStaff = staff.effects?.maxStaff || 99;
        const isMaxed = hiredCount >= maxStaff;

        // Build effects display (only show if unlocked)
        let effectsHTML = '';
        if (staff.effects && !isLocked) {
            const effects = Object.entries(staff.effects)
                .filter(([key]) => !['maxStaff', 'maintenanceLevel', 'keeperSlots', 'cleanerSlots'].includes(key))
                .map(([key, val]) => {
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    return `<span style="background: rgba(34, 197, 94, 0.1); color: #22c55e; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">${label}: +${val}</span>`;
                }).join('');
            if (effects) effectsHTML = `<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">${effects}</div>`;
        }

        // Build capacity info
        let capacityInfo = '';
        if (staff.keeperSlots > 0) {
            capacityInfo += `<span style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem;">🧤 ${staff.keeperSlots} keeper slots</span>`;
        }
        if (staff.cleanerSlots > 0) {
            capacityInfo += `<span style="background: rgba(168, 85, 247, 0.1); color: #a855f7; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem;">🧹 ${staff.cleanerSlots} cleaner slots</span>`;
        }

        html += `
            <div style="background: #1e293b; border: 1px solid ${isLocked ? '#64748b' : '#334155'}; border-radius: 12px; overflow: hidden; position: relative; ${isLocked ? 'opacity: 0.7;' : ''}">
                ${isLocked ? `
                    <div style="position: absolute; top: 10px; right: 10px; background: #64748b; color: #fff; padding: 6px 12px; border-radius: 20px; font-weight: 700; font-size: 0.85rem; z-index: 10;">
                        🔒 LOCKED
                    </div>
                ` : ''}
                <div style="background: linear-gradient(135deg, #334155, #1e293b); padding: 15px; text-align: center;">
                    <span style="font-size: 3rem; ${isLocked ? 'filter: grayscale(100%);' : ''}">${staff.icon || '👤'}</span>
                    <h3 style="margin: 8px 0 4px; color: #e5e7eb;">${staff.name}</h3>
                    <div style="font-size: 0.85rem; color: #9ca3af;">${staff.role || 'Staff'} • Hired: ${hiredCount}/${maxStaff}</div>
                </div>
                <div style="padding: 15px;">
                    <p style="color: #9ca3af; font-size: 0.9rem; margin: 0 0 10px;">${isLocked ? '🔒 Research required to unlock this staff type.' : (staff.description || 'A valuable addition to your team.')}</p>
                    ${!isLocked && capacityInfo ? `<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px;">${capacityInfo}</div>` : ''}
                    ${!isLocked ? effectsHTML : ''}
                    <div style="font-size: 1.2rem; font-weight: 800; color: ${isLocked ? '#64748b' : '#22c55e'}; margin: 10px 0; text-align: center; background: ${isLocked ? 'rgba(100, 116, 139, 0.1)' : 'rgba(34, 197, 94, 0.1)'}; padding: 8px; border-radius: 8px; border: 1px solid ${isLocked ? 'rgba(100, 116, 139, 0.2)' : 'rgba(34, 197, 94, 0.2)'};">
                        💰 $${staff.cost.toLocaleString()} (hire) • $${staff.salary || 0}/day
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="${isLocked ? '' : `window.hireStaff('${staff.id}')`}" 
                            style="flex: 1; padding: 10px; background: ${isLocked ? '#475569' : '#22c55e'}; color: ${isLocked ? '#9ca3af' : '#000'}; border: none; border-radius: 8px; font-weight: 700; cursor: ${isLocked ? 'not-allowed' : 'pointer'}; font-size: 0.9rem;"
                            ${isLocked || isMaxed ? 'disabled' : ''}>
                            ${isLocked ? '🔒 Locked' : (isMaxed ? 'Max Hired' : '✅ Hire')}
                        </button>
                        <button onclick="${isLocked ? '' : `window.fireStaff('${staff.id}')`}" 
                            style="flex: 1; padding: 10px; background: ${isLocked ? '#475569' : '#ef4444'}; color: ${isLocked ? '#9ca3af' : '#fff'}; border: none; border-radius: 8px; font-weight: 700; cursor: ${isLocked ? 'not-allowed' : 'pointer'}; font-size: 0.9rem;"
                            ${isLocked || hiredCount === 0 ? 'disabled' : ''}>
                            ${isLocked ? '🔒 Locked' : (hiredCount === 0 ? 'None Hired' : '❌ Fire One')}
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;

    staffEl.innerHTML = html;
}

export function hireStaff(staffId) {
    const staff = data.staff.find(s => s.id === staffId);
    if (!staff) {
        alert("Staff type not found!");
        return;
    }

    // 🔥 Safety check for locked staff
    if (!isUnlocked(staffId)) {
        alert("This staff type is locked! Complete the required research first.");
        return;
    }

    const hiredInstances = state.hiredStaff.filter(s => s.typeId === staffId);
    const maxStaff = staff.effects?.maxStaff || 99;
    if (hiredInstances.length >= maxStaff) {
        alert(`Cannot hire more ${staff.name}! Maximum reached.`);
        return;
    }

    if (state.money < staff.cost) {
        alert(`Not enough money! Need $${staff.cost}`);
        return;
    }

    // Deduct money
    state.money -= staff.cost;

    // Create unique instance
    const newStaffInstance = {
        uid: 'staff_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        typeId: staffId,
        assignments: []
    };

    state.hiredStaff.push(newStaffInstance);

    eventBus.emit('STAFF_HIRED', {
        staffName: staff.name,
        cost: staff.cost
    });

    renderStaff();
    eventBus.emit('DAY_ADVANCED'); // Trigger UI refresh
}

export function fireStaff(staffId) {
    const staff = data.staff.find(s => s.id === staffId);
    if (!staff) {
        alert("Staff type not found!");
        return;
    }

    // 🔥 Safety check for locked staff
    if (!isUnlocked(staffId)) {
        alert("This staff type is locked!");
        return;
    }

    const hiredInstances = state.hiredStaff.filter(s => s.typeId === staffId);
    if (hiredInstances.length === 0) {
        alert("No staff to fire!");
        return;
    }

    const refundAmount = Math.floor(staff.cost * 0.2);
    
    if (!confirm(`Fire ${staff.name}?\n\nYou'll receive a severance refund of $${refundAmount}.`)) {
        return;
    }

    // Fire the oldest instance
    const instanceToFire = hiredInstances[0];
    const index = state.hiredStaff.findIndex(s => s.uid === instanceToFire.uid);
    
    if (index !== -1) {
        state.hiredStaff.splice(index, 1);
        state.money += refundAmount;

        eventBus.emit('STAFF_FIRED', {
            staffName: staff.name,
            refund: refundAmount
        });

        renderStaff();
        eventBus.emit('DAY_ADVANCED'); // Trigger UI refresh
    }
}

// Expose to window for onclick handlers
window.hireStaff = hireStaff;
window.fireStaff = fireStaff;
