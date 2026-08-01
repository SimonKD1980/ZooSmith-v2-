// js/engine/data.js

export const data = {
    animals: [],
    upgrades: [],
    exhibitTypes: {},
    research: [] // 🔥 ADD THIS
};

export async function loadAllData() {
    console.log("🔄 Loading game data...");
    
    try {
        // 🔥 ADD researchRes TO THE PROMISE.ALL ARRAY
        const [animalsRes, upgradesRes, exhibitTypesRes, researchRes] = await Promise.all([
            fetch('data/animals.json'),
            fetch('data/upgrades.json'),
            fetch('data/exhibitTypes.json'),
            fetch('data/research.json') // 🔥 ADD THIS LINE
        ]);

        data.animals = await animalsRes.json();
        data.upgrades = await upgradesRes.json();
        data.exhibitTypes = await exhibitTypesRes.json();
        data.research = await researchRes.json(); // 🔥 ADD THIS LINE

        console.log("✅ Game data loaded successfully!");
        
    } catch (error) {
        console.error("❌ FAILED to load game data:", error);
    }
}
