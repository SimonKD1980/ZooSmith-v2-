// --- Building & Demolishing ---
function buildExhibit(size, type) {
  const sizeData = EXHIBIT_SIZES[size];
  if (!sizeData) return;
  if (state.money < sizeData.cost) {
    showToast("Not enough money!", "error");
    return;
  }

  state.money -= sizeData.cost;
  const id = `exhibit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  
  state.exhibits[id] = {
    id: id,
    name: `${sizeData.label} Exhibit ${Object.keys(state.exhibits).length + 1}`,
    size: size,
    type: type || "terrestrial",
    buildDaysRemaining: sizeData.buildDays,
    fenceCondition: 100,
    cleanliness: 100,
    upgrades: [],
    animals: []
  };

  showToast(`Building ${sizeData.label} exhibit...`, "success");
  if (typeof renderExhibits === 'function') renderExhibits();
  if (typeof updateUI === 'function') updateUI();
}

function buildHouse(typeId) {
  const houseData = data.houses[typeId];
  if (!houseData) return;
  if (state.money < houseData.cost) {
    showToast("Not enough money!", "error");
    return;
  }

  state.money -= houseData.cost;
  const id = `house_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  
  state.houses[id] = {
    id: id,
    typeId: typeId,
    name: houseData.name,
    buildDaysRemaining: houseData.buildDays,
    maxExhibits: houseData.maxExhibits,
    exhibits: {}
  };

  showToast(`Building ${houseData.name}...`, "success");
  if (typeof renderHouses === 'function') renderHouses();
  if (typeof updateUI === 'function') updateUI();
}

function buildHouseExhibit(houseId, size) {
  const house = state.houses[houseId];
  if (!house) return;
  if (Object.keys(house.exhibits).length >= house.maxExhibits) {
    showToast("House is full!", "error");
    return;
  }

  const sizeData = EXHIBIT_SIZES[size];
  if (state.money < sizeData.cost) {
    showToast("Not enough money!", "error");
    return;
  }

  state.money -= sizeData.cost;
  const id = `house_exhibit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  
  house.exhibits[id] = {
    id: id,
    name: `${house.name} - ${sizeData.label}`,
    size: size,
    type: "indoor",
    buildDaysRemaining: sizeData.buildDays,
    fenceCondition: 100, // Indoor exhibits don't degrade the same way, but kept for consistency
    cleanliness: 100,
    upgrades: [],
    animals: []
  };

  showToast(`Adding exhibit to ${house.name}...`, "success");
  if (typeof renderHouses === 'function') renderHouses();
  if (typeof updateUI === 'function') updateUI();
}

function demolishExhibit(id) {
  const context = getExhibitContext(id);
  if (!context.exhibit) return;
  if (context.exhibit.animals && context.exhibit.animals.length > 0) {
    showToast("Cannot demolish an exhibit with animals!", "error");
    return;
  }

  const sizeData = EXHIBIT_SIZES[context.exhibit.size];
  const refund = Math.floor(sizeData.cost * 0.5);
  state.money += refund;

  if (context.houseId) {
    delete state.houses[context.houseId].exhibits[id];
  } else {
    delete state.exhibits[id];
  }

  showToast(`Demolished exhibit. Refunded $${refund}`, "warn");
  if (typeof renderExhibits === 'function') renderExhibits();
  if (typeof renderHouses === 'function') renderHouses();
  if (typeof updateUI === 'function') updateUI();
}

function renameExhibit(exhibitId) {
  const context = getExhibitContext(exhibitId);
  if (!context.exhibit) return;
  
  const newName = prompt("Enter new name:", context.exhibit.name);
  if (newName && newName.trim()) {
    context.exhibit.name = newName.trim();
    if (typeof renderExhibits === 'function') renderExhibits();
    if (typeof renderHouses === 'function') renderHouses();
  }
}

// --- Upgrades ---
function openUpgradeMenu(exhibitId) {
  state.activeUpgradeExhibit = exhibitId;
  if (typeof renderUpgradeModal === 'function') renderUpgradeModal();
  document.getElementById("upgradeModal").classList.add("active");
}

function buyUpgradeFromModal(upgradeId) {
  const upgrade = data.upgrades[upgradeId];
  const context = getExhibitContext(state.activeUpgradeExhibit);
  if (!upgrade || !context.exhibit) return;

  if (state.money < upgrade.cost) {
    showToast("Not enough money!", "error");
    return;
  }
  if (context.exhibit.upgrades.includes(upgradeId)) {
    showToast("Already owned!", "warn");
    return;
  }

  state.money -= upgrade.cost;
  context.exhibit.upgrades.push(upgradeId);
  
  showToast(`Bought ${upgrade.name}`, "success");
  if (typeof renderUpgradeModal === 'function') renderUpgradeModal();
  if (typeof renderExhibits === 'function') renderExhibits();
  if (typeof updateUI === 'function') updateUI();
}

function sellUpgradeFromModal(upgradeId) {
  const upgrade = data.upgrades[upgradeId];
  const context = getExhibitContext(state.activeUpgradeExhibit);
  if (!upgrade || !context.exhibit) return;

  const refund = Math.floor(upgrade.cost * 0.5);
  state.money += refund;
  context.exhibit.upgrades = context.exhibit.upgrades.filter(u => u !== upgradeId);
  
  showToast(`Sold ${upgrade.name} for $${refund}`, "warn");
  if (typeof renderUpgradeModal === 'function') renderUpgradeModal();
  if (typeof renderExhibits === 'function') renderExhibits();
  if (typeof updateUI === 'function') updateUI();
}

// --- Fences & Escapes ---
function repairFence(exhibitId) {
  const context = getExhibitContext(exhibitId);
  if (!context.exhibit) return;

  const damage = 100 - context.exhibit.fenceCondition;
  const cost = Math.ceil(damage * 10); // $10 per 1% damage

  if (state.money < cost) {
    showToast("Not enough money!", "error");
    return;
  }

  state.money -= cost;
  context.exhibit.fenceCondition = 100;
  showToast(`Repaired fence for $${cost}`, "success");
  if (typeof renderExhibits === 'function') renderExhibits();
  if (typeof updateUI === 'function') updateUI();
}

function processFenceDegradation() {
  getAllExhibits().forEach(({ exhibit }) => {
    if (exhibit.buildDaysRemaining > 0) return;
    
    const animalCount = exhibit.animals ? exhibit.animals.length : 0;
    let sizeBonus = 0;
    if (exhibit.size === "medium") sizeBonus = 0.5;
    if (exhibit.size === "large") sizeBonus = 1.0;

    let degradation = 0.5 + (animalCount * 0.2) + sizeBonus;
    degradation *= (1 - (state.maintenanceLevel * 0.2)); // Maintenance workers reduce degradation
    
    exhibit.fenceCondition = Math.max(0, (exhibit.fenceCondition || 100) - degradation);

    // Check for escapes
    if (exhibit.fenceCondition < 10) {
      triggerEscape(exhibit, 1.0); // 100% chance
    } else if (exhibit.fenceCondition < 30) {
      triggerEscape(exhibit, 0.3); // 30% chance
    } else if (exhibit.fenceCondition < 50) {
      triggerEscape(exhibit, 0.1); // 10% chance
    }
  });
}

function triggerEscape(exhibit, chance) {
  if (!exhibit.animals || exhibit.animals.length === 0) return;
  if (Math.random() > chance) return;

  const escapedAnimal = exhibit.animals[Math.floor(Math.random() * exhibit.animals.length)];
  const baseAnimal = data.animals.find(a => a.id === escapedAnimal.id);
  
  showToast(`🚨 ${escapedAnimal.name} escaped from ${exhibit.name}!`, "error");
  
  // 50% chance to recover
  if (Math.random() < 0.5 && baseAnimal) {
    const recoveryCost = (baseAnimal.dailyIncome || 10) * 20;
    if (state.money >= recoveryCost) {
      state.money -= recoveryCost;
      showToast(`Recovered ${escapedAnimal.name} for $${recoveryCost}`, "warn");
    } else {
      exhibit.animals = exhibit.animals.filter(a => a !== escapedAnimal);
      state.totalDeaths++;
      state.unnaturalDeaths++;
      showToast(`${escapedAnimal.name} was lost forever!`, "error");
    }
  } else {
    exhibit.animals = exhibit.animals.filter(a => a !== escapedAnimal);
    state.totalDeaths++;
    state.unnaturalDeaths++;
    showToast(`${escapedAnimal.name} was lost forever!`, "error");
  }
}