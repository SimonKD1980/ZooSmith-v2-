// js/ui/HouseUI.js
import { state, generateUniqueId, canPlaceAnimalInIndoorExhibit } from '../engine/GameState.js';
import { eventBus } from '../engine/EventBus.js';
import { data } from '../engine/data.js'; // Uses your existing data loader!

let currentHouseId = null;
let currentExhibitId = null;

export const HouseUI = {
    init() {
        this.renderHouseShop();
        this.renderBuiltHouses();
    },

    renderHouseShop() {
        const container = document.getElementById('houseShopContainer');
        if (!container || !data.houses) return;
        container.innerHTML = '';
        
        const availableHouses = data.houses.filter(h => state.currentTier >= (h.unlockTier || 1));

        availableHouses.forEach(house => {
            const div = document.createElement('div');
            div.className = 'exhibit-slot empty';
            div.style.cursor = 'default';
            div.innerHTML = `
                <div class="slot-icon">${house.icon}</div>
                <div class="slot-title">${house.name}</div>
                <div class="slot-subtitle">${house.description}</div>
                <div class="slot-subtitle">Cap: ${house.capacity} | Upkeep: $${house.dailyUpkeep}/day</div>
                <button class="btn-small primary" onclick="HouseUI.buyHouse('${house.id}')">Buy $${house.cost}</button>
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
            const div = document.createElement('div');
            div.className = 'exhibit-slot occupied';
            div.style.cursor = 'pointer';
            div.innerHTML = `
                <div class="slot-icon">${houseData.icon}</div>
                <div class="slot-title">${house.name}</div>
                <div class="slot-subtitle">${Object.keys(house.exhibits).length}/${houseData.capacity} Exhibits</div>
                <button class="btn-small primary" onclick="event.stopPropagation(); HouseUI.openHouseDetail('${house.id}')">Manage</button>
            `;
            div.onclick = () => this.openHouseDetail(house.id);
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

        const instanceId = generateUniqueId('house');
        state.houses[instanceId] = {
            id: instanceId,
            dataId: houseData.id,
            name: houseData.name,
            cleanliness: 100,
            exhibits: {}
        };

        state.money -= houseData.cost;
        eventBus.emit('MONEY_CHANGED');
        this.renderHouseShop();
        this.renderBuiltHouses();
    },

    openHouseDetail(houseInstanceId) {
        currentHouseId = houseInstanceId;
        const house = state.houses[houseInstanceId];
        if (!house) return;

        const houseData = data.houses.find(h => h.id === house.dataId);
        const exhibitCount = Object.keys(house.exhibits).length;

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

        const exhibitCount = Object.keys(house.exhibits).length;

        Object.values(house.exhibits).forEach(exhibit => {
            const exData = data.indoor_exhibits.find(e => e.id === exhibit.dataId);
            const animalNames = exhibit.animals.map(aId => {
                const animal = data.animals.find(a => a.id === aId);
                return animal ? animal.name : 'Unknown';
            });

            const div = document.createElement('div');
            div.className = 'exhibit-slot occupied';
            div.innerHTML = `
                <div class="slot-icon">${exData.icon}</div>
                <div class="slot-title">${exData.name}</div>
                <div class="slot-subtitle">${exhibit.animals.length}/${exData.maxAnimals} Animals</div>
                <div class="animal-tags">
                    ${animalNames.map(name => `<span class="animal-tag">${name}</span>`).join('')}
                </div>
                <button class="btn-small primary" onclick="HouseUI.promptAddAnimal('${house.id}', '${exhibit.id}')">+ Add Animal</button>
            `;
            grid.appendChild(div);
        });

        const emptySlots = houseData.capacity - exhibitCount;
        for (let i = 0; i < emptySlots; i++) {
            const div = document.createElement('div');
            div.className = 'exhibit-slot empty';
            div.innerHTML = `
                <div class="slot-icon">➕</div>
                <div class="slot-title">Empty Slot</div>
                <div class="slot-subtitle">Click to build an exhibit</div>
                <button class="btn-small secondary" onclick="HouseUI.showBuildExhibitOptions('${house.id}')">Build Exhibit</button>
            `;
            grid.appendChild(div);
        }
    },

    showBuildExhibitOptions(houseInstanceId) {
        const house = state.houses[houseInstanceId];
        const houseData = data.houses.find(h => h.id === house.dataId);
        
        const allowedExhibits = data.indoor_exhibits.filter(ex => 
            houseData.allowedExhibitSize.includes(ex.size) &&
            houseData.allowedExhibitType.includes(ex.type)
        );

        let options = "Choose an exhibit to build:\n";
        allowedExhibits.forEach((ex, index) => {
            options += `${index + 1}. ${ex.name} ($${ex.cost}) - ${ex.description}\n`;
        });
        options += `\nEnter a number (1-${allowedExhibits.length}):`;

        const choice = prompt(options);
        if (!choice) return;

        const selectedIndex = parseInt(choice) - 1;
        if (selectedIndex >= 0 && selectedIndex < allowedExhibits.length) {
            this.buildIndoorExhibit(houseInstanceId, allowedExhibits[selectedIndex].id);
        }
    },

    buildIndoorExhibit(houseInstanceId, exhibitDataId) {
        const house = state.houses[houseInstanceId];
        const exData = data.indoor_exhibits.find(e => e.id === exhibitDataId);

        if (state.money < exData.cost) {
            alert("Not enough money to build this exhibit!");
            return;
        }

        const instanceId = generateUniqueId('indoor_ex');
        house.exhibits[instanceId] = {
            id: instanceId,
            dataId: exData.id,
            animals: [],
            cleanliness: 100
        };

        state.money -= exData.cost;
        eventBus.emit('MONEY_CHANGED');
        
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
            const validation = canPlaceAnimalInIndoorExhibit(animal, exData, exhibit.animals.length);
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
                    <span>${animal.icon || '🐾'} ${animal.name} <small style="color:#9ca3af">(${animal.requiredExhibitSize} ${animal.requiredExhibitType})</small></span>
                    <button class="btn-small primary" onclick="HouseUI.confirmAddAnimal('${animal.id}')">Add</button>
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

        const validation = canPlaceAnimalInIndoorExhibit(animalData, exData, exhibit.animals.length);
        
        if (!validation.valid) {
            alert(validation.reason);
            return;
        }

        exhibit.animals.push(animalId);
        this.closeAnimalSelector();
        
        const houseData = data.houses.find(h => h.id === house.dataId);
        this.renderIndoorExhibitsGrid(house, houseData);
        eventBus.emit('ANIMAL_ASSIGNED', { animalId, exhibitId: currentExhibitId });
    },

    sellHouse(houseInstanceId) {
        if (!confirm("Are you sure? Selling the house will also remove all exhibits and animals inside it!")) return;

        const house = state.houses[houseInstanceId];
        const houseData = data.houses.find(h => h.id === house.dataId);
        
        state.money += Math.floor(houseData.cost * 0.5);
        delete state.houses[houseInstanceId];
        
        this.closeModal();
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
    }
};

window.HouseUI = HouseUI;
