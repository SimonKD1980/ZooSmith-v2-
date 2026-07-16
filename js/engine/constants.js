// js/engine/constants.js
// All game balance constants in ONE place. Tweak here, affects everywhere.

export const FOOD_TYPES = {
    hay: {
        name: "Hay",
        icon: "🌾",
        costPerUnit: 2,
        diet: "Herbivore",
        storageCap: 200,
        color: "#fbbf24"
    },
    meat: {
        name: "Meat",
        icon: "🥩",
        costPerUnit: 5,
        diet: "Carnivore",
        storageCap: 100,
        color: "#ef4444"
    },
    produce: {
        name: "Produce",
        icon: "🥬",
        costPerUnit: 3,
        diet: "Omnivore",
        storageCap: 150,
        color: "#22c55e"
    }
};

export function getDietFoodType(diet) {
    if (diet === "Herbivore") return "hay";
    if (diet === "Carnivore") return "meat";
    if (diet === "Omnivore") return "produce";
    return "hay";
}

export function getLifeStage(ageDays) {
    if (ageDays < 30) return { stage: 'baby', emoji: '🍼', label: 'Baby', canBreed: false };
    if (ageDays < 90) return { stage: 'juvenile', emoji: '🐾', label: 'Juvenile', canBreed: false };
    if (ageDays < 365) return { stage: 'adult', emoji: '🦁', label: 'Adult', canBreed: true };
    return { stage: 'senior', emoji: '👴', label: 'Senior', canBreed: true };
}

export function shouldDieOfOldAge(ageDays) {
    if (ageDays < 600) return false;
    return Math.random() < ((ageDays - 600) / 400) * 0.01;
}
