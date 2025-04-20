// Script to make a user an admin
// Usage: node utils/makeAdmin.js <username>

if (process.env.NODE_ENV != "production") {
    require('dotenv').config();
}

const mongoose = require('mongoose');
const User = require('../models/user');

const username = process.argv[2];

if (!username) {
    console.error('Please provide a username');
    console.log('Usage: node utils/makeAdmin.js <username>');
    process.exit(1);
}

const atlas_url = process.env.ATLASDB_URL;

async function main() {
    try {
        await mongoose.connect(atlas_url);
        console.log('Connected to database');

        const user = await User.findOne({ username });
        
        if (!user) {
            console.error(`User ${username} not found`);
            process.exit(1);
        }

        user.isAdmin = true;
        await user.save();
        
        console.log(`User ${username} is now an admin`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();