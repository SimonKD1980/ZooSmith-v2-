// js/engine/systems/StaffSystem.js
import { state } from '../GameState.js';
import { eventBus } from '../EventBus.js';
import { data } from '../data.js';

export function processStaff() {
    console.log('🔍 STAFF DEBUG - hiredStaff:', state.hiredStaff);
    console.log('🔍 STAFF DEBUG - hiredStaff length:', state.hiredStaff?.length);
    
    let totalSalary = 0;
    
    // ONLY calculate if there are ACTUALLY hired staff
    if (state.hiredStaff && state.hiredStaff.length > 0) {
        state.hiredStaff.forEach(staffInstance => {
            const staffData = data.staff.find(s => s.id === staffInstance.typeId);
            if (staffData && staffData.salary) {
                totalSalary += staffData.salary;
            }
        });
    }
    
    // 🔥 CRITICAL: Force to 0 if no staff
    if (!state.hiredStaff || state.hiredStaff.length === 0) {
        totalSalary = 0;
    }
    
    console.log('💰 STAFF DEBUG - Calculated salary:', totalSalary);

    // 🔥 CRITICAL: Initialize dailyReport if it doesn't exist
    if (!state.dailyReport) {
        state.dailyReport = {};
    }
    
    // 🔥 CRITICAL: Explicitly set staffExpense (overwrites any ghost values)
    state.dailyReport.staffExpense = totalSalary;
    
    console.log('📊 STAFF DEBUG - dailyReport.staffExpense set to:', state.dailyReport.staffExpense);

    // Deduct salary if > 0
    if (totalSalary > 0) {
        state.money -= totalSalary;
        eventBus.emit('STAFF_EXPENSE', { amount: totalSalary });
    }
}

export function getKeeperCapacity() {
    if (!state.hiredStaff || state.hiredStaff.length === 0) return 0;
    return state.hiredStaff.reduce((sum, staff) => {
        const staffData = data.staff.find(s => s.id === staff.typeId);
        return sum + (staffData?.keeperCapacity || 0);
    }, 0);
}

export function getCleanerCapacity() {
    if (!state.hiredStaff || state.hiredStaff.length === 0) return 0;
    return state.hiredStaff.reduce((sum, staff) => {
        const staffData = data.staff.find(s => s.id === staff.typeId);
        return sum + (staffData?.cleanerCapacity || 0);
    }, 0);
}

export function getKeeperDemand() {
    let demand = 0;
    Object.values(state.exhibits || {}).forEach(exhibit => {
        demand += exhibit.animals?.length || 0;
    });
    return demand;
}

export function getCleanerDemand() {
    let demand = 0;
    Object.values(state.exhibits || {}).forEach(exhibit => {
        if (exhibit.buildDaysRemaining === 0) demand += 1;
    });
    Object.keys(state.amenities || {}).forEach(amenityId => {
        const count = state.amenities[amenityId];
        if (count > 0) demand += count;
    });
    return demand;
}

export function isUnderstaffed() {
    return getKeeperCapacity() < getKeeperDemand() || getCleanerCapacity() < getCleanerDemand();
}
