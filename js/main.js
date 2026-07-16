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
        
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        const section = document.getElementById(sectionId);
        if (section) section.classList.add('active');
        
        // Render the appropriate tab
        if (sectionId === 'shop') renderShop();
        else if (sectionId === 'supplies') renderSupplies();
        else if (sectionId === 'staff') renderStaff();
        else if (sectionId === 'exhibits') renderExhibitsTab();
        else if (sectionId === 'amenities') renderAmenitiesTab();
        else if (sectionId === 'visitors') renderVisitorsTab();
    });
});

// =====================================================================
// MAIN UI UPDATE (Only updates the header now!)
// =====================================================================
function updateUI() {
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
// TAB RENDERERS (Placeholder tabs we haven't fully built yet)
// =====================================================================

function renderExhibitsTab() {
    const el = document.getElementById('exhibits');
    if (!el) return;
    
    let html = '<div class="status-panel"><h3>🏞️ Exhibit Status</h3>';
    
    if (Object.keys(state.exhibits).length === 0) {
        html += '<p style="color: #9ca3af;">No exhibits yet. Build one to get started!</p>';
    } else {
        for (const id in state.exhibits) {
            const exhibit = state.exhibits[id];
            const fence = exhibit.fenceCondition ?? 100;
            const cleanliness = exhibit.cleanliness ?? 100;
            const fenceColor = fence >= 70 ? '#22c55e' : fence >= 50 ? '#f59e0b' : fence >= 30 ? '#ef4444' : '#dc2626';
            const cleanColor = cleanliness >= 70 ? '#22c55e' : cleanliness >= 50 ? '#f59e0b' : cleanliness >= 30 ? '#ef4444' : '#dc2626';
            
            html += `
                <div style="background: #0f172a; padding: 10px; border-radius: 6px; margin-bottom: 8px;">
                    <div style="font-weight: bold; margin-bottom: 6px;">${exhibit.name} (${exhibit.animals.length} animals)</div>
                    <div style="display: flex; gap: 15px; font-size: 0.9rem; flex-wrap: wrap;">
                        <div>🔧 Fence: <strong style="color: ${fenceColor}">${fence.toFixed(1)}%</strong></div>
                        <div>✨ Clean: <strong style="color: ${cleanColor}">${cleanliness.toFixed(1)}%</strong></div>
                    </div>
                    <div style="margin-top: 8px; font-size: 0.85rem; color: #9ca3af;">
                        🐾 Animals: ${exhibit.animals.map(a => a.name).join(', ') || 'None'}
                    </div>
                </div>
            `;
        }
    }
    html += '</div>';
    html += '<div class="status-panel"><h2 style="margin-bottom: 15px;">🏞️ Manage Exhibits</h2><p style="color: #9ca3af;">Coming soon! Repair fences, buy upgrades, and move animals.</p></div>';
    
    el.innerHTML = html;
}

function renderAmenitiesTab() {
    const el = document.getElementById('amenities');
    if (!el) return;
    el.innerHTML = '<div class="status-panel"><h2 style="margin-bottom: 15px;">🏪 Amenities</h2><p style="color: #9ca3af;">Coming soon! Build restrooms, food stands, and gift shops.</p></div>';
}

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
        document.getElementById('buildModal').classList.add('active');
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
