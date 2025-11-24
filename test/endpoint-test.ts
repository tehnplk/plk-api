// Test file to call the Google Apps Script endpoint
import { writeFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const ENDPOINT_URL = process.env.ENDPOINT_URL || 'https://script.google.com/macros/s/AKfycbzKcomVEGs3E_JMkZpkJjwjzVjrbzNxyJD1byzhsAsRB8bGEM1qxUqVSZtHK0MOnVRfmg/exec';

async function testGoogleAppsScriptEndpoint() {
  try {
    console.log('Testing Google Apps Script endpoint...');
    console.log('URL:', ENDPOINT_URL);
    
    const upstreamUrl = `${ENDPOINT_URL}?sheet=kpi`;
    const response = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Success! Response:', data);
    
    // Write result to JSON file
    const outputPath = join(__dirname, '..', 'test', 'kpi-result.json');
    writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
    console.log('Result saved to:', outputPath);
    
    return data;
    
  } catch (error) {
    console.error('Error calling endpoint:', error);
    throw error;
  }
}

// Test with POST request
async function testGoogleAppsScriptEndpointPost() {
  try {
    console.log('Testing Google Apps Script endpoint with POST...');
    
    const testData = {
      message: 'Hello from TypeScript test',
      timestamp: new Date().toISOString(),
    };
    
    const response = await fetch(ENDPOINT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Success! POST Response:', data);
    return data;
    
  } catch (error) {
    console.error('Error calling endpoint with POST:', error);
    throw error;
  }
}

// Run tests
async function runTests() {
  console.log('=== Starting Google Apps Script Endpoint Tests ===\n');
  
  try {
    // Test GET request
    await testGoogleAppsScriptEndpoint();
    console.log('\n');
    
    // Test POST request
    await testGoogleAppsScriptEndpointPost();
    
    console.log('\n=== All tests completed successfully ===');
    
  } catch (error) {
    console.error('\n=== Tests failed ===');
    process.exit(1);
  }
}

// Execute tests if this file is run directly
if (require.main === module) {
  runTests();
}

export { testGoogleAppsScriptEndpoint, testGoogleAppsScriptEndpointPost, runTests };