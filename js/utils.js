function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function getExhibitContext(exhibitId) {
  if (state.exhibits[exhibitId]) {
    return { exhibit: state.exhibits[exhibitId], houseId: null };
  }
  for (const [houseId, house] of Object.entries(state.houses)) {
    if (house.exhibits && house.exhibits[exhibitId]) {
      return { exhibit: house.exhibits[exhibitId], houseId: houseId };
    }
  }
  return { exhibit: null, houseId: null };
}

function getAllExhibits() {
  const result = [];
  for (const [id, exhibit] of Object.entries(state.exhibits)) {
    result.push({ id, exhibit, houseId: null });
  }
  for (const [houseId, house] of Object.entries(state.houses)) {
    if (house.exhibits) {
      for (const [id, exhibit] of Object.entries(house.exhibits)) {
        result.push({ id, exhibit, houseId });
      }
    }
  }
  return result;
}

function getAllAnimals() {
  const animals = [];
  getAllExhibits().forEach(({ exhibit }) => {
    if (exhibit.animals) {
      exhibit.animals.forEach(animal => animals.push(animal));
    }
  });
  return animals;
}

function countAnimals(speciesId) {
  return getAllAnimals().filter(a => a.id === speciesId).length;
}

function getNextAnimalName(speciesName) {
  if (!state.animalCounters[speciesName]) state.animalCounters[speciesName] = 1;
  const num = state.animalCounters[speciesName]++;
  return `${speciesName} ${num}`;
}

function pickVariation(animalData) {
  if (!animalData.variations || animalData.variations.length === 0) return "Normal";
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const v of animalData.variations) {
    cumulative += v.chance;
    if (roll <= cumulative) return v.name;
  }
  return animalData.variations[0].name;
}

function addTicker(message) {
  const ticker = document.getElementById("ticker");
  if (ticker) ticker.textContent = message;
}

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function exhibitSizeOk(exhibitSize, requiredSize) {
  if (!requiredSize) return true;
  return SIZE_RANK[exhibitSize] >= SIZE_RANK[requiredSize];
}