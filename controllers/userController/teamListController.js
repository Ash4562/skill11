const asyncHandler = require("express-async-handler");
const Contest = require("../../models/admin/Contest");
const axios = require("axios")

exports.getContestByMatchId = asyncHandler(async (req, res) => {
    const { match_id } = req.params;

    try {
        const contests = await Contest.find({ match_id });

        if (!contests || contests.length === 0) {
            return res.status(400).json({ message: "No contests found for the provided match ID" });
        }

        const apiUrl = process.env.ENTITY_URL
        const { data } = await axios.get(apiUrl)

        const matches = data?.response?.items || []
        const matchDetails = matches.find(
            (match) => match?.match_id === parseInt(match_id, 10)
        );

        if (!matchDetails) {
            return res.status(404).json({ message: "Match data not found for the provided match ID" });
        }


        res.status(200).json({
            message: "Contests fetched successfully with team data",
            match_details: {
                match_id: matchDetails.match_id,
                teama: matchDetails.teama,
                teamb: matchDetails.teamb,
                date_start: matchDetails.date_start,
                cid: matchDetails.competition.cid
            },
            contests
        });
    } catch (error) {
        console.error("Error fetching contests or match data:", error);

        res.status(500).json({
            message: "Failed to fetch contests or match data",
            error: error.message,
        });
    }
});
