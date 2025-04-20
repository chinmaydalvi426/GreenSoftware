// This file can be run manually after deployment to seed the database
// Run with: node seed-db.js

require('dotenv').config();
const seedDatabase = require('./init/index.js');

console.log('Starting database seeding process...');
// The seedDatabase function is already called in init/index.js