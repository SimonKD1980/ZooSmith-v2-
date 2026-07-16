// js/main.js
import { state } from './engine/GameState.js';
import { eventBus } from './engine/EventBus.js';
import { advanceDay } from './engine/Engine.js';
import { loadAllData } from './engine/data.js';
import { FOOD_TYPES } from './engine/constants.js';
import { 
    getKeeperCapacity, 
    getKeeperDemand, 
    getCleanerCapacity, 
    getCleanerDemand,
    isUnderstaffed 
} from './engine/systems/StaffSystem.js';

// --- UI REFERENCES ---
const moneyEl = document.getElementById('money');
const dayEl = document.getElementById('day');
const ratingEl = document.getElementById('rating');
const satisfactionEl = document.getElementById('satisfaction');
const endDayBtn = document.getElementById('endDayBtn');
const logEl = document.getElementById('log');
const exhibitStatusEl = document.getElementById('exhibitStatus');
const visitorStatusEl = document.getElementById('visitorStatus');
const foodStatusEl = document.getElementById('foodStatus');
const staffStatusEl = document.getElementById('staffStatus'); // ← ADD THIS

// --- UI UPDATE FUNCTION ---
function updateUI() {
    moneyEl.textContent = state.money.toLocaleString();
    dayEl.textContent = state.day;
    ratingEl.textContent = state.zooRating;
    satisfactionEl.textContent = state.visitorSatisfaction;

    updateExhibitStatus();
    updateVisitorStatus();
    updateFoodStatus();
    updateStaffStatus(); // ← ADD THIS
}

// ... (keep all existing update functions)

// ADD THIS NEW FUNCTION
function updateStaffStatus() {
    if (!staffStatusEl) return;

    const keeperCapacity = getKeeperCapacity();
    const keeperDemand = getKeeperDemand();
    const cleanerCapacity = getCleanerCapacity();
    const cleanerDemand = getCleanerDemand();
    const understaffed = isUnderstaffed();

    let html = '<h3 style="margin: 0 0 10px 0;">👷 Staff Overview</h3>';
    
    html += `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
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
                    $${state.dailyReport.staffExpense || 0}
                </div>
                <div style="font-size: 0.75rem; color: #9ca3af; margin-top: 4px;">
                    ${state.hiredStaff.length} staff hired
                </div>
            </div>
        </div>
    `;

    if (understaffed) {
        html += `
            <div style="margin-top: 12px; padding: 10px; background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; border-radius: 6px; text-align: center;">
                <div style="color: #fca5a5; font-weight: 700;">⚠️ UNDERSTAFFED</div>
                <div style="color: #e5e7eb; font-size: 0.85rem; margin-top: 4px;">
                    Animals may go hungry and facilities may get dirty!
                </div>
            </div>
        `;
    }

    staffStatusEl.innerHTML = html;
}

// ... (keep all existing event listeners)

// ADD THESE NEW EVENT LISTENERS
eventBus.on('STAFF_EXPENSE', (data) => {
    logMessage(`💰 Staff salaries: -$${data.amount}`);
});

eventBus.on('UNDERSTAFFED', (data) => {
    logMessage(`⚠️ UNDERSTAFFED! Keepers: ${data.keeperCapacity}/${data.keeperDemand} | Cleaners: ${data.cleanerCapacity}/${data.cleanerDemand}`);
});

// ... (keep the rest)
