function isKeeperRole(typeId) {
  const staffData = data.staff.find(s => s.id === typeId);
  if (!staffData) return false;
  return staffData.role.toLowerCase().includes('keeper') || (staffData.keeperSlots || 0) > 0;
}

function isCleanerRole(typeId) {
  const staffData = data.staff.find(s => s.id === typeId);
  if (!staffData) return false;
  return staffData.role.toLowerCase().includes('cleaner') || 
         staffData.role.toLowerCase().includes('janitor') || 
         (staffData.cleanerSlots || 0) > 0;
}

function getKeeperCapacity() {
  let capacity = 0;
  state.hiredStaff.forEach(instance => {
    const staffData = data.staff.find(s => s.id === instance.typeId);
    const slots = staffData?.keeperSlots || 5;
    if (isKeeperRole(instance.typeId)) {
      capacity += slots;
    }
  });
  return capacity;
}

function getKeeperDemand() {
  let demand = 0;
  getAllExhibits().forEach(({ exhibit }) => {
    if (exhibit.buildDaysRemaining > 0) return; // Under construction doesn't count
    if (exhibit.size === "small") demand += 1;
    else if (exhibit.size === "medium") demand += 2;
    else if (exhibit.size === "large") demand += 3;
  });
  return demand;
}

function getCleanerCapacity() {
  let capacity = 0;
  state.hiredStaff.forEach(instance => {
    const staffData = data.staff.find(s => s.id === instance.typeId);
    const slots = staffData?.cleanerSlots || 10;
    if (isCleanerRole(instance.typeId)) {
      capacity += slots;
    }
  });
  return capacity;
}

function getCleanerDemand() {
  let demand = 0;
  if (state.amenities.bin) demand += state.amenities.bin * 1;
  if (state.amenities.restroom) demand += state.amenities.restroom * 2;
  if (state.amenities.toilet) demand += state.amenities.toilet * 2;
  return demand;
}

function isUnderstaffed() {
  return getKeeperDemand() > getKeeperCapacity() || getCleanerDemand() > getCleanerCapacity();
}

function getStaffEffects() {
  const effects = { cleanExhibits: 0, cleanPark: 0, animalHappiness: 0, maxStaff: 0 };
  state.hiredStaff.forEach(instance => {
    const staffData = data.staff.find(s => s.id === instance.typeId);
    if (staffData && staffData.effects) {
      effects.cleanExhibits += staffData.effects.cleanExhibits || 0;
      effects.cleanPark += staffData.effects.cleanPark || 0;
      effects.animalHappiness += staffData.effects.animalHappiness || 0;
      effects.maxStaff += staffData.effects.maxStaff || 0;
    }
  });
  return effects;
}

function getTargetDemand(targetId, targetType) {
  if (targetType === "exhibit") {
    const { exhibit } = getExhibitContext(targetId);
    if (!exhibit || exhibit.buildDaysRemaining > 0) return 0;
    if (exhibit.size === "small") return 1;
    if (exhibit.size === "medium") return 2;
    if (exhibit.size === "large") return 3;
    return 1;
  } else if (targetType === "amenity") {
    if (targetId === "bin") return 1;
    if (targetId === "restroom" || targetId === "toilet") return 2;
    return 1;
  }
  return 0;
}

function getFreeSlots(staffInstance) {
  const staffData = data.staff.find(s => s.id === staffInstance.typeId);
  if (!staffData) return 0;
  
  let totalSlots = 0;
  let usedSlots = staffInstance.assignments.length;

  if (isKeeperRole(staffInstance.typeId)) totalSlots += (staffData.keeperSlots || 5);
  if (isCleanerRole(staffInstance.typeId)) totalSlots += (staffData.cleanerSlots || 10);

  return Math.max(0, totalSlots - usedSlots);
}

function hireStaff(staffId) {
  const staffData = data.staff.find(s => s.id === staffId);
  if (!staffData) return;

  const newStaff = {
    uid: `staff_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    typeId: staffId,
    assignments: []
  };

  state.hiredStaff.push(newStaff);
  showToast(`Hired ${staffData.name}!`, "success");
  if (typeof renderStaff === 'function') renderStaff();
  if (typeof updateUI === 'function') updateUI();
}

function fireStaff(uid) {
  const index = state.hiredStaff.findIndex(s => s.uid === uid);
  if (index !== -1) {
    const staffData = data.staff.find(s => s.id === state.hiredStaff[index].typeId);
    state.hiredStaff.splice(index, 1);
    showToast(`Fired ${staffData ? staffData.name : "Staff"}`, "warn");
    if (typeof renderStaff === 'function') renderStaff();
    if (typeof updateUI === 'function') updateUI();
  }
}

// V0.7.0 Hybrid Cleaning System
function processExhibitCleanliness() {
  const staffEffects = getStaffEffects();
  const janitorCleaningPower = staffEffects.cleanExhibits || 0;
  const allExhibits = getAllExhibits();

  for (const { exhibit } of allExhibits) {
    if (exhibit.buildDaysRemaining > 0) continue;
    if (exhibit.cleanliness === undefined) exhibit.cleanliness = 100;

    // 1. Animals create dirt based on species dirtiness
    let dirtAmount = 0;
    if (exhibit.animals) {
      exhibit.animals.forEach(animalInstance => {
        const baseAnimal = data.animals.find(a => a.id === animalInstance.id);
        const dirtLevel = baseAnimal ? (baseAnimal.dirtiness || 2) : 2;
        dirtAmount += dirtLevel;
      });
    }
    exhibit.cleanliness -= dirtAmount;

    // 2. Keepers assigned to THIS exhibit clean it (+2 per keeper)
    const assignedKeepers = state.hiredStaff.filter(s =>
      s.assignments &&
      s.assignments.includes(exhibit.id) &&
      isKeeperRole(s.typeId)
    );
    const keeperCleaningBonus = assignedKeepers.length * 2;
    exhibit.cleanliness += keeperCleaningBonus;

    // 3. Janitors provide global cleaning
    if (janitorCleaningPower > 0) {
      exhibit.cleanliness += janitorCleaningPower;
    }

    // 4. Clamp between 0 and 100
    exhibit.cleanliness = Math.max(0, Math.min(100, exhibit.cleanliness));
  }
}