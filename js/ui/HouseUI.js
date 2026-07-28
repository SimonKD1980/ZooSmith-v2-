// js/ui/HouseUI.js
import { state, generateUniqueId, canPlaceAnimalInIndoorExhibit } from '../engine/GameState.js';
import { eventBus } from '../engine/EventBus.js';
import { data } from '../engine/data.js';

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

        if (data.houses.length === 0) {
            container.innerHTML = '<p style="color: #9ca3af; grid-column: 1/-1; text-align: center;">No house types available. Check data/houses.json</p>';
            return;
        }

        data.houses.forEach(house => {
            const canAfford = state.money >= house.cost;
            const div = document.createElement('div');
            div.style.cssText = `background: #1e293b; border: 1px solid #334155; border-radius: 12px; overflow: hidden; transition: transform 0.2s;`;
            div.onmouseenter = () => div.style.transform = 'translateY(-4px)';
            div.onmouseleave = () => div.style.transform = 'translateY(0)';
            div.innerHTML = `
                <div style="background: linear-gradient(135deg, #334155, #1e293b); padding: 20px; text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 8px;">${house.icon}</div>
                    <h3 style="margin: 0; color: #e5e7eb;">${house.name}</h3>
                    <div style="font-size: 0.85rem; color: #9ca3af; margin-top: 4px;">${house.climate} climate</div>
                </div>
                <div style="padding: 15px;">
                    <p style="color: #9ca3af; font-size: 0.9rem; margin: 0 0 12px; min-height: 40px;">${house.description}</p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; font-size: 0.85rem;">
                        <div style="background: #0f172a; padding: 8px; border-radius: 6px; text-align: center;">
                            <div style="color: #9ca3af;">Capacity</div>
                            <div style="color: #3b82f6; font-weight: 700;">${house.capacity} exhibits</div>
                        </div>
                        <div style="background: #0f172a; padding: 8px; border-radius: 6px; text-align: center;">
                            <div style="color: #9ca3af;">Upkeep</div>
                            <div style="color: #f59e0b; font-weight: 700;">$${house.dailyUpkeep}/day</div>
                        </div>
                    </div>
                    <div style="font-size: 1.3rem; font-weight: 800; color: #22c55e; text-align: center; margin-bottom: 12px;">
                        💰 $${house.cost.toLocaleString()}
                    </div>
                    <button onclick="HouseUI.buyHouse('${house.id}')"
                        style="width: 100%; padding: 10px; background: ${canAfford ? '#22c55e' : '#475569'}; color: ${canAfford ? '#000' : '#9ca3af'}; border: none; border-radius: 8px; font-weight: 700; cursor: ${canAfford ? 'pointer' : 'not-allowed'}; font-size: 0.95rem;"
                        ${!canAfford ? 'disabled' : ''}>
                        ${canAfford ? '🏠 Build House' : '💸 Can\'t Afford'}
                    </button>
                </div>
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
            container.innerHTML = '<p style="color: #9ca3af; grid-column: 1/-1; text-align: center;">No houses built yet. Build one above to get started!</p>';
            return;
        }

        houseInstances.forEach(house => {
            const houseData = data.houses.find(h => h.id === house.dataId);
            if (!houseData) return;
            const exhibitCount = Object.keys(house.exhibits || {}).length;
            const div = document.createElement('div');
            div.style.cssText = `background: #1e293b; border: 2px solid #22c55e; border-radius: 12px; padding: 15px; cursor: pointer; transition: all 0.2s;`;
            div.onmouseenter = () => div.style.transform = 'translateY(-4px)';
            div.onmouseleave = () => div.style.transform = 'translateY(0)';
            div.onclick = () => this.openHouseDetail(house.id);
            div.innerHTML = `
                <div style="text-align: center; margin-bottom: 10px;">
                    <div style="font-size: 3rem;">${houseData.icon}</div>
                    <h4 style="margin: 8px 0 4px; color: #e5e7eb;">${house.name}</h4>
                    <div style="font-size: 0.85rem; color: #9ca3af;">${houseData.climate} climate</div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                    <div style="background: #0f172a; padding: 8px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 0.75rem; color: #9ca3af;">Exhibits</div>
                        <div style="font-weight: 700; color: #3b82f6;">${exhibitCount}/${houseData.capacity}</div>
                    </div>
                    <div style="background: #0f172a; padding: 8px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 0.75rem; color: #9ca3af;">Clean</div>
                        <div style="font-weight: 700; color: ${(house.cleanliness || 100) >= 70 ? '#22c55e' : '#f59e0b'};">${Math.round(house.cleanliness || 100)}%</div>
                    </div>
                </div>
                <button onclick="event.stopPropagation(); HouseUI.openHouseDetail('${house.id}')"
                    style="width: 100%; padding: 10px; background: #22c55e; color: #000; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">
                    ⚙️ Manage
                </button>
            `;
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
        state.houses[instanceId] = {
            id: instanceId,
            dataId: houseData.id,
            name: name,
            cleanliness: 100,
            exhibits: {}
        };
        state.money -= houseData.cost;

        eventBus.emit('HOUSE_BUILT', { name: name, cost: houseData.cost });
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
        document.getElementById('modalHouseClimate').innerText = `🌡️ ${houseData.climate.charAt(0).toUpperCase() + houseData.climate.slice(1)}`;
        document.getElementById('modalHouseUpkeep').innerText = `💰 $${houseData.dailyUpkeep}/day`;
        document.getElementById('modalHouseCapacity').innerText = `📦 ${exhibitCount}/${houseData.capacity} Exhibits`;
        document.getElementById('sellHouseBtn').onclick = () => this.sellHouse(houseInstanceId);

        this.renderIndoorExhibitsGrid(house, houseData);
        document.getElementById('houseDetailModal').style.display = 'flex';
    },

    renderIndoorExhibitsGrid(house, houseData) {
        const grid = document.getElementById('indoorExhibitsGrid');
        grid.innerHTML = '';

        // Render built exhibits
        Object.values(house.exhibits || {}).forEach(exhibit => {
            const exData = data.indoor_exhibits.find(e => e.id === exhibit.dataId);
            if (!exData) return;

            const animalCount = (exhibit.animals || []).length;
            const cleanliness = exhibit.cleanliness || 100;

            const div = document.createElement('div');
            div.style.cssText = `background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 12px;`;
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <div style="font-size: 2rem;">${exData.icon}</div>
                    <div style="font-size: 0.75rem; color: ${cleanliness >= 70 ? '#22c55e' : '#f59e0b'};">✨ ${Math.round(cleanliness)}%</div>
                </div>
                <div style="font-weight: 700; color: #e5e7eb; margin-bottom: 4px;">${exData.name}</div>
                <div style="font-size: 0.8rem; color: #9ca3af; margin-bottom: 8px;">
                    🐾 ${animalCount}/${exData.maxAnimals} animals
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px; min-height: 24px;">
                    ${(exhibit.animals || []).map(aId => {
                        const animal = this.findAnimalById(aId);
                        return animal ? `<span style="background: #1e293b; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; color: #e5e7eb;">${animal.name || 'Animal'}</span>` : '';
                    }).join('')}
                </div>
                <button onclick="HouseUI.promptAddAnimal('${house.id}', '${exhibit.id}')"
                    style="width: 100%; padding: 8px; background: #3b82f6; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.85rem;">
                    + Add Animal
                </button>
            `;
            grid.appendChild(div);
        });

        // Render empty slots
        const emptySlots = houseData.capacity - Object.keys(house.exhibits || {}).length;
        for (let i = 0; i < emptySlots; i++) {
            const div = document.createElement('div');
            div.style.cssText = `background: #0f172a; border: 2px dashed #334155; border-radius: 10px; padding: 20px; text-align: center; cursor: pointer; transition: all 0.2s;`;
            div.onmouseenter = () => div.style.borderColor = '#22c55e';
            div.onmouseleave = () => div.style.borderColor = '#334155';
            div.innerHTML = `
                <div style="font-size: 2.5rem; margin-bottom: 8px;">➕</div>
                <div style="font-weight: 700; color: #e5e7eb; margin-bottom: 4px;">Empty Slot</div>
                <div style="font-size: 0.8rem; color: #9ca3af; margin-bottom: 12px;">Click to build an exhibit</div>
                <button onclick="HouseUI.showBuildExhibitOptions('${house.id}')"
                    style="padding: 8px 16px; background: #22c55e; color: #000; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 0.85rem;">
                    🏗️ Build Exhibit
                </button>
            `;
            grid.appendChild(div);
        }
    },

    findAnimalById(animalId) {
        // Search in regular exhibits
        for (const exhibit of Object.values(state.exhibits || {})) {
            const found = (exhibit.animals || []).find(a => a.uid === animalId);
            if (found) return found;
        }
        return null;
    },

    showBuildExhibitOptions(houseInstanceId) {
        const house = state.houses[houseInstanceId];
        const houseData = data.houses.find(h => h.id === house.dataId);
        const allowedExhibits = data.indoor_exhibits.filter(ex =>
            houseData.allowedExhibitSize.includes(ex.size) &&
            houseData.allowedExhibitType.includes(ex.type)
        );

        if (allowedExhibits.length === 0) {
            alert("No exhibit types available for this house!");
            return;
        }

        let options = "Choose an exhibit to build:\n\n";
        allowedExhibits.forEach((ex, index) => {
            options += `${index + 1}. ${ex.icon} ${ex.name} ($${ex.cost}) - ${ex.description}\n   Size: ${ex.size} | Max ${ex.maxAnimals} animals\n\n`;
        });
        options += `Enter a number (1-${allowedExhibits.length}):`;

        const choice = prompt(options);
        if (!choice) return;

        const selectedIndex = parseInt(choice) - 1;
        if (selectedIndex >= 0 && selectedIndex < allowedExhibits.length) {
            this.buildIndoorExhibit(houseInstanceId, allowedExhibits[selectedIndex].id);
        } else {
            alert("Invalid selection!");
        }
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
        house.exhibits[instanceId] = {
            id: instanceId,
            dataId: exData.id,
            animals: [],
            cleanliness: 100
        };
        state.money -= exData.cost;

        eventBus.emit('INDOOR_EXHIBIT_BUILT', {
            name: exData.name,
            houseName: house.name,
            cost: exData.cost
        });
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

        // Find all animals in regular exhibits that are compatible
        const compatibleAnimals = [];
        Object.values(state.exhibits || {}).forEach(regExhibit => {
            (regExhibit.animals || []).forEach(animal => {
                // Check if animal is already in an indoor exhibit
                const alreadyInIndoor = this.isAnimalInIndoorExhibit(animal.uid);
                if (alreadyInIndoor) return;

                const animalData = data.animals.find(a => a.id === animal.id);
                if (!animalData) return;

                const validation = canPlaceAnimalInIndoorExhibit(animalData, exData, (exhibit.animals || []).length);
                if (validation.valid) {
                    compatibleAnimals.push({
                        animal,
                        animalData,
                        fromExhibit: regExhibit.name
                    });
                }
            });
        });

        const listContainer = document.getElementById('compatibleAnimalsList');
        listContainer.innerHTML = '';

        if (compatibleAnimals.length === 0) {
            listContainer.innerHTML = '<p style="color: #ef4444; text-align: center; padding: 20px;">No compatible animals available. Check size/type requirements, or the animal may already be in an indoor exhibit.</p>';
        } else {
            compatibleAnimals.forEach(({ animal, animalData, fromExhibit }) => {
                const div = document.createElement('div');
                div.style.cssText = `background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 12px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;`;
                div.innerHTML = `
                    <div>
                        <div style="font-weight: 700; color: #e5e7eb;">${animal.name}</div>
                        <div style="font-size: 0.8rem; color: #9ca3af;">
                            ${animalData.icon || '🐾'} ${animalData.name} • From: ${fromExhibit}
                        </div>
                    </div>
                    <button onclick="HouseUI.confirmAddAnimal('${animal.uid}')"
                        style="padding: 8px 16px; background: #22c55e; color: #000; border: none; border-radius: 6px; font-weight: 700; cursor: pointer;">
                        Add →
                    </button>
                `;
                listContainer.appendChild(div);
            });
        }

        document.getElementById('animalSelectorModal').style.display = 'flex';
    },

    isAnimalInIndoorExhibit(animalUid) {
        for (const house of Object.values(state.houses || {})) {
            for (const exhibit of Object.values(house.exhibits || {})) {
                if ((exhibit.animals || []).includes(animalUid)) {
                    return true;
                }
            }
        }
        return false;
    },

    confirmAddAnimal(animalUid) {
        if (!currentHouseId || !currentExhibitId) return;

        const house = state.houses[currentHouseId];
        const exhibit = house.exhibits[currentExhibitId];
        const exData = data.indoor_exhibits.find(e => e.id === exhibit.dataId);

        // Find the animal in regular exhibits
        let animal = null;
        let fromExhibit = null;
        for (const regExhibit of Object.values(state.exhibits || {})) {
            const found = (regExhibit.animals || []).find(a => a.uid === animalUid);
            if (found) {
                animal = found;
                fromExhibit = regExhibit;
                break;
            }
        }

        if (!animal || !fromExhibit) {
            alert("Animal not found!");
            return;
        }

        const animalData = data.animals.find(a => a.id === animal.id);
        const validation = canPlaceAnimalInIndoorExhibit(animalData, exData, (exhibit.animals || []).length);
        if (!validation.valid) {
            alert(validation.reason);
            return;
        }

        // Add to indoor exhibit (store as UID reference)
        if (!exhibit.animals) exhibit.animals = [];
        exhibit.animals.push(animal.uid);

        // Remove from regular exhibit
        const idx = fromExhibit.animals.findIndex(a => a.uid === animalUid);
        if (idx !== -1) fromExhibit.animals.splice(idx, 1);

        this.closeAnimalSelector();

        eventBus.emit('ANIMAL_ADDED_TO_INDOOR', {
            animalName: animal.name,
            houseName: house.name
        });

        const houseData = data.houses.find(h => h.id === house.dataId);
        this.renderIndoorExhibitsGrid(house, houseData);
        this.renderBuiltHouses();
    },

    sellHouse(houseInstanceId) {
        if (!confirm("Are you sure? Selling the house will also remove all exhibits inside it. Animals will be returned to regular exhibits.")) return;

        const house = state.houses[houseInstanceId];
        const houseData = data.houses.find(h => h.id === house.dataId);
        const refund = Math.floor(houseData.cost * 0.5);

        // Return animals to regular exhibits
        Object.values(house.exhibits || {}).forEach(exhibit => {
            (exhibit.animals || []).forEach(animalUid => {
                // Find the animal data and return to a compatible regular exhibit
                for (const regExhibit of Object.values(state.exhibits || {})) {
                    // Just put them back - they were originally in a regular exhibit
                    // For simplicity, we'll create a placeholder
                    const animalData = data.animals.find(a => a.uid === animalUid);
                    if (animalData) {
                        regExhibit.animals.push(animalData);
                        break;
                    }
                }
            });
        });

        state.money += refund;
        delete state.houses[houseInstanceId];

        eventBus.emit('HOUSE_SOLD', { name: house.name, refund });
        eventBus.emit('MONEY_CHANGED');

        this.closeModal();
        this.renderBuiltHouses();
        this.renderHouseShop();
    },

    closeModal() {
        document.getElementById('houseDetailModal').style.display = 'none';
        currentHouseId = null;
    },

    closeAnimalSelector() {
        document.getElementById('animalSelectorModal').style.display = 'none';
        currentHouseId = null;
        currentExhibitId = null;
    }
};

window.HouseUI = HouseUI;
