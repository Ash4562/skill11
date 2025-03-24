const mongoose = require("mongoose");

const prizeDistributionSchema = new mongoose.Schema({
    rank: {
        type: String,
        required: true,
        validate: {
            validator: (value) => /^(\d+|\d+-\d+)$/.test(value),
            message: "Invalid rank range format. Use '1', '2', or '6-10'.",
        },
    },
    prize: {
        type: Number,
        required: true,
        min: [0, "Prize must be a positive number"],
    },
});

const teamSchema = new mongoose.Schema({
    team_id: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    short_name: {
        type: String,
        required: true,
    },
    logo_url: {
        type: String,
        required: true,
    },
});

const venueSchema = new mongoose.Schema({
    venue_id: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        required: true,
    },
    timezone: {
        type: String,
        default: null,
    },
});

const contestSchema = new mongoose.Schema(
    {
        match_id: {
            type: String,
            required: true,
        },
        contest_category: {
            type: String,
            required: true,
            enum: ["Mega", "Head-to-Head", "Small League", "Custom"],
        },
        contest_name: {
            type: String,
            required: true,
            trim: true,
        },
        prize_pool: {
            type: Number,
            required: true,
            min: [0, "Prize pool must be a positive value"],
        },
        entry_fee: {
            type: Number,
            required: true,
            min: [0, "Entry fee must be a positive value"],
        },
        max_participants: {
            type: Number,
            required: true,
            min: [2, "At least 2 participants required"],
        },
        current_participants: {
            type: Number,
            default: 0,
            min: [0, "Participants cannot be negative"],
        },
        prize_distribution: {
            type: [prizeDistributionSchema],
            required: true,
            validate: {
                validator: (value) => value.length > 0,
                message: "Prize distribution cannot be empty.",
            },
        },
        teama: {
            type: teamSchema,
            required: true,
        },
        teamb: {
            type: teamSchema,
            required: true,
        },
        date_start: {
            type: Date,
            required: true,
        },
        date_end: {
            type: Date,
            required: true,
        },
        venue: {
            type: venueSchema,
            required: true,
        },
        title: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true,
    }
);

contestSchema.pre("save", function (next) {
    this.updated_at = new Date();
    next();
});

module.exports = mongoose.model("Contest", contestSchema);