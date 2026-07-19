// js/engine/systems/WildlifeSystem.js
import { state } from '../GameState.js';
import { eventBus } from '../EventBus.js';
import { data } from '../data.js';
import { getLifeStage } from '../constants.js';
import { getKeeperCapacity, getKeeperDemand } from './StaffSystem.js';
import { getExhibitEffects } from './UpgradeSystem.js'; // Add to imports


export function processWildlife() {
    // Check keeper capacity
    const keeperCapacity = getKeeperCapacity();
    let animalsFed = 0;
    const hungryAnimals = [];

    // Collect all animals across all exhibits
    const allAnimals = [];
    Object.values(state.exhibits).forEach(exhibit => {
        if (exhibit.buildDaysRemaining > 0) return;
        
        exhibit.animals.forEach(animal => {
            allAnimals.push({ animal, exhibit });
        });
    });

    // Sort animals - prioritize sick and hungry ones
    allAnimals.sort((a, b) => {
        // Sick animals first
        if (a.animal.sick && !b.animal.sick) return -1;
        if (!a.animal.sick && b.animal.sick) return 1;
        // Then hungry animals
        if (a.animal.wasHungry && !b.animal.wasHungry) return -1;
        if (!a.animal.wasHungry && b.animal.wasHungry) return 1;
        return 0;
    });

    // Process each animal
    allAnimals.forEach(({ animal, exhibit }) => {
        // Age the animal
        animal.ageDays = (animal.ageDays || 0) + 1;

        // Check if we have keeper capacity to feed this animal
        const canFeed = animalsFed < keeperCapacity;

        // Feed the animal (only if we have capacity)
        const speciesData = data.animals.find(a => a.id === animal.id);
        const foodAmount = speciesData?.foodAmount || 1;
        const foodType = getFoodTypeForDiet(animal.diet);
        
        animal.wasHungry = false;
        
        if (canFeed && (state.food?.[foodType] || 0) >= foodAmount) {
            // Keeper is available AND we have food
            state.food[foodType] -= foodAmount;
            animal.health = Math.min(100, (animal.health || 100) + 1);
            animalsFed++;
        } else if (!canFeed) {
            // No keeper capacity - animal goes hungry
            animal.wasHungry = true;
            animal.health = Math.max(0, (animal.health || 100) - 5);
            hungryAnimals.push(animal.name);
        } else {
            // No food available
            animal.wasHungry = true;
            animal.health = Math.max(0, (animal.health || 100) - 5);
            hungryAnimals.push(animal.name);
        }

        if (canFeed && (state.food?.[foodType] || 0) >= foodAmount) {
    state.food[foodType] -= foodAmount;
    
    // 🔥 Apply upgrade happiness bonus
    const exhibitEffects = getExhibitEffects(exhibit);
    const healthGain = 1 + Math.floor(exhibitEffects.happiness / 10); // Every 10 happiness = +1 extra health
    
    animal.health = Math.min(100, (animal.health || 100) + healthGain);
    animalsFed++;
}

        // Pregnancy countdown
        if (animal.isPregnant) {
            animal.daysUntilBirth--;
            if (animal.daysUntilBirth <= 0) {
                giveBirth(exhibit, animal);
            }
        }

        // Death check
        if (animal.health <= 0) {
            const cause = animal.ageDays > 3650 ? 'old age' : 'neglect';
            eventBus.emit('ANIMAL_DIED', {
                animal: animal,
                cause: cause,
                exhibitName: exhibit.name
            });
        }
    });

    // Emit hungry animals warning
    if (hungryAnimals.length > 0) {
        eventBus.emit('ANIMALS_HUNGRY', {
            animals: hungryAnimals,
            reason: keeperCapacity === 0 ? 'No keepers hired!' : 'Not enough keepers!'
        });
    }

    // Remove dead animals
    Object.values(state.exhibits).forEach(exhibit => {
        exhibit.animals = exhibit.animals.filter(a => a.health > 0);
    });
}

function getFoodTypeForDiet(diet) {
    if (diet === 'Carnivore') return 'meat';
    if (diet === 'Herbivore') return 'hay';
    return 'produce';
}

function giveBirth(exhibit, mother) {
    const speciesData = data.animals.find(a => a.id === mother.id);
    const speciesName = speciesData?.name || mother.name;
    
    const babyGender = Math.random() < 0.5 ? 'male' : 'female';
    const baby = {
        uid: 'animal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        id: mother.id,
        speciesName: speciesName,
        name: `${speciesName} Baby`,
        gender: babyGender,
        ageDays: 0,
        health: 100,
        sick: false,
        wasHungry: false,
        isPregnant: false,
        daysUntilBirth: 0,
        bornInZoo: true,
        diet: speciesData?.diet || mother.diet,
        mother: mother.uid,
        father: mother.babyFather
    };
    
    exhibit.animals.push(baby);
    
    mother.isPregnant = false;
    mother.daysUntilBirth = 0;
    const fatherName = exhibit.animals.find(a => a.uid === mother.babyFather)?.name || 'Unknown';
    mother.babyFather = null;
    
    state.pendingBaby = {
        babyUid: baby.uid,
        exhibitId: exhibit.id,
        species: speciesName,
        gender: babyGender,
        motherName: mother.name,
        fatherName: fatherName
    };
    
    eventBus.emit('ANIMAL_BORN', {
        baby: baby,
        mother: mother,
        exhibitName: exhibit.name
    });
    
    eventBus.emit('BABY_NEEDS_NAME', state.pendingBaby);
}

export function attemptBreeding(exhibitId) {
    const exhibit = state.exhibits[exhibitId];
    if (!exhibit) {
        alert("Exhibit not found!");
        return false;
    }
    
    if (exhibit.buildDaysRemaining > 0) {
        alert("Cannot breed in an exhibit under construction!");
        return false;
    }
    
    const speciesGroups = {};
    exhibit.animals.forEach(animal => {
        const species = animal.id;
        if (!speciesGroups[species]) speciesGroups[species] = [];
        speciesGroups[species].push(animal);
    });
    
    for (const species in speciesGroups) {
        const group = speciesGroups[species];
        const males = group.filter(a => a.gender === 'male' && getLifeStage(a.ageDays || 0).stage === 'adult' && !a.isPregnant);
        const females = group.filter(a => a.gender === 'female' && getLifeStage(a.ageDays || 0).stage === 'adult' && !a.isPregnant);
        
        if (males.length > 0 && females.length > 0) {
            const father = males[0];
            const mother = females[0];
            
            if (mother.isPregnant) {
                continue;
            }
            
            const gestationDays = 30 + Math.floor(Math.random() * 30);
            mother.isPregnant = true;
            mother.daysUntilBirth = gestationDays;
            mother.babyFather = father.uid;
            
            eventBus.emit('PREGNANCY_STARTED', {
                mother: mother,
                father: father.name,
                gestationDays: gestationDays,
                exhibitName: exhibit.name
            });
            
            return true;
        }
    }
    
    alert("No compatible breeding pair found! You need at least one adult male and one adult female of the same species, and neither can already be pregnant.");
    return false;
}

export function renameBaby(babyUid, newName) {
    for (const exhibit of Object.values(state.exhibits)) {
        const baby = exhibit.animals.find(a => a.uid === babyUid);
        if (baby) {
            baby.name = newName;
            state.pendingBaby = null;
            return true;
        }
    }
    return false;
}
