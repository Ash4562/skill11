const asyncHandler = require('express-async-handler');
const { getMatchData } = require('../../services/MatchDetails');

exports.getLiveMatchesData = asyncHandler(async (req, res) => {
    try {
        const liveMatches = getMatchData();

        if (!liveMatches || liveMatches.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No live matches data available at the moment. Please try again later.",
            });
        }

        res.status(200).json({
            success: true,
            data: liveMatches,
        });
    } catch (error) {
        console.error("Error in getLiveMatchesData:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch live match data.",
            error: error.message,
        });
    }
});
