import { state } from './engine/GameState.js';
import { eventBus } from './engine/EventBus.js';
import { advanceDay } from './engine/Engine.js';

// --- UI REFERENCES ---
const moneyEl = document.getElementById('money');
const dayEl = document.getElementById('day');
const endDayBtn = document.getElementById('endDayBtn');
const logEl = document.getElementById('log');

// --- UI UPDATE FUNCTION ---
function updateUI() {
    moneyEl.textContent = state.money.toLocaleString();
    dayEl.textContent = state.day;
}

// --- EVENT LISTENERS ---
// Listen for the Engine to tell us the day has advanced
eventBus.on('DAY_ADVANCED', () => {
    updateUI();
    logMessage(`--- Day ${state.day} Complete ---`);
});

// Listen for Economy events to log them
eventBus.on('ECONOMY_PROCESSED', (data) => {
    logMessage(`💰 Economy: Net Profit $${data.profit} | Total: $${data.totalMoney}`);
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
