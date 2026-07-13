// --- Master Daily Cycle ---
function advanceDay() {
  // 1. Check for active events (Placeholder)
  // if (state.activeEvent) return; 

  // 2. Feed animals
  consumeDailyFood();
  
  // 3. Process health and deaths
  processAnimalHealth();
  
  // 4 & 5. Income (Visitors & Animals)
  processDayIncome();
  processAnimalIncome();
  
  // 6. Facility upkeep
  processUpkeep();
  
  // 7. Maintenance and build timers
  processDailyMaintenance();
  
  // 8. Fence degradation
  processFenceDegradation();
  
  // 9. Cleanliness (from staff.js)
  processExhibitCleanliness();
  
  // 10. Age animals & old-age deaths
  processAging();
  
  // 11. Breeding attempts
  getAllExhibits().forEach(({ exhibit }) => tryBreeding(exhibit));
  
  // 12. Process pregnancies
  processPregnancies();
  
  // 13. Progress research
  progressResearch();
  
  // 14. Advance date
  advanceDate();
  
  // 15. Monthly report
  if (state.day === 1 && state.month !== 1) { // Triggered on the 1st of new months
     generateMonthlyReport();
  }
  
  // 16. Achievements
  checkAchievements();
  
  // 17. Zoo Rating
  calculateZooRating();
  
  // 18. Save game
  if (typeof saveGame === 'function') saveGame();
  
  // 19. Leaderboard
  if (typeof submitToLeaderboard === 'function') submitToLeaderboard();
  
  // 20. Random events (Disabled per GDD)
  // triggerRandomEvent();

  // Decay death penalty slightly each day
  state.recentDeathPenalty = Math.max(0, (state.recentDeathPenalty || 0) - 2);
  state.daysSinceNewAnimal = (state.daysSinceNewAnimal || 0) + 1;

  // Refresh UI
  if (typeof updateUI === 'function') updateUI();
  if (typeof renderExhibits === 'function') renderExhibits();
  if (typeof renderHouses === 'function') renderHouses();
}

// --- Daily Sub-Processes ---
function consumeDailyFood() {
  getAllAnimals().forEach(animal => {
    const baseAnimal = data.animals.find(a => a.id === animal.id);
    if (!baseAnimal) return;

    let foodNeeded = 1;
    if (animal.isPregnant) foodNeeded = 2; // Pregnant animals eat double

    const diet = baseAnimal.diet;
    let foodType = null;
    
    if (diet === "Herbivore") foodType = "hay";
    else if (diet === "Carnivore") foodType = "meat";
    else if (diet === "Omnivore") foodType = "produce";

    if (foodType && state.food[foodType] >= foodNeeded) {
      state.food[foodType] -= foodNeeded;
      animal.wasHungry = false;
    } else {
      animal.wasHungry = true;
      if (foodType && state.food[foodType] < foodNeeded) {
         // Deplete whatever is left
         state.food[foodType] = 0;
      }
    }
  });
}

function processUpkeep() {
  let upkeep = 0;
  upkeep += getAllExhibits().length * 5; // $5 per exhibit
  upkeep += Object.keys(state.houses).length * 10; // $10 per house
  
  state.money -= upkeep;
  state.monthlyIncomeTracker -= upkeep;
}

function processDailyMaintenance() {
  // Decrease build timers
  getAllExhibits().forEach(({ exhibit }) => {
    if (exhibit.buildDaysRemaining > 0) {
      exhibit.buildDaysRemaining--;
      if (exhibit.buildDaysRemaining === 0) {
        showToast(`🏗️ ${exhibit.name} is now open!`, "success");
      }
    }
  });

  for (const house of Object.values(state.houses)) {
    if (house.buildDaysRemaining > 0) {
      house.buildDaysRemaining--;
      if (house.buildDaysRemaining === 0) {
        showToast(`🏗️ ${house.name} is now open!`, "success");
      }
    }
    // Also decrement exhibits inside houses
    if (house.exhibits) {
       Object.values(house.exhibits).forEach(ex => {
          if (ex.buildDaysRemaining > 0) ex.buildDaysRemaining--;
       });
    }
  }

  // Amenity maintenance
  let amenityMaintenance = 0;
  for (const [id, count] of Object.entries(state.amenities)) {
    const amenityData = data.amenities[id];
    if (amenityData) {
      amenityMaintenance += (amenityData.maintenanceCost || 0) * count;
    }
  }
  state.money -= amenityMaintenance;
  state.monthlyIncomeTracker -= amenityMaintenance;
  state.maintenance.dailyMaintenanceCost = amenityMaintenance;
}

function processAging() {
  getAllAnimals().forEach(animal => {
    animal.age = (animal.age || 0) + 1;
    
    // Old age death chance
    if (animal.age > 600) {
      const deathChance = ((animal.age - 600) / 400) * 0.01;
      if (Math.random() < deathChance) {
        animal.isDead = true;
        state.naturalDeaths++;
        state.totalDeaths++;
        const context = getAllExhibits().find(({exhibit}) => exhibit.animals.includes(animal));
        if (context) {
           context.exhibit.animals = context.exhibit.animals.filter(a => a !== animal);
           showToast(`🕊️ ${animal.name} passed away of old age.`, "warn");
        }
      }
    }
  });
}

function progressResearch() {
  if (!state.activeResearch) return;
  
  state.activeResearch.daysRemaining--;
  if (state.activeResearch.daysRemaining <= 0) {
    const project = data.researchProjects[state.activeResearch.projectId];
    if (project) {
      state.completedResearch.push(project.id);
      showToast(`🔬 Research Complete: ${project.name}!`, "success");
      if (typeof renderResearch === 'function') renderResearch();
      if (typeof renderShop === 'function') renderShop();
    }
    state.activeResearch = null;
  }
}

function advanceDate() {
  state.day++;
  if (state.day > 30) {
    state.day = 1;
    state.month++;
    if (state.month > 12) {
      state.month = 1;
      state.year++;
    }
  }
}

function generateMonthlyReport() {
  const report = {
    month: state.month,
    year: state.year,
    income: state.monthlyIncomeTracker,
    visitors: state.dailyVisitors * 30, // Rough estimate
    animals: getAllAnimals().length,
    rating: state.zooRating
  };
  
  state.monthlyReports.push(report);
  state.monthlyIncomeTracker = 0; // Reset tracker
  
  if (typeof renderReports === 'function') renderReports();
  showMonthlyReportModal(report);
}

// --- Zoo Rating & Achievements ---
function calculateZooRating() {
  const allAnimals = getAllAnimals();
  const allExhibits = getAllExhibits();
  
  // 1. Animal Variety (20%)
  const uniqueSpecies = new Set(allAnimals.map(a => a.id)).size;
  const varietyScore = Math.min(100, uniqueSpecies * 10);
  
  // 2. Animal Health (20%)
  const avgHealth = allAnimals.length > 0 ? allAnimals.reduce((sum, a) => sum + (a.health || 100), 0) / allAnimals.length : 0;
  
  // 3. Visitor Satisfaction (15%)
  const satisfactionScore = state.visitorSatisfaction || 0;
  
  // 4. Cleanliness (10%)
  const avgCleanliness = allExhibits.length > 0 ? allExhibits.reduce((sum, {exhibit}) => sum + (exhibit.cleanliness || 100), 0) / allExhibits.length : 100;
  
  // 5. Death Score (25%)
  const deathPenalty = Math.min(100, state.recentDeathPenalty || 0);
  const deathScore = 100 - deathPenalty;
  
  // 6. Amenities (10%)
  const amenityScore = Math.min(100, 
    ((state.amenities.restroom || 0) + (state.amenities.toilet || 0)) * 20 + 
    (state.amenities.bin || 0) * 5 + 
    ((state.amenities.food_stand || 0) + (state.amenities.cafe || 0)) * 15
  );
  
  const rating = (varietyScore * 0.2) + (avgHealth * 0.2) + (satisfactionScore * 0.15) + 
                 (avgCleanliness * 0.1) + (deathScore * 0.25) + (amenityScore * 0.1);
  
  const oldRating = state.zooRating;
  state.zooRating = Math.round(Math.max(0, Math.min(100, rating)));
  
  // Tier up bonus
  const oldTier = Object.keys(ZOO_RATING_TIERS).find(t => oldRating >= ZOO_RATING_TIERS[t].min && oldRating <= ZOO_RATING_TIERS[t].max);
  const newTier = Object.keys(ZOO_RATING_TIERS).find(t => state.zooRating >= ZOO_RATING_TIERS[t].min && state.zooRating <= ZOO_RATING_TIERS[t].max);
  
  if (newTier && oldTier && parseInt(newTier) > parseInt(oldTier)) {
    const bonus = parseInt(newTier) * 500;
    state.money += bonus;
    showToast(`⭐ Zoo Rating Upgraded! Bonus: $${bonus}`, "success");
  }
  
  return state.zooRating;
}

function checkAchievements() {
  if (!data.achievements) return;
  
  data.achievements.forEach(ach => {
    if (state.achievements[ach.id]) return; // Already unlocked
    
    let unlocked = false;
    const check = ach.check;
    
    switch(check.type) {
      case 'totalAnimals': unlocked = getAllAnimals().length >= check.value; break;
      case 'money': unlocked = state.money >= check.value; break;
      case 'exhibitsCount': unlocked = getAllExhibits().length >= check.value; break;
      case 'totalDays': 
        const totalDays = (state.year - 1) * 360 + (state.month - 1) * 30 + state.day;
        unlocked = totalDays >= check.value; 
        break;
      case 'bredAnimals': unlocked = state.bredAnimals >= check.value; break;
      case 'animalsSold': unlocked = state.animalsSold >= check.value; break;
      case 'hasRareVariant':
        unlocked = getAllAnimals().some(a => {
           const base = data.animals.find(x => x.id === a.id);
           return base && base.variations && base.variations.some(v => v.name === a.variation && v.rare);
        }); 
        break;
      case 'visitorSatisfaction': unlocked = (state.visitorSatisfaction || 0) >= check.value; break;
    }
    
    if (unlocked) {
      state.achievements[ach.id] = true;
      showToast(`🏆 Achievement Unlocked: ${ach.name}!`, 'success');
      if (typeof renderAchievements === 'function') renderAchievements();
    }
  });
}

// --- Placeholder for Monthly Report Modal ---
function showMonthlyReportModal(report) {
  // This will be fully implemented in modals.js
  showToast(`📊 Month ${report.month} Report: Earned $${report.income}`, 'info');
}