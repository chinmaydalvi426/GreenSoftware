const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    checkIn: {
        type: Date,
        required: true
    },
    checkOut: {
        type: Date,
        required: true
    },
    guests: {
        type: Number,
        required: true,
        min: 1
    },
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "cancelled", "completed"],
        default: "pending"
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "refunded"],
        default: "pending"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Validate that check-out date is after check-in date
bookingSchema.pre("validate", function(next) {
    if (this.checkOut <= this.checkIn) {
        this.invalidate("checkOut", "Check-out date must be after check-in date");
    }
    next();
});

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;