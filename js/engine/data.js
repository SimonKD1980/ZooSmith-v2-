// js/engine/data.js
export const data = {
    animals: [],
    amenities: {},
    staff: [],
    exhibitTypes: {},
    research: [],
    upgrades: [],
    marketingData: { weeklyTiers: [], campaigns: [] },
    houses: [],
    indoor_exhibits: []
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

        // Load amenities
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
                data.amenities = amenitiesData;
            }
            console.log(`✅ Loaded ${Object.keys(data.amenities).length} amenities`);
        } else {
            console.warn('⚠️ amenities.json failed to load:', amenitiesRes.status);
        }

        // Load staff
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

        // Load marketing
        console.log('📦 Fetching marketing.json...');
        const marketingRes = await fetch('./data/marketing.json');
        if (marketingRes.ok) {
            data.marketingData = await marketingRes.json();
            console.log(`✅ Loaded ${data.marketingData.weeklyTiers.length} marketing tiers and ${data.marketingData.campaigns.length} campaigns`);
        } else {
            console.warn('⚠️ marketing.json failed to load');
        }

        // Load research
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

        // Load houses (NEW)
        console.log('📦 Fetching houses.json...');
        const housesRes = await fetch('./data/houses.json');
        if (housesRes.ok) {
            const housesArr = await housesRes.json();
            data.houses = Array.isArray(housesArr) ? housesArr : [];
            console.log(`✅ Loaded ${data.houses.length} house types`);
        } else {
            console.warn('⚠️ houses.json failed to load:', housesRes.status);
            data.houses = [];
        }

        // Load indoor exhibits (NEW)
        console.log('📦 Fetching indoor_exhibits.json...');
        const indoorRes = await fetch('./data/indoor_exhibits.json');
        if (indoorRes.ok) {
            const indoorArr = await indoorRes.json();
            data.indoor_exhibits = Array.isArray(indoorArr) ? indoorArr : [];
            console.log(`✅ Loaded ${data.indoor_exhibits.length} indoor exhibit types`);
        } else {
            console.warn('⚠️ indoor_exhibits.json failed to load:', indoorRes.status);
            data.indoor_exhibits = [];
        }

        console.log('✅ All data loaded successfully!');
    } catch (error) {
        console.error('❌ ERROR in loadAllData():', error);
        console.error('❌ Error message:', error.message);
    }
}
