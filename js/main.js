// js/main.js
import { state } from './engine/GameState.js';
import { eventBus } from './engine/EventBus.js';
import { advanceDay } from './engine/Engine.js';

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

// 🔥 NEW: Listen for animal deaths to show in the UI log
eventBus.on('ANIMAL_DIED', (data) => {
    const emoji = data.cause === 'old age' ? '⚰️' : '💀';
    logMessage(`${emoji} ${data.animal.name} died of ${data.cause} in ${data.exhibitName}!`);
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
updateUI();
logMessage("🦁 ZooSmith V2 Engine Initialized!");
