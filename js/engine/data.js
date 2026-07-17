// js/engine/data.js
export const data = {
    animals: [],
    amenities: {},
    staff: [],
    exhibitTypes: {}
};

export async function loadAllData() {
    console.log('📦 Loading all data...');
    
    try {
        // Load animals
        console.log('📦 Loading animals.json...');
        const animalsRes = await fetch('./data/animals.json');
        if (!animalsRes.ok) throw new Error(`Failed to load animals.json: ${animalsRes.status}`);
        const animalsArr = await animalsRes.json();
        data.animals = animalsArr;
        console.log(`✅ Loaded ${data.animals.length} animals`);
        
        // Load amenities
        console.log('📦 Loading amenities.json...');
        const amenitiesRes = await fetch('./data/amenities.json');
        if (!amenitiesRes.ok) throw new Error(`Failed to load amenities.json: ${amenitiesRes.status}`);
        const amenitiesArr = await amenitiesRes.json();
        data.amenities = {};
        amenitiesArr.forEach(item => data.amenities[item.id] = item);
        console.log(`✅ Loaded ${Object.keys(data.amenities).length} amenities`);
        
        // Load staff
        console.log('📦 Loading staff.json...');
        const staffRes = await fetch('./data/staff.json');
        if (!staffRes.ok) throw new Error(`Failed to load staff.json: ${staffRes.status}`);
        data.staff = await staffRes.json();
        console.log(`✅ Loaded ${data.staff.length} staff types`);
        
        console.log('✅ All data loaded successfully!');
    } catch (error) {
        console.error('❌ Error loading data:', error);
        alert(`Failed to load game data: ${error.message}\n\nCheck the console for details.`);
    }
}
