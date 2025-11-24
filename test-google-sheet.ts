import fetch from 'node-fetch';

async function testGoogleSheetAPI() {
  try {
    console.log('Testing Google Sheet API call...');
    
    const response = await fetch('http://localhost:3000/api/kpi/sheet', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('Success! Data received:');
    console.log('Data type:', typeof data);
    console.log('Data length:', Array.isArray(data) ? data.length : 'Not an array');
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('Sample item:', JSON.stringify(data[0], null, 2));
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testGoogleSheetAPI();
