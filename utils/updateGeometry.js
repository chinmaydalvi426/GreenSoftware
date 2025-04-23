// Script to update existing listings with geometry data
require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('../models/listings.js');

// Mapbox geocoding
const mbxgeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const geocodingClient = mbxgeocoding({ accessToken: process.env.map_token });

async function updateListingsGeometry() {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.ATLASDB_URL);
        console.log("✅ Connected to MongoDB Atlas");
        
        // Find all listings without geometry
        const listings = await Listing.find({ 
            $or: [
                { geometry: { $exists: false } },
                { geometry: null },
                { "geometry.coordinates": { $exists: false } },
                { "geometry.coordinates": { $size: 0 } }
            ]
        });
        
        console.log(`Found ${listings.length} listings without geometry data.`);
        
        if (listings.length === 0) {
            console.log("No listings need to be updated.");
            return;
        }
        
        let updatedCount = 0;
        let errorCount = 0;
        
        // Process each listing
        for (const listing of listings) {
            try {
                console.log(`Processing listing: ${listing.title} (${listing.location}, ${listing.country})`);
                
                // Get geocoding data
                const query = `${listing.location}, ${listing.country}`;
                const response = await geocodingClient.forwardGeocode({
                    query,
                    limit: 1
                }).send();
                
                if (response.body.features && response.body.features.length > 0) {
                    const geometry = response.body.features[0].geometry;
                    
                    // Update the listing
                    listing.geometry = geometry;
                    await listing.save();
                    
                    console.log(`✅ Updated geometry for: ${listing.title}`);
                    console.log(`   Coordinates: [${geometry.coordinates[0]}, ${geometry.coordinates[1]}]`);
                    updatedCount++;
                } else {
                    console.log(`❌ No geocoding results found for: ${query}`);
                    errorCount++;
                }
                
                // Add a small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (err) {
                console.error(`❌ Error updating listing ${listing.title}:`, err.message);
                errorCount++;
            }
        }
        
        console.log("\n--- Summary ---");
        console.log(`Total listings processed: ${listings.length}`);
        console.log(`Successfully updated: ${updatedCount}`);
        console.log(`Failed to update: ${errorCount}`);
        
    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await mongoose.connection.close();
        console.log("🔌 MongoDB connection closed");
    }
}

// Run the function
updateListingsGeometry();