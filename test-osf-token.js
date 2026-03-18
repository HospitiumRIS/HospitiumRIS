require('dotenv').config();

const OSF_API_BASE = 'https://api.osf.io/v2';

async function testOSFToken() {
    const token = process.env.OSF_TOKEN;
    
    console.log('Testing OSF token...');
    console.log('Token exists:', !!token);
    console.log('Token length:', token?.length);
    
    if (!token) {
        console.error('❌ OSF_TOKEN not found in .env');
        return;
    }

    try {
        // Test with a simple GET request to user profile
        const response = await fetch(`${OSF_API_BASE}/users/me/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        console.log('Response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Token is valid!');
            console.log('User:', data.data.attributes.full_name);
        } else {
            const error = await response.json();
            console.error('❌ Token validation failed:', error);
        }
    } catch (error) {
        console.error('❌ Error testing token:', error.message);
    }
}

testOSFToken();
