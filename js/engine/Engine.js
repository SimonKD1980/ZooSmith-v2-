// js/engine/data.js

export const data = {
    animals: [],
    upgrades: [],
    exhibitTypes: {} // This will hold your nested JSON
};

export async function loadAllData() {
    try {
        // Fetch all JSON files in parallel
        const [animalsRes, upgradesRes, exhibitTypesRes] = await Promise.all([
            fetch('data/animals.json'),
            fetch('data/upgrades.json'),
            fetch('data/exhibitTypes.json')
        ]);

        // Parse and assign to the data object
        data.animals = await animalsRes.json();
        data.upgrades = await upgradesRes.json();
        data.exhibitTypes = await exhibitTypesRes.json();

        console.log('✅ Game data loaded successfully:', data);
    } catch (error) {
        console.error('❌ Failed to load game data:', error);
    }
}
