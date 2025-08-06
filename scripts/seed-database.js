#!/usr/bin/env node

/**
 * Database Seeding Script
 * 
 * This script wipes the database and seeds it with test data
 * for frontend development. It uses the existing dev endpoints.
 * 
 * Usage:
 *   node scripts/seed-database.js
 *   node scripts/seed-database.js --users 10 --groups 5
 *   node scripts/seed-database.js --reset-only
 */

const https = require('https');
const http = require('http');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'https://api-yqyq3bmp3a-uc.a.run.app';
const SEED_OPTIONS = {
  userCount: parseInt(process.argv.find(arg => arg.startsWith('--users='))?.split('=')[1]) || 8,
  groupCount: parseInt(process.argv.find(arg => arg.startsWith('--groups='))?.split('=')[1]) || 4,
  maxUsersPerGroup: parseInt(process.argv.find(arg => arg.startsWith('--max-users='))?.split('=')[1]) || 6
};

const RESET_ONLY = process.argv.includes('--reset-only');

// Helper function to make HTTP requests
function makeRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    const url = new URL(fullUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.error || responseData}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Main seeding function
async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');
  
  try {
    // Check if dev utilities are available
    console.log('📋 Checking dev utilities status...');
    const status = await makeRequest('GET', '/dev/status');
    console.log(`✅ Dev utilities available: ${status.available}`);
    console.log(`🌍 Environment: ${status.environment}\n`);

    if (!status.available) {
      console.error('❌ Dev utilities are not available. Make sure you are in development mode.');
      process.exit(1);
    }

    // Get current database stats
    console.log('📊 Getting current database stats...');
    const stats = await makeRequest('GET', '/dev/stats');
    console.log(`📈 Current stats:`, stats.stats);
    console.log('');

    if (!RESET_ONLY) {
      // Wipe the database
      console.log('🧹 Wiping database...');
      await makeRequest('DELETE', '/dev/wipe', {
        collections: ['users', 'groups']
      });
      console.log('✅ Database wiped successfully\n');

      // Seed with test data
      console.log(`🌱 Seeding database with ${SEED_OPTIONS.userCount} users and ${SEED_OPTIONS.groupCount} groups...`);
      const seedResult = await makeRequest('POST', '/dev/seed', SEED_OPTIONS);
      console.log('✅ Database seeded successfully');
      console.log(`📊 Created:`, seedResult.testData);
      console.log('');
    } else {
      // Reset database (wipe + seed in one operation)
      console.log(`🔄 Resetting database with ${SEED_OPTIONS.userCount} users and ${SEED_OPTIONS.groupCount} groups...`);
      const resetResult = await makeRequest('POST', '/dev/reset', {
        collections: ['users', 'groups'],
        seedOptions: SEED_OPTIONS
      });
      console.log('✅ Database reset successfully');
      console.log(`📊 Created:`, resetResult.testData);
      console.log('');
    }

    // Get final database stats
    console.log('📊 Getting final database stats...');
    const finalStats = await makeRequest('GET', '/dev/stats');
    console.log(`📈 Final stats:`, finalStats.stats);
    console.log('');

    console.log('🎉 Database seeding complete!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Start your frontend development server');
    console.log('   2. Use the test data to build and test your UI');
    console.log('   3. Run this script again anytime you need fresh data');
    console.log('');
    console.log('🔗 API Base URL:', API_BASE_URL);
    console.log('📖 API Documentation: docs/API.md');

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Check that the API is accessible at:', API_BASE_URL);
    console.log('   2. Verify NODE_ENV=development or ENABLE_DEV_UTILITIES=true');
    console.log('   3. Ensure your dev database is properly configured');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase }; 