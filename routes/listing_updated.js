const express = require("express")
const app = express();
const router = express.Router({mergeParams : true});
const wrapAsync = require("../utils/WrapAsync.js");
const { listingSchema , reviewSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");
const listing = require("../models/listings.js");
const {isloggedin, isOwner} = require("../middleware.js");
const methodOverride = require("method-override");
const { storage } = require("../cloudconfig.js");
const multer  = require('multer')
const upload = multer({storage});

let mapaccesstoken = process.env.map_token 
const mbxgeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const geocodingClient = mbxgeocoding({ accessToken: mapaccesstoken });


app.use(methodOverride("_method"));

const validatelisting = (req , res , next) => {
    let { error } = listingSchema.validate(req.body);
    if(error){
        throw new ExpressError(400 , error)
    }else  {
        next();
    }
};

//INDEX ROUTE
router.get("/" ,wrapAsync(async (req,res) => {
    let { search, location, category, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;
    
    // Convert page and limit to numbers
    page = parseInt(page);
    limit = parseInt(limit);
    
    // Build filter object for MongoDB query
    let filter = {};
    
    // Search by title or description using text index for better performance
    if (search) {
        // If search term is more than 3 characters, use text search for better performance
        if (search.length > 3) {
            filter.$text = { $search: search };
        } else {
            // For shorter terms, fallback to regex for more flexible matching
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
    }
    
    // Filter by location
    if (location) {
        filter.location = { $regex: location, $options: 'i' };
    }
    
    // Filter by category (we'll add this field to the model later)
    if (category && category !== 'all') {
        filter.category = category;
    }
    
    // Filter by price range
    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    
    // Create query
    let listingQuery = listing.find(filter);
    
    // Apply sorting
    if (sort) {
        switch(sort) {
            case 'price_asc':
                listingQuery = listingQuery.sort({ price: 1 });
                break;
            case 'price_desc':
                listingQuery = listingQuery.sort({ price: -1 });
                break;
            case 'newest':
                listingQuery = listingQuery.sort({ _id: -1 }); // Assuming ObjectId has creation timestamp
                break;
            default:
                // Default sorting (you can define your own)
                break;
        }
    }
    
    // Only select fields needed for the listing cards to reduce data transfer
    listingQuery.select('title price location country image category createdAt review');
    
    // Add pagination
    const totalListings = await listing.countDocuments(filter);
    const totalPages = Math.ceil(totalListings / limit);
    
    // Ensure page is within valid range
    if (page < 1) page = 1;
    if (page > totalPages && totalPages > 0) page = totalPages;
    
    // Apply pagination to query
    listingQuery.skip((page - 1) * limit).limit(limit);
    
    // Execute query
    const alllisting = await listingQuery.exec();
    
    // Get unique locations for filter dropdown
    const locations = await listing.distinct('location');
    
    // Get min and max prices for the price range filter
    const priceStats = await listing.aggregate([
        {
            $group: {
                _id: null,
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        }
    ]);
    
    const priceRange = priceStats.length > 0 ? {
        min: priceStats[0].minPrice,
        max: priceStats[0].maxPrice
    } : { min: 0, max: 10000 };
    
    // Render the page with filters and results
    res.render("listings/index.ejs", {
        alllisting,
        filters: {
            search: search || '',
            location: location || '',
            category: category || 'all',
            minPrice: minPrice || priceRange.min,
            maxPrice: maxPrice || priceRange.max,
            sort: sort || 'default'
        },
        locations,
        priceRange,
        categories: ['Beach', 'Mountain', 'City', 'Countryside', 'Lake', 'Tropical', 'Camping', 'Skiing', 'Desert', 'Island'],
        pagination: {
            page,
            limit,
            totalPages,
            totalListings,
            hasNext: page < totalPages,
            hasPrev: page > 1
        }
    });
 }))
 
 //new listing
 router.get("/new" ,isloggedin, (req,res) => {
     res.render("listings/new.ejs");
 });
 
 //SHOW
 router.get("/:id" ,wrapAsync(async (req,res) => {
    let {id} = req.params ;
    const idlist = await listing.findById(id).populate({
        path : "review" ,
        populate : {
            path : "author"
        },
    }).populate("owner"); 
    
    if(!idlist){
        req.flash("error" , "listing you requested for does not exist");
        return res.redirect("/listings");
    }
    
    // Log the listing to debug
    console.log("Listing owner:", idlist.owner);
    
    res.render("listings/show.ejs", {idlist} );
 }));
 
 //create route
 router.post("/"  ,isloggedin, upload.single('listing[image]'), wrapAsync(async(req,res,next) => {
    // Ensure user is logged in
    if (!req.user) {
        req.flash("error", "You must be logged in to create a listing");
        return res.redirect("/login");
    }
    
    let response = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 2
    }).send();
    
    let url = req.file.path;
    let filename = req.file.filename;
    
    const newlisting = await new listing(req.body.listing);
    
    // Ensure owner is set
    newlisting.owner = req.user._id;
    newlisting.image = { url, filename };
    newlisting.geometry = response.body.features[0].geometry; 
    
    let savedlisting = await newlisting.save();
    console.log("New listing created with owner:", savedlisting.owner);
    
    req.flash("success", "New listing is created");
    res.redirect("/listings");
 }));
 
 //edit route
 router.get("/:id/edit" ,isloggedin,isOwner, wrapAsync(async(req,res) => {

     let { id } =req.params ;
     const listings = await listing.findById(id);
    //  let originalurl = listings.image.url;

     req.flash("success" , " listing is edited");
     res.render("listings/edit.ejs" ,{listings});
 }))
 
 
 //UPDATE ROUTE
 router.put("/:id" ,isloggedin, isOwner, upload.single('listing[image]') , wrapAsync(async(req,res) =>{
    let { id } = req.params;
    console.log(req.file);
    
    // Find the listing first to preserve the owner
    const existingListing = await listing.findById(id);
    if (!existingListing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }
    
    // Get geocoding data if location has changed
    let geometryData = existingListing.geometry;
    if (req.body.listing.location && req.body.listing.location !== existingListing.location) {
        try {
            let response = await geocodingClient.forwardGeocode({
                query: req.body.listing.location,
                limit: 2
            }).send();
            
            if (response.body.features.length > 0) {
                geometryData = response.body.features[0].geometry;
            }
        } catch (err) {
            console.error("Geocoding error:", err);
            // Continue with update even if geocoding fails
        }
    }
    
    // Preserve the owner when updating and add geometry data
    const update = await listing.findByIdAndUpdate(id, {
        ...req.body.listing,
        owner: existingListing.owner, // Ensure owner is preserved
        geometry: geometryData // Add geometry data
    }, { new: true });
    
    if(typeof req.file !== "undefined"){
       let url = req.file.path;
       let filename = req.file.filename;
       update.image = {url, filename};
       await update.save();
    }
    
    req.flash("success", "Listing is updated"); 
    res.redirect(`/listings/${id}`);
 }));
 
 
 //DELETE ROUTE
 router.delete("/:id" ,isloggedin,isOwner, wrapAsync(async(req,res) =>{
     let { id } = req.params;
     let deleted_hotel = await listing.findByIdAndDelete(id);
     req.flash("success" , " listing is deleted");
     res.redirect("/listings");
     // console.log(deleted_hotel);
     
 }));

// API endpoint for search (for AJAX requests)
router.get("/api/search", wrapAsync(async (req, res) => {
    let { search, location, category, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;
    
    // Convert page and limit to numbers
    page = parseInt(page);
    limit = parseInt(limit);
    
    // Build filter object for MongoDB query
    let filter = {};
    
    // Search by title or description using text index for better performance
    if (search) {
        // If search term is more than 3 characters, use text search for better performance
        if (search.length > 3) {
            filter.$text = { $search: search };
        } else {
            // For shorter terms, fallback to regex for more flexible matching
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
    }
    
    // Filter by location
    if (location) {
        filter.location = { $regex: location, $options: 'i' };
    }
    
    // Filter by category
    if (category && category !== 'all') {
        filter.category = category;
    }
    
    // Filter by price range
    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    
    // Create query
    let listingQuery = listing.find(filter);
    
    // Apply sorting
    if (sort) {
        switch(sort) {
            case 'price_asc':
                listingQuery = listingQuery.sort({ price: 1 });
                break;
            case 'price_desc':
                listingQuery = listingQuery.sort({ price: -1 });
                break;
            case 'newest':
                listingQuery = listingQuery.sort({ _id: -1 });
                break;
            default:
                break;
        }
    }
    
    // Only select fields needed for the listing cards to reduce data transfer
    listingQuery.select('title price location country image category createdAt review');
    
    // Add pagination
    const totalListings = await listing.countDocuments(filter);
    const totalPages = Math.ceil(totalListings / limit);
    
    // Ensure page is within valid range
    if (page < 1) page = 1;
    if (page > totalPages && totalPages > 0) page = totalPages;
    
    // Apply pagination to query
    listingQuery.skip((page - 1) * limit).limit(limit);
    
    // Execute query
    const listings = await listingQuery.exec();
    
    // Return JSON response
    res.json({
        success: true,
        count: listings.length,
        totalListings,
        pagination: {
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        },
        data: listings
    });
}));

module.exports = router ;