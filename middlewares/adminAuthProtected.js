const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const Admin = require('../models/admin/Admin');

// Protect Middleware
const protect = asyncHandler(async (req, res, next) => {
    const token = req.cookies.auth_token; // Ensure cookie-parser is used in your app

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch the admin associated with the token
        const admin = await Admin.findById(decoded.id).select('-password');

        if (!admin) {
            return res.status(401).json({ message: 'Not authorized, admin not found' });
        }

        req.admin = admin; // Attach admin to request
        next();
    } catch (error) {
        console.error('Error verifying token:', error.message);
        res.status(401).json({ message: 'Not authorized, invalid token' });
    }
});

module.exports = { protect };