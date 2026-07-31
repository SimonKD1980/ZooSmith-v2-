// js/engine/data.js

export const data = {
    animals: [],
    upgrades: [],
    exhibitTypes: {} // 🔥 This will hold your nested JSON data
};

export async function loadAllData() {
    console.log("🔄 Loading game data...");
    
    try {
        // Fetch all JSON files at the same time
        const [animalsRes, upgradesRes, exhibitTypesRes] = await Promise.all([
            fetch('data/animals.json'),
            fetch('data/upgrades.json'),
            fetch('data/exhibitTypes.json') // 🔥 THIS IS THE CRITICAL LINE
        ]);

        // Parse the JSON and save it to our data object
        data.animals = await animalsRes.json();
        data.upgrades = await upgradesRes.json();
        data.exhibitTypes = await exhibitTypesRes.json();

        console.log("✅ Game data loaded successfully!");
        console.log("Exhibit Types loaded:", data.exhibitTypes); // You will see this in the console
        
    } catch (error) {
        console.error("❌ FAILED to load game data:", error);
        console.error("Check that data/exhibitTypes.json exists and has no syntax errors (like missing commas).");
    }
}
