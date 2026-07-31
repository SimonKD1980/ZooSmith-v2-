// js/engine/constants.js

export const FOOD_TYPES = {
    hay: { name: "Hay", icon: "🌾", costPerUnit: 2, diet: "Herbivore", storageCap: 200, color: "#fbbf24" },
    meat: { name: "Meat", icon: "", costPerUnit: 5, diet: "Carnivore", storageCap: 100, color: "#ef4444" },
    produce: { name: "Produce", icon: "🥬", costPerUnit: 3, diet: "Omnivore", storageCap: 150, color: "#22c55e" }
};

// 🔥 NEW: Habitat Types (The "Type" of environment)
export const HABITAT_TYPES = {
    terrestrial: {
        id: 'terrestrial',
        name: 'Terrestrial',
        icon: '🏞️',
        description: 'Standard land habitat for mammals and birds.',
        baseCost: 500,
        baseUpkeep: 5
    },
    aquatic: {
        id: 'aquatic',
        name: 'Aquatic',
        icon: '🌊',
        description: 'Water habitat for fish, amphibians, and marine life.',
        baseCost: 1000,
        baseUpkeep: 15
    },
    terrarium: {
        id: 'terrarium',
        name: 'Terrarium',
        icon: '🦎',
        description: 'Glass enclosure for reptiles, insects, and small creatures.',
        baseCost: 800,
        baseUpkeep: 10
    }
};

// 🔥 NEW: Exhibit Sizes (The physical dimensions)
export const EXHIBIT_SIZES = {
    small: {
        id: 'small',
        name: 'Small',
        costMultiplier: 1,
        upkeepMultiplier: 1,
        buildDays: 2,
        maxAnimals: 4
    },
    medium: {
        id: 'medium',
        name: 'Medium',
        costMultiplier: 3,
        upkeepMultiplier: 3,
        buildDays: 4,
        maxAnimals: 6
    },
    large: {
        id: 'large',
        name: 'Large',
        costMultiplier: 8,
        upkeepMultiplier: 8,
        buildDays: 7,
        maxAnimals: 10
    }
};

export function getDietFoodType(diet) {
    if (diet === "Herbivore") return "hay";
    if (diet === "Carnivore") return "meat";
    if (diet === "Omnivore") return "produce";
    return "hay";
}

export function getLifeStage(ageDays) {
    if (ageDays < 30) return { stage: 'baby', emoji: '', label: 'Baby', canBreed: false };
    if (ageDays < 90) return { stage: 'juvenile', emoji: '', label: 'Juvenile', canBreed: false };
    if (ageDays < 365) return { stage: 'adult', emoji: '🦁', label: 'Adult', canBreed: true };
    return { stage: 'senior', emoji: '👴', label: 'Senior', canBreed: true };
}

export function shouldDieOfOldAge(ageDays) {
    if (ageDays < 600) return false;
    return Math.random() < ((ageDays - 600) / 400) * 0.01;
}
