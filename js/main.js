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
import { renderShop } from './ui/ShopUI.js';
import { renderSupplies } from './ui/SuppliesUI.js';
import { renderStaff } from './ui/StaffUI.js';
import { renderAmenities } from './ui/AmenitiesUI.js';
import { renderExhibits } from './ui/ExhibitsUI.js';

// =====================================================================
// UI REFERENCES
// =====================================================================
const moneyEl = document.getElementById('money');
const dayEl = document.getElementById('day');
const ratingEl = document.getElementById('rating');
const satisfactionEl = document.getElementById('satisfaction');
const zooNameEl = document.getElementById('zooName');
const endDayBtn = document.getElementById('endDayBtn');
const buildExhibitBtn = document.getElementById('buildExhibitBtn');
const logEl = document.getElementById('log');

// =====================================================================
// TAB NAVIGATION
// =====================================================================
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const sectionId = btn.dataset.section;
        
        // Update active button
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update active section
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        const section = document.getElementById(sectionId);
        if (section) section.classList.add('active');
        
        // Render the appropriate tab
        if (sectionId === 'shop') renderShop();
        else if (sectionId === 'supplies') renderSupplies();
        else if (sectionId === 'staff') renderStaff();
        else if (sectionId === 'amenities') renderAmenities();
        else if (sectionId === 'exhibits') renderExhibits();
        else if (sectionId === 'visitors') renderVisitorsTab();
    });
});

// =====================================================================
// MAIN UI UPDATE (Header only - status panels are in tabs now)
// =====================================================================
function updateUI() {
    // Safety check for money
    if (typeof state.money !== 'number' || isNaN(state.money)) {
        console.error('❌ state.money is invalid:', state.money);
        state.money = 0;
    }
    
    if (moneyEl) moneyEl.textContent = state.money.toLocaleString();
    if (dayEl) dayEl.textContent = state.day;
    if (ratingEl) ratingEl.textContent = state.zooRating;
    if (satisfactionEl) satisfactionEl.textContent = state.visitorSatisfaction;
    if (zooNameEl) zooNameEl.textContent = state.zooName || 'My Zoo';
}

// =====================================================================
// TAB RENDERERS
// =====================================================================

function renderVisitorsTab() {
    const el = document.getElementById('visitors');
    if (!el) return;
    
    let html = '<div class="status-panel"><h3>👥 Visitor Summary</h3>';
    html += `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
            <div style="background: #0f172a; padding: 12px; border-radius: 6px; text-align: center;">
                <div style="font-size: 0.8rem; color: #9ca3af;">Today's Visitors</div>
                <div style="font-size: 1.5rem; font-weight: 800; color: #3b82f6;">${state.dailyVisitors}</div>
            </div>
            <div style="background: #0f172a; padding: 12px; border-radius: 6px; text-align: center;">
                <div style="font-size: 0.8rem; color: #9ca3af;">Guest Happiness</div>
                <div style="font-size: 1.5rem; font-weight: 800; color: ${(state.guestHappiness || 50) >= 70 ? '#22c55e' : '#f59e0b'};">${state.guestHappiness || 50}%</div>
            </div>
            <div style="background: #0f172a; padding: 12px; border-radius: 6px; text-align: center;">
                <div style="font-size: 0.8rem; color: #9ca3af;">Amenity Revenue</div>
                <div style="font-size: 1.5rem; font-weight: 800; color: #fbbf24;">$${(state.visitorSpending?.total || 0).toLocaleString()}</div>
            </div>
        </div>
    `;
    
    if (state.visitorComplaints && state.visitorComplaints.length > 0) {
        html += '<div style="margin-top: 12px; padding: 10px; background: rgba(239, 68, 68, 0.1); border-radius: 6px;">';
        html += '<div style="font-size: 0.8rem; color: #fca5a5; margin-bottom: 6px; font-weight: 700;">⚠️ Complaints:</div>';
        state.visitorComplaints.forEach(c => {
            html += `<div style="font-size: 0.85rem; color: #e5e7eb; margin-bottom: 4px;">${c.icon} ${c.text}</div>`;
        });
        html += '</div>';
    }
    html += '</div>';
    html += '<div class="status-panel"><h2 style="margin-bottom: 15px;">🎟️ Ticket Management</h2><p style="color: #9ca3af;">Coming soon! Adjust ticket prices and view visitor stats.</p></div>';
    
    el.innerHTML = html;
}

// =====================================================================
// EVENT LISTENERS
// =====================================================================
eventBus.on('DAY_ADVANCED', () => {
    updateUI();
    // Re-render active tab
    const activeTab = document.querySelector('.nav-btn.active');
    if (activeTab) activeTab.click();
    logMessage(`--- Day ${state.day} Complete ---`);
});

eventBus.on('ECONOMY_PROCESSED', (data) => {
    logMessage(`💰 Economy: Visitors ${data.visitors} | Net Profit $${data.profit}`);
});

eventBus.on('ANIMAL_DIED', (data) => {
    const emoji = data.cause === 'old age' ? '⚰️' : '💀';
    logMessage(`${emoji} ${data.animal.name} died of ${data.cause} in ${data.exhibitName}`);
});

eventBus.on('ANIMALS_HUNGRY', (data) => {
    logMessage(`⚠️ HUNGRY: ${data.animals.slice(0, 3).join(', ')}${data.animals.length > 3 ? ` +${data.animals.length - 3} more` : ''}`);
});

eventBus.on('ANIMAL_SICK', (data) => {
    logMessage(`🤒 ${data.animal.name} has fallen ill in ${data.exhibitName}!`);
});

eventBus.on('ANIMAL_RECOVERED', (data) => {
    logMessage(`💚 ${data.animal.name} has recovered!`);
});

eventBus.on('PREGNANCY_STARTED', (data) => {
    logMessage(`🤰 ${data.mother.name} is pregnant! Baby due in ${data.gestationDays} days (father: ${data.father})`);
});

eventBus.on('ANIMAL_BORN', (data) => {
    logMessage(`🍼 ${data.baby.name} was born to ${data.mother.name} in ${data.exhibitName}!`);
});

eventBus.on('LIFE_STAGE', (data) => {
    const stageEmoji = { baby: '🍼', juvenile: '🐾', adult: '🦁', senior: '👴' };
    logMessage(`${stageEmoji[data.stage]} ${data.animal.name} is now a ${data.stage}!`);
});

eventBus.on('EXHIBIT_COMPLETED', (data) => {
    logMessage(`✅ ${data.name} finished building!`);
});

eventBus.on('MAINTENANCE_COST', (data) => {
    logMessage(`🧹 Maintenance cost: -$${data.amount}`);
});

eventBus.on('UPKEEP_COST', (data) => {
    logMessage(`🧾 Facility upkeep: -$${data.amount}`);
});

eventBus.on('ANIMAL_ESCAPED', (data) => {
    logMessage(`🚨 ${data.animal.name} escaped from ${data.exhibitName}!`);
});

eventBus.on('VISITORS_PROCESSED', (data) => {
    logMessage(`👥 Visitors: ${data.visitors} | Spending: $${data.spending.total}`);
});

eventBus.on('STAFF_EXPENSE', (data) => {
    logMessage(`💰 Staff salaries: -$${data.amount}`);
});

eventBus.on('UNDERSTAFFED', (data) => {
    logMessage(`⚠️ UNDERSTAFFED! Keepers: ${data.keeperCapacity}/${data.keeperDemand} | Cleaners: ${data.cleanerCapacity}/${data.cleanerDemand}`);
});

eventBus.on('ANIMAL_PURCHASED', (data) => {
    logMessage(`🎉 Purchased ${data.animal} for $${data.cost} (placed in ${data.exhibit})`);
});

eventBus.on('FOOD_PURCHASED', (data) => {
    const food = FOOD_TYPES[data.foodType];
    logMessage(`🍽️ Bought ${data.amount} ${food.name} for $${data.cost}`);
});

eventBus.on('STAFF_HIRED', (data) => {
    logMessage(`✅ Hired ${data.staffName} for $${data.cost}`);
});

eventBus.on('STAFF_FIRED', (data) => {
    logMessage(`❌ Fired ${data.staffName} (severance: $${data.refund})`);
});

eventBus.on('AMENITY_BUILT', (data) => {
    logMessage(`🏪 Built ${data.amenityName} for $${data.cost}`);
});

eventBus.on('EXHIBIT_BUILD_STARTED', (data) => {
    logMessage(`🏗️ Started building ${data.name} (${data.size}) for $${data.cost} - ${data.days} days`);
});

eventBus.on('FENCE_REPAIRED', (data) => {
    logMessage(`🔧 Repaired fence at ${data.exhibitName} for $${data.cost}`);
});

// =====================================================================
// BUTTON HANDLERS
// =====================================================================
if (endDayBtn) {
    endDayBtn.addEventListener('click', (e) => {
        e.preventDefault();
        advanceDay();
    });
}

if (buildExhibitBtn) {
    buildExhibitBtn.addEventListener('click', () => {
        const modal = document.getElementById('buildModal');
        if (modal) modal.classList.add('active');
    });
}

// =====================================================================
// LOG HELPER
// =====================================================================
function logMessage(msg) {
    if (!logEl) return;
    const p = document.createElement('div');
    p.textContent = msg;
    logEl.prepend(p);
    // Keep log manageable
    while (logEl.children.length > 100) {
        logEl.removeChild(logEl.lastChild);
    }
}

// =====================================================================
// INITIALIZATION
// =====================================================================
async function init() {
    await loadAllData();
    updateUI();
    renderShop();
    logMessage("🦁 ZooSmith V2 Engine Initialized!");
    logMessage("💡 Tip: Click the tabs to see different status panels.");
}

init();
