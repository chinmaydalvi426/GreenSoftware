const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/WrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { isloggedin } = require("../middleware.js");
const Booking = require("../models/booking.js");
const Listing = require("../models/listings.js");

// Middleware to check if user is the booking owner
const isBookingOwner = async (req, res, next) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findById(id);
        if (!booking) {
            req.flash("error", "Booking not found");
            return res.redirect("/bookings");
        }
        
        if (!booking.user.equals(req.user._id)) {
            req.flash("error", "You don't have permission to do that");
            return res.redirect("/bookings");
        }
        next();
    } catch (err) {
        next(err);
    }
};

// Middleware to check if user is the listing owner
const isListingOwner = async (req, res, next) => {
    try {
        const { listingId } = req.params;
        const listing = await Listing.findById(listingId);
        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/listings");
        }
        
        // Check if listing has an owner and if the current user is the owner
        if (listing.owner && listing.owner.equals(req.user._id)) {
            req.flash("error", "You cannot book your own listing");
            return res.redirect(`/listings/${listingId}`);
        }
        next();
    } catch (err) {
        next(err);
    }
};

// Get all bookings for the current user
router.get("/", isloggedin, wrapAsync(async (req, res) => {
    // Fetch bookings and populate listing data
    // Note: Some listings might be null if they've been deleted
    const bookings = await Booking.find({ user: req.user._id })
        .populate({
            path: "listing",
            // Even if the listing is null, we still want to include the booking
            options: { allowEmptyResults: true }
        })
        .sort({ createdAt: -1 });
    
    res.render("bookings/index.ejs", { bookings });
}));

// Get bookings for a specific listing (for listing owners)
router.get("/listings/:listingId", isloggedin, wrapAsync(async (req, res) => {
    const { listingId } = req.params;
    const listing = await Listing.findById(listingId);
    
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }
    
    // Check if listing has an owner and if the current user is the owner
    if (!listing.owner || !listing.owner.equals(req.user._id)) {
        req.flash("error", "You don't have permission to view these bookings");
        return res.redirect("/listings");
    }
    
    const bookings = await Booking.find({ listing: listingId })
        .populate("user")
        .sort({ checkIn: 1 });
    
    res.render("bookings/listing.ejs", { bookings, listing });
}));

// Show booking form
router.get("/listings/:listingId/new", isloggedin, isListingOwner, wrapAsync(async (req, res) => {
    const { listingId } = req.params;
    const listing = await Listing.findById(listingId);
    
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }
    
    res.render("bookings/new.ejs", { listing });
}));

// Create new booking
router.post("/listings/:listingId", isloggedin, isListingOwner, wrapAsync(async (req, res) => {
    const { listingId } = req.params;
    const { checkIn, checkOut, guests } = req.body;
    
    const listing = await Listing.findById(listingId);
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }
    
    // Check if guests exceed max guests
    if (guests > listing.maxGuests) {
        req.flash("error", `This listing can only accommodate up to ${listing.maxGuests} guests`);
        return res.redirect(`/bookings/listings/${listingId}/new`);
    }
    
    // Convert dates to Date objects
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    // Calculate number of nights
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
    // Calculate total price
    const totalPrice = listing.price * nights;
    
    // Check for booking conflicts
    const conflictingBookings = await Booking.find({
        listing: listingId,
        status: { $in: ["pending", "confirmed"] },
        $or: [
            { checkIn: { $lte: checkOutDate }, checkOut: { $gte: checkInDate } }
        ]
    });
    
    if (conflictingBookings.length > 0) {
        req.flash("error", "This listing is not available for the selected dates");
        return res.redirect(`/bookings/listings/${listingId}/new`);
    }
    
    // Create new booking
    const newBooking = new Booking({
        listing: listingId,
        user: req.user._id,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests,
        totalPrice,
        status: "pending",
        paymentStatus: "pending"
    });
    
    await newBooking.save();
    
    req.flash("success", "Booking created successfully! Awaiting confirmation.");
    res.redirect(`/bookings/${newBooking._id}`);
}));

// Show booking details
router.get("/:id", isloggedin, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const booking = await Booking.findById(id)
        .populate("listing")
        .populate("user");
    
    if (!booking) {
        req.flash("error", "Booking not found");
        return res.redirect("/bookings");
    }
    
    // Check if user is either the booking user or listing owner
    const isOwner = booking.user._id.equals(req.user._id);
    const isHost = booking.listing.owner && booking.listing.owner.equals(req.user._id);
    
    if (!isOwner && !isHost) {
        req.flash("error", "You don't have permission to view this booking");
        return res.redirect("/bookings");
    }
    
    res.render("bookings/show.ejs", { booking, isOwner, isHost });
}));

// Cancel booking
router.post("/:id/cancel", isloggedin, isBookingOwner, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    
    if (!booking) {
        req.flash("error", "Booking not found");
        return res.redirect("/bookings");
    }
    
    // Only allow cancellation of pending or confirmed bookings
    if (booking.status !== "pending" && booking.status !== "confirmed") {
        req.flash("error", "This booking cannot be cancelled");
        return res.redirect(`/bookings/${id}`);
    }
    
    booking.status = "cancelled";
    if (booking.paymentStatus === "paid") {
        booking.paymentStatus = "refunded";
    }
    
    await booking.save();
    
    req.flash("success", "Booking cancelled successfully");
    res.redirect("/bookings");
}));

// Update booking status (for listing owners)
router.post("/:id/status", isloggedin, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const booking = await Booking.findById(id).populate("listing");
    
    if (!booking) {
        req.flash("error", "Booking not found");
        return res.redirect("/bookings");
    }
    
    // Check if listing has an owner and if the current user is the owner
    if (!booking.listing.owner || !booking.listing.owner.equals(req.user._id)) {
        req.flash("error", "You don't have permission to update this booking");
        return res.redirect("/bookings");
    }
    
    // Validate status
    if (!["pending", "confirmed", "cancelled", "completed"].includes(status)) {
        req.flash("error", "Invalid status");
        return res.redirect(`/bookings/${id}`);
    }
    
    booking.status = status;
    await booking.save();
    
    req.flash("success", "Booking status updated successfully");
    res.redirect(`/bookings/${id}`);
}));

module.exports = router;