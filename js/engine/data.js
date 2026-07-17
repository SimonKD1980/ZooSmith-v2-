// js/engine/data.js
export const data = {
    animals: [],
    amenities: {},
    staff: [],
    exhibitTypes: {}
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
        console.log('📦 Step 3: Parsed animals, length:', animalsArr.length);
        
        data.animals = animalsArr;
        console.log(`✅ Loaded ${data.animals.length} animals`);
        
        // Load amenities
        console.log('📦 Fetching amenities.json...');
        const amenitiesRes = await fetch('./data/amenities.json');
        if (amenitiesRes.ok) {
            const amenitiesArr = await amenitiesRes.json();
            data.amenities = {};
            amenitiesArr.forEach(item => data.amenities[item.id] = item);
            console.log(`✅ Loaded ${Object.keys(data.amenities).length} amenities`);
        } else {
            console.warn('⚠️ amenities.json failed to load:', amenitiesRes.status);
        }
        
        // Load staff
        console.log('📦 Fetching staff.json...');
        const staffRes = await fetch('./data/staff.json');
        if (staffRes.ok) {
            data.staff = await staffRes.json();
            console.log(`✅ Loaded ${data.staff.length} staff types`);
        } else {
            console.warn('⚠️ staff.json failed to load:', staffRes.status);
        }
        
        console.log('✅ All data loaded successfully!');
    } catch (error) {
        console.error('❌ ERROR in loadAllData():', error);
        console.error('❌ Error message:', error.message);
    }
}
