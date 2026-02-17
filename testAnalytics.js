const axios = require('axios');

async function testAnalytics() {
    try {
        const res = await axios.post('http://localhost:5000/api/analytics/track', {
            eventType: 'page_view',
            path: '/test'
        });
        console.log('SUCCESS:', res.data);
    } catch (err) {
        console.log('ERROR:', err.response ? { status: err.response.status, data: err.response.data } : err.message);
    }
}

testAnalytics();
