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
            <div style="text-align:center; padding:40px; background:#1e293b; border-radius:12px; border:1px solid #ef4444; color:#fca5a5;">
                <h3>❌ No Animal Data Found</h3>
                <p style="color:#9ca3af;">Check your browser console (F12) for details.</p>
            </div>
        `;
        return;
    }

    const categories = [...new Set(data.animals.map(a => a.category || 'Other'))].sort();
    
    shop.innerHTML = `
        <div style="background:#1e293b; border:1px solid #334155; border-radius:12px; padding:20px; margin-bottom:24px;">
            <input type="text" id="animalSearch" placeholder="🔍 Search animals by name, species, or habitat..." value="${currentSearch}" 
                style="width:100%; padding:12px 16px; font-size:1rem; background:#0f172a; color:#e5e7eb; border:2px solid #334155; border-radius:8px; margin-bottom:16px; outline:none; transition:border-color 0.2s;"
                onfocus="this.style.borderColor='#22c55e'" onblur="this.style.borderColor='#334155'" />
            
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <button onclick="window.filterByCategory('all')" 
                    style="padding:8px 16px; background:${currentCategory === 'all' ? '#22c55e' : '#0f172a'}; color:${currentCategory === 'all' ? '#000' : '#e5e7eb'}; border:1px solid ${currentCategory === 'all' ? '#22c55e' : '#334155'}; border-radius:8px; cursor:pointer; font-weight:600; transition:all 0.2s;">
                    🌍 All (${data.animals.length})
                </button>
                ${categories.map(cat => {
                    const count = data.animals.filter(a => a.category === cat).length;
                    const isActive = currentCategory === cat;
                    return `<button onclick="window.filterByCategory('${cat}')" 
                        style="padding:8px 16px; background:${isActive ? '#22c55e' : '#0f172a'}; color:${isActive ? '#000' : '#e5e7eb'}; border:1px solid ${isActive ? '#22c55e' : '#334155'}; border-radius:8px; cursor:pointer; font-weight:600; transition:all 0.2s;">
                        ${cat} (${count})
                    </button>`;
                }).join('')}
            </div>
        </div>
        <div id="shopGrid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:20px;"></div>
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
        grid.innerHTML = '<div style="text-align:center; padding:40px; background:#1e293b; border-radius:12px; grid-column:1/-1; color:#9ca3af;"><h3>No animals found</h3></div>';
        return;
    }

    grid.innerHTML = '';
    filtered.forEach((animal) => {
        const isLocked = animal.id && !isUnlocked(animal.id);
        const cost = animal.cost ?? animal.price ?? 0;
        
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

        const card = document.createElement("div");
        card.style.cssText = `
            background: #1e293b; 
            border: 1px solid ${isLocked ? '#475569' : '#334155'}; 
            border-radius: 12px; 
            overflow: hidden; 
            position: relative; 
            transition: transform 0.2s, box-shadow 0.2s;
            ${isLocked ? 'opacity: 0.7;' : 'cursor: pointer;'}
        `;
        if (!isLocked) {
            card.onmouseenter = () => { card.style.transform = 'translateY(-4px)'; card.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)'; };
            card.onmouseleave = () => { card.style.transform = 'translateY(0)'; card.style.boxShadow = 'none'; };
        }
        
        card.innerHTML = `
            ${isLocked ? `<div style="position:absolute; top:12px; right:12px; background:#ef4444; color:#fff; padding:4px 10px; border-radius:20px; font-weight:700; font-size:0.8rem; z-index:10;">🔒 LOCKED</div>` : ''}
            
            <img src="${animal.image || 'https://placehold.co/400x200/0f172a/e5e7eb?text=' + encodeURIComponent(animal.name)}" 
                alt="${animal.name}" style="width:100%; height:180px; object-fit:cover; background:#0f172a; ${isLocked ? 'filter:grayscale(100%);' : ''}" />
            
            <div style="padding:16px;">
                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:8px;">
                    <div>
                        <h3 style="margin:0; font-size:1.2rem; font-weight:800; color:#e5e7eb;">${animal.name}</h3>
                        <p style="margin:4px 0 0; font-size:0.85rem; color:#9ca3af; font-style:italic;">${animal.scienceName || ''}</p>
                    </div>
                    ${animal.category ? `<span style="background:#a855f7; color:#fff; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:600;">${animal.category}</span>` : ''}
                </div>
                
                <div style="display:flex; gap:6px; flex-wrap:wrap; margin:12px 0;">
                    <span style="background:#0f172a; color:#e5e7eb; padding:4px 8px; border-radius:6px; font-size:0.8rem; border:1px solid #334155;">${dietEmoji} ${animal.diet}</span>
                    <span style="background:#0f172a; color:#e5e7eb; padding:4px 8px; border-radius:6px; font-size:0.8rem; border:1px solid #334155;">🌍 ${animal.habitat}</span>
                    <span style="background:#0f172a; color:#e5e7eb; padding:4px 8px; border-radius:6px; font-size:0.8rem; border:1px solid #334155;">${statusEmoji} ${animal.conservationStatus}</span>
                </div>
                
                ${!isLocked ? `
                    <div style="background:#0f172a; border:1px solid #334155; border-radius:8px; padding:12px; margin:12px 0;">
                        <div style="color:#64748b; font-size:0.75rem; font-weight:700; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">Requirements</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:0.85rem; color:#e5e7eb;">
                            <div style="display:flex; align-items:center; gap:6px;"><span style="font-size:1.1rem;">${sizeEmoji}</span> ${requiredSize.charAt(0).toUpperCase() + requiredSize.slice(1)} Exhibit</div>
                            <div style="display:flex; align-items:center; gap:6px;"><span style="font-size:1.1rem;">${typeEmoji}</span> ${requiredType.charAt(0).toUpperCase() + requiredType.slice(1)}</div>
                            <div style="display:flex; align-items:center; gap:6px;"><span style="font-size:1.1rem;">${foodTypeEmoji}</span> ${foodAmount} ${foodType}/day</div>
                            <div style="display:flex; align-items:center; gap:6px;"><span style="font-size:1.1rem;">⭐</span> <span style="color:#fbbf24; font-weight:700;">+${attractionValue} visitors</span></div>
                        </div>
                    </div>
                ` : ''}
                
                <p style="color:#9ca3af; font-size:0.9rem; margin:12px 0; line-height:1.4;">${isLocked ? '🔒 Research required to unlock this animal.' : (animal.info || 'No description available.')}</p>
                
                <div style="font-size:1.3rem; font-weight:800; color:${isLocked ? '#64748b' : '#22c55e'}; text-align:center; background:${isLocked ? 'rgba(100,116,139,0.1)' : 'rgba(34,197,94,0.1)'}; padding:10px; border-radius:8px; border:1px solid ${isLocked ? 'rgba(100,116,139,0.2)' : 'rgba(34,197,94,0.2)'}; margin-bottom:12px;">
                    💰 $${cost.toLocaleString()}
                </div>
                
                <button class="buy-animal-btn" 
                    style="width:100%; padding:12px; background:${isLocked ? '#475569' : '#22c55e'}; color:${isLocked ? '#9ca3af' : '#000'}; border:none; border-radius:8px; font-weight:700; cursor:${isLocked ? 'not-allowed' : 'pointer'}; font-size:1rem; transition:filter 0.2s;"
                    ${isLocked ? 'disabled' : ''}
                    onmouseover="if(!${isLocked}) this.style.filter='brightness(1.1)'" 
                    onmouseout="if(!${isLocked}) this.style.filter='brightness(1)'">
                    ${isLocked ? '🔒 Locked' : '🛒 Add to Zoo'}
                </button>
            </div>
        `;

        if (!isLocked) {
            card.querySelector(".buy-animal-btn").onclick = (e) => {
                e.stopPropagation();
                openBuyModal(animal);
            };
        }

        grid.appendChild(card);
    });
}

function openBuyModal(animal) {
    // Create modal overlay dynamically to guarantee it looks good
    let modalOverlay = document.getElementById("dynamicBuyModal");
    if (!modalOverlay) {
        modalOverlay = document.createElement("div");
        modalOverlay.id = "dynamicBuyModal";
        modalOverlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); backdrop-filter:blur(4px); z-index:1000; display:flex; justify-content:center; align-items:center; opacity:0; transition:opacity 0.2s;";
        document.body.appendChild(modalOverlay);
        
        // Close on background click
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeBuyModal();
        });
    }

    const ids = Object.keys(state.exhibits);
    let compatibleExhibits = 0;
    const requiredType = animal.requiredExhibitType || 'terrestrial';
    let exhibitOptions = '';

    for (const id of ids) {
        const exhibit = state.exhibits[id];
        if (exhibit.buildDaysRemaining > 0) continue;
        if (exhibit.type !== requiredType) continue;
        
        const SIZE_RANK = { small: 1, medium: 2, large: 3 };
        if (SIZE_RANK[exhibit.size] < SIZE_RANK[animal.requiredExhibitSize || "small"]) continue;

        const exhibitType = data.exhibitTypes?.[exhibit.type] || { emoji: '🏞️', name: 'Exhibit' };
        exhibitOptions += `<option value="${id}">${exhibitType.emoji} ${exhibit.name} (${exhibit.size})</option>`;
        compatibleExhibits++;
    }

    if (compatibleExhibits === 0) {
        alert(`No compatible exhibits available!\n\nRequired: ${requiredType} exhibit, ${animal.requiredExhibitSize || 'small'} size or larger.`);
        return;
    }

    const defaultName = generateRandomAnimalName(animal.name);
    const cost = animal.cost ?? animal.price ?? 0;

    modalOverlay.innerHTML = `
        <div style="background:#1e293b; border:2px solid #334155; border-radius:16px; width:90%; max-width:500px; padding:24px; box-shadow:0 20px 50px rgba(0,0,0,0.5); transform:scale(0.95); transition:transform 0.2s;" id="modalContent">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3 style="margin:0; color:#e5e7eb; font-size:1.4rem;">🦁 Add ${animal.name}</h3>
                <button onclick="window.closeBuyModal()" style="background:#ef4444; color:#fff; border:none; width:32px; height:32px; border-radius:50%; cursor:pointer; font-size:1.2rem; display:flex; align-items:center; justify-content:center;">✕</button>
            </div>
            
            <div style="margin-bottom:16px;">
                <label style="display:block; margin-bottom:6px; font-weight:600; color:#e5e7eb; font-size:0.9rem;">🏷️ Animal Name</label>
                <div style="display:flex; gap:8px;">
                    <input type="text" id="animalNameInput" value="${defaultName}" maxlength="20" 
                        style="flex:1; padding:10px; background:#0f172a; color:#e5e7eb; border:2px solid #334155; border-radius:8px; font-size:1rem; outline:none;"
                        onfocus="this.style.borderColor='#22c55e'" onblur="this.style.borderColor='#334155'">
                    <button onclick="window.randomizeAnimalName('${animal.name}')" style="padding:10px 16px; background:#334155; color:#e5e7eb; border:none; border-radius:8px; cursor:pointer; font-weight:600;">🎲</button>
                </div>
            </div>
            
            <div style="margin-bottom:16px;">
                <label style="display:block; margin-bottom:6px; font-weight:600; color:#e5e7eb; font-size:0.9rem;">🏞️ Exhibit</label>
                <select id="exhibitSelect" style="width:100%; padding:10px; background:#0f172a; color:#e5e7eb; border:2px solid #334155; border-radius:8px; font-size:1rem; outline:none;"
                    onfocus="this.style.borderColor='#22c55e'" onblur="this.style.borderColor='#334155'">
                    ${exhibitOptions}
                </select>
            </div>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px;">
                <div>
                    <label style="display:block; margin-bottom:6px; font-weight:600; color:#e5e7eb; font-size:0.9rem;">⚧️ Gender</label>
                    <select id="genderSelect" style="width:100%; padding:10px; background:#0f172a; color:#e5e7eb; border:2px solid #334155; border-radius:8px; font-size:1rem; outline:none;"
                        onfocus="this.style.borderColor='#22c55e'" onblur="this.style.borderColor='#334155'">
                        <option value="male">♂️ Male</option>
                        <option value="female">♀️ Female</option>
                    </select>
                </div>
                <div>
                    <label style="display:block; margin-bottom:6px; font-weight:600; color:#e5e7eb; font-size:0.9rem;">🎂 Life Stage</label>
                    <select id="ageSelect" style="width:100%; padding:10px; background:#0f172a; color:#e5e7eb; border:2px solid #334155; border-radius:8px; font-size:1rem; outline:none;"
                        onfocus="this.style.borderColor='#22c55e'" onblur="this.style.borderColor='#334155'">
                        <option value="baby">🍼 Baby</option>
                        <option value="juvenile">🐾 Juvenile</option>
                        <option value="adult" selected>🦁 Adult</option>
                        <option value="senior">👴 Senior</option>
                    </select>
                </div>
            </div>
            
            <div style="display:flex; align-items:center; justify-content:space-between; padding-top:16px; border-top:2px solid #334155;">
                <div style="font-size:1.3rem; font-weight:800; color:#22c55e;">💰 $${cost.toLocaleString()}</div>
                <div style="display:flex; gap:10px;">
                    <button onclick="window.closeBuyModal()" style="padding:10px 20px; background:#ef4444; color:#fff; border:none; border-radius:8px; font-weight:700; cursor:pointer;">Cancel</button>
                    <button onclick="window.confirmBuyAnimal()" style="padding:10px 20px; background:#22c55e; color:#000; border:none; border-radius:8px; font-weight:700; cursor:pointer;">✅ Confirm</button>
                </div>
            </div each>
        </div>
    `;

    state.pendingAnimal = animal;
    document.body.appendChild(modalOverlay);
    
    // Trigger animation
    requestAnimationFrame(() => {
        modalOverlay.style.opacity = '1';
        document.getElementById('modalContent').style.transform = 'scale(1)';
    });
    
    // Focus name input
    setTimeout(() => document.getElementById('animalNameInput')?.focus(), 100);
}

export function closeBuyModal() {
    const modalOverlay = document.getElementById("dynamicBuyModal");
    if (modalOverlay) {
        modalOverlay.style.opacity = '0';
        document.getElementById('modalContent').style.transform = 'scale(0.95)';
        setTimeout(() => {
            modalOverlay.remove();
            state.pendingAnimal = null;
        }, 200);
    }
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
        input.focus();
    }
}

window.randomizeAnimalName = randomizeAnimalName;
window.filterByCategory = (category) => {
    currentCategory = category;
    renderShop();
};
window.closeBuyModal = closeBuyModal;
window.confirmBuyAnimal = confirmBuyAnimal;
