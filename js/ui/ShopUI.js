// js/ui/ShopUI.js
import { state } from '../engine/GameState.js';
import { eventBus } from '../engine/EventBus.js';
import { data } from '../engine/data.js';

let currentCategory = 'all';
let currentSearch = '';

export function renderShop() {
    const shop = document.getElementById("shop");
    if (!shop) return;

    const categories = [...new Set(data.animals.map(a => a.category || 'Other'))].sort();
    
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

    const unlocked = [];
    const locked = [];

    data.animals.forEach(animal => {
        // For now, all animals are unlocked (we'll add research/achievement checks later)
        unlocked.push(animal);
    });

    let filtered = unlocked;
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
    filtered.forEach(animal => {
        const slotCost = getAnimalSlotCost(animal);
        const slotColor = slotCost >= 3 ? '#ef4444' : slotCost >= 2 ? '#f59e0b' : '#3b82f6';
        const dietEmoji = animal.diet === 'Carnivore' ? '🥩' : animal.diet === 'Herbivore' ? '🌿' : '🍖';
        const statusEmoji = animal.conservationStatus === 'Endangered' ? '🔴' :
            animal.conservationStatus === 'Vulnerable' ? '🟡' :
            animal.conservationStatus === 'Critically Endangered' ? '⚫' : '🟢';

        const actualFoodCost = getActualFoodCost(animal);

        const card = document.createElement("div");
        card.className = "premium-card";
        card.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 12px; overflow: hidden;";
        
        card.innerHTML = `
            <img src="${animal.image}" alt="${animal.name}" style="width: 100%; height: 200px; object-fit: cover;" />
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
                    <span style="background: #0f172a; color: ${slotColor}; padding: 4px 8px; border-radius: 8px; font-size: 0.8rem;">🧑‍🌾 ${slotCost} slot${slotCost > 1 ? 's' : ''}</span>
                </div>
                <p style="color: #9ca3af; font-size: 0.9rem; margin: 10px 0;">${animal.info}</p>
                <div style="display:flex; gap:6px; flex-wrap:wrap; margin: 6px 0;">
                    <span style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; padding: 4px 8px; border-radius: 8px; font-size: 0.8rem;">🍖 Upkeep: $${actualFoodCost}/day</span>
                    <span style="background: rgba(59, 130, 246, 0.15); color: #3b82f6; padding: 4px 8px; border-radius: 8px; font-size: 0.8rem;">🌟 Attraction: +${animal.attractionValue}</span>
                </div>
                <div style="font-size: 1.4rem; font-weight: 800; color: #22c55e; margin: 10px 0; text-align: center; background: rgba(34, 197, 94, 0.1); padding: 8px; border-radius: 8px; border: 1px solid rgba(34, 197, 94, 0.2);">
                    💰 $${(animal.cost ?? animal.price ?? 0).toLocaleString()}
                </div>
                <button class="buy-animal-btn" style="width: 100%; padding: 10px; background: #22c55e; color: #000; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 1rem;">
                    Add to Zoo
                </button>
            </div>
        `;

        card.querySelector(".buy-animal-btn").onclick = () => openBuyModal(animal);
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

    const requiredType = animal.requiredExhibitType || 'terrestrial';

    for (const id of ids) {
        const exhibit = state.exhibits[id];
        if (exhibit.type !== requiredType) continue;
        if (!exhibitSizeOk(exhibit.size, animal.requiredExhibitSize || "small")) continue;

        const opt = document.createElement("option");
        opt.value = id;
        const exhibitType = data.exhibitTypes[exhibit.type] || data.exhibitTypes.terrestrial || { emoji: '🏞️', name: 'Exhibit' };
        opt.textContent = `${exhibitType.emoji} ${exhibit.name}`;
        select.appendChild(opt);
        compatibleExhibits++;
    }

    if (compatibleExhibits === 0) {
        alert(`No compatible exhibits! Build a ${requiredType} exhibit first.`);
        return;
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

export function confirmBuyAnimal() {
    const exhibitSelect = document.getElementById("exhibitSelect");
    const genderSelect = document.getElementById("genderSelect");
    
    if (!exhibitSelect || !genderSelect) return;
    
    const exhibitId = exhibitSelect.value;
    const gender = genderSelect.value;
    const animal = state.pendingAnimal;

    if (!animal) return;

    if (state.money < animal.cost) {
        alert("Not enough money!");
        return;
    }

    const exhibit = state.exhibits[exhibitId];
    if (!exhibit) {
        alert("Exhibit not found!");
        return;
    }

    if (exhibit.buildDaysRemaining > 0) {
        alert("Exhibit is still under construction!");
        return;
    }

    // Deduct money
    state.money -= animal.cost;

    // Add animal to exhibit
    exhibit.animals.push({
        id: animal.id,
        name: getNextAnimalName(animal.name),
        gender,
        dailyIncome: animal.dailyIncome || 0,
        foodCost: animal.foodCost || 0,
        diet: animal.diet,
        foodAmount: animal.foodAmount || 1,
        compatibleWith: animal.compatibleWith || [],
        minInExhibit: animal.minInExhibit || 1,
        maxInExhibit: animal.maxInExhibit || 5,
        preferredShelter: animal.preferredShelter || [],
        preferredDecorations: animal.preferredDecorations || [],
        preferredFacilities: animal.preferredFacilities || [],
        dislikedShelter: animal.dislikedShelter || [],
        dislikedDecorations: animal.dislikedDecorations || [],
        dislikedFacilities: animal.dislikedFacilities || [],
        bornInZoo: false,
        health: 100,
        ageDays: 0,
        attractionValue: animal.attractionValue || 10
    });

    state.daysSinceNewAnimal = 0;

    // Emit event
    eventBus.emit('ANIMAL_PURCHASED', {
        animal: animal.name,
        exhibit: exhibit.name,
        cost: animal.cost
    });

    closeBuyModal();
    renderShop();
    
    // Update UI
    eventBus.emit('DAY_ADVANCED'); // Trigger UI refresh
}

function getNextAnimalName(speciesName) {
    if (!state.animalCounters) state.animalCounters = {};
    if (!state.animalCounters[speciesName]) state.animalCounters[speciesName] = 1;
    const suggestedName = `${speciesName} ${state.animalCounters[speciesName]}`;
    state.animalCounters[speciesName]++;
    return suggestedName;
}

// Expose functions to window for onclick handlers
window.filterByCategory = (category) => {
    currentCategory = category;
    renderShop();
};

window.closeBuyModal = closeBuyModal;
window.confirmBuyAnimal = confirmBuyAnimal;
