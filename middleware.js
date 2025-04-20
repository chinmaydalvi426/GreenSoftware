const listing = require("./models/listings.js");

module.exports.isloggedin = (req,res , next) => {
    if(!req.isAuthenticated()) {
        // console.log(req.originalUrl);
        req.session.redirecturl = req.originalUrl;
        console.log(req.session.redirecturl);
        req.flash("error" , "You must be loggedin ");
        return  res.redirect("/login");
    }
    next();
}

// Alias for consistency with route naming
module.exports.isLoggedIn = module.exports.isloggedin;

module.exports.saveRedirectUrl = (req,res,next) => {
    if(req.session.redirecturl){
        res.locals.redirectUrl = req.session.redirecturl;
        console.log(res.locals.redirectUrl);
        
    };
    next();
}

module.exports.isOwner = async (req,res,next) => {
    let { id } = req.params;
    let listings = await listing.findById(id);
    console.log(listings);
    if(!listings.owner._id.equals(res.locals.curuser._id)){
       req.flash("error" , "you are not allowed");
       return res.redirect(`/listings/${id}`);
    }
    next();
}

// Admin middleware to restrict access to admin-only routes
module.exports.isAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        req.flash("error", "Access denied. Admin privileges required.");
        return res.redirect("/listings");
    }
    next();
}