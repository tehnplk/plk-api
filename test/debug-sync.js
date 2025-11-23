// Debug script to test sync components
const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  try {
    const prisma = new PrismaClient();
    
    // Test basic connection
    const count = await prisma.kpis.count();
    console.log('✅ Database connection successful');
    console.log(`📊 Current KPI count: ${count}`);
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

async function testGoogleSheetsAPI() {
  console.log('Testing Google Sheets API...');
  try {
    const ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbzKcomVEGs3E_JMkZpkJjwjzVjrbzNxyJD1byzhsAsRB8bGEM1qxUqVSZtHK0MOnVRfmg/exec';
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
    
    const apiData = await response.json();
    const kpiData = Array.isArray(apiData) ? apiData : apiData.data ?? [];
    
    console.log('✅ Google Sheets API successful');
    console.log(`📊 API returned ${kpiData.length} records`);
    
    return kpiData;
  } catch (error) {
    console.error('❌ Google Sheets API failed:', error);
    return null;
  }
}

async function main() {
  console.log('🔍 Starting sync debug...\n');
  
  const dbOk = await testDatabaseConnection();
  if (!dbOk) {
    console.log('❌ Database test failed - stopping debug');
    return;
  }
  
  const apiData = await testGoogleSheetsAPI();
  if (!apiData) {
    console.log('❌ API test failed - stopping debug');
    return;
  }
  
  console.log('\n✅ All tests passed! Sync should work.');
}

main().catch(console.error);
