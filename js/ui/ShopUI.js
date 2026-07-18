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

    console.log('🔍 DEBUG: data.animals =', data.animals);
    console.log('🔍 DEBUG: data.animals length =', data.animals?.length);

    if (!data.animals || data.animals.length === 0) {
        shop.innerHTML = `
            <div style="text-align:center; padding:40px; color:#fca5a5;">
                <h3>❌ No Animal Data Found</h3>
                <p style="color:#9ca3af;">Check your browser console (F12) for details.</p>
                <p style="color:#9ca3af; font-size:0.9rem;">Make sure data/animals.json exists and has data.</p>
            </div>
        `;
        return;
    }

    const categories = [...new Set(data.animals.map(a => a.category || 'Other'))].sort();
    
    console.log('🔍 DEBUG: Categories found =', categories);
    
    shop.innerHTML = `
        <div style="margin-bottom: 20px;">
            <div style="margin-bottom: 15px;">
                <input type="text" id="animalSearch" placeholder="🔍 Search animals..." value="${currentSearch}" 
                    style="width: 100%; padding: 12px; font-size: 16px; background: #1e293b; color: #e5e7eb; border: 1px solid #334155; border-radius: 10px;"/>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">
                <button class="category-tab ${currentCategory === 'all' ? 'active' : ''}" onclick="window.filterByCategory('all')" 
                    style="padding: 8px 16px; background: ${currentCategory === 'all' ? '#22c55e' : '#1e293b'}; color: ${currentCategory === 'all' ? '#000' : '#e5e7eb'}; border: 1px solid #334155; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    🌍 All (${data.animals.length})
                </button>
                ${categories.map(cat => {
                    const count = data.animals.filter(a => a.category === cat).length;
                    const isActive = currentCategory === cat;
                    return `<button class="category-tab ${isActive ? 'active' : ''}" onclick="window.filterByCategory('${cat}')" 
                        style="padding: 8px 16px; background: ${isActive ? '#22c55e' : '#1e293b'}; color: ${isActive ? '#000' : '#e5e7eb'}; border: 1px solid #334155; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        ${cat} (${count})
                    </button>`;
                }).join('')}
            </div>
        </div>
        <div class="grid-layout" id="shopGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px;"></div>
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
        grid.innerHTML = '<div style="text-align:center; padding:40px; color:#9ca3af; grid-column: 1/-1;"><h3>No animals found</h3></div>';
        return;
    }

    grid.innerHTML = '';
    filtered.forEach((animal) => {
        // 🔥 Check if animal is unlocked
        const isLocked = animal.id && !isUnlocked(animal.id);
        
        const slotCost = getAnimalSlotCost(animal);
        const slotColor = slotCost >= 3 ? '#ef4444' : slotCost >= 2 ? '#f59e0b' : '#3b82f6';
        const dietEmoji = animal.diet === 'Carnivore' ? '🥩' : animal.diet === 'Herbivore' ? '🌿' : '🍖';
        const statusEmoji = animal.conservationStatus === 'Endangered' ? '🔴' :
            animal.conservationStatus === 'Vulnerable' ? '🟡' :
            animal.conservationStatus === 'Critically Endangered' ? '⚫' : '';

        const actualFoodCost = getActualFoodCost(animal);
        const imageUrl = animal.image || 'https://placehold.co/400x200/1e293b/e5e7eb?text=' + encodeURIComponent(animal.name);

        const card = document.createElement("div");
        card.className = "premium-card";
        card.style.cssText = `background: #1e293b; border: 1px solid ${isLocked ? '#64748b' : '#334155'}; border-radius: 12px; overflow: hidden; position: relative; ${isLocked ? 'opacity: 0.7;' : ''}`;
        
        card.innerHTML = `
            ${isLocked ? `
                <div style="position: absolute; top: 10px; right: 10px; background: #64748b; color: #fff; padding: 6px 12px; border-radius: 20px; font-weight: 700; font-size: 0.85rem; z-index: 10;">
                    🔒 LOCKED
                </div>
            ` : ''}
            <img src="${imageUrl}" alt="${animal.name}" style="width: 100%; height: 200px; object-fit: cover; background: #0f172a; ${isLocked ? 'filter: grayscale(100%);' : ''}" />
            <div style="padding: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <div>
                        <h3 style="margin:0; font-size:1.3rem; font-weight:800; color: #e5e7eb;">${animal.name}</h3>
                        <p style="margin:0 0 4px; font-size:0.85rem; color:#9ca3af; font-style:italic;">${animal.scienceName || ''}</p>
                    </div>
                    ${animal.category ? `<span style="background: #a855f7; color: #fff; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">${animal.category}</span>` : ''}
                </div>
                <div style="display: flex; gap: 6px; flex-wrap: wrap; margin: 8px 0;">
                    <span style="background: #0f172a; color: #e5e7eb; padding: 4px 8px; border-radius: 8px; font-size: 0.8rem;">${dietEmoji} ${animal.diet}</span>
                    <span style="background: #0f172a; color: #e5e7eb; padding: 4px 8px; border-radius: 8px; font-size: 0.8rem;">🌍 ${animal.habitat}</span>
                    <span style="background: #0f172a; color: #e5e7eb; padding: 4px 8px; border-radius: 8px; font-size: 0.8rem;">${statusEmoji} ${animal.conservationStatus}</span>
                </div>
                <p style="color: #9ca3af; font-size: 0.9rem; margin: 10px 0;">${isLocked ? '🔒 Research required to unlock this animal.' : (animal.info || 'No description available.')}</p>
                <div style="font-size: 1.4rem; font-weight: 800; color: ${isLocked ? '#64748b' : '#22c55e'}; margin: 10px 0; text-align: center; background: ${isLocked ? 'rgba(100, 116, 139, 0.1)' : 'rgba(34, 197, 94, 0.1)'}; padding: 8px; border-radius: 8px; border: 1px solid ${isLocked ? 'rgba(100, 116, 139, 0.2)' : 'rgba(34, 197, 94, 0.2)'};">
                    💰 $${(animal.cost ?? animal.price ?? 0).toLocaleString()}
                </div>
                <button class="buy-animal-btn" 
                    style="width: 100%; padding: 10px; background: ${isLocked ? '#475569' : '#22c55e'}; color: ${isLocked ? '#9ca3af' : '#000'}; border: none; border-radius: 8px; font-weight: 700; cursor: ${isLocked ? 'not-allowed' : 'pointer'}; font-size: 1rem;"
                    ${isLocked ? 'disabled' : ''}>
                    ${isLocked ? '🔒 Locked' : 'Add to Zoo'}
                </button>
            </div>
        `;

        if (!isLocked) {
            card.querySelector(".buy-animal-btn").onclick = () => openBuyModal(animal);
        }

        grid.appendChild(card);
    });
}

function getAnimalSlotCost(animal) {
    const size = animal.requiredExhibitSize || "small";
    if (size === "large") return 3;
    if (size === "medium") return 2;
    return 1;
}

function getActualFoodCost(animal) {
    const foodTypes = {
        hay: { costPerUnit: 2, diet: "Herbivore" },
        meat: { costPerUnit: 5, diet: "Carnivore" },
        produce: { costPerUnit: 3, diet: "Omnivore" }
    };
    
    const diet = animal.diet;
    let foodType = 'hay';
    if (diet === "Carnivore") foodType = "meat";
    else if (diet === "Omnivore") foodType = "produce";
    
    const foodData = foodTypes[foodType];
    const baseAmount = animal.foodAmount || 1;
    return foodData.costPerUnit * baseAmount;
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
        
        if (exhibit.buildDaysRemaining > 0) {
            underConstruction++;
            continue;
        }
        
        if (exhibit.type !== requiredType) {
            wrongType++;
            continue;
        }
        
        if (!exhibitSizeOk(exhibit.size, animal.requiredExhibitSize || "small")) {
            wrongSize++;
            continue;
        }

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

    // 🔥 NEW: Generate a random default name
    const defaultName = generateRandomAnimalName(animal.name);

    // Update modal content to include Name input
    const modalContent = modal.querySelector('.modal-content');
    modalContent.innerHTML = `
        <h3>🦁 Add ${animal.name} to Zoo</h3>
        <p style="color: #9ca3af; margin-bottom: 15px;">Customize your new animal:</p>
        
        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #e5e7eb;">🏷️ Animal Name:</label>
        <input type="text" id="animalNameInput" value="${defaultName}" 
            style="width: 100%; padding: 10px; margin-bottom: 15px; background: #0f172a; color: #e5e7eb; border: 1px solid #334155; border-radius: 8px; font-size: 1rem;"
            placeholder="Enter a name..." maxlength="20">
        <button onclick="window.randomizeAnimalName('${animal.name}')" style="margin-bottom: 15px; padding: 6px 12px; background: #334155; color: #e5e7eb; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">🎲 Randomize Name</button>
        
        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #e5e7eb;">🏞️ Exhibit:</label>
        <select id="exhibitSelect" style="width: 100%; padding: 10px; margin-bottom: 15px; background: #0f172a; color: #e5e7eb; border: 1px solid #334155; border-radius: 8px; font-size: 1rem;">
        </select>
        
        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #e5e7eb;">⚧️ Gender:</label>
        <select id="genderSelect" style="width: 100%; padding: 10px; margin-bottom: 15px; background: #0f172a; color: #e5e7eb; border: 1px solid #334155; border-radius: 8px; font-size: 1rem;">
            <option value="male">♂️ Male</option>
            <option value="female">♀️ Female</option>
        </select>

        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #e5e7eb;">🎂 Life Stage:</label>
        <select id="ageSelect" style="width: 100%; padding: 10px; margin-bottom: 15px; background: #0f172a; color: #e5e7eb; border: 1px solid #334155; border-radius: 8px; font-size: 1rem;">
            <option value="baby">🍼 Baby (0-30 days) - Lower attraction, grows over time</option>
            <option value="juvenile">🐾 Juvenile (31-90 days) - Moderate attraction</option>
            <option value="adult" selected>🦁 Adult (91-365 days) - Full attraction value</option>
            <option value="senior">👴 Senior (365+ days) - Full attraction, higher health risks</option>
        </select>
        
        <div class="modal-buttons" style="display: flex; gap: 10px; margin-top: 10px;">
            <button class="confirm-btn" style="flex: 1; padding: 12px; background: #22c55e; color: #000; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 1rem;" onclick="confirmBuyAnimal()">✅ Confirm Purchase</button>
            <button class="cancel-btn" style="flex: 1; padding: 12px; background: #ef4444; color: #fff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 1rem;" onclick="closeBuyModal()">❌ Cancel</button>
        </div>
    `;

    // Re-populate the exhibit select since we overwrote the innerHTML
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
    const customName = document.getElementById("animalNameInput").value.trim(); // 🔥 NEW
    const animal = state.pendingAnimal;
    
    if (!exhibitId || !animal) {
        alert("Please select an exhibit!");
        return;
    }

    // 🔥 NEW: Validate name
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

    // Determine ageDays based on selection
    let ageDays = 365;
    if (ageStage === 'baby') ageDays = Math.floor(Math.random() * 30);
    else if (ageStage === 'juvenile') ageDays = 30 + Math.floor(Math.random() * 60);
    else if (ageStage === 'adult') ageDays = 90 + Math.floor(Math.random() * 275);
    else if (ageStage === 'senior') ageDays = 365 + Math.floor(Math.random() * 400);

    // Deduct money
    state.money -= cost;

    // Track animal purchase in daily report
    if (!state.dailyReport) state.dailyReport = {};
    if (!state.dailyReport.animalPurchases) state.dailyReport.animalPurchases = [];
    
    state.dailyReport.animalPurchases.push({
        name: customName, // 🔥 CHANGED: Use custom name
        species: animal.name, // 🔥 NEW: Track species separately
        cost: cost,
        exhibit: exhibit.name,
        gender: gender,
        ageStage: ageStage
    });

    // Create animal instance with chosen age and custom name
    const newAnimal = {
        uid: 'animal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        id: animal.id, // 🔥 Species ID (for grouping)
        speciesName: animal.name, // 🔥 NEW: Species name (for display/grouping)
        name: customName, // 🔥 CHANGED: Custom individual name
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
        animal: customName, // 🔥 CHANGED: Use custom name
        species: animal.name, // 🔥 NEW: Track species
        cost: cost,
        exhibit: exhibit.name,
        gender: gender,
        ageStage: ageStage
    });

    closeBuyModal();
    renderShop();
    eventBus.emit('DAY_ADVANCED');
}

function getNextAnimalName(speciesName) {
    if (!state.animalCounters) state.animalCounters = {};
    if (!state.animalCounters[speciesName]) state.animalCounters[speciesName] = 1;
    const suggestedName = `${speciesName} ${state.animalCounters[speciesName]}`;
    state.animalCounters[speciesName]++;
    return suggestedName;
}

// =====================================================================
// NAME GENERATION HELPERS
// =====================================================================
const MALE_NAMES = ['Leo', 'Max', 'Charlie', 'Rocky', 'Zeus', 'Thor', 'Simba', 'Rex', 'Oscar', 'Felix', 'Milo', 'Buddy', 'Duke', 'Titan', 'Apollo', 'Loki', 'Kong', 'Rango', 'Diego', 'Alex'];
const FEMALE_NAMES = ['Luna', 'Bella', 'Daisy', 'Cleo', 'Nala', 'Zara', 'Willow', 'Mia', 'Ruby', 'Stella', 'Ginger', 'Lola', 'Pepper', 'Ivy', 'Athena', 'Freya', 'Kali', 'Suki', 'Maya', 'Aria'];
const GENDER_NEUTRAL_NAMES = ['Shadow', 'Storm', 'Blaze', 'Spirit', 'Misty', 'Thunder', 'Sunny', 'Pepper', 'Scout', 'Raven', 'Phoenix', 'Echo', 'Sage', 'Jasper', 'Indigo'];

function generateRandomAnimalName(speciesName) {
    // 50% chance of gendered name, 50% chance of species-based name
    if (Math.random() < 0.5) {
        const allNames = [...MALE_NAMES, ...FEMALE_NAMES, ...GENDER_NEUTRAL_NAMES];
        return allNames[Math.floor(Math.random() * allNames.length)];
    } else {
        // Use species-based name
        return speciesName + ' ' + (Math.floor(Math.random() * 99) + 1);
    }
}

function randomizeAnimalName(speciesName) {
    const input = document.getElementById('animalNameInput');
    if (input) {
        input.value = generateRandomAnimalName(speciesName);
    }
}

// Expose to window
window.randomizeAnimalName = randomizeAnimalName;
// Expose functions to window for onclick handlers
window.filterByCategory = (category) => {
    currentCategory = category;
    renderShop();
};

window.closeBuyModal = closeBuyModal;
window.confirmBuyAnimal = confirmBuyAnimal;
