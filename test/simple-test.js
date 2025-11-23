const ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbzKcomVEGs3E_JMkZpkJjwjzVjrbzNxyJD1byzhsAsRB8bGEM1qxUqVSZtHK0MOnVRfmg/exec';

async function testEndpoint() {
  try {
    console.log('Testing Google Apps Script endpoint...');
    console.log('URL:', ENDPOINT_URL);
    
    const startTime = Date.now();
    const upstreamUrl = `${ENDPOINT_URL}?sheet=kpi`;
    
    console.log('Making request to:', upstreamUrl);
    
    const response = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const endTime = Date.now();
    console.log(`Request completed in ${endTime - startTime}ms`);
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Success! Response data length:', JSON.stringify(data).length);
    console.log('Data type:', typeof data);
    console.log('Is array?', Array.isArray(data));
    
    if (Array.isArray(data)) {
      console.log('Array length:', data.length);
      if (data.length > 0) {
        console.log('First item keys:', Object.keys(data[0]));
      }
    } else if (data && typeof data === 'object') {
      console.log('Object keys:', Object.keys(data));
      if (data.data) {
        console.log('Data array length:', data.data.length);
      }
    }
    
    return data;
    
  } catch (error) {
    console.error('Error calling endpoint:', error);
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    throw error;
  }
}

testEndpoint()
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
