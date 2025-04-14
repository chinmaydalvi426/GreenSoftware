const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/WrapAsync.js");
const User = require("../models/user.js");
const Listing = require("../models/listings.js");
const Booking = require("../models/booking.js");
const { isloggedin } = require("../middleware.js");
const multer = require("multer");
const { storage } = require("../cloudconfig.js");
const upload = multer({ storage });
const ExpressError = require("../utils/ExpressError.js");

// Middleware to check if user is the profile owner
const isProfileOwner = (req, res, next) => {
    if (!req.user || req.user._id.toString() !== req.params.id) {
        req.flash("error", "You don't have permission to do that");
        return res.redirect("/listings");
    }
    next();
};

// User Profile
router.get("/profile/:id", wrapAsync(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/listings");
    }

    // Get user's listings
    const listings = await Listing.find({ owner: user._id }).sort({ createdAt: -1 });

    // Check if the profile belongs to the logged-in user
    const isOwner = req.user && req.user._id.toString() === user._id.toString();

    res.render("users/profile.ejs", { user, listings, isOwner });
}));

// Edit Profile Form
router.get("/profile/:id/edit", isloggedin, isProfileOwner, wrapAsync(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/listings");
    }
    res.render("users/edit-profile.ejs", { user });
}));

// Update Profile
router.put("/profile/:id", isloggedin, isProfileOwner, upload.single("avatar"), wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { fullName, email, phone, bio, location, facebook, twitter, instagram } = req.body;

    // Find user
    const user = await User.findById(id);
    if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/listings");
    }

    // Update user fields
    user.fullName = fullName;
    user.email = email;
    user.phone = phone;
    user.bio = bio;
    user.location = location;
    user.socialLinks.facebook = facebook;
    user.socialLinks.twitter = twitter;
    user.socialLinks.instagram = instagram;

    // Update avatar if provided
    if (req.file) {
        user.avatar = {
            url: req.file.path,
            filename: req.file.filename
        };
    }

    await user.save();
    req.flash("success", "Profile updated successfully");
    res.redirect(`/users/profile/${id}`);
}));

// Update User Preferences
router.put("/profile/:id/preferences", isloggedin, isProfileOwner, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { currency, language, emailNotifications, bookingNotifications, marketingNotifications } = req.body;

    // Find user
    const user = await User.findById(id);
    if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/listings");
    }

    // Update preferences
    user.preferences.currency = currency;
    user.preferences.language = language;
    user.preferences.notifications.email = emailNotifications === "on";
    user.preferences.notifications.bookings = bookingNotifications === "on";
    user.preferences.notifications.marketing = marketingNotifications === "on";

    await user.save();
    req.flash("success", "Preferences updated successfully");
    res.redirect(`/users/profile/${id}/edit`);
}));

// User's Listings
router.get("/profile/:id/listings", wrapAsync(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/listings");
    }

    const listings = await Listing.find({ owner: user._id }).sort({ createdAt: -1 });
    const isOwner = req.user && req.user._id.toString() === user._id.toString();

    res.render("users/listings.ejs", { user, listings, isOwner });
}));

// Change Password Form
router.get("/profile/:id/change-password", isloggedin, isProfileOwner, wrapAsync(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/listings");
    }
    res.render("users/change-password.ejs", { user });
}));

// Change Password
router.post("/profile/:id/change-password", isloggedin, isProfileOwner, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
        req.flash("error", "New passwords do not match");
        return res.redirect(`/users/profile/${id}/change-password`);
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/listings");
    }

    // Change password using passport-local-mongoose
    await user.changePassword(currentPassword, newPassword);
    
    req.flash("success", "Password changed successfully");
    res.redirect(`/users/profile/${id}`);
}));

// Dashboard
router.get("/dashboard", isloggedin, wrapAsync(async (req, res) => {
    const userId = req.user._id;
    
    // Get user's listings
    const listings = await Listing.find({ owner: userId });
    
    // Get user's bookings
    const bookings = await Booking.find({ user: userId })
        .populate("listing")
        .sort({ createdAt: -1 })
        .limit(5);
    
    // Get bookings for user's listings
    const listingIds = listings.map(listing => listing._id);
    const receivedBookings = await Booking.find({ listing: { $in: listingIds } })
        .populate("user")
        .populate("listing")
        .sort({ createdAt: -1 })
        .limit(5);
    
    res.render("users/dashboard.ejs", { 
        listings, 
        bookings, 
        receivedBookings,
        listingCount: listings.length
    });
}));

module.exports = router;