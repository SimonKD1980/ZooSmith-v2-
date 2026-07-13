// --- Life Stages & Helpers ---
function getLifeStage(age) {
  if (age < 30) return "Baby";
  if (age < 90) return "Juvenile";
  if (age < 365) return "Adult";
  return "Senior";
}

function getIncomeMultiplier(age) {
  if (age < 30) return 0.5;
  if (age < 90) return 0.75;
  if (age < 365) return 1.0;
  return 0.8;
}

function canBreed(animal) {
  const stage = getLifeStage(animal.age);
  return (stage === "Adult" || stage === "Senior") && !animal.isPregnant;
}

// --- V0.7.0 Happiness System ---
function getExhibitHappiness(exhibit) {
  if (!exhibit || !exhibit.animals || exhibit.animals.length === 0) return 0;
  
  let totalHappiness = 0;
  const upgrades = exhibit.upgrades || [];
  const understaffed = isUnderstaffed();
  const staffEffects = getStaffEffects();
  const cleanliness = exhibit.cleanliness ?? 100;

  exhibit.animals.forEach(animal => {
    let happiness = 30; // Base happiness
    const speciesId = animal.id;
    const count = exhibit.animals.filter(a => a.id === speciesId).length;
    const baseAnimal = data.animals.find(a => a.id === speciesId);
    
    if (!baseAnimal) return;

    // 1. Herd Size
    const min = baseAnimal.minInExhibit || 1;
    const max = baseAnimal.maxInExhibit || 10;
    
    if (count < min) {
      happiness = (count / min) * 30; // Lonely penalty
    } else if (count > max) {
      happiness -= (count - max) * 15; // Overcrowding
    } else {
      happiness += 20; // Proper herd bonus
    }

    // 2. Health (up to +10)
    const health = animal.health ?? 100;
    happiness += (health / 10);

    // 3. Food (-30 if hungry)
    if (animal.wasHungry) {
      happiness -= 30;
      delete animal.wasHungry; // Clear flag after applying penalty
    }

    // 4. Staffing (-20 if understaffed)
    if (understaffed) happiness -= 20;

    // 5. Cleanliness (up to -25 if filthy)
    if (cleanliness < 50) {
      happiness -= (50 - cleanliness) * 0.5;
    }

    // 6. Preferred items
    toArray(baseAnimal.preferredShelter).forEach(pref => {
      if (upgrades.includes(pref)) happiness += 15;
      else happiness -= 10;
    });
    toArray(baseAnimal.preferredDecorations).forEach(pref => {
      if (upgrades.includes(pref)) happiness += 5;
      else happiness -= 3;
    });
    toArray(baseAnimal.preferredFacilities).forEach(pref => {
      if (upgrades.includes(pref)) happiness += 5;
      else happiness -= 3;
    });

    // 7. Disliked items
    toArray(baseAnimal.dislikedShelter).forEach(pref => {
      if (upgrades.includes(pref)) happiness -= 20;
    });
    toArray(baseAnimal.dislikedDecorations).forEach(pref => {
      if (upgrades.includes(pref)) happiness -= 10;
    });
    toArray(baseAnimal.dislikedFacilities).forEach(pref => {
      if (upgrades.includes(pref)) happiness -= 10;
    });

    totalHappiness += happiness;
  });

  let avgHappiness = Math.round(totalHappiness / exhibit.animals.length);
  avgHappiness += (staffEffects.cleanExhibits || 0) * 0.5;
  avgHappiness += staffEffects.animalHappiness || 0;

  return Math.max(0, Math.min(100, avgHappiness));
}

// --- Health & Breeding ---
function processAnimalHealth() {
  const allExhibits = getAllExhibits();
  
  allExhibits.forEach(({ exhibit }) => {
    if (!exhibit.animals) return;
    
    exhibit.animals.forEach(animal => {
      // Sickness chance based on low cleanliness or happiness
      const happiness = getExhibitHappiness(exhibit);
      const cleanliness = exhibit.cleanliness ?? 100;
      
      if (cleanliness < 30 || happiness < 30) {
        if (Math.random() < 0.05) { // 5% chance to get sick
          animal.health = Math.max(0, (animal.health || 100) - 20);
          if (animal.health <= 0) {
            animal.isDead = true;
          }
        }
      } else {
        // Natural healing
        animal.health = Math.min(100, (animal.health || 100) + 2);
      }
    });

    // Remove dead animals and apply penalties
    const deadAnimals = exhibit.animals.filter(a => a.isDead);
    if (deadAnimals.length > 0) {
      state.totalDeaths += deadAnimals.length;
      state.unnaturalDeaths += deadAnimals.length;
      state.recentDeathPenalty = Math.min(100, (state.recentDeathPenalty || 0) + (deadAnimals.length * 15));
      showToast(`💀 An animal died in ${exhibit.name}!`, "error");
      exhibit.animals = exhibit.animals.filter(a => !a.isDead);
    }
  });
}

function tryBreeding(exhibit) {
  if (!exhibit.animals || exhibit.animals.length < 2) return;
  if (getExhibitHappiness(exhibit) < 100) return; // Must be perfectly happy

  const speciesGroups = {};
  exhibit.animals.forEach(a => {
    if (!speciesGroups[a.id]) speciesGroups[a.id] = [];
    speciesGroups[a.id].push(a);
  });

  for (const [speciesId, animals] of Object.entries(speciesGroups)) {
    const baseAnimal = data.animals.find(a => a.id === speciesId);
    if (!baseAnimal || !baseAnimal.breedChance) continue;

    const males = animals.filter(a => a.gender === "male" && canBreed(a));
    const females = animals.filter(a => a.gender === "female" && canBreed(a));

    if (males.length > 0 && females.length > 0) {
      if (Math.random() < baseAnimal.breedChance) {
        const mother = females[0];
        mother.isPregnant = true;
        mother.daysUntilBirth = baseAnimal.gestationDays || 30;
        showToast(`🤰 A ${baseAnimal.name} is pregnant!`, "success");
        break; // Only one pregnancy per day per exhibit
      }
    }
  }
}

function processPregnancies() {
  getAllAnimals().forEach(animal => {
    if (animal.isPregnant) {
      animal.daysUntilBirth--;
      // Pregnant animals eat double (handled in consumeDailyFood)
      
      if (animal.daysUntilBirth <= 0) {
        animal.isPregnant = false;
        const baseAnimal = data.animals.find(a => a.id === animal.id);
        
        // Find the exhibit this animal is in to add the baby
        const context = getAllExhibits().find(({exhibit}) => exhibit.animals.includes(animal));
        if (context && baseAnimal) {
          const baby = {
            id: baseAnimal.id,
            name: getNextAnimalName(baseAnimal.name),
            gender: Math.random() < 0.5 ? "male" : "female",
            age: 0,
            health: 100,
            variation: pickVariation(baseAnimal),
            isPregnant: false,
            daysUntilBirth: 0,
            bornInZoo: true,
            wasHungry: false
          };
          context.exhibit.animals.push(baby);
          state.bredAnimals++;
          state.daysSinceNewAnimal = 0; // Reset novelty
          showToast(`🎉 A new ${baseAnimal.name} (${baby.variation}) was born!`, "success");
        }
      }
    }
  });
}

// --- Animal Actions ---
function generateAnimalThoughts(animal, exhibit) {
  const thoughts = [];
  const baseAnimal = data.animals.find(a => a.id === animal.id);
  if (!baseAnimal) return thoughts;

  if (animal.wasHungry) thoughts.push("I'm so hungry... 🍽️");
  if ((animal.health || 100) < 50) thoughts.push("I don't feel well... 🤒");
  if (exhibit.cleanliness < 40) thoughts.push("This place is filthy! 🤢");
  
  const count = exhibit.animals.filter(a => a.id === animal.id).length;
  if (count < (baseAnimal.minInExhibit || 1)) thoughts.push("I feel lonely... 😔");
  if (count > (baseAnimal.maxInExhibit || 10)) thoughts.push("Too crowded! 😫");

  if (thoughts.length === 0) thoughts.push("Life is good! 😊");
  return thoughts;
}

function sellAnimal(animal, exhibitId) {
  const context = getExhibitContext(exhibitId);
  if (!context.exhibit) return;

  const baseAnimal = data.animals.find(a => a.id === animal.id);
  const basePrice = baseAnimal ? baseAnimal.cost : 100;
  const ageMultiplier = getIncomeMultiplier(animal.age);
  const healthMultiplier = (animal.health || 100) / 100;
  
  const sellPrice = Math.round(basePrice * 0.5 * ageMultiplier * healthMultiplier);
  
  state.money += sellPrice;
  context.exhibit.animals = context.exhibit.animals.filter(a => a !== animal);
  state.animalsSold++;
  
  showToast(`Sold ${animal.name} for $${sellPrice}`, "success");
  if (typeof renderExhibits === 'function') renderExhibits();
  if (typeof updateUI === 'function') updateUI();
}

function moveAnimalTo(toId) {
  if (!state.moveState.active) return;
  
  const fromContext = getExhibitContext(state.moveState.fromExhibit);
  const toContext = getExhibitContext(toId);
  
  if (!fromContext.exhibit || !toContext.exhibit) return;
  
  const animal = fromContext.exhibit.animals[state.moveState.animalIndex];
  if (!animal) return;

  // Remove from old, add to new
  fromContext.exhibit.animals.splice(state.moveState.animalIndex, 1);
  toContext.exhibit.animals.push(animal);
  
  state.moveState = { active: false, fromExhibit: null, animalIndex: null };
  state.uiMode = "normal";
  
  showToast(`Moved ${animal.name} to ${toContext.exhibit.name}`, "info");
  if (typeof renderExhibits === 'function') renderExhibits();
}