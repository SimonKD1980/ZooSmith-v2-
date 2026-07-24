// js/main.js
import { state, getSeason } from './engine/GameState.js';
import { eventBus } from './engine/EventBus.js';
import { advanceDay } from './engine/Engine.js';
import { loadAllData, data } from './engine/data.js';
import { FOOD_TYPES } from './engine/constants.js';
import { 
    getKeeperCapacity, 
    getKeeperDemand, 
    getCleanerCapacity, 
    getCleanerDemand,
    isUnderstaffed 
} from './engine/systems/StaffSystem.js';
import { RATING_TIERS, getTier } from './engine/systems/RatingSystem.js';
import { renderShop } from './ui/ShopUI.js';
import { renderSupplies } from './ui/SuppliesUI.js';
import { renderStaff } from './ui/StaffUI.js';
import { renderAmenities } from './ui/AmenitiesUI.js';
import { renderExhibits } from './ui/ExhibitsUI.js';
import { 
    saveGame, 
    loadGame, 
    getSaveSlots, 
    deleteSave, 
    exportSave, 
    importSave 
} from './engine/SaveSystem.js';
import { renderReports } from './ui/ReportsUI.js';
import { renderResearch } from './ui/ResearchUI.js';
import { startResearch } from './engine/systems/ResearchSystem.js';
import { renderMarketing } from './ui/MarketingUI.js';

// 🆕 ADDITION 1: Import HouseUI
import { HouseUI } from './ui/HouseUI.js';

// =====================================================================
// UI REFERENCES
// =====================================================================
const moneyEl = document.getElementById('money');
const dayEl = document.getElementById('day');
const seasonEl = document.getElementById('season');
const ratingEl = document.getElementById('rating');
const satisfactionEl = document.getElementById('satisfaction');
const zooNameEl = document.getElementById('zooName');
const endDayBtn = document.getElementById('endDayBtn');
const buildExhibitBtn = document.getElementById('buildExhibitBtn');

console.log('🚀 main.js loaded!');

// =====================================================================
// LOG STORAGE
// =====================================================================
const logMessages = [];
const MAX_LOG_MESSAGES = 500;

if (zooNameEl) {
    zooNameEl.addEventListener('click', () => {
        const newName = prompt('Enter a new name for your zoo:', state.zooName);
        if (newName && newName.trim() !== '') {
            state.zooName = newName.trim();
            updateUI();
            logMessage(`🏷️ Zoo renamed to "${state.zooName}"!`);
            if (typeof saveGame === 'function') saveGame('autosave'); 
        }
    });
}

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
        
        if (sectionId === 'shop') renderShop();
        else if (sectionId === 'supplies') renderSupplies();
        else if (sectionId === 'staff') renderStaff();
        else if (sectionId === 'amenities') renderAmenities();
        else if (sectionId === 'exhibits') renderExhibits();
        else if (sectionId === 'visitors') renderVisitorsTab();
        else if (sectionId === 'saves') renderSavesTab();
        else if (sectionId === 'reports') renderReports();
        else if (sectionId === 'research') renderResearch();
        else if (sectionId === 'log') renderLogTab();
        else if (sectionId === 'marketing') renderMarketing();
        // 🆕 ADDITION 2: Handle Houses tab click
        else if (sectionId === 'houses') {
            HouseUI.renderHouseShop();
            HouseUI.renderBuiltHouses();
        }
    });
});

// =====================================================================
// MAIN UI UPDATE
// =====================================================================
function updateUI() {
    if (typeof state.money !== 'number' || isNaN(state.money)) {
        console.error('❌ state.money is invalid:', state.money);
        state.money = 0;
    }
    
    if (moneyEl) moneyEl.textContent = `$${state.money.toLocaleString()}`;
    
    if (dayEl) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        dayEl.textContent = `${monthNames[state.month - 1]} ${state.day}, Y${state.year}`;
    }
    if (seasonEl) {
        const seasonNames = { winter: '❄️ Winter', spring: '🌸 Spring', summer: '☀️ Summer', fall: '🍂 Fall' };
        seasonEl.textContent = seasonNames[getSeason()];
    }
    
    const tier = getTier(state.zooRating || 0);
    if (ratingEl) ratingEl.textContent = `${tier.emoji} ${state.zooRating}`;
    if (satisfactionEl) satisfactionEl.textContent = `${state.visitorSatisfaction}%`;
    if (zooNameEl) zooNameEl.textContent = state.zooName || 'My Zoo';
}

// ... [KEEP ALL YOUR EXISTING renderSavesTab, renderVisitorsTab, renderRatingBreakdown, renderLogTab, EVENT LISTENERS, AND BUTTON HANDLERS EXACTLY AS THEY WERE] ...

// =====================================================================
// INITIALIZATION
// =====================================================================
async function init() {
    console.log('🚀 init() function called!');
    
    try {
        await loadAllData();
        console.log('✅ loadAllData() completed!');
        
        updateUI();
        renderShop();
        HouseUI.init(); // 🆕 ADDITION 3: Initialize House UI
        
        logMessage("🦁 ZooSmith V2 Engine Initialized!");
        
        window.state = state;
        window.data = data;
    } catch (error) {
        console.error('❌ ERROR in init():', error);
    }
}

console.log('🚀 About to call init()...');
init();
