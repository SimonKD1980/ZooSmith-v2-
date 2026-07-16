// js/engine/systems/WildlifeSystem.js
import { state } from '../GameState.js';
import { eventBus } from '../EventBus.js';
import { data } from '../data.js';
import { FOOD_TYPES, getDietFoodType, getLifeStage, shouldDieOfOldAge } from '../constants.js';
import { getStaffEffects, isKeepersUnderstaffed } from './StaffSystem.js';

export function processWildlife() {
    // Order matters! Food → Health → Breeding → Pregnancy → Aging
    const hungerResults = consumeDailyFood();
    processAnimalHealth(hungerResults.hungryAnimals);
    processBreeding();
    processPregnancy();
    processAging();
}

// =====================================================================
// 1. FOOD CONSUMPTION
// =====================================================================
function consumeDailyFood() {
    const hungryAnimals = [];
    const consumption = { hay: 0, meat: 0, produce: 0 };
    const allAnimals = getAllAnimals();

    // 🔥 CRITICAL FIX: If understaffed, NO food is consumed, but animals go hungry
    if (isKeepersUnderstaffed()) {
        allAnimals.forEach(animal => {
            animal.wasHungry = true;
            const foodIcon = FOOD_TYPES[getDietFoodType(animal.diet)]?.icon || '🍖';
            if (!hungryAnimals.includes(`${foodIcon} ${animal.name}`)) {
                hungryAnimals.push(`${foodIcon} ${animal.name}`);
            }
        });
        
        if (hungryAnimals.length > 0) {
            eventBus.emit('ANIMALS_HUNGRY', { animals: hungryAnimals });
        }
        
        // Return early: zero consumption
        return { consumption, hungryAnimals }; 
    }

    // Calculate total consumption needed (only runs if adequately staffed)
    allAnimals.forEach(animal => {
        const baseAmount = animal.foodAmount || 1;
        const amount = animal.isPregnant ? baseAmount * 2 : baseAmount;
        const foodType = getDietFoodType(animal.diet);
        consumption[foodType] += amount;
    });

    // Deduct from inventory, mark hungry if short
    for (const foodType in consumption) {
        const needed = consumption[foodType];
        const available = state.food[foodType] || 0;

        if (available >= needed) {
            state.food[foodType] -= needed;
        } else {
            state.food[foodType] = 0;
            // Mark animals of this diet as hungry
            allAnimals.forEach(animal => {
                if (getDietFoodType(animal.diet) === foodType) {
                    animal.wasHungry = true;
                    const foodIcon = FOOD_TYPES[foodType]?.icon || '🍖';
                    if (!hungryAnimals.includes(`${foodIcon} ${animal.name}`)) {
                        hungryAnimals.push(`${foodIcon} ${animal.name}`);
                    }
                }
            });
        }
    }

    if (hungryAnimals.length > 0) {
        eventBus.emit('ANIMALS_HUNGRY', { animals: hungryAnimals });
    }

    return { consumption, hungryAnimals };
}

// =====================================================================
// 2. HEALTH PROCESSING
// =====================================================================
function processAnimalHealth(hungryAnimals) {
    const allExhibits = Object.values(state.exhibits);
    const deaths = [];

    for (const exhibit of allExhibits) {
        if (exhibit.buildDaysRemaining > 0) continue;

        for (const animal of exhibit.animals) {
            if (animal.health === undefined) animal.health = 100;

            let healthChange = 2; // Base daily recovery

            // Hunger penalty
            if (animal.wasHungry) {
                healthChange -= 10;
                // Don't delete wasHungry yet - happiness calc needs it
            }

            // Sickness penalty
            if (animal.sick) {
                healthChange -= 3;
            }

            // Dirty exhibit penalty
            const cleanliness = exhibit.cleanliness ?? 100;
            if (cleanliness < 50) {
                healthChange -= (50 - cleanliness) * 0.1;
            }

            animal.health = Math.max(0, Math.min(100, animal.health + healthChange));

            // Sickness onset (health < 40)
            if (animal.health < 40 && !animal.sick && !animal.wasSickNotified) {
                animal.sick = true;
                animal.wasSickNotified = true;
                eventBus.emit('ANIMAL_SICK', { animal, exhibitName: exhibit.name });
            }

            // Recovery (health >= 70)
            if (animal.health >= 70 && animal.sick) {
                animal.sick = false;
                delete animal.wasSickNotified;
                eventBus.emit('ANIMAL_RECOVERED', { animal, exhibitName: exhibit.name });
            }

            // Death from neglect
            if (animal.health <= 0) {
                deaths.push({ animal, exhibit, cause: 'neglect' });
            }
        }

        // Remove dead animals and emit events
        for (const death of deaths) {
            death.exhibit.animals = death.exhibit.animals.filter(a => a !== death.animal);
            eventBus.emit('ANIMAL_DIED', {
                animal: death.animal,
                cause: death.cause,
                exhibitName: death.exhibit.name
            });
        }
    }
}

// =====================================================================
// 3. BREEDING
// =====================================================================
function processBreeding() {
    for (const exhibitId in state.exhibits) {
        const exhibit = state.exhibits[exhibitId];
        if (exhibit.buildDaysRemaining > 0) continue;

        const animals = exhibit.animals;
        if (!animals || animals.length < 2) continue;

        // Group by species
        const groups = {};
        animals.forEach(a => {
            if (!groups[a.id]) groups[a.id] = [];
            groups[a.id].push(a);
        });

        for (const species in groups) {
            const group = groups[species];
            const females = group.filter(a => {
                const stage = getLifeStage(a.ageDays || 0);
                return a.gender === "female" && !a.isPregnant && stage.canBreed;
            });
            const matureMales = group.filter(a =>
                getLifeStage(a.ageDays || 0).canBreed && a.gender === "male"
            );

            // Need: happy exhibit, mature male, breedable female
            const exhibitHappiness = getExhibitHappiness(exhibit);
            if (matureMales.length === 0 || females.length === 0 || exhibitHappiness < 80) continue;

            // Breed chance (from animal data, default 10%)
            const baseChance = data.animals.find(a => a.id === species)?.breedChance ?? 0.1;
            const chance = baseChance; // Could add staff breeding bonus here later

            if (Math.random() < chance) {
                const mother = females[Math.floor(Math.random() * females.length)];
                const father = matureMales[Math.floor(Math.random() * matureMales.length)];
                const gestationDays = data.animals.find(a => a.id === species)?.gestationDays || 10;

                mother.isPregnant = true;
                mother.daysUntilBirth = gestationDays;
                mother.babySpecies = species;
                mother.babyFather = father.name;

                state.daysSinceNewAnimal = 0;

                eventBus.emit('PREGNANCY_STARTED', {
                    mother,
                    father: father.name,
                    gestationDays,
                    exhibitName: exhibit.name
                });
            }
        }
    }
}

// =====================================================================
// 4. PREGNANCY COUNTDOWN & BIRTH
// =====================================================================
function processPregnancy() {
    for (const exhibitId in state.exhibits) {
        const exhibit = state.exhibits[exhibitId];
        if (exhibit.buildDaysRemaining > 0) continue;

        for (const animal of exhibit.animals) {
            if (!animal.isPregnant) continue;

            animal.daysUntilBirth--;

            if (animal.daysUntilBirth <= 0) {
                const species = animal.babySpecies || animal.id;
                const speciesData = data.animals.find(a => a.id === species);

                const baby = {
                    id: species,
                    name: `${speciesData?.name || species} Jr.`,
                    gender: Math.random() < 0.5 ? "male" : "female",
                    ageDays: 0,
                    diet: animal.diet,
                    foodAmount: animal.foodAmount || 1,
                    health: 100,
                    bornInZoo: true,
                    requiredExhibitSize: animal.requiredExhibitSize
                };

                exhibit.animals.push(baby);

                // Clear pregnancy
                animal.isPregnant = false;
                delete animal.daysUntilBirth;
                delete animal.babySpecies;
                delete animal.babyFather;

                state.bredAnimals = (state.bredAnimals || 0) + 1;
                state.daysSinceNewAnimal = 0;

                eventBus.emit('ANIMAL_BORN', {
                    baby,
                    mother: animal,
                    exhibitName: exhibit.name
                });
            }
        }
    }
}

// =====================================================================
// 5. AGING & OLD AGE DEATH
// =====================================================================
function processAging() {
    const deaths = [];

    for (const exhibitId in state.exhibits) {
        const exhibit = state.exhibits[exhibitId];
        if (exhibit.buildDaysRemaining > 0) continue;

        for (const animal of exhibit.animals) {
            const oldAge = animal.ageDays || 0;
            animal.ageDays = oldAge + 1;

            // Life stage milestones
            if (animal.ageDays === 30) {
                eventBus.emit('LIFE_STAGE', { animal, stage: 'juvenile', exhibitName: exhibit.name });
            } else if (animal.ageDays === 90) {
                eventBus.emit('LIFE_STAGE', { animal, stage: 'adult', exhibitName: exhibit.name });
            } else if (animal.ageDays === 365) {
                eventBus.emit('LIFE_STAGE', { animal, stage: 'senior', exhibitName: exhibit.name });
            }

            // Old age death
            if (shouldDieOfOldAge(animal.ageDays)) {
                deaths.push({ animal, exhibit, cause: 'old age' });
            }
            // Sickness death (5% chance per day if sick)
            else if (animal.sick && Math.random() < 0.05) {
                deaths.push({ animal, exhibit, cause: 'sickness' });
            }
        }

        // Remove dead animals
        for (const death of deaths) {
            death.exhibit.animals = death.exhibit.animals.filter(a => a !== death.animal);
            eventBus.emit('ANIMAL_DIED', {
                animal: death.animal,
                cause: death.cause,
                exhibitName: death.exhibit.name
            });
        }
    }
}

// =====================================================================
// HELPERS
// =====================================================================
function getAllAnimals() {
    return Object.values(state.exhibits).flatMap(ex => ex.animals || []);
}

function getExhibitHappiness(exhibit) {
    if (!exhibit || !exhibit.animals?.length) return 0;
    let total = 0;

    exhibit.animals.forEach(animal => {
        let happiness = 50; // Base

        // Health
        const health = animal.health ?? 100;
        happiness += (health - 50) * 0.4; // -20 to +20 based on health

        // Hunger (clears the flag after using it)
        if (animal.wasHungry) {
            happiness -= 30;
            delete animal.wasHungry; 
        }

        // Cleanliness
        const cleanliness = exhibit.cleanliness ?? 100;
        if (cleanliness < 50) {
            happiness -= (50 - cleanliness) * 0.5;
        }

        total += Math.max(0, Math.min(100, happiness));
    });

    return Math.round(total / exhibit.animals.length);
}
