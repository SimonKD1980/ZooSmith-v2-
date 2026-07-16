// js/ui/SuppliesUI.js
import { state } from '../engine/GameState.js';
import { eventBus } from '../engine/EventBus.js';
import { FOOD_TYPES, getDietFoodType } from '../engine/constants.js';
import { data } from '../engine/data.js';

export function renderSupplies() {
    const suppliesEl = document.getElementById('supplies');
    if (!suppliesEl) return;

    // Calculate consumption
    const consumption = { hay: 0, meat: 0, produce: 0 };
    const animalCounts = { hay: 0, meat: 0, produce: 0 };
    
    const allAnimals = Object.values(state.exhibits).flatMap(ex => ex.animals || []);
    
    allAnimals.forEach(animal => {
        const baseAmount = animal.foodAmount || 1;
        const amount = animal.isPregnant ? baseAmount * 2 : baseAmount;
        const foodType = getDietFoodType(animal.diet);
        consumption[foodType] += amount;
        animalCounts[foodType]++;
    });

    // Build food cards
    let cardsHTML = '';
    
    for (const foodType in FOOD_TYPES) {
        const food = FOOD_TYPES[foodType];
        const current = state.food[foodType] || 0;
        const cap = food.storageCap;
        const percent = Math.min(100, (current / cap) * 100);
        const dailyUse = consumption[foodType];
        const daysLeft = dailyUse > 0 ? Math.floor(current / dailyUse) : '∞';
        const isLow = current < dailyUse * 3;
        const isEmpty = current === 0 && dailyUse > 0;

        cardsHTML += `
            <div style="background: #1e293b; border: 1px solid ${isEmpty ? '#dc2626' : isLow ? '#f59e0b' : '#334155'}; border-radius: 12px; overflow: hidden; ${isEmpty ? 'box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);' : ''}">
                <div style="background: linear-gradient(135deg, ${food.color}22, #0f172a); padding: 15px; text-align: center;">
                    <span style="font-size: 2.5rem;">${food.icon}</span>
                    <h3 style="margin: 8px 0 4px; color: #e5e7eb;">${food.name}</h3>
                    <div style="font-size: 0.85rem; color: #9ca3af;">For ${food.diet}s • $${food.costPerUnit}/unit</div>
                </div>
                <div style="padding: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
                        <div>
                            <div style="font-size: 2rem; font-weight: 900; color: ${isEmpty ? '#dc2626' : isLow ? '#f59e0b' : '#3b82f6'};">${current}</div>
                            <div style="font-size: 0.8rem; color: #9ca3af;">/ ${cap} units</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 0.85rem; color: #9ca3af;">Days left:</div>
                            <div style="font-size: 1.3rem; font-weight: 800; color: ${daysLeft < 3 && daysLeft !== '∞' ? '#f59e0b' : '#e5e7eb'};">${daysLeft}${daysLeft !== '∞' ? ' days' : ''}</div>
                        </div>
                    </div>
                    <div style="height: 10px; background: #0f172a; border-radius: 5px; overflow: hidden; margin-bottom: 8px;">
                        <div style="height: 100%; width: ${percent}%; background: linear-gradient(90deg, ${food.color}, ${food.color}cc); transition: width 0.3s;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #9ca3af; margin-bottom: 8px;">
                        <span>📊 ${dailyUse}/day</span>
                        <span>🐾 ${animalCounts[foodType]} animals</span>
                    </div>
                    ${isEmpty ? `<div style="padding: 8px; background: rgba(239, 68, 68, 0.15); border-radius: 8px; text-align: center; color: #dc2626; font-weight: 700; margin-bottom: 8px;">⚠️ OUT OF STOCK</div>` : ''}
                    ${isLow && !isEmpty ? `<div style="padding: 8px; background: rgba(245, 158, 11, 0.15); border-radius: 8px; text-align: center; color: #f59e0b; font-weight: 700; margin-bottom: 8px;">⚠️ LOW STOCK</div>` : ''}
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                        <button onclick="window.buyFood('${foodType}', 10)" style="padding: 8px; font-size: 0.85rem; background: #334155; color: #e5e7eb; border: 1px solid #475569; border-radius: 6px; cursor: pointer;">+10<br><small>$${food.costPerUnit * 10}</small></button>
                        <button onclick="window.buyFood('${foodType}', 25)" style="padding: 8px; font-size: 0.85rem; background: #334155; color: #e5e7eb; border: 1px solid #475569; border-radius: 6px; cursor: pointer;">+25<br><small>$${food.costPerUnit * 25}</small></button>
                        <button onclick="window.buyFood('${foodType}', 50)" style="padding: 8px; font-size: 0.85rem; background: #334155; color: #e5e7eb; border: 1px solid #475569; border-radius: 6px; cursor: pointer;">+50<br><small>$${Math.floor(food.costPerUnit * 50 * 0.9)} (10% off)</small></button>
                        <button onclick="window.buyFood('${foodType}', 100)" style="padding: 8px; font-size: 0.85rem; background: #22c55e; color: #000; border: none; border-radius: 6px; cursor: pointer; font-weight: 700;">+100<br><small>$${Math.floor(food.costPerUnit * 100 * 0.8)} (20% off)</small></button>
                    </div>
                </div>
            </div>
        `;
    }

    suppliesEl.innerHTML = `
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 20px; grid-column: 1 / -1;">
            <h3 style="margin: 0 0 8px; color: #e5e7eb;">🍽 Food Supply Management</h3>
            <div style="color: #9ca3af; font-size: 0.9rem;">Buy food to keep your animals fed. Pregnant animals eat double!</div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px;">
            ${cardsHTML}
        </div>
    `;
}

export function buyFood(foodType, amount) {
    const food = FOOD_TYPES[foodType];
    if (!food) {
        alert("Unknown food type!");
        return;
    }

    if (!state.food) state.food = { hay: 0, meat: 0, produce: 0 };
    if (state.food[foodType] === undefined) state.food[foodType] = 0;

    const current = state.food[foodType];
    const spaceAvailable = food.storageCap - current;

    if (spaceAvailable <= 0) {
        alert(`${food.name} storage is full!`);
        return;
    }

    const actualAmount = Math.min(amount, spaceAvailable);

    let unitCost = food.costPerUnit;
    if (actualAmount >= 100) unitCost *= 0.8;
    else if (actualAmount >= 50) unitCost *= 0.9;

    const totalCost = Math.floor(unitCost * actualAmount);

    if (state.money < totalCost) {
        alert(`Not enough money! Need $${totalCost}`);
        return;
    }

    state.money -= totalCost;
    state.food[foodType] = current + actualAmount;

    eventBus.emit('FOOD_PURCHASED', {
        foodType,
        amount: actualAmount,
        cost: totalCost
    });

    renderSupplies();
    eventBus.emit('DAY_ADVANCED'); // Trigger UI refresh
}

// Expose to window for onclick handlers
window.buyFood = buyFood;
