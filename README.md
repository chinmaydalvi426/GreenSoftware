# Wanderlust - Travel Booking Platform

## Fixing Listings Without Owners

If you're seeing undefined owners in your console logs, you can run the fix script to assign owners to all listings:

```bash
node utils/fixListingOwners.js
```

This script will:
1. Find all listings without owners
2. Assign a default owner (the first user in the database) to these listings
3. Update the database

After running this script, all listings should have valid owners.

## Features

- User authentication and authorization
- Listing creation and management
- Review system
- Booking system
- Search and filtering
- Map integration
- Responsive design

## Booking System

The booking system allows users to:
- Book listings for specific dates
- Specify the number of guests
- View their bookings
- Cancel bookings

Listing owners can:
- View bookings for their listings
- Confirm or cancel bookings
- Mark bookings as completed

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in a `.env` file:
   ```
   ATLASDB_URL=your_mongodb_connection_string
   CLOUD_NAME=your_cloudinary_cloud_name
   CLOUD_API_KEY=your_cloudinary_api_key
   CLOUD_API_SECRET=your_cloudinary_api_secret
   map_token=your_mapbox_token
   ```

3. Start the server:
   ```bash
   node index.js
   ```

4. Visit `http://localhost:8080` in your browser.