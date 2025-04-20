const mongoose = require("mongoose");
const Listing = require("../models/listings.js");
const initData = require("./data.js");

// Use environment variable for MongoDB connection
const dbURI = process.env.ATLASDB_URL || 'mongodb://localhost:27017/wonderlust';

async function seedDatabase() {
    try {
        await mongoose.connect(dbURI);
        console.log("✅ Connected to MongoDB Atlas");

        // Clear old listings
        await Listing.deleteMany({});
        console.log("🗑️ Old listings removed");

        // Add owner ID to each listing
        const listingsWithOwner = initData.data.map((obj) => ({
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

seedDatabase();
