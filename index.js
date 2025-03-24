const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

// Routes
const contestRoutes = require('./routes/adminRoute/contestRoute');
const userRoutes = require('./routes/userRoute/userRoute');
const matchRoutes = require('./routes/adminRoute/matchRoute');
const userMatchRoutes = require('./routes/userRoute/userMatchRoutes');
const { protect } = require("./middlewares/adminAuthProtected");

// App Initialization
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            const allowedOrigins = [
                'https://skills11.in', // Production
                'http://localhost:5173', // Development
            ];
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    },
});

// Middleware
app.use((req, res, next) => {
    if (req.url.includes('//')) {
        const normalizedUrl = req.url.replace(/\/{2,}/g, '/');
        return res.redirect(301, normalizedUrl);
    }
    next();
});
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            'https://skills11.in',
            'http://localhost:5173',
        ];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URL,)
    .then(() => {
        console.log('MongoDB connected successfully');
    }).catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });

// Routes
app.use("/api/match", require("./routes/userRoute/matchRoutes"));
app.use("/api/user-match", userMatchRoutes);
app.use('/api/v1/matches', matchRoutes);
app.use('/api/v1/admin/contest', protect, contestRoutes);
app.use('/api/v1/user/contest', require("./routes/userRoute/contestRoute"));
app.use('/api/v1/user/auth', userRoutes);
app.use('/api/user/kyc', require("./routes/kycRoute/kycDetailsRoute"))
app.use('/api/admin/auth', require("./routes/adminRoute/authRoute"))
app.use('/api/admin/banner', require("./routes/adminRoute/fileUploadRoute"))

// Error Handling
app.use("*", (req, res) => res.status(404).json({ message: "No resource found" }));
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    if (err.name === 'UnauthorizedError') {
        res.status(401).json({ message: 'Invalid token' });
    } else if (err.message === 'Not allowed by CORS') {
        res.status(403).json({ message: 'CORS error: Not allowed by origin' });
    } else {
        res.status(500).json({ message: err.message || 'Internal server error' });
    }
});

// Socket.IO Setup
io.on('connection', (socket) => {
    console.log('Client connected to live match updates');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });

    socket.on('subscribeToLiveUpdates', (data) => {
        console.log('Subscription received for live updates:', data);
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
