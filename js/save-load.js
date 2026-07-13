function saveGame() {
  const profiles = getProfiles();
  const activeId = getActiveProfileId();
  profiles[activeId].state = JSON.parse(JSON.stringify(state));
  profiles[activeId].money = state.money;
  profiles[activeId].animals = getAllAnimals().length;
  profiles[activeId].timestamp = Date.now();
  saveProfiles(profiles);
}

function loadGame() {
  let profiles = getProfiles();
  let activeId = getActiveProfileId();
  
  if (!profiles[activeId]) {
    activeId = `zoo_${Date.now()}`;
    profiles[activeId] = { id: activeId, zooName: "My Zoo", state: JSON.parse(JSON.stringify(state)) };
    setActiveProfileId(activeId);
    saveProfiles(profiles);
  }
  
  if (profiles[activeId].state) {
    Object.assign(state, profiles[activeId].state);
  }
  
  // V0.7.0 Migration
  if (state.hiredStaff.length > 0 && typeof state.hiredStaff[0] === 'string') {
    state.hiredStaff = state.hiredStaff.map(id => ({
      uid: 'migrated_' + Date.now() + Math.random(), typeId: id, assignments: []
    }));
  }
}

function getProfiles() { return JSON.parse(localStorage.getItem("zooProfiles") || "{}"); }
function saveProfiles(p) { localStorage.setItem("zooProfiles", JSON.stringify(p)); }
function getActiveProfileId() { return localStorage.getItem("activeZooProfileId") || "default"; }
function setActiveProfileId(id) { localStorage.setItem("activeZooProfileId", id); }