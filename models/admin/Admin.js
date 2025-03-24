const mongoose = require('mongoose');
const validator = require('validator');

const adminSchema = mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'Please add an email'],
            unique: true,
            trim: true,
            lowercase: true,
            validate: [validator.isEmail, 'Please add a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Please add a password'],
            minlength: [8, 'Password must be at least 8 characters long'],
            validate: {
                validator: function (value) {
                    return /[A-Z]/.test(value) && /[0-9]/.test(value) && /[!@#$%^&*(),.?":{}|<>]/.test(value);
                },
                message: 'Password must contain at least one uppercase letter, one number, and one special character',
            },
        },
        role: {
            type: String,
            default: 'admin',
        },
        otp: {
            type: String,
            required: false,
        },
        otpExpires: {
            type: Date,
            required: false,
        },


    },
    {
        timestamps: true,
    }
);

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;