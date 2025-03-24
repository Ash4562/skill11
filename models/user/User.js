const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        unique: true,
        sparse: true,
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
    },
    avatar: {
        type: String,
    },
    otp: {
        type: String,
    },
    otpExpiry: {
        type: Date,
    },
    role: {
        type: String,
        default: "User"
    },
    isPanVerified: {
        type: Boolean,
        default: false
    },
    currentToken: {
        type: String
    },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;
