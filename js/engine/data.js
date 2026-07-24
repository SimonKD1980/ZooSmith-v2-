// js/engine/data.js
export const data = {
    animals: [],
    houses: [],             // 🆕 NEW
    indoor_exhibits: [],    // 🆕 NEW
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
        // 🆕 GITHUB PAGES PATH FIX: Detect environment and set correct base path
        const isGitHubPages = window.location.hostname.includes('github.io');
        const basePath = isGitHubPages ? '/ZooSmith-v2-/' : './';
        
        // Load animals
        console.log('📦 Step 1: Fetching animals.json...');
        const animalsRes = await fetch(`${basePath}data/animals.json`);
        if (!animalsRes.ok) throw new Error(`animals.json returned ${animalsRes.status}`);
        
        const animalsArr = await animalsRes.json();
        data.animals = Array.isArray(animalsArr) ? animalsArr : [];
        console.log(`✅ Loaded ${data.animals.length} animals`);
        
        // Load houses 🆕
        console.log('📦 Fetching houses.json...');
        const housesRes = await fetch(`${basePath}data/houses.json`);
        if (housesRes.ok) {
            const housesArr = await housesRes.json();
            data.houses = Array.isArray(housesArr) ? housesArr : [];
            console.log(`✅ Loaded ${data.houses.length} houses`);
        } else {
            console.warn('⚠️ houses.json failed to load:', housesRes.status);
        }

        // Load indoor exhibits 🆕
        console.log('📦 Fetching indoor_exhibits.json...');
        const indoorRes = await fetch(`${basePath}data/indoor_exhibits.json`);
        if (indoorRes.ok) {
            const indoorArr = await indoorRes.json();
            data.indoor_exhibits = Array.isArray(indoorArr) ? indoorArr : [];
            console.log(`✅ Loaded ${data.indoor_exhibits.length} indoor exhibits`);
        } else {
            console.warn('⚠️ indoor_exhibits.json failed to load:', indoorRes.status);
        }
        
        // Load amenities
        console.log('📦 Fetching amenities.json...');
        const amenitiesRes = await fetch(`${basePath}data/amenities.json`);
        if (amenitiesRes.ok) {
            const amenitiesData = await amenitiesRes.json();
            data.amenities = {};
            if (Array.isArray(amenitiesData)) {
                amenitiesData.forEach(item => { if (item.id) data.amenities[item.id] = item; });
            } else {
                data.amenities = amenitiesData;
            }
            console.log(`✅ Loaded ${Object.keys(data.amenities).length} amenities`);
        } else {
            console.warn('⚠️ amenities.json failed to load:', amenitiesRes.status);
        }
        
        // Load staff
        console.log('📦 Fetching staff.json...');
        const staffRes = await fetch(`${basePath}data/staff.json`);
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

        // Load marketing
        console.log('📦 Fetching marketing.json...');
        const marketingRes = await fetch(`${basePath}data/marketing.json`);
        if (marketingRes.ok) {
            data.marketingData = await marketingRes.json();
            console.log(`✅ Loaded ${data.marketingData.weeklyTiers?.length || 0} marketing tiers and ${data.marketingData.campaigns?.length || 0} campaigns`);
        } else {
            console.warn('⚠️ marketing.json failed to load');
        }

        // Load research
        console.log('📦 Fetching research.json...');
        const researchRes = await fetch(`${basePath}data/research.json`);
        if (researchRes.ok) {
            const researchArr = await researchRes.json();
            data.research = Array.isArray(researchArr) ? researchArr : [];
            console.log(`✅ Loaded ${data.research.length} research items`);
        } else {
            console.warn('⚠️ research.json failed to load:', researchRes.status);
        }

        // Load upgrades
        console.log('📦 Fetching upgrades.json...');
        const upgradesRes = await fetch(`${basePath}data/upgrades.json`);
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
