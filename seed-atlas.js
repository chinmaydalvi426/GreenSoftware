// Script to seed the Atlas database with sample listings
require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('./models/listings.js');
const sampleListings = require('./init/data.js');

async function seedAtlasDatabase() {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.ATLASDB_URL);
        console.log("✅ Connected to MongoDB Atlas");
        
        // Check if listings already exist
        const existingCount = await Listing.countDocuments();
        console.log(`Current listings in database: ${existingCount}`);
        
        if (existingCount > 0) {
            const proceed = await promptUser("Database already has listings. Do you want to proceed and add more? (y/n): ");
            if (proceed.toLowerCase() !== 'y') {
                console.log("Operation cancelled by user.");
                return;
            }
        }
        
        // Add owner ID to each listing
        const listingsWithOwner = sampleListings.map((obj) => ({
            ...obj,
            owner: "67932213d22f28e4a9190c64" // You may want to change this to a valid user ID in your database
        }));
        
        // Insert listings
        const result = await Listing.insertMany(listingsWithOwner);
        console.log(`🌱 Successfully added ${result.length} listings to the database!`);
        
        // Verify the new count
        const newCount = await Listing.countDocuments();
        console.log(`Total listings in database now: ${newCount}`);
        
    } catch (err) {
        console.error("❌ Error seeding Atlas database:", err);
    } finally {
        await mongoose.connection.close();
        console.log("🔌 MongoDB connection closed");
    }
}

// Simple function to prompt user for input
function promptUser(question) {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    return new Promise(resolve => {
        readline.question(question, answer => {
            readline.close();
            resolve(answer);
        });
    });
}

// Run the function
seedAtlasDatabase();