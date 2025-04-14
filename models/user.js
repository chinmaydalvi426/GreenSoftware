const { string, required } = require('joi');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const Userschema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    fullName: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: ''
    },
    avatar: {
        url: {
            type: String,
            default: ''
        },
        filename: {
            type: String,
            default: ''
        }
    },
    location: {
        type: String,
        default: ''
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    socialLinks: {
        facebook: {
            type: String,
            default: ''
        },
        twitter: {
            type: String,
            default: ''
        },
        instagram: {
            type: String,
            default: ''
        }
    },
    preferences: {
        currency: {
            type: String,
            default: 'INR'
        },
        language: {
            type: String,
            default: 'English'
        },
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            bookings: {
                type: Boolean,
                default: true
            },
            marketing: {
                type: Boolean,
                default: false
            }
        }
    }
}, { timestamps: true });

Userschema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', Userschema);