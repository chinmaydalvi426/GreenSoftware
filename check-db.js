// Script to check database contents
require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('./models/listings.js');

async function checkDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.ATLASDB_URL);
        console.log("✅ Connected to MongoDB Atlas");

        // Count listings
        const count = await Listing.countDocuments();
        console.log(`Total listings in database: ${count}`);

        // Get a sample of listings
        if (count > 0) {
            const sample = await Listing.find().limit(3);
            console.log("Sample listings:");
            sample.forEach((listing, index) => {
                console.log(`\n--- Listing ${index + 1} ---`);
                console.log(`Title: ${listing.title}`);
                console.log(`Location: ${listing.location}, ${listing.country}`);
                console.log(`Price: ${listing.price}`);
                console.log(`Owner ID: ${listing.owner}`);
            });
        } else {
            console.log("No listings found in the database!");
        }

    } catch (err) {
        console.error("❌ Error checking database:", err);
    } finally {
        await mongoose.connection.close();
        console.log("🔌 MongoDB connection closed");
    }
}

checkDatabase();