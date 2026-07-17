// js/engine/data.js
export const data = {
    animals: [],
    amenities: {},
    staff: [],
    exhibitTypes: {}
};

console.log('🔧 data.js file loaded!');

export async function loadAllData() {
    console.log('📦 Starting data load...');
    
    try {
        // Test fetch
        console.log('📦 Testing fetch...');
        const testRes = await fetch('./data/animals.json');
        console.log('📦 Fetch response status:', testRes.status);
        
        if (!testRes.ok) {
            console.error('❌ Failed to fetch animals.json');
            return;
        }
        
        const animalsArr = await testRes.json();
        console.log('📦 Parsed animals:', animalsArr);
        
        data.animals = animalsArr;
        console.log(`✅ Loaded ${data.animals.length} animals`);
        
        // Load amenities
        const amenitiesRes = await fetch('./data/amenities.json');
        if (amenitiesRes.ok) {
            const amenitiesArr = await amenitiesRes.json();
            data.amenities = {};
            amenitiesArr.forEach(item => data.amenities[item.id] = item);
            console.log(`✅ Loaded ${Object.keys(data.amenities).length} amenities`);
        }
        
        // Load staff
        const staffRes = await fetch('./data/staff.json');
        if (staffRes.ok) {
            data.staff = await staffRes.json();
            console.log(`✅ Loaded ${data.staff.length} staff types`);
        }
        
        console.log('✅ All data loaded!');
    } catch (error) {
        console.error('❌ Error:', error);
    }
}
