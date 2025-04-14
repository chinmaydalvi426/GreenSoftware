const mongoose = require("mongoose");
const schema = mongoose.Schema;
const Review = require("./review.js");
const User = require('./user.js');

const listingSchema = new schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        url: {
            type: String
        },
        filename: {
            type: String
        }
    },
    price: {
        type: Number,
        required: true,
        index: true // Add index for price queries
    },
    location: {
        type: String,
        required: true,
        index: true // Add index for location queries
    },
    country: {
        type: String,
        required: true,
        index: true // Add index for country queries
    },
    category: {
        type: String,
        enum: ['Beach', 'Mountain', 'City', 'Countryside', 'Lake', 'Tropical', 'Camping', 'Skiing', 'Desert', 'Island'],
        default: 'City',
        index: true // Add index for category queries
    },
    amenities: {
        type: [String],
        default: []
    },
    bedrooms: {
        type: Number,
        default: 1
    },
    bathrooms: {
        type: Number,
        default: 1
    },
    maxGuests: {
        type: Number,
        default: 2
    },
    review: [
        {
            type: schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    owner: {
        type: schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true // Add index for owner queries
    },
    geometry: {
        type: {
            type: String,
            enum: ['Point']
            // required: true
        },
        coordinates: {
            type: [Number]
            // required: true
        }
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true // Add index for date-based queries
    }
});

// Create text index for search functionality
listingSchema.index({ title: 'text', description: 'text', location: 'text' });

// Cascade delete reviews
listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) {
        await Review.deleteMany({ _id: { $in: listing.review } });
    }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
