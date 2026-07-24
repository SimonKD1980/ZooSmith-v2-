// js/main.js

// =====================================================================
// 1. IMPORTS
// =====================================================================
import { state } from './engine/GameState.js';
import { eventBus } from './engine/EventBus.js';
import { advanceDay, loadGameData, animalsData } from './engine/Engine.js';
import { HouseUI } from './ui/HouseUI.js';

// 🆕 GLOBAL ASSET PATH FIX FOR GITHUB PAGES
const isGitHubPages = window.location.hostname.includes('github.io');
const BASE_PATH = isGitHubPages ? '/ZooSmith-v2-/' : './';
window.BASE_PATH = BASE_PATH;

// =====================================================================
// 2. INITIALIZATION
// =====================================================================

async function initGame() {
    console.log('🦁 ZooSmith V2 Initializing...');
    
    // 1. WAIT for all JSON data to load
    await loadGameData(); 
    
    // 2. Initialize UI modules
    renderShop();      // Your original shop rendering
    HouseUI.init();    // New House UI
    
    // 3. Initial UI render
    updateHeaderUI();
    
    console.log('✅ Game Ready!');
}

document.addEventListener('DOMContentLoaded', initGame);

// =====================================================================
// 3. EVENT LISTENERS
// =====================================================================

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        
        e.target.classList.add('active');
        const sectionId = e.target.dataset.section;
        document.getElementById(sectionId).classList.add('active');

        if (sectionId === 'houses') {
            HouseUI.renderHouseShop();
            HouseUI.renderBuiltHouses();
        }
        if (sectionId === 'shop') {
            renderShop();
        }
    });
});

const endDayBtn = document.getElementById('endDayBtn');
if (endDayBtn) {
    endDayBtn.addEventListener('click', () => {
        advanceDay();
        updateHeaderUI();
    });
}

eventBus.on('MONEY_CHANGED', () => {
    updateHeaderUI();
});

eventBus.on('DAY_ADVANCED', () => {
    updateHeaderUI();
});

// =====================================================================
// 4. SHOP RENDERING (Your Original Logic Restored)
// =====================================================================

function renderShop() {
    const shopContainer = document.getElementById('shop');
    if (!shopContainer || !window.animalsData) return;
    
    shopContainer.innerHTML = '';
    
    const grid = document.createElement('div');
    grid.className = 'exhibit-grid';
    grid.style.marginTop = '0';
    
    window.animalsData.forEach(animal => {
        const item = document.createElement('div');
        item.className = 'exhibit-slot empty';
        item.style.cursor = 'pointer';
        
        // 🎯 YOUR ORIGINAL LOGIC: Use animal.id + '.png'
        const imgSrc = `${window.BASE_PATH}images/animals/${animal.id}.png`;
        
        item.innerHTML = `
            <img src="${imgSrc}" 
                 alt="${animal.name}" 
                 style="width: 80px; height: 80px; object-fit: contain; margin-bottom: 8px;"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div style="font-size: 2.5rem; margin-bottom: 8px; display: none;">${animal.icon || '🐾'}</div>
            <div class="slot-title">${animal.name}</div>
            <div class="slot-subtitle">${animal.category || 'Animal'}</div>
            <div class="slot-subtitle">Cost: $${animal.cost}</div>
            <button class="btn-small primary" onclick="openBuyAnimalModal('${animal.id}')">Buy</button>
        `;
        grid.appendChild(item);
    });
    
    shopContainer.appendChild(grid);
}

// =====================================================================
// 5. HEADER UI
// =====================================================================

function updateHeaderUI() {
    const moneyEl = document.getElementById('money');
    if (moneyEl) moneyEl.innerText = `$${state.money.toLocaleString()}`;

    const dayEl = document.getElementById('day');
    if (dayEl) dayEl.innerText = `Day ${state.day}, M${state.month}, Y${state.year}`;

    const ratingEl = document.getElementById('rating');
    if (ratingEl) ratingEl.innerText = state.zooRating;

    const satisfactionEl = document.getElementById('satisfaction');
    if (satisfactionEl) satisfactionEl.innerText = `${state.visitorSatisfaction}%`;
}

// =====================================================================
// 6. GLOBAL MODAL HANDLERS
// =====================================================================

window.openBuyAnimalModal = function(animalId) {
    window.animalToBuy = animalId;
    const select = document.getElementById('exhibitSelect');
    select.innerHTML = '<option value="default">Default Exhibit</option>';
    document.getElementById('buyModal').classList.add('active');
};

window.confirmBuyAnimal = function() {
    const animalId = window.animalToBuy;
    const animal = window.animalsData.find(a => a.id === animalId);
    
    if (!animal) return;

    if (state.money >= animal.cost) {
        state.money -= animal.cost;
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
