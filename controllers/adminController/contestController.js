const asyncHandler = require("express-async-handler");
const Contest = require('../../models/admin/Contest');
const axios = require("axios");

exports.createContest = asyncHandler(async (req, res) => {
    const {
        match_id,
        contest_category,
        contest_name,
        prize_pool,
        entry_fee,
        max_participants,
        prize_distribution,
        teama,
        teamb,
        venue,
        date_start,
        date_end,
        title
    } = req.body;



    try {
        // Validate prize distribution format
        if (!Array.isArray(prize_distribution) || prize_distribution.length === 0) {
            return res.status(400).json({
                message: "Prize distribution must be a non-empty array.",
            });
        }

        const isValidPrizeDistribution = prize_distribution.every((item) => {
            const rankRangeValid = /^(\d+|\d+-\d+)$/.test(item.rank);
            const prizeValid = item.prize >= 0;
            return rankRangeValid && prizeValid;
        });

        if (!isValidPrizeDistribution) {
            return res.status(400).json({
                message: "Invalid prize distribution format.",
            });
        }

        // Create a new contest
        const newContest = new Contest({
            match_id,
            contest_category,
            contest_name,
            prize_pool,
            entry_fee,
            max_participants,
            prize_distribution,
            teama,
            teamb,
            venue,
            date_start,
            date_end,
            title,
            status: "inactive", // Default status
        });

        const savedContest = await newContest.save();

        res.status(201).json({
            message: "Contest created successfully",
            contest: savedContest,
        });
    } catch (error) {
        console.error("Error while creating contest:", error.message);
        res.status(500).json({
            message: "Failed to create contest",
            error: error.message,
        });
    }
});

exports.getAllContests = asyncHandler(async (req, res) => {
    try {
        const contests = await Contest.find({});
        if (!contests.length) {
            return res.status(404).json({ message: "No contests found" });
        }

        res.status(200).json({
            message: "All contests fetched successfully",
            contests,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch contests",
            error: error.message,
        });
    }
});


exports.getContestByMatchId = asyncHandler(async (req, res) => {
    const { match_id } = req.params;

    try {
        const contests = await Contest.find({ match_id });

        if (!contests || contests.length === 0) {
            return res.status(404).json({ message: "No contests found for the provided match ID" });
        }

        res.status(200).json({
            message: "Contests fetched successfully",
            contests,
        });
    } catch (error) {
        console.error("Error fetching contests:", error);

        res.status(500).json({
            message: "Failed to fetch contests",
            error: error.message,
        });
    }
});