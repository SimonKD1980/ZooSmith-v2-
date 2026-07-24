// js/main.js

// =====================================================================
// 1. IMPORTS
// =====================================================================
import { state } from './engine/GameState.js';
import { eventBus } from './engine/EventBus.js';
import { advanceDay, loadGameData, animalsData } from './engine/Engine.js'; // 🆕 Added animalsData
import { HouseUI } from './ui/HouseUI.js';

// =====================================================================
// 2. INITIALIZATION
// =====================================================================

async function initGame() {
    console.log('🦁 ZooSmith V2 Initializing...');
    
    // 1. WAIT for all JSON data to load before doing anything else
    await loadGameData(); 
    
    // 2. Initialize UI modules
    renderShop();      // 🆕 Renders the main animal shop
    HouseUI.init();    // Initializes the Houses tab
    
    // 3. Initial UI render based on starting state
    updateHeaderUI();
    
    console.log('✅ Game Ready!');
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', initGame);

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

        // Refresh specific UIs when their tabs are opened
        if (sectionId === 'houses') {
            HouseUI.renderHouseShop();
            HouseUI.renderBuiltHouses();
        }
        if (sectionId === 'shop') {
            renderShop(); // Refresh shop in case money/tiers changed
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
});

eventBus.on('DAY_ADVANCED', () => {
    updateHeaderUI();
});

// =====================================================================
// 4. HELPER FUNCTIONS
// =====================================================================

/**
 * 🆕 Renders the main Shop tab with animals from animals.json
 */
function renderShop() {
    const shopContainer = document.getElementById('shop');
    if (!shopContainer || !animalsData) return;
    
    shopContainer.innerHTML = ''; // Clear existing content
    
    // Create a grid to hold the shop items (reusing the exhibit-grid CSS)
    const grid = document.createElement('div');
    grid.className = 'exhibit-grid';
    grid.style.marginTop = '0'; // Reset margin for shop
    
    animalsData.forEach(animal => {
        const item = document.createElement('div');
        item.className = 'exhibit-slot empty';
        item.style.cursor = 'pointer';
        item.innerHTML = `
            <div class="slot-icon">${animal.icon || '🐾'}</div>
            <div class="slot-title">${animal.name}</div>
            <div class="slot-subtitle">${animal.category || 'Animal'}</div>
            <div class="slot-subtitle">Cost: $${animal.cost}</div>
            <button class="btn-small primary" onclick="openBuyAnimalModal('${animal.id}')">Buy</button>
        `;
        grid.appendChild(item);
    });
    
    shopContainer.appendChild(grid);
}

function updateHeaderUI() {
    // Update Money
    const moneyEl = document.getElementById('money');
    if (moneyEl) moneyEl.innerText = `$${state.money.toLocaleString()}`;

    // Update Date & Season
    const dayEl = document.getElementById('day');
    if (dayEl) dayEl.innerText = `Day ${state.day}, M${state.month}, Y${state.year}`;

    // Update Rating
    const ratingEl = document.getElementById('rating');
    if (ratingEl) ratingEl.innerText = state.zooRating;

    // Update Satisfaction
    const satisfactionEl = document.getElementById('satisfaction');
    if (satisfactionEl) satisfactionEl.innerText = `${state.visitorSatisfaction}%`;
}

// =====================================================================
// 5. GLOBAL MODAL HANDLERS
// =====================================================================

// Opens the buy animal modal and stores which animal we want to buy
window.openBuyAnimalModal = function(animalId) {
    window.animalToBuy = animalId;
    
    // Populate the exhibit dropdown (Basic example - adapt to your actual exhibit logic)
    const select = document.getElementById('exhibitSelect');
    select.innerHTML = '<option value="default">Default Exhibit</option>';
    
    // Show the modal
    document.getElementById('buyModal').classList.add('active');
};

// Your existing confirm logic (adapt as needed)
window.confirmBuyAnimal = function() {
    const animalId = window.animalToBuy;
    const animal = animalsData.find(a => a.id === animalId);
    
    if (!animal) return;

    if (state.money >= animal.cost) {
        state.money -= animal.cost;
        
        // 🆕 Add animal to state (Basic implementation - adapt to your exhibit logic)
        // state.animals.push({ id: generateUniqueId('animal'), dataId: animalId, ... });
        
        eventBus.emit('MONEY_CHANGED');
        closeBuyModal();
        console.log(`✅ Bought ${animal.name}`);
    } else {
        alert("Not enough money!");
    }
};

window.closeBuyModal = function() {
    document.getElementById('buyModal').classList.remove('active');
    window.animalToBuy = null;
};
