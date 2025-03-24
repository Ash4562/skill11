const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../../models/admin/Admin');
const User = require('../../models/user/User');
const panDetails = require("../../models/kyc/KycDetails")
const crypto = require('crypto');
const sendEmail = require('../../utils/sendEmail');


const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const registerAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide both email and password' });
    }

    const adminExists = await Admin.findOne({ email });
    console.log(adminExists);

    if (adminExists) {
        return res.status(400).json({ message: 'Admin already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
        email,
        password: hashedPassword,
        role: 'admin',
    });

    if (admin) {
        const token = generateToken(admin._id);

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        res.status(201).json({
            _id: admin.id,
            email: admin.email,
            role: admin.role,
            message: 'Registration successful',
        });
    } else {
        res.status(400).json({ message: 'Invalid admin data' });
    }
});

const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide both email and password' });
    }

    try {
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const otp = crypto.randomInt(100000, 999999);

        const otpHash = crypto
            .createHash('sha256')
            .update(String(otp))
            .digest('hex');

        await sendEmail({
            to: admin.email,
            subject: "Secure OTP for Admin Login",
            message: `Dear ${admin.name || "Admin"},
            
            We received a request to log in to your admin account. Your One-Time Password (OTP) is:
            
            ${otp}
            
            This OTP is valid for the next 10 minutes. If you did not request this, please ignore this email or contact support immediately.
            
            Thank you,
            [Your Application Name] Team`,
            html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
                        <h2 style="color: #4CAF50;">Admin Login OTP</h2>
                        <p>Dear ${admin.name || "Admin"},</p>
                        <p>We received a request to log in to your admin account. Please use the following One-Time Password (OTP) to proceed:</p>
                        <h3 style="color: #FF5722; text-align: center;">${otp}</h3>
                        <p><b>Note:</b> This OTP is valid for the next <b>10 minutes</b>.</p>
                        <hr>
                        <p>If you did not request this, please ignore this email or contact our support team immediately.</p>
                        <p>Thank you,</p>
                        <p style="color: #4CAF50;">[Your Application Name] Team</p>
                    </div>
                `
        });


        admin.otp = otpHash;
        admin.otpExpires = Date.now() + 10 * 60 * 1000;
        await admin.save();

        return res.status(200).json({
            message: 'OTP sent to your registered email. Please verify within 10 minutes.',
        });
    } catch (error) {
        console.error('Error during admin login:', error.message);
        return res.status(500).json({
            message: 'An error occurred during login. Please try again later.',
        });
    }
});

const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Please provide both email and OTP' });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
    }

    // Hash the OTP provided by the user
    const hashedOTP = crypto
        .createHash('sha256')
        .update(String(otp))
        .digest('hex');

    // Check if hashed OTP matches and is not expired
    if (admin.otp !== hashedOTP) {
        return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (admin.otpExpires < Date.now()) {
        return res.status(400).json({ message: 'OTP has expired' });
    }

    // OTP is valid, generate token and login
    const token = generateToken(admin._id);

    res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(200).json({
        _id: admin.id,
        email: admin.email,
        role: admin.role,
        message: 'Login successful',
        token
    });
});


// Logout Admin
const logoutAdmin = asyncHandler(async (req, res) => {
    // Clear the auth_token cookie
    res.cookie('auth_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        expires: new Date(0), // Expire immediately
    });

    res.status(200).json({ message: 'Logout successful' });
});

const registeredUser = asyncHandler(async (req, res) => {
    const registerUser = await User.find().lean();
    res.status(200).json({ message: "All User Fetch Successfully", registerUser });
});

const getPanDetails = asyncHandler(async (req, res) => {
    try {
        const newPanDetails = await panDetails.find()
            .populate({
                path: 'userId',
                select: 'isPanVerified'
            });

        res.status(200).json({
            message: "User Pan Detail Fetch Successfully",
            newPanDetails
        });
    } catch (error) {
        console.error("Error fetching PAN details:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = {
    registerAdmin,
    loginAdmin,
    verifyOTP,
    logoutAdmin,
    registeredUser,
    getPanDetails
};