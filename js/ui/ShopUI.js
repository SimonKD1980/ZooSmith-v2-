// js/ui/ShopUI.js
import { state } from '../engine/GameState.js';
import { eventBus } from '../engine/EventBus.js';
import { data } from '../engine/data.js';
import { isUnlocked } from '../engine/systems/ResearchSystem.js';

let currentCategory = 'all';
let currentSearch = '';

export function renderShop() {
    const shop = document.getElementById("shop");
    if (!shop) {
        console.error('❌ Shop element not found!');
        return;
    }

    if (!data.animals || data.animals.length === 0) {
        shop.innerHTML = `
            <div class="card" style="text-align:center; padding:40px; color: var(--danger);">
                <h3>❌ No Animal Data Found</h3>
                <p>Check your browser console (F12) for details.</p>
                <p style="font-size:0.9rem;">Make sure data/animals.json exists and has data.</p>
            </div>
        `;
        return;
    }

    const categories = [...new Set(data.animals.map(a => a.category || 'Other'))].sort();
    
    shop.innerHTML = `
        <div class="card" style="margin-bottom: 24px;">
            <div style="margin-bottom: 16px;">
                <input type="text" id="animalSearch" placeholder="🔍 Search animals by name, species, or habitat..." value="${currentSearch}" 
                    class="search-input" />
            </div>
            <div class="flex flex-wrap gap-2" style="margin-bottom: 10px;">
                <button class="category-tab ${currentCategory === 'all' ? 'active' : ''}" onclick="window.filterByCategory('all')">
                    🌍 All (${data.animals.length})
                </button>
                ${categories.map(cat => {
                    const count = data.animals.filter(a => a.category === cat).length;
                    const isActive = currentCategory === cat;
                    return `<button class="category-tab ${isActive ? 'active' : ''}" onclick="window.filterByCategory('${cat}')">
                        ${cat} (${count})
                    </button>`;
                }).join('')}
            </div>
        </div>
        <div class="grid-layout" id="shopGrid"></div>
    `;

    const searchInput = document.getElementById('animalSearch');
    if (searchInput && !searchInput.dataset.listenerAttached) {
        searchInput.dataset.listenerAttached = 'true';
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase();
            renderShopGrid();
        });
    }

    renderShopGrid();
}

function renderShopGrid() {
    const grid = document.getElementById('shopGrid');
    if (!grid) return;

    let filtered = data.animals;
    if (currentCategory !== 'all') {
        filtered = filtered.filter(a => a.category === currentCategory);
    }
    if (currentSearch) {
        filtered = filtered.filter(a =>
            a.name.toLowerCase().includes(currentSearch) ||
            a.scienceName?.toLowerCase().includes(currentSearch) ||
            a.habitat?.toLowerCase().includes(currentSearch)
        );
    }

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="card" style="text-align:center; padding:40px; grid-column: 1/-1;"><h3>No animals found</h3></div>';
        return;
    }

    grid.innerHTML = '';
    filtered.forEach((animal) => {
        const isLocked = animal.id && !isUnlocked(animal.id);
        
        const dietEmoji = animal.diet === 'Carnivore' ? '🥩' : animal.diet === 'Herbivore' ? '🌿' : '🍖';
        const statusEmoji = animal.conservationStatus === 'Endangered' ? '🔴' :
            animal.conservationStatus === 'Vulnerable' ? '🟡' :
            animal.conservationStatus === 'Critically Endangered' ? '⚫' : '';

        const requiredSize = animal.requiredExhibitSize || 'small';
        const requiredType = animal.requiredExhibitType || 'terrestrial';
        const sizeEmoji = requiredSize === 'large' ? '🏞️' : requiredSize === 'medium' ? '🏕️' : '🏠';
        const typeEmoji = requiredType === 'aquatic' ? '🌊' : '🌍';
        
        const attractionValue = animal.attractionValue || 10;
        const foodAmount = animal.foodAmount || 1;
        const foodType = animal.diet === 'Carnivore' ? 'meat' : animal.diet === 'Herbivore' ? 'hay' : 'produce';
        const foodTypeEmoji = foodType === 'meat' ? '🥩' : foodType === 'hay' ? '🌾' : '🥬';
        const cost = animal.cost ?? animal.price ?? 0;

        const card = document.createElement("div");
        card.className = `card premium-card ${isLocked ? 'locked' : ''}`;
        
        card.innerHTML = `
            ${isLocked ? `
                <div class="badge badge-danger" style="position: absolute; top: 12px; right: 12px; z-index: 10;">
                    🔒 LOCKED
                </div>
            ` : ''}
            <img src="${animal.image || 'https://placehold.co/400x200/1e293b/e5e7eb?text=' + encodeURIComponent(animal.name)}" 
                alt="${animal.name}" class="animal-image ${isLocked ? 'grayscale' : ''}" />
            
            <div class="card-body">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">${animal.name}</h3>
                        <p class="card-subtitle">${animal.scienceName || ''}</p>
                    </div>
                    ${animal.category ? `<span class="badge badge-info">${animal.category}</span>` : ''}
                </div>
                
                <div class="flex flex-wrap gap-2" style="margin: 12px 0;">
                    <span class="badge badge-warning">${dietEmoji} ${animal.diet}</span>
                    <span class="badge badge-secondary">🌍 ${animal.habitat}</span>
                    <span class="badge badge-secondary">${statusEmoji} ${animal.conservationStatus}</span>
                </div>
                
                ${!isLocked ? `
                    <div class="requirements-box">
                        <div class="requirements-title">Requirements</div>
                        <div class="requirements-grid">
                            <div class="req-item"><span class="req-icon">${sizeEmoji}</span> ${requiredSize.charAt(0).toUpperCase() + requiredSize.slice(1)} Exhibit</div>
                            <div class="req-item"><span class="req-icon">${typeEmoji}</span> ${requiredType.charAt(0).toUpperCase() + requiredType.slice(1)}</div>
                            <div class="req-item"><span class="req-icon">${foodTypeEmoji}</span> ${foodAmount} ${foodType}/day</div>
                            <div class="req-item"><span class="req-icon">⭐</span> <span class="text-success">+${attractionValue} visitors</span></div>
                        </div>
                    </div>
                ` : ''}
                
                <p class="card-description">${isLocked ? '🔒 Research required to unlock this animal.' : (animal.info || 'No description available.')}</p>
                
                <div class="price-tag ${isLocked ? 'locked' : ''}">
                    💰 $${cost.toLocaleString()}
                </div>
                
                <button class="btn-primary buy-animal-btn" style="width: 100%;" ${isLocked ? 'disabled' : ''}>
                    ${isLocked ? '🔒 Locked' : '🛒 Add to Zoo'}
                </button>
            </div>
        `;

        if (!isLocked) {
            card.querySelector(".buy-animal-btn").onclick = () => openBuyModal(animal);
        }

        grid.appendChild(card);
    });
}

function openBuyModal(animal) {
    const modal = document.getElementById("buyModal");
    if (!modal) return;
    
    const select = document.getElementById("exhibitSelect");
    if (!select) return;
    
    select.innerHTML = "";
    const ids = Object.keys(state.exhibits);
    let compatibleExhibits = 0;
    let underConstruction = 0;
    let wrongType = 0;
    let wrongSize = 0;

    const requiredType = animal.requiredExhibitType || 'terrestrial';

    for (const id of ids) {
        const exhibit = state.exhibits[id];
        if (exhibit.buildDaysRemaining > 0) { underConstruction++; continue; }
        if (exhibit.type !== requiredType) { wrongType++; continue; }
        if (!exhibitSizeOk(exhibit.size, animal.requiredExhibitSize || "small")) { wrongSize++; continue; }

        const opt = document.createElement("option");
        opt.value = id;
        const exhibitType = data.exhibitTypes?.[exhibit.type] || { emoji: '🏞️', name: 'Exhibit' };
        opt.textContent = `${exhibitType.emoji} ${exhibit.name} (${exhibit.size})`;
        select.appendChild(opt);
        compatibleExhibits++;
    }

    if (compatibleExhibits === 0) {
        let message = `No compatible exhibits available!\n\n`;
        if (underConstruction > 0) message += `🚧 ${underConstruction} exhibit(s) under construction\n`;
        if (wrongType > 0) message += `❌ ${wrongType} exhibit(s) wrong type\n`;
        if (wrongSize > 0) message += `❌ ${wrongSize} exhibit(s) wrong size\n`;
        message += `\nRequired: ${requiredType} exhibit, ${animal.requiredExhibitSize || 'small'} size or larger.`;
        alert(message);
        return;
    }

    const defaultName = generateRandomAnimalName(animal.name);
    const cost = animal.cost ?? animal.price ?? 0;

    const modalContent = modal.querySelector('.modal-content');
    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>🦁 Add ${animal.name} to Zoo</h3>
            <button class="modal-close" onclick="window.closeBuyModal()">✕</button>
        </div>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">Customize your new animal:</p>
        
        <div class="form-group">
            <label>🏷️ Animal Name</label>
            <div class="flex gap-2">
                <input type="text" id="animalNameInput" value="${defaultName}" class="form-input" placeholder="Enter a name..." maxlength="20" style="flex: 1;">
                <button class="btn-secondary btn-small" onclick="window.randomizeAnimalName('${animal.name}')" style="white-space: nowrap;">🎲 Randomize</button>
            </div>
        </div>
        
        <div class="form-group">
            <label>🏞️ Exhibit</label>
            <select id="exhibitSelect" class="form-input"></select>
        </div>
        
        <div class="form-row">
            <div class="form-group" style="flex: 1;">
                <label>⚧️ Gender</label>
                <select id="genderSelect" class="form-input">
                    <option value="male">♂️ Male</option>
                    <option value="female">♀️ Female</option>
                </select>
            </div>
            <div class="form-group" style="flex: 1;">
                <label>🎂 Life Stage</label>
                <select id="ageSelect" class="form-input">
                    <option value="baby">🍼 Baby</option>
                    <option value="juvenile">🐾 Juvenile</option>
                    <option value="adult" selected>🦁 Adult</option>
                    <option value="senior">👴 Senior</option>
                </select>
            </div>
        </div>
        
        <div class="modal-footer">
            <div class="price-tag" style="margin-bottom: 0;">Total: 💰 $${cost.toLocaleString()}</div>
            <div class="flex gap-2" style="flex: 1; justify-content: flex-end;">
                <button class="btn-danger" onclick="window.closeBuyModal()">Cancel</button>
                <button class="btn-primary" onclick="window.confirmBuyAnimal()">✅ Confirm Purchase</button>
            </div>
        </div>
    `;

    // Re-populate the exhibit select
    const newSelect = document.getElementById("exhibitSelect");
    for (const id of ids) {
        const exhibit = state.exhibits[id];
        if (exhibit.buildDaysRemaining > 0) continue;
        if (exhibit.type !== requiredType) continue;
        if (!exhibitSizeOk(exhibit.size, animal.requiredExhibitSize || "small")) continue;

        const opt = document.createElement("option");
        opt.value = id;
        const exhibitType = data.exhibitTypes?.[exhibit.type] || { emoji: '🏞️', name: 'Exhibit' };
        opt.textContent = `${exhibitType.emoji} ${exhibit.name} (${exhibit.size})`;
        newSelect.appendChild(opt);
    }

    state.pendingAnimal = animal;
    modal.classList.add("active");
}

function exhibitSizeOk(exhibitSize, requiredSize) {
    const SIZE_RANK = { small: 1, medium: 2, large: 3 };
    return SIZE_RANK[exhibitSize] >= SIZE_RANK[requiredSize];
}

export function closeBuyModal() {
    const modal = document.getElementById("buyModal");
    if (modal) modal.classList.remove("active");
    state.pendingAnimal = null;
}

function confirmBuyAnimal() {
    const exhibitId = document.getElementById("exhibitSelect").value;
    const gender = document.getElementById("genderSelect").value;
    const ageStage = document.getElementById("ageSelect").value;
    const customName = document.getElementById("animalNameInput").value.trim();
    const animal = state.pendingAnimal;
    
    if (!exhibitId || !animal) {
        alert("Please select an exhibit!");
        return;
    }

    if (!customName || customName.length === 0) {
        alert("Please enter a name for your animal!");
        return;
    }

    const exhibit = state.exhibits[exhibitId];
    if (!exhibit) {
        alert("Exhibit not found!");
        return;
    }

    const cost = animal.cost ?? animal.price ?? 0;
    if (state.money < cost) {
        alert(`Not enough money! Need $${cost}`);
        return;
    }

    let ageDays = 365;
    if (ageStage === 'baby') ageDays = Math.floor(Math.random() * 30);
    else if (ageStage === 'juvenile') ageDays = 30 + Math.floor(Math.random() * 60);
    else if (ageStage === 'adult') ageDays = 90 + Math.floor(Math.random() * 275);
    else if (ageStage === 'senior') ageDays = 365 + Math.floor(Math.random() * 400);

    state.money -= cost;

    if (!state.dailyReport) state.dailyReport = {};
    if (!state.dailyReport.animalPurchases) state.dailyReport.animalPurchases = [];
    
    state.dailyReport.animalPurchases.push({
        name: customName,
        species: animal.name,
        cost: cost,
        exhibit: exhibit.name,
        gender: gender,
        ageStage: ageStage
    });

    const newAnimal = {
        uid: 'animal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        id: animal.id,
        speciesName: animal.name,
        name: customName,
        gender: gender,
        ageDays: ageDays,
        health: 100,
        sick: false,
        wasHungry: false,
        isPregnant: false,
        daysUntilBirth: 0,
        bornInZoo: false,
        diet: animal.diet
    };

    exhibit.animals.push(newAnimal);

    eventBus.emit('ANIMAL_PURCHASED', {
        animal: customName,
        species: animal.name,
        cost: cost,
        exhibit: exhibit.name,
        gender: gender,
        ageStage: ageStage
    });

    closeBuyModal();
    renderShop();
    eventBus.emit('DAY_ADVANCED');
}

const MALE_NAMES = ['Leo', 'Max', 'Charlie', 'Rocky', 'Zeus', 'Thor', 'Simba', 'Rex', 'Oscar', 'Felix', 'Milo', 'Buddy', 'Duke', 'Titan', 'Apollo', 'Loki', 'Kong', 'Rango', 'Diego', 'Alex'];
const FEMALE_NAMES = ['Luna', 'Bella', 'Daisy', 'Cleo', 'Nala', 'Zara', 'Willow', 'Mia', 'Ruby', 'Stella', 'Ginger', 'Lola', 'Pepper', 'Ivy', 'Athena', 'Freya', 'Kali', 'Suki', 'Maya', 'Aria'];
const GENDER_NEUTRAL_NAMES = ['Shadow', 'Storm', 'Blaze', 'Spirit', 'Misty', 'Thunder', 'Sunny', 'Pepper', 'Scout', 'Raven', 'Phoenix', 'Echo', 'Sage', 'Jasper', 'Indigo'];

function generateRandomAnimalName(speciesName) {
    if (Math.random() < 0.5) {
        const allNames = [...MALE_NAMES, ...FEMALE_NAMES, ...GENDER_NEUTRAL_NAMES];
        return allNames[Math.floor(Math.random() * allNames.length)];
    } else {
        return speciesName + ' ' + (Math.floor(Math.random() * 99) + 1);
    }
}

function randomizeAnimalName(speciesName) {
    const input = document.getElementById('animalNameInput');
    if (input) {
        input.value = generateRandomAnimalName(speciesName);
    }
}

window.randomizeAnimalName = randomizeAnimalName;
window.filterByCategory = (category) => {
    currentCategory = category;
    renderShop();
};
window.closeBuyModal = closeBuyModal;
window.confirmBuyAnimal = confirmBuyAnimal;
