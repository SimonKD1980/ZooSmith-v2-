// js/engine/systems/WildlifeSystem.js
import { state } from '../GameState.js';
import { eventBus } from '../EventBus.js';
import { data } from '../data.js';
import { getLifeStage } from '../constants.js';

export function processWildlife() {
    Object.values(state.exhibits).forEach(exhibit => {
        if (exhibit.buildDaysRemaining > 0) return;

        exhibit.animals.forEach(animal => {
            // Age the animal
            animal.ageDays = (animal.ageDays || 0) + 1;

            // Feed the animal
            const speciesData = data.animals.find(a => a.id === animal.id);
            const foodAmount = speciesData?.foodAmount || 1;
            const foodType = getFoodTypeForDiet(animal.diet);
            
            animal.wasHungry = false;
            if ((state.food?.[foodType] || 0) >= foodAmount) {
                state.food[foodType] -= foodAmount;
                animal.health = Math.min(100, (animal.health || 100) + 1);
            } else {
                animal.wasHungry = true;
                animal.health = Math.max(0, (animal.health || 100) - 5);
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

        // Remove dead animals
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
    
    // 🔥 Create the baby with a temporary name
    const babyGender = Math.random() < 0.5 ? 'male' : 'female';
    const baby = {
        uid: 'animal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        id: mother.id,
        speciesName: speciesName,
        name: `${speciesName} Baby`, // Temporary name - player will rename
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
    
    // Reset mother
    mother.isPregnant = false;
    mother.daysUntilBirth = 0;
    const fatherName = exhibit.animals.find(a => a.uid === mother.babyFather)?.name || 'Unknown';
    mother.babyFather = null;
    
    // 🔥 Store pending baby for naming
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
    
    // 🔥 Emit special event to trigger naming modal
    eventBus.emit('BABY_NEEDS_NAME', state.pendingBaby);
}

// 🔥 NEW: Try to initiate breeding in an exhibit
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
    
    // Group animals by species
    const speciesGroups = {};
    exhibit.animals.forEach(animal => {
        const species = animal.id;
        if (!speciesGroups[species]) speciesGroups[species] = [];
        speciesGroups[species].push(animal);
    });
    
    // Find a breedable pair
    for (const species in speciesGroups) {
        const group = speciesGroups[species];
        const males = group.filter(a => a.gender === 'male' && getLifeStage(a.ageDays || 0).stage === 'adult' && !a.isPregnant);
        const females = group.filter(a => a.gender === 'female' && getLifeStage(a.ageDays || 0).stage === 'adult' && !a.isPregnant);
        
        if (males.length > 0 && females.length > 0) {
            const father = males[0];
            const mother = females[0];
            
            // Check if already pregnant
            if (mother.isPregnant) {
                continue;
            }
            
            // Start pregnancy
            const gestationDays = 30 + Math.floor(Math.random() * 30); // 30-60 days
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

// 🔥 NEW: Rename a baby
export function renameBaby(babyUid, newName) {
    // Find the baby across all exhibits
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
