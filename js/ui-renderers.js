function updateUI() {
  document.getElementById("money").textContent = state.money.toLocaleString();
  document.getElementById("year").textContent = state.year;
  document.getElementById("month").textContent = state.month;
  document.getElementById("day").textContent = state.day;
  document.getElementById("zooRating").textContent = state.zooRating;
  
  const tier = Object.values(ZOO_RATING_TIERS).find(t => state.zooRating >= t.min && state.zooRating <= t.max) || ZOO_RATING_TIERS[1];
  document.getElementById("zooRatingTier").textContent = `(${tier.label})`;
  document.getElementById("ratingBadge").style.color = tier.color;
  document.getElementById("zooNameDisplay").textContent = state.zooName;
}

function renderShop() {
  const section = document.getElementById("shop");
  section.innerHTML = `<h2>🛒 Animal Shop</h2><div class="grid" id="shopGrid"></div>`;
  const grid = document.getElementById("shopGrid");
  
  data.animals.forEach(animal => {
    const isUnlocked = !animal.researchRequired || state.completedResearch.includes(animal.researchRequired);
    const card = document.createElement("div");
    card.className = "premium-card";
    card.style.opacity = isUnlocked ? "1" : "0.5";
    card.innerHTML = `
      <h3>${animal.emoji} ${animal.name}</h3>
      <p>${animal.info}</p>
      <p>Cost: $${animal.cost} | Income: $${animal.dailyIncome}/day</p>
      <p>Diet: ${animal.diet} | Dirt: ${animal.dirtiness}/5</p>
      ${isUnlocked ? `<button onclick="openBuyModal('${animal.id}')">Buy</button>` : `<button disabled>🔒 Requires Research</button>`}
    `;
    grid.appendChild(card);
  });
}

function renderExhibits() {
  const section = document.getElementById("exhibits");
  section.innerHTML = `<h2>🏞️ Exhibits</h2><div id="exhibitsList"></div>`;
  const list = document.getElementById("exhibitsList");
  
  getAllExhibits().forEach(({ id, exhibit }) => {
    const card = document.createElement("div");
    card.className = "exhibitCard";
    const happiness = getExhibitHappiness(exhibit);
    const isBuilding = exhibit.buildDaysRemaining > 0;
    
    let animalsHTML = "";
    if (exhibit.animals && exhibit.animals.length > 0) {
      animalsHTML = exhibit.animals.map((a, idx) => {
        const base = data.animals.find(x => x.id === a.id);
        return `<span class="animalTag" onclick="openAnimalInfo('${id}', ${idx})">${base ? base.emoji : '🐾'} ${a.name}</span>`;
      }).join("");
    } else {
      animalsHTML = "<p style='color:var(--muted)'>No animals yet.</p>";
    }

    card.innerHTML = `
      <div class="header">
        <span>${exhibit.name} ${isBuilding ? '(Building...)' : ''}</span>
        <span>
          <button onclick="openUpgradeMenu('${id}')">🛠️</button>
          <button onclick="demolishExhibit('${id}')">🗑️</button>
        </span>
      </div>
      <div class="body">
        <p>Size: ${exhibit.size} | Fence: ${Math.round(exhibit.fenceCondition)}% | Clean: ${Math.round(exhibit.cleanliness)}%</p>
        <div class="happiness-bar"><div class="fill" style="width: ${happiness}%"></div></div>
        <p>Happiness: ${happiness}%</p>
        <div>${animalsHTML}</div>
        ${isBuilding ? `<p>Days left: ${exhibit.buildDaysRemaining}</p>` : ""}
      </div>
    `;
    list.appendChild(card);
  });
}

function renderStaff() {
  const section = document.getElementById("staff");
  section.innerHTML = `<h2>👷 Staff</h2>
    <p>Keepers: ${getKeeperCapacity() - getKeeperDemand()} / ${getKeeperCapacity()} slots available</p>
    <p>Cleaners: ${getCleanerCapacity() - getCleanerDemand()} / ${getCleanerCapacity()} slots available</p>
    <div class="grid" id="staffGrid"></div>`;
  const grid = document.getElementById("staffGrid");
  
  data.staff.forEach(s => {
    const card = document.createElement("div");
    card.className = "premium-card";
    card.innerHTML = `
      <h3>${s.icon} ${s.name}</h3>
      <p>${s.description}</p>
      <p>Cost: $${s.cost} | Salary: $${s.salary}/day</p>
      <button onclick="hireStaff('${s.id}')">Hire</button>
    `;
    grid.appendChild(card);
  });

  // List hired staff
  if (state.hiredStaff.length > 0) {
    const hiredDiv = document.createElement("div");
    hiredDiv.innerHTML = `<h3 style="margin-top:20px">Hired Staff</h3>`;
    state.hiredStaff.forEach(s => {
      const sData = data.staff.find(x => x.id === s.typeId);
      hiredDiv.innerHTML += `<div class="premium-card">${sData.icon} ${sData.name} <button onclick="fireStaff('${s.uid}')">Fire</button></div>`;
    });
    section.appendChild(hiredDiv);
  }
}

function renderSupplies() {
  const section = document.getElementById("supplies");
  section.innerHTML = `<h2>🍽 Supplies</h2><div class="grid" id="suppliesGrid"></div>`;
  const grid = document.getElementById("suppliesGrid");
  
  Object.entries(FOOD_TYPES).forEach(([id, food]) => {
    const card = document.createElement("div");
    card.className = "premium-card";
    card.innerHTML = `
      <h3>${food.icon} ${food.name}</h3>
      <p>In Stock: ${state.food[id] || 0} / ${food.storageCap}</p>
      <p>Cost: $${food.costPerUnit}/unit</p>
      <button onclick="buyFood('${id}', 10)">Buy 10 ($${food.costPerUnit * 10})</button>
    `;
    grid.appendChild(card);
  });
}

function buyFood(type, amount) {
  const food = FOOD_TYPES[type];
  const cost = food.costPerUnit * amount;
  if (state.money < cost) { showToast("Not enough money!", "error"); return; }
  state.money -= cost;
  state.food[type] = Math.min(food.storageCap, (state.food[type] || 0) + amount);
  showToast(`Bought ${amount} ${food.name}`, "success");
  renderSupplies(); updateUI();
}

function renderAmenities() {
  const section = document.getElementById("amenities");
  section.innerHTML = `<h2>🏪 Amenities</h2><div class="grid" id="amenitiesGrid"></div>`;
  const grid = document.getElementById("amenitiesGrid");
  
  Object.values(data.amenities).forEach(a => {
    const card = document.createElement("div");
    card.className = "premium-card";
    card.innerHTML = `
      <h3>${a.icon} ${a.name}</h3>
      <p>${a.description}</p>
      <p>Cost: $${a.cost} | Owned: ${state.amenities[a.id] || 0}</p>
      <button onclick="buyAmenity('${a.id}')">Buy</button>
    `;
    grid.appendChild(card);
  });
}

function buyAmenity(id) {
  const a = data.amenities[id];
  if (state.money < a.cost) { showToast("Not enough money!", "error"); return; }
  state.money -= a.cost;
  state.amenities[id] = (state.amenities[id] || 0) + 1;
  showToast(`Bought ${a.name}`, "success");
  renderAmenities(); updateUI();
}

function renderResearch() {
  const section = document.getElementById("research");
  section.innerHTML = `<h2>🔬 Research</h2><div class="grid" id="researchGrid"></div>`;
  const grid = document.getElementById("researchGrid");
  
  Object.values(data.researchProjects).forEach(p => {
    const isCompleted = state.completedResearch.includes(p.id);
    const isActive = state.activeResearch && state.activeResearch.projectId === p.id;
    const isLocked = p.requires && !state.completedResearch.includes(p.requires);
    
    const card = document.createElement("div");
    card.className = "premium-card";
    card.innerHTML = `
      <h3>${p.icon} ${p.name}</h3>
      <p>${p.desc}</p>
      <p>Cost: $${p.cost} | Time: ${p.days} days</p>
      ${isCompleted ? "<p style='color:var(--accent)'>✅ Completed</p>" : 
        isActive ? `<p style='color:var(--warn)'>⏳ ${state.activeResearch.daysRemaining} days left</p>` :
        isLocked ? "<button disabled>🔒 Requires Prerequisite</button>" :
        `<button onclick="startResearch('${p.id}')">Start Research</button>`}
    `;
    grid.appendChild(card);
  });
}

function startResearch(id) {
  const p = data.researchProjects[id];
  if (state.money < p.cost) { showToast("Not enough money!", "error"); return; }
  if (state.activeResearch) { showToast("Already researching!", "warn"); return; }
  
  state.money -= p.cost;
  state.activeResearch = { projectId: id, daysRemaining: p.days };
  showToast(`Started researching ${p.name}`, "success");
  renderResearch(); updateUI();
}

// Placeholder renderers for other tabs
function renderHouses() { document.getElementById("houses").innerHTML = "<h2>🏠 Houses</h2><p>Build houses to create indoor exhibits.</p>"; }
function renderFacilities() { document.getElementById("facilities").innerHTML = "<h2>🏗 Facilities</h2><p>Global zoo facilities go here.</p>"; }
function renderVisitors() { document.getElementById("visitors").innerHTML = `<h2>👥 Visitors</h2><p>Today: ${state.dailyVisitors} | Satisfaction: ${state.visitorSatisfaction}%</p>`; }
function renderReports() { document.getElementById("reports").innerHTML = "<h2>📊 Reports</h2><p>Financial charts will render here via Chart.js.</p>"; }
function renderMap() { document.getElementById("map").innerHTML = "<h2>🗺️ Zoo Map</h2><p>Visual map of your zoo.</p>"; }
function renderAchievements() {
  const section = document.getElementById("achievements");
  section.innerHTML = `<h2>🏆 Achievements</h2><div class="grid" id="achGrid"></div>`;
  const grid = document.getElementById("achGrid");
  data.achievements.forEach(a => {
    const unlocked = state.achievements[a.id];
    grid.innerHTML += `<div class="premium-card" style="opacity:${unlocked ? 1 : 0.5}"><h3>${a.icon} ${a.name}</h3><p>${a.desc}</p></div>`;
  });
}
function renderLeaderboard() { document.getElementById("leaderboard").innerHTML = "<h2>🏆 Leaderboard</h2><p>Firebase leaderboard goes here.</p>"; }