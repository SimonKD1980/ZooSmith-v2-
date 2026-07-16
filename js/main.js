// js/main.js
import { state } from './engine/GameState.js';
import { eventBus } from './engine/EventBus.js';
import { advanceDay } from './engine/Engine.js';
import { loadAllData } from './engine/data.js';

// --- UI REFERENCES ---
const moneyEl = document.getElementById('money');
const dayEl = document.getElementById('day');
const ratingEl = document.getElementById('rating');
const satisfactionEl = document.getElementById('satisfaction');
const endDayBtn = document.getElementById('endDayBtn');
const logEl = document.getElementById('log');
const exhibitStatusEl = document.getElementById('exhibitStatus');

// --- UI UPDATE FUNCTION ---
function updateUI() {
    moneyEl.textContent = state.money.toLocaleString();
    dayEl.textContent = state.day;
    ratingEl.textContent = state.zooRating;
    satisfactionEl.textContent = state.visitorSatisfaction;
    
    // 🔥 NEW: Update exhibit status display
    updateExhibitStatus();
}

function updateExhibitStatus() {
    let html = '<h3 style="margin: 0 0 10px 0;">🏞️ Exhibit Status</h3>';
    
    if (Object.keys(state.exhibits).length === 0) {
        html += '<p style="color: var(--muted);">No exhibits yet</p>';
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
                    <div style="display: flex; gap: 15px; font-size: 0.9rem;">
                        <div>
                            🔧 Fence: <strong style="color: ${fenceColor}">${fence.toFixed(1)}%</strong>
                        </div>
                        <div>
                            ✨ Clean: <strong style="color: ${cleanColor}">${cleanliness.toFixed(1)}%</strong>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    exhibitStatusEl.innerHTML = html;
}

// --- EVENT LISTENERS ---
eventBus.on('DAY_ADVANCED', () => {
    updateUI();
    logMessage(`--- Day ${state.day} Complete ---`);
});

eventBus.on('ECONOMY_PROCESSED', (data) => {
    logMessage(`💰 Economy: Net Profit $${data.profit} | Total: $${data.totalMoney}`);
});

eventBus.on('ANIMAL_DIED', (data) => {
    const emoji = data.cause === 'old age' ? '⚰️' : '💀';
    logMessage(`${emoji} ${data.animal.name} died of ${data.cause} in ${data.exhibitName}!`);
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

// Hook up the button
endDayBtn.addEventListener('click', () => {
    advanceDay();
});

// --- HELPER ---
function logMessage(msg) {
    const p = document.createElement('div');
    p.textContent = msg;
    logEl.prepend(p);
}

// --- INIT ---
async function init() {
    await loadAllData();
    updateUI();
    logMessage("🦁 ZooSmith V2 Engine Initialized with Facilities!");
}

init();
