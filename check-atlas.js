// Script to check Atlas database connection and listings
require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('./models/listings.js');

async function checkAtlasConnection() {
    try {
        console.log("Attempting to connect to MongoDB Atlas...");
        console.log(`Connection string: ${process.env.ATLASDB_URL.replace(/:[^:]*@/, ':****@')}`);
        
        await mongoose.connect(process.env.ATLASDB_URL);
        console.log("✅ Successfully connected to MongoDB Atlas");
        
        // Check database and collection names
        const dbName = mongoose.connection.db.databaseName;
        console.log(`Connected to database: ${dbName}`);
        
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("Available collections:");
        collections.forEach(collection => {
            console.log(`- ${collection.name}`);
        });
        
        // Count listings
        const count = await Listing.countDocuments();
        console.log(`\nTotal listings in database: ${count}`);
        
        if (count > 0) {
            // Get a sample of listings
            const sample = await Listing.find().limit(3);
            console.log("\nSample listings:");
            sample.forEach((listing, index) => {
                console.log(`\n--- Listing ${index + 1} ---`);
                console.log(`Title: ${listing.title}`);
                console.log(`Location: ${listing.location}, ${listing.country}`);
                console.log(`Price: ${listing.price}`);
                console.log(`Owner ID: ${listing.owner}`);
                console.log(`ID: ${listing._id}`);
            });
            
            // Check listing schema
            console.log("\nListing schema fields:");
            const sampleKeys = Object.keys(sample[0]._doc);
            sampleKeys.forEach(key => {
                console.log(`- ${key}: ${typeof sample[0][key]}`);
            });
        } else {
            console.log("⚠️ No listings found in the database!");
        }
    } catch (err) {
        console.error("❌ Error connecting to MongoDB Atlas:", err);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log("🔌 MongoDB connection closed");
        }
    }
}

checkAtlasConnection();