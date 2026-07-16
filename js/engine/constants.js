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

// 🔥 NEW: Exhibit type definitions
export const EXHIBIT_TYPES = {
    small: {
        id: 'small',
        name: 'Small Exhibit',
        icon: '🏞️',
        description: 'Perfect for small animals like birds, reptiles, or small mammals.',
        cost: 500,
        buildDays: 2,
        size: 'small',
        maxAnimals: 4,
        upkeep: 5
    },
    medium: {
        id: 'medium',
        name: 'Medium Exhibit',
        icon: '🌿',
        description: 'Great for medium-sized animals like wolves, deer, or small big cats.',
        cost: 1500,
        buildDays: 4,
        size: 'medium',
        maxAnimals: 6,
        upkeep: 15
    },
    large: {
        id: 'large',
        name: 'Large Exhibit',
        icon: '🦁',
        description: 'Spacious habitat for large animals like lions, elephants, or giraffes.',
        cost: 4000,
        buildDays: 7,
        size: 'large',
        maxAnimals: 10,
        upkeep: 30
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
