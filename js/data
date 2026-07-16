// js/engine/data.js
// This will be populated when we load the JSON files
export const data = {
    animals: [],
    upgrades: {},
    facilities: {},
    staff: [],
    amenities: {},
    achievements: [],
    researchProjects: {},
    exhibitTypes: {}
};

// Function to load all JSON data
export async function loadAllData() {
    try {
        const [animalsRes, staffRes, amenitiesRes, exhibitTypesRes] = await Promise.all([
            fetch('./data/animals.json'),
            fetch('./data/staff.json'),
            fetch('./data/amenities.json'),
            fetch('./data/exhibit_types.json')
        ]);
        
        data.animals = await animalsRes.json();
        data.staff = await staffRes.json();
        data.amenities = await amenitiesRes.json();
        data.exhibitTypes = await exhibitTypesRes.json();
        
        console.log('✅ All game data loaded');
    } catch (error) {
        console.error('❌ Failed to load game data:', error);
    }
}
