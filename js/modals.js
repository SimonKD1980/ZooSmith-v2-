function showSection(sectionId, event) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".nav button").forEach(b => b.classList.remove("active"));
  
  document.getElementById(sectionId).classList.add("active");
  if (event && event.target) event.target.classList.add("active");
  
  const renderFunc = `render${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}`;
  if (typeof window[renderFunc] === 'function') window[renderFunc]();
}

function openBuildModal() {
  const content = document.getElementById("buildContent");
  content.innerHTML = Object.entries(EXHIBIT_SIZES).map(([size, data]) => `
    <div class="premium-card" style="margin-bottom:10px">
      <h3>${data.emoji} ${data.label} Exhibit</h3>
      <p>Cost: $${data.cost} | Build Time: ${data.buildDays} days</p>
      <button onclick="buildExhibit('${size}', 'terrestrial'); closeBuildModal();">Build</button>
    </div>
  `).join("");
  document.getElementById("buildModal").classList.add("active");
}
function closeBuildModal() { document.getElementById("buildModal").classList.remove("active"); }

function openBuyModal(animalId) {
  state.pendingAnimal = animalId;
  const select = document.getElementById("exhibitSelect");
  select.innerHTML = getAllExhibits().filter(({exhibit}) => exhibit.buildDaysRemaining === 0).map(({id, exhibit}) => 
    `<option value="${id}">${exhibit.name}</option>`
  ).join("");
  document.getElementById("buyModal").classList.add("active");
}
function closeBuyModal() { document.getElementById("buyModal").classList.remove("active"); }

document.getElementById("confirmBuyBtn").onclick = function() {
  const animalId = state.pendingAnimal;
  const exhibitId = document.getElementById("exhibitSelect").value;
  const gender = document.getElementById("genderSelect").value;
  
  const baseAnimal = data.animals.find(a => a.id === animalId);
  if (!baseAnimal || state.money < baseAnimal.cost) { showToast("Not enough money!", "error"); return; }
  
  const context = getExhibitContext(exhibitId);
  if (!context.exhibit) return;
  
  state.money -= baseAnimal.cost;
  context.exhibit.animals.push({
    id: baseAnimal.id, name: getNextAnimalName(baseAnimal.name), gender: gender,
    age: 90, health: 100, variation: pickVariation(baseAnimal),
    isPregnant: false, daysUntilBirth: 0, bornInZoo: false, wasHungry: false
  });
  
  state.daysSinceNewAnimal = 0;
  showToast(`Bought ${baseAnimal.name}!`, "success");
  closeBuyModal(); renderExhibits(); updateUI();
};

function openAnimalInfo(exhibitId, index) {
  const context = getExhibitContext(exhibitId);
  const animal = context.exhibit.animals[index];
  const base = data.animals.find(x => x.id === animal.id);
  
  document.getElementById("animalInfoContent").innerHTML = `
    <h3>${base.emoji} ${animal.name} (${animal.variation})</h3>
    <p>Age: ${animal.age} days (${getLifeStage(animal.age)})</p>
    <p>Health: ${animal.health}% | Gender: ${animal.gender}</p>
    <button onclick="sellAnimal(${JSON.stringify(animal).replace(/"/g, '&quot;')}, '${exhibitId}'); closeAnimalInfo();">Sell</button>
  `;
  document.getElementById("animalInfoModal").classList.add("active");
}
function closeAnimalInfo() { document.getElementById("animalInfoModal").classList.remove("active"); }

function openUpgradeModal() {
  const context = getExhibitContext(state.activeUpgradeExhibit);
  const content = document.getElementById("upgradeContent");
  content.innerHTML = Object.values(data.upgrades).map(u => {
    const owned = context.exhibit.upgrades.includes(u.id);
    return `<div class="premium-card"><h3>${u.name}</h3><p>${u.description}</p>
      ${owned ? `<button onclick="sellUpgradeFromModal('${u.id}')">Sell ($${Math.floor(u.cost/2)})</button>` : 
                `<button onclick="buyUpgradeFromModal('${u.id}')">Buy ($${u.cost})</button>`}
    </div>`;
  }).join("");
}
function closeUpgradeModal() { document.getElementById("upgradeModal").classList.remove("active"); }

function openSettingsModal() { document.getElementById("settingsModal").classList.add("active"); }
function closeSettingsModal() { document.getElementById("settingsModal").classList.remove("active"); }
function openManageZoosModal() { document.getElementById("manageZoosModal").classList.add("active"); }
function closeManageZoosModal() { document.getElementById("manageZoosModal").classList.remove("active"); }
function showRatingBreakdown() { document.getElementById("ratingModal").classList.add("active"); }
function closeRatingModal() { document.getElementById("ratingModal").classList.remove("active"); }