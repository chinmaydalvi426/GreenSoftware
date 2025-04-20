const mongoose = require("mongoose");
const Listing = require("../models/listings.js");
const sampleListings = require("./data.js");

// Use environment variable for MongoDB connection
const dbURI = process.env.ATLASDB_URL || 'mongodb://localhost:27017/wonderlust';

async function seedDatabase() {
    try {
        await mongoose.connect(dbURI);
        console.log("✅ Connected to MongoDB Atlas");

        // Check if listings already exist
        const existingCount = await Listing.countDocuments();
        
        if (existingCount > 0) {
            console.log(`✅ Database already has ${existingCount} listings. Skipping seeding.`);
            return;
        }
        
        console.log("No listings found. Seeding database...");
        
        // Add owner ID to each listing
        const listingsWithOwner = sampleListings.map((obj) => ({
            ...obj,
            owner: "67932213d22f28e4a9190c64"
        }));

        // Insert listings
        await Listing.insertMany(listingsWithOwner);
        console.log("🌱 Database seeded with listings!");

    } catch (err) {
        console.error("❌ Error during database seeding:", err);
    } finally {
        await mongoose.connection.close();
        console.log("🔌 MongoDB connection closed");
    }
}

// Run the function if this file is executed directly
if (require.main === module) {
    seedDatabase();
}

module.exports = seedDatabase;
