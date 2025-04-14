// Script to fix listings without owners
if (process.env.NODE_ENV != "production") {
    require('dotenv').config();
}

const mongoose = require("mongoose");
const Listing = require("../models/listings.js");
const User = require("../models/user.js");

// Connect to MongoDB
const atlas_url = process.env.ATLASDB_URL;

async function main() {
    try {
        await mongoose.connect(atlas_url);
        console.log("Connected to database");

        // Find an admin user to assign as default owner
        const adminUser = await User.findOne({});
        
        if (!adminUser) {
            console.error("No users found in the database. Please create a user first.");
            process.exit(1);
        }

        console.log(`Using ${adminUser.username} (${adminUser._id}) as default owner`);

        // Find all listings without owners
        const listingsWithoutOwner = await Listing.find({ owner: { $exists: false } });
        console.log(`Found ${listingsWithoutOwner.length} listings without owners`);

        // Update listings without owners
        if (listingsWithoutOwner.length > 0) {
            const updateResult = await Listing.updateMany(
                { owner: { $exists: false } },
                { $set: { owner: adminUser._id } }
            );
            
            console.log(`Updated ${updateResult.modifiedCount} listings`);
        }

        // Find all listings with null owners
        const listingsWithNullOwner = await Listing.find({ owner: null });
        console.log(`Found ${listingsWithNullOwner.length} listings with null owners`);

        // Update listings with null owners
        if (listingsWithNullOwner.length > 0) {
            const updateResult = await Listing.updateMany(
                { owner: null },
                { $set: { owner: adminUser._id } }
            );
            
            console.log(`Updated ${updateResult.modifiedCount} listings`);
        }

        console.log("Finished updating listings");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        mongoose.connection.close();
    }
}

main();