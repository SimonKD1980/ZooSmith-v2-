// js/ui/HouseUI.js
import { state, generateUniqueId, canPlaceAnimalInIndoorExhibit } from '../engine/GameState.js';
import { eventBus } from '../engine/EventBus.js';
import { data } from '../engine/data.js';

let currentHouseId = null;
let currentExhibitId = null;
let pendingHouseIdForExhibit = null;

export const HouseUI = {
    init() {
        this.renderHouseShop();
        this.renderBuiltHouses();
    },

    renderHouseShop() {
        const container = document.getElementById('houseShopContainer');
        if (!container || !data.houses) return;
        container.innerHTML = '';

        if (data.houses.length === 0) {
            container.innerHTML = '<p style="color: #9ca3af; grid-column: 1/-1; text-align: center;">No house types available. Check data/houses.json</p>';
            return;
        }

        data.houses.forEach(house => {
            const canAfford = state.money >= house.cost;
            const buildDays = house.buildDays || 5;
            const div = document.createElement('div');
            div.className = 'exhibit-slot empty';
            div.style.cursor = 'default';
            div.innerHTML = `
                <div class="slot-icon">${house.icon}</div>
                <div class="slot-title">${house.name}</div>
                <div class="slot-subtitle">${house.description}</div>
                <div class="slot-subtitle">📅 ${buildDays} days • Cap: ${house.capacity} • 💰 $${house.dailyUpkeep}/day upkeep</div>
                <button class="btn-small btn-primary" onclick="HouseUI.buyHouse('${house.id}')" ${!canAfford ? 'disabled' : ''}>
                    ${canAfford ? `Build $${house.cost}` : '💸 Can\'t Afford'}
                </button>
            `;
            container.appendChild(div);
        });
    },

    renderBuiltHouses() {
        const container = document.getElementById('builtHousesList');
        if (!container) return;
        container.innerHTML = '';

        const houseInstances = Object.values(state.houses || {});
        if (houseInstances.length === 0) {
            container.innerHTML = '<p style="color: #9ca3af; grid-column: 1/-1; text-align: center;">No houses built yet.</p>';
            return;
        }

        houseInstances.forEach(house => {
            const houseData = data.houses.find(h => h.id === house.dataId);
            if (!houseData) return;
            
            const isUnderConstruction = house.buildDaysRemaining > 0;
            const div = document.createElement('div');
            div.className = `exhibit-slot ${isUnderConstruction ? 'empty' : 'occupied'}`;
            div.style.cursor = isUnderConstruction ? 'default' : 'pointer';
            
            let constructionHTML = '';
            if (isUnderConstruction) {
                const totalDays = houseData.buildDays || 5;
                const progress = ((totalDays - house.buildDaysRemaining) / totalDays) * 100;
                constructionHTML = `
                    <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid #f59e0b; border-radius: 6px; padding: 10px; margin: 10px 0;">
                        <div style="color: #fbbf24; font-weight: 700; margin-bottom: 4px;">🚧 Under Construction</div>
                        <div style="color: #e5e7eb; font-size: 0.9rem;">${house.buildDaysRemaining} day${house.buildDaysRemaining !== 1 ? 's' : ''} remaining</div>
                        <div style="height: 6px; background: #1e293b; border-radius: 3px; margin-top: 6px; overflow: hidden;">
                            <div style="height: 100%; width: ${progress}%; background: #f59e0b; transition: width 0.5s;"></div>
                        </div>
                    </div>
                `;
            }
            
            div.innerHTML = `
                <div class="slot-icon">${houseData.icon}</div>
                <div class="slot-title">${house.name}</div>
                ${constructionHTML}
                ${!isUnderConstruction ? `
                    <div class="slot-subtitle">${Object.keys(house.exhibits || {}).length}/${houseData.capacity} Exhibits</div>
                    <button class="btn-small btn-primary" onclick="event.stopPropagation(); HouseUI.openHouseDetail('${house.id}')">Manage</button>
                ` : `
                    <div class="slot-subtitle" style="color: #f59e0b;">🚧 Building...</div>
                `}
            `;
            
            if (!isUnderConstruction) {
                div.onclick = () => this.openHouseDetail(house.id);
            }
            container.appendChild(div);
        });
    },

    buyHouse(houseDataId) {
        const houseData = data.houses.find(h => h.id === houseDataId);
        if (!houseData) return;

        if (state.money < houseData.cost) {
            alert("Not enough money!");
            return;
        }

        const name = prompt(`Name your new ${houseData.name}:`, houseData.name);
        if (!name) return;

        const instanceId = generateUniqueId('house');
        if (!state.houses) state.houses = {};
        
        const buildDays = houseData.buildDays || 5;
        
        state.houses[instanceId] = {
            id: instanceId,
            dataId: houseData.id,
            name: name,
            cleanliness: 100,
            exhibits: {},
            buildDaysRemaining: buildDays
        };
        
        // 🔥 DEDUCT MONEY
        state.money -= houseData.cost;
        
        // 🔥 TRACK IN DAILY REPORT
        if (!state.dailyReport) state.dailyReport = {};
        if (!state.dailyReport.animalPurchases) state.dailyReport.animalPurchases = [];
        state.dailyReport.animalPurchases.push({
            name: name,
            species: houseData.name,
            cost: houseData.cost,
            exhibit: 'Houses',
            gender: 'N/A',
            ageStage: 'construction'
        });

        eventBus.emit('HOUSE_BUILD_STARTED', { 
            name: name, 
            cost: houseData.cost,
            days: buildDays
        });
        eventBus.emit('MONEY_CHANGED');

        this.renderHouseShop();
        this.renderBuiltHouses();
    },

    openHouseDetail(houseInstanceId) {
        currentHouseId = houseInstanceId;
        const house = state.houses[houseInstanceId];
        if (!house) return;

        const houseData = data.houses.find(h => h.id === house.dataId);
        if (!houseData) return;

        const exhibitCount = Object.keys(house.exhibits || {}).length;
        document.getElementById('modalHouseTitle').innerText = `${houseData.icon} ${house.name}`;
        document.getElementById('modalHouseDesc').innerText = houseData.description;
        document.getElementById('modalHouseClimate').innerText = `🌡️ Climate: ${houseData.climate.charAt(0).toUpperCase() + houseData.climate.slice(1)}`;
        document.getElementById('modalHouseUpkeep').innerText = `💰 Upkeep: $${houseData.dailyUpkeep}/day`;
        document.getElementById('modalHouseCapacity').innerText = `📦 Capacity: ${exhibitCount}/${houseData.capacity} Exhibits`;
        document.getElementById('sellHouseBtn').onclick = () => this.sellHouse(houseInstanceId);

        this.renderIndoorExhibitsGrid(house, houseData);
        document.getElementById('houseDetailModal').classList.add('active');
    },

    renderIndoorExhibitsGrid(house, houseData) {
        const grid = document.getElementById('indoorExhibitsGrid');
        grid.innerHTML = '';

        Object.values(house.exhibits || {}).forEach(exhibit => {
            const exData = data.indoor_exhibits.find(e => e.id === exhibit.dataId);
            if (!exData) return;

            const animalNames = (exhibit.animals || []).map(aId => {
                const animal = data.animals.find(a => a.id === aId);
                return animal ? animal.name : 'Unknown';
            });

            const isUnderConstruction = exhibit.buildDaysRemaining > 0;
            const div = document.createElement('div');
            div.className = `exhibit-slot ${isUnderConstruction ? 'empty' : 'occupied'}`;
            
            let constructionHTML = '';
            if (isUnderConstruction) {
                const totalDays = exData.buildDays || 2;
                const progress = ((totalDays - exhibit.buildDaysRemaining) / totalDays) * 100;
                constructionHTML = `
                    <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid #f59e0b; border-radius: 6px; padding: 8px; margin: 8px 0;">
                        <div style="color: #fbbf24; font-weight: 700; font-size: 0.85rem;">🚧 Building ${exhibit.buildDaysRemaining}d left</div>
                        <div style="height: 4px; background: #1e293b; border-radius: 2px; margin-top: 4px; overflow: hidden;">
                            <div style="height: 100%; width: ${progress}%; background: #f59e0b;"></div>
                        </div>
                    </div>
                `;
            }
            
            div.innerHTML = `
                <div class="slot-icon">${exData.icon}</div>
                <div class="slot-title">${exData.name}</div>
                ${constructionHTML}
                ${!isUnderConstruction ? `
                    <div class="slot-subtitle">${(exhibit.animals || []).length}/${exData.maxAnimals} Animals</div>
                    <div class="animal-tags">
                        ${animalNames.map(name => `<span class="animal-tag">${name}</span>`).join('')}
                    </div>
                    <button class="btn-small btn-secondary" onclick="HouseUI.promptAddAnimal('${house.id}', '${exhibit.id}')">+ Add Animal</button>
                ` : `
                    <div class="slot-subtitle" style="color: #f59e0b;">🚧 Building...</div>
                `}
            `;
            grid.appendChild(div);
        });

        const emptySlots = houseData.capacity - Object.keys(house.exhibits || {}).length;
        for (let i = 0; i < emptySlots; i++) {
            const div = document.createElement('div');
            div.className = 'exhibit-slot empty';
            div.innerHTML = `
                <div class="slot-icon">➕</div>
                <div class="slot-title">Empty Slot</div>
                <div class="slot-subtitle">Click to build an exhibit</div>
                <button class="btn-small btn-secondary" onclick="HouseUI.showExhibitTypeModal('${house.id}')">Build Exhibit</button>
            `;
            grid.appendChild(div);
        }
    },

    showExhibitTypeModal(houseInstanceId) {
        pendingHouseIdForExhibit = houseInstanceId;
        const house = state.houses[houseInstanceId];
        const houseData = data.houses.find(h => h.id === house.dataId);
        const allowedExhibits = data.indoor_exhibits.filter(ex => 
            houseData.allowedExhibitSize.includes(ex.size) &&
            houseData.allowedExhibitType.includes(ex.type)
        );

        const optionsContainer = document.getElementById('exhibitTypeOptions');
        optionsContainer.innerHTML = '';

        if (allowedExhibits.length === 0) {
            optionsContainer.innerHTML = '<p style="color: #ef4444; grid-column: 1/-1; text-align: center;">No exhibit types available for this house.</p>';
        } else {
            allowedExhibits.forEach(ex => {
                const canAfford = state.money >= ex.cost;
                const buildDays = ex.buildDays || 2;
                const div = document.createElement('div');
                div.style.cssText = `background: #0f172a; border: 2px solid #334155; border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.2s;`;
                div.onmouseenter = () => div.style.borderColor = '#22c55e';
                div.onmouseleave = () => div.style.borderColor = '#334155';
                div.innerHTML = `
                    <div style="font-size: 3rem; text-align: center; margin-bottom: 10px;">${ex.icon}</div>
                    <h3 style="margin: 0 0 8px; color: #e5e7eb; text-align: center;">${ex.name}</h3>
                    <p style="color: #9ca3af; font-size: 0.9rem; margin: 0 0 12px; text-align: center;">${ex.description}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 0.85rem;">
                        <span style="color: #9ca3af;">📏 ${ex.size}</span>
                        <span style="color: #9ca3af;">🐾 Max ${ex.maxAnimals}</span>
                        <span style="color: #f59e0b;">📅 ${buildDays}d</span>
                    </div>
                    <div style="font-size: 1.3rem; font-weight: 800; color: ${canAfford ? '#22c55e' : '#64748b'}; text-align: center; margin-bottom: 12px;">
                        💰 $${ex.cost.toLocaleString()}
                    </div>
                    <button class="btn-small ${canAfford ? 'btn-primary' : 'btn-secondary'}" 
                        style="width: 100%;"
                        onclick="event.stopPropagation(); HouseUI.buildIndoorExhibit('${houseInstanceId}', '${ex.id}')"
                        ${!canAfford ? 'disabled' : ''}>
                        ${canAfford ? '🏗️ Build' : '💸 Can\'t Afford'}
                    </button>
                `;
                if (canAfford) {
                    div.onclick = () => this.buildIndoorExhibit(houseInstanceId, ex.id);
                }
                optionsContainer.appendChild(div);
            });
        }

        document.getElementById('exhibitTypeModal').classList.add('active');
    },

    buildIndoorExhibit(houseInstanceId, exhibitDataId) {
        const house = state.houses[houseInstanceId];
        const exData = data.indoor_exhibits.find(e => e.id === exhibitDataId);
        if (!exData) return;

        if (state.money < exData.cost) {
            alert("Not enough money to build this exhibit!");
            return;
        }

        const instanceId = generateUniqueId('indoor_ex');
        if (!house.exhibits) house.exhibits = {};
        
        const buildDays = exData.buildDays || 2;
        
        house.exhibits[instanceId] = {
            id: instanceId,
            dataId: exData.id,
            animals: [],
            cleanliness: 100,
            buildDaysRemaining: buildDays
        };
        
        // 🔥 DEDUCT MONEY
        state.money -= exData.cost;
        
        // 🔥 TRACK IN DAILY REPORT
        if (!state.dailyReport) state.dailyReport = {};
        if (!state.dailyReport.animalPurchases) state.dailyReport.animalPurchases = [];
        state.dailyReport.animalPurchases.push({
            name: exData.name,
            species: 'Indoor Exhibit',
            cost: exData.cost,
            exhibit: house.name,
            gender: 'N/A',
            ageStage: 'construction'
        });

        eventBus.emit('INDOOR_EXHIBIT_BUILD_STARTED', { 
            name: exData.name, 
            houseName: house.name,
            cost: exData.cost,
            days: buildDays
        });
        eventBus.emit('MONEY_CHANGED');

        this.closeExhibitTypeModal();
        const houseData = data.houses.find(h => h.id === house.dataId);
        this.renderIndoorExhibitsGrid(house, houseData);
        this.renderBuiltHouses();
    },

    promptAddAnimal(houseInstanceId, exhibitInstanceId) {
        currentHouseId = houseInstanceId;
        currentExhibitId = exhibitInstanceId;

        const house = state.houses[houseInstanceId];
        const exhibit = house.exhibits[exhibitInstanceId];
        const exData = data.indoor_exhibits.find(e => e.id === exhibit.dataId);

        const compatibleAnimals = data.animals.filter(animal => {
            const validation = canPlaceAnimalInIndoorExhibit(animal, exData, (exhibit.animals || []).length);
            return validation.valid;
        });

        const listContainer = document.getElementById('compatibleAnimalsList');
        listContainer.innerHTML = '';

        if (compatibleAnimals.length === 0) {
            listContainer.innerHTML = '<p style="color: #ef4444;">No compatible animals available. Check size/type requirements.</p>';
        } else {
            compatibleAnimals.forEach(animal => {
                const div = document.createElement('div');
                div.className = 'animal-list-item';
                div.innerHTML = `
                    <span>${animal.icon || '🐾'} ${animal.name} <small style="color:#9ca3af">(${animal.requiredExhibitSize || 'small'} ${animal.requiredExhibitType || 'terrestrial'})</small></span>
                    <button class="btn-small btn-primary" onclick="HouseUI.confirmAddAnimal('${animal.id}')">Add</button>
                `;
                listContainer.appendChild(div);
            });
        }

        document.getElementById('animalSelectorModal').classList.add('active');
    },

    confirmAddAnimal(animalId) {
        if (!currentHouseId || !currentExhibitId) return;

        const house = state.houses[currentHouseId];
        const exhibit = house.exhibits[currentExhibitId];
        const animalData = data.animals.find(a => a.id === animalId);
        const exData = data.indoor_exhibits.find(e => e.id === exhibit.dataId);

        const validation = canPlaceAnimalInIndoorExhibit(animalData, exData, (exhibit.animals || []).length);
        if (!validation.valid) {
            alert(validation.reason);
            return;
        }

        if (!exhibit.animals) exhibit.animals = [];
        exhibit.animals.push(animalId);

        this.closeAnimalSelector();
        eventBus.emit('ANIMAL_ADDED_TO_INDOOR', { animalId, exhibitId: currentExhibitId });

        const houseData = data.houses.find(h => h.id === house.dataId);
        this.renderIndoorExhibitsGrid(house, houseData);
    },

    sellHouse(houseInstanceId) {
        if (!confirm("Are you sure? Selling the house will also remove all exhibits and animals inside it!")) return;

        const house = state.houses[houseInstanceId];
        const houseData = data.houses.find(h => h.id === house.dataId);
        const refund = Math.floor(houseData.cost * 0.5);
        state.money += refund;
        delete state.houses[houseInstanceId];

        this.closeModal();
        eventBus.emit('HOUSE_SOLD', { name: house.name, refund });
        eventBus.emit('MONEY_CHANGED');
        this.renderBuiltHouses();
    },

    closeModal() {
        document.getElementById('houseDetailModal').classList.remove('active');
        currentHouseId = null;
    },

    closeAnimalSelector() {
        document.getElementById('animalSelectorModal').classList.remove('active');
        currentHouseId = null;
        currentExhibitId = null;
    },

    closeExhibitTypeModal() {
        document.getElementById('exhibitTypeModal').classList.remove('active');
        pendingHouseIdForExhibit = null;
    }
};

window.HouseUI = HouseUI;
