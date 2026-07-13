async function loadJSON(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to load ${path}:`, error);
    return null;
  }
}

async function loadShop() {
  const res = await loadJSON("data/animals.json");
  if (res) data.animals = res;
}

async function loadResearch() {
  const res = await loadJSON("data/research.json");
  if (res) {
    data.researchProjects = {};
    res.forEach(item => data.researchProjects[item.id] = item);
  }
}

async function loadUpgrades() {
  const res = await loadJSON("data/upgrades.json");
  if (res) {
    data.upgrades = {};
    res.forEach(item => data.upgrades[item.id] = item);
  }
}

async function loadFacilities() {
  const res = await loadJSON("data/facilities.json");
  if (res) {
    data.facilities = {};
    res.forEach(item => data.facilities[item.id] = item);
  }
}

async function loadStaff() {
  const res = await loadJSON("data/staff.json");
  if (res) data.staff = res;
}

async function loadAmenities() {
  const res = await loadJSON("data/amenities.json");
  if (res) {
    data.amenities = {};
    res.forEach(item => data.amenities[item.id] = item);
  }
}

async function loadAchievements() {
  const res = await loadJSON("data/achievements.json");
  if (res) data.achievements = res;
}

async function loadExhibitTypes() {
  const res = await loadJSON("data/exhibit_types.json");
  if (res) {
    data.exhibitTypes = {};
    res.forEach(item => data.exhibitTypes[item.id] = item);
  }
}

async function loadHouses() {
  const res = await loadJSON("data/houses.json");
  if (res) {
    data.houses = {};
    res.forEach(item => data.houses[item.id] = item);
  }
}

async function loadAllData() {
  await Promise.all([
    loadShop(),
    loadResearch(),
    loadUpgrades(),
    loadFacilities(),
    loadStaff(),
    loadAmenities(),
    loadAchievements(),
    loadExhibitTypes(),
    loadHouses()
  ]);
  console.log("All game data loaded successfully.");
}