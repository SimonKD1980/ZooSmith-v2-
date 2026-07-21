// js/engine/data.js
export const data = {
    animals: [],
    amenities: {},
    staff: [],
    exhibitTypes: {},
    research: [],
    upgrades: [],
    marketingData: { weeklyTiers: [], campaigns: [] }
};

console.log('🔧 data.js file loaded!');

export async function loadAllData() {
    console.log('📦 loadAllData() function called!');
    
    try {
        // Load animals
        console.log('📦 Step 1: Fetching animals.json...');
        const animalsRes = await fetch('./data/animals.json');
        console.log('📦 Step 2: animals.json status:', animalsRes.status);
        
        if (!animalsRes.ok) {
            throw new Error(`animals.json returned ${animalsRes.status}`);
        }
        
        const animalsArr = await animalsRes.json();
        data.animals = Array.isArray(animalsArr) ? animalsArr : [];
        console.log(`✅ Loaded ${data.animals.length} animals`);
        
        // Load amenities (Handles both Array and Object formats)
        console.log('📦 Fetching amenities.json...');
        const amenitiesRes = await fetch('./data/amenities.json');
        if (amenitiesRes.ok) {
            const amenitiesData = await amenitiesRes.json();
            data.amenities = {};
            
            if (Array.isArray(amenitiesData)) {
                amenitiesData.forEach(item => {
                    if (item.id) data.amenities[item.id] = item;
                });
            } else {
                data.amenities = amenitiesData; // Already an object
            }
            console.log(`✅ Loaded ${Object.keys(data.amenities).length} amenities`);
        } else {
            console.warn('⚠️ amenities.json failed to load:', amenitiesRes.status);
        }
        
        // Load staff (Handles both Array and Object formats)
        console.log('📦 Fetching staff.json...');
        const staffRes = await fetch('./data/staff.json');
        if (staffRes.ok) {
            const staffData = await staffRes.json();
            if (Array.isArray(staffData)) {
                data.staff = staffData;
            } else {
                data.staff = Object.values(staffData);
            }
            console.log(`✅ Loaded ${data.staff.length} staff types`);
        } else {
            console.warn('⚠️ staff.json failed to load:', staffRes.status);
        }

        console.log(' Fetching marketing.json...');
const marketingRes = await fetch('./data/marketing.json');
if (marketingRes.ok) {
    data.marketingData = await marketingRes.json();
    console.log(`✅ Loaded ${data.marketingData.weeklyTiers.length} marketing tiers and ${data.marketingData.campaigns.length} campaigns`);
} else {
    console.warn('⚠️ marketing.json failed to load');
}
        // Add this to the loadAllData() function, after loading staff
console.log('📦 Fetching research.json...');
const researchRes = await fetch('./data/research.json');
if (researchRes.ok) {
    const researchArr = await researchRes.json();
    data.research = Array.isArray(researchArr) ? researchArr : [];
    console.log(`✅ Loaded ${data.research.length} research items`);
} else {
    console.warn('⚠️ research.json failed to load:', researchRes.status);
}
// Load upgrades
console.log('📦 Fetching upgrades.json...');
const upgradesRes = await fetch('./data/upgrades.json');
if (upgradesRes.ok) {
    const upgradesArr = await upgradesRes.json();
    data.upgrades = Array.isArray(upgradesArr) ? upgradesArr : [];
    console.log(`✅ Loaded ${data.upgrades.length} upgrades`);
} else {
    console.warn('⚠️ upgrades.json failed to load:', upgradesRes.status);
    data.upgrades = [];
}
        
        console.log('✅ All data loaded successfully!');
    } catch (error) {
        console.error('❌ ERROR in loadAllData():', error);
        console.error('❌ Error message:', error.message);
    }
}
