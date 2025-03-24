const axios = require('axios');
require('dotenv').config();

let matchData = [];

const UPCOMING_MATCHES_URL = process.env.ENTITY_URL;

if (!UPCOMING_MATCHES_URL) {
    console.error("UPCOMING_MATCHES_URL is not defined. Check your environment variables.");
}

const fetchLiveMatches = async () => {
    try {
        if (!UPCOMING_MATCHES_URL) {
            throw new Error("UPCOMING_MATCHES_URL is not defined.");
        }

        const response = await axios.get(UPCOMING_MATCHES_URL);

        const matches = response?.data?.response?.items || [];

        matchData = matches;
        console.log("Live match data updated successfully:", matchData.length, "matches found.");
    } catch (error) {
        console.error("Error while fetching live matches:", error.message);
    }
};

setInterval(fetchLiveMatches, 5 * 60 * 1000);

fetchLiveMatches();

const getMatchData = () => matchData;

module.exports = {
    fetchLiveMatches,
    getMatchData,
};
