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

// --- UI UPDATE FUNCTION ---
function updateUI() {
    moneyEl.textContent = state.money.toLocaleString();
    dayEl.textContent = state.day;
    ratingEl.textContent = state.zooRating;
    satisfactionEl.textContent = state.visitorSatisfaction;
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

// NEW: Facility events
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
