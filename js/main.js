// js/main.js

// =====================================================================
// 1. IMPORTS (Declare each ONLY ONCE at the top of the file)
// =====================================================================
import { state } from './engine/GameState.js';
import { eventBus } from './engine/EventBus.js'; // ⚠️ MAKE SURE THIS IS ONLY HERE ONCE!
import { advanceDay } from './engine/Engine.js';
import { HouseUI } from './ui/HouseUI.js';

// (Add your other existing imports here, e.g., ShopUI, StaffUI, etc.)

// =====================================================================
// 2. INITIALIZATION
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🦁 ZooSmith V2 Initialized');
    
    // Initialize UI modules
    HouseUI.init();
    
    // Initialize your other UI modules here...
    // ShopUI.init();
    // StaffUI.init();

    // Initial UI render based on starting state
    updateHeaderUI();
});

// =====================================================================
// 3. EVENT LISTENERS
// =====================================================================

// --- Navigation Tabs ---
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Remove active class from all buttons and sections
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        
        // Add active class to clicked button and corresponding section
        e.target.classList.add('active');
        const sectionId = e.target.dataset.section;
        document.getElementById(sectionId).classList.add('active');

        // 🆕 Refresh House UI when the tab is opened
        if (sectionId === 'houses') {
            HouseUI.renderHouseShop();
            HouseUI.renderBuiltHouses();
        }
    });
});

// --- End Day Button ---
const endDayBtn = document.getElementById('endDayBtn');
if (endDayBtn) {
    endDayBtn.addEventListener('click', () => {
        advanceDay();
        updateHeaderUI();
    });
}

// --- EventBus Listeners (Live UI Updates) ---
eventBus.on('MONEY_CHANGED', () => {
    updateHeaderUI();
    // Optional: Re-render house lists if you want live updates without tab switching
    // HouseUI.renderBuiltHouses(); 
});

eventBus.on('DAY_ADVANCED', () => {
    updateHeaderUI();
});

// =====================================================================
// 4. HELPER FUNCTIONS
// =====================================================================

function updateHeaderUI() {
    // Update Money
    const moneyEl = document.getElementById('money');
    if (moneyEl) moneyEl.innerText = `$${state.money.toLocaleString()}`;

    // Update Date & Season
    const dayEl = document.getElementById('day');
    const seasonEl = document.getElementById('season');
    if (dayEl) dayEl.innerText = `Day ${state.day}, M${state.month}, Y${state.year}`;
    // (You can import getSeason from GameState.js to update the season emoji/text here)

    // Update Rating
    const ratingEl = document.getElementById('rating');
    if (ratingEl) ratingEl.innerText = state.zooRating;

    // Update Satisfaction
    const satisfactionEl = document.getElementById('satisfaction');
    if (satisfactionEl) satisfactionEl.innerText = `${state.visitorSatisfaction}%`;
}

// Make functions globally available for HTML onclick handlers (if needed)
window.confirmBuyAnimal = function() { /* Your existing logic */ };
window.closeBuyModal = function() { document.getElementById('buyModal').classList.remove('active'); };
