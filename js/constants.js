const EXHIBIT_SIZES = {
  small:  { cost: 1000,  buildDays: 3,  label: "Small",  emoji: "🟢" },
  medium: { cost: 2500,  buildDays: 6,  label: "Medium", emoji: "🟡" },
  large:  { cost: 5000,  buildDays: 10, label: "Large",  emoji: "🔴" }
};

const SIZE_RANK = { small: 1, medium: 2, large: 3 };

const FOOD_TYPES = {
  hay:     { name: "Hay",     icon: "🌾", costPerUnit: 2, diet: "Herbivore", storageCap: 200, color: "#fbbf24" },
  meat:    { name: "Meat",    icon: "🥩", costPerUnit: 5, diet: "Carnivore", storageCap: 100, color: "#ef4444" },
  produce: { name: "Produce", icon: "🥬", costPerUnit: 3, diet: "Omnivore",  storageCap: 150, color: "#22c55e" }
};

const TIER_INFO = {
  basic:     { label: "Basic",     color: "#22c55e", emoji: "🟢" },
  advanced:  { label: "Advanced",  color: "#3b82f6", emoji: "🔵" },
  exotic:    { label: "Exotic",    color: "#a855f7", emoji: "🟣" },
  legendary: { label: "Legendary", color: "#fbbf24", emoji: "🌟" }
};

const ZOO_RATING_TIERS = {
  1: { min: 0,  max: 19,  label: "Struggling",  emoji: "⭐",       color: "#dc2626" },
  2: { min: 20, max: 39,  label: "Developing",  emoji: "⭐⭐",     color: "#f59e0b" },
  3: { min: 40, max: 59,  label: "Good",        emoji: "⭐⭐⭐",   color: "#3b82f6" },
  4: { min: 60, max: 79,  label: "Excellent",   emoji: "⭐⭐⭐⭐", color: "#a855f7" },
  5: { min: 80, max: 100, label: "World-Class", emoji: "⭐⭐⭐⭐⭐", color: "#fbbf24" }
};