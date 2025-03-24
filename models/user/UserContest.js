const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
    matchId: {
        type: String,
        required: true,
    },
    contestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contest',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    selectedPlayers: [
        {
            playerId: { type: String, required: true },
            name: { type: String, required: true },
            role: { type: String, required: true },
            points: { type: Number, default: 0 },
            isCaptain: { type: Boolean, default: false },
            isViceCaptain: { type: Boolean, default: false },
        },
    ],
    captainId: {
        type: String,
        required: true,
    },
    viceCaptainId: {
        type: String,
        required: true,
    },
    joinDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['active', 'locked', 'completed'],
        default: 'active',
    },
});

module.exports = mongoose.model('UserContest', contestSchema);