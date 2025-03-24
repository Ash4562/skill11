const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/user/User');

/**
 * Middleware to protect routes by verifying JWT tokens and ensuring the user exists.
 */
exports.Protected = asyncHandler(async (req, res, next) => {
    try {
        // Retrieve token from cookies or Authorization header
        let token = req.cookies?.auth;

        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;

            // Ensure the Authorization header is formatted correctly
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            } else {
                return res.status(400).json({ message: 'Authorization header is malformed. Expected format: Bearer <token>' });
            }
        }

        // If no token is found, reject the request
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized, no token provided' });
        }

        // Ensure JWT secret key exists in the environment
        if (!process.env.JWT_KEY) {
            throw new Error('JWT_KEY is not set in the environment variables');
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_KEY);

        // Retrieve the user from the database
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized, user no longer exists' });
        }

        // Ensure the token matches the user's current active token (if implementing one-device login)
        if (user.currentToken && user.currentToken !== token) {
            return res.status(401).json({ message: 'Unauthorized, session is invalid. Please log in again.' });
        }

        // Attach user object to the request for use in further processing
        req.user = user;
        next();
    } catch (error) {
        console.error('Token verification error:', error.message);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Unauthorized, token has expired. Please log in again.' });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Unauthorized, invalid token' });
        }

        // For other unexpected errors
        return res.status(500).json({ message: 'An error occurred while processing the request. Please try again later.' });
    }
});
