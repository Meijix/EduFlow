
const API_URL = 'http://localhost:3001/api';

async function testApi() {
    try {
        console.log('--- Testing API ---');

        // 1. Create Area
        console.log('1. Creating Area...');
        const areaId = `test-area-${Date.now()}`;
        const areaRes = await fetch(`${API_URL}/areas`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: areaId,
                name: 'Test Area',
                description: 'Created by test script',
                icon: 'test-icon',
                createdAt: new Date().toISOString()
            })
        });
        if (!areaRes.ok) throw new Error(await areaRes.text());
        console.log('✅ Area created');

        // 2. Fetch Areas
        console.log('2. Fetching Areas...');
        const areasRes = await fetch(`${API_URL}/areas`);
        const areas = await areasRes.json();
        const createdArea = areas.find(a => a.id === areaId);
        if (!createdArea) throw new Error('Area not found in list');
        console.log('✅ Area fetched');

        // 3. Test Deep Upsert (Area + Topics)
        console.log('3. Testing Deep Upsert (Topics)...');
        const topicId = `test-topic-${Date.now()}`;
        const updatedArea = {
            ...createdArea,
            topics: [
                {
                    id: topicId,
                    title: 'Nested Topic',
                    description: 'Should be saved via Area save',
                    status: 'PENDING',
                    resources: []
                }
            ]
        };

        const updateRes = await fetch(`${API_URL}/areas`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedArea)
        });
        if (!updateRes.ok) throw new Error('Failed to update area with topics');

        // Verify Topic was saved
        const areasRes2 = await fetch(`${API_URL}/areas`);
        const areas2 = await areasRes2.json();
        const areaVerified = areas2.find(a => a.id === areaId);

        if (!areaVerified.topics || areaVerified.topics.length === 0) {
            throw new Error('Topics were not saved!');
        }
        if (areaVerified.topics[0].id !== topicId) {
            throw new Error('Topic ID mismatch');
        }
        console.log('✅ Topic persistence verified');

        console.log('--- Test Finished ---');
    } catch (err) {
        console.error('❌ Test Failed:', err);
        process.exit(1);
    }
}

testApi();
