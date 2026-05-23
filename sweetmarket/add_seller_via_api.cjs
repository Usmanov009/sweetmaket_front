const fetch = require('node-fetch');

async function addSellerViaAPI() {
  try {
    const userId = 'mpf787y1qkke';
    const BASE_URL = 'http://localhost:3001';
    
    // First, get user info (we need to create an endpoint for this or use existing auth)
    // Since there's no public endpoint to get user by ID, we'll need to use the database directly
    // But since direct DB access failed, let's try a different approach
    
    // Let's use the seller registration endpoint with the user's info
    // We'll need to make some assumptions about the user's data
    
    console.log('Adding seller via API...');
    
    // Since we don't have the user's phone/password, we need to get this info first
    // Let me try to use the admin endpoint to get user info
    
    const response = await fetch(`${BASE_URL}/api/admin/users/${userId}`);
    
    if (!response.ok) {
      console.log('Cannot get user info via API. User might not exist or endpoint not available.');
      console.log('Please provide the user\'s phone number and password to register as seller.');
      return;
    }
    
    const userData = await response.json();
    console.log('User found:', userData);
    
    // Now register as seller
    const sellerResponse = await fetch(`${BASE_URL}/api/seller/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: userData.name || 'User',
        shopName: 'Sweetmakers Shop',
        phone: userData.phone,
        password: 'sweetmakers123', // Default password
        address: 'Toshkent',
        region: 'Toshkent',
        city: 'Toshkent'
      })
    });
    
    if (sellerResponse.ok) {
      const sellerData = await sellerResponse.json();
      console.log('Seller added successfully:', sellerData);
    } else {
      const error = await sellerResponse.json();
      console.log('Error adding seller:', error);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

addSellerViaAPI();
