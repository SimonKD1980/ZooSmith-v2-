// js/main.js
import { state } from './engine/GameState.js';
import { eventBus } from './engine/EventBus.js';
import { advanceDay } from './engine/Engine.js';
import { loadAllData } from './engine/data.js';
import { FOOD_TYPES } from './engine/constants.js';

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

// --- UI UPDATE FUNCTION ---
function updateUI() {
    moneyEl.textContent = state.money.toLocaleString();
    dayEl.textContent = state.day;
    ratingEl.textContent = state.zooRating;
    satisfactionEl.textContent = state.visitorSatisfaction;

    updateExhibitStatus();
    updateVisitorStatus();
    updateFoodStatus();
}

function updateExhibitStatus() {
    let html = '<h3 style="margin: 0 0 10px 0;">🏞️ Exhibit Status</h3>';

    if (Object.keys(state.exhibits).length === 0) {
        html += '<p style="color: #9ca3af;">No exhibits yet</p>';
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
                        <div>🔧 Fence: <strong style="color: ${fenceColor}">${fence.toFixed(1)}%</strong></div>
                        <div>✨ Clean: <strong style="color: ${cleanColor}">${cleanliness.toFixed(1)}%</strong></div>
                    </div>
                </div>
            `;
        }
    }

    exhibitStatusEl.innerHTML = html;
}

function updateVisitorStatus() {
    if (!visitorStatusEl) return;

    let html = '<h3 style="margin: 0 0 10px 0;">👥 Visitor Summary</h3>';
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

    visitorStatusEl.innerHTML = html;
}

function updateFoodStatus() {
    if (!foodStatusEl) return;

    let html = '<h3 style="margin: 0 0 10px 0;">🍽️ Food Inventory</h3>';
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">';

    for (const foodType in FOOD_TYPES) {
        const food = FOOD_TYPES[foodType];
        const current = state.food[foodType] || 0;
        const cap = food.storageCap;
        const percent = (current / cap) * 100;
        const isLow = current < 10;
        const isEmpty = current === 0;

        html += `
            <div style="background: #0f172a; padding: 12px; border-radius: 6px; border: 1px solid ${isEmpty ? '#dc2626' : isLow ? '#f59e0b' : '#1e293b'};">
                <div style="font-size: 2rem; text-align: center;">${food.icon}</div>
                <div style="text-align: center; font-weight: 700; margin: 4px 0;">${food.name}</div>
                <div style="text-align: center; font-size: 1.3rem; font-weight: 800; color: ${isEmpty ? '#dc2626' : isLow ? '#f59e0b' : food.color};">
                    ${current} / ${cap}
                </div>
                <div style="height: 6px; background: #1e293b; border-radius: 3px; margin-top: 6px; overflow: hidden;">
                    <div style="height: 100%; width: ${percent}%; background: ${food.color};"></div>
                </div>
            </div>
        `;
    }

    html += '</div>';
    foodStatusEl.innerHTML = html;
}

// --- EVENT LISTENERS ---
eventBus.on('DAY_ADVANCED', () => {
    updateUI();
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
    logMessage("🦁 ZooSmith V2 Engine Initialized with Full Wildlife!");
}

init();
