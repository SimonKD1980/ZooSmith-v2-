// js/engine/data.js
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

// Load all JSON data files
export async function loadAllData() {
    try {
        const [animalsRes, upgradesRes, staffRes, amenitiesRes, achievementsRes, exhibitTypesRes, researchRes] = await Promise.all([
            fetch('./data/animals.json?nocache=' + Date.now()),
            fetch('./data/upgrades.json?nocache=' + Date.now()),
            fetch('./data/staff.json?nocache=' + Date.now()),
            fetch('./data/amenities.json?nocache=' + Date.now()),
            fetch('./data/achievements.json?nocache=' + Date.now()),
            fetch('./data/exhibit_types.json?nocache=' + Date.now()),
            fetch('./data/research.json?nocache=' + Date.now())
        ]);
        
        data.animals = await animalsRes.json();
        
        const upgradesArr = await upgradesRes.json();
        data.upgrades = {};
        upgradesArr.forEach(item => data.upgrades[item.id] = item);
        
        data.staff = await staffRes.json();
        
        const amenitiesArr = await amenitiesRes.json();
        data.amenities = {};
        amenitiesArr.forEach(item => data.amenities[item.id] = item);
        
        data.achievements = await achievementsRes.json();
        
        const exhibitTypesArr = await exhibitTypesRes.json();
        data.exhibitTypes = {};
        exhibitTypesArr.forEach(item => data.exhibitTypes[item.id] = item);
        
        const researchArr = await researchRes.json();
        data.researchProjects = {};
        researchArr.forEach(item => data.researchProjects[item.id] = item);
        
        console.log('✅ All game data loaded');
    } catch (error) {
        console.error('❌ Failed to load game data:', error);
    }
}
