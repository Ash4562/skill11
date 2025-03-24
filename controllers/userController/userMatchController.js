const asyncHandler = require("express-async-handler");
const UserMatch = require("../../models/user/UserMatch");
const { default: axios } = require("axios");

// Fetch leaderboard and calculate total points for each user
exports.getLeaderboard = asyncHandler(async (req, res) => {
  try {
    const users = await UserMatch.find(); // Get all users
    if (!users) {
      return res.status(404).json({ message: "No users found" });
    }

    // Calculate total points for each user (sum of all players' points)
    const leaderboard = users.map(user => {
      const totalPoints = user.players.reduce((total, player) => {
        return total + (player.points || 0); // Accumulate points for each player
      }, 0);

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        totalPoints, // Store the total points for the user
        players: user.players,
      };
    });

    // Sort the leaderboard by total points (descending order)
    leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

    // Assign ranks to users based on their total points
    const leaderboardWithRank = leaderboard.map((user, index) => ({
      ...user,
      rank: index + 1, // Rank starts from 1
    }));

    res.status(200).json({ leaderboard: leaderboardWithRank });
  } catch (error) {
    console.error("Error fetching leaderboard:", error.message);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
})


exports.getMatchScoreboard = asyncHandler(async (req, res) => {
  const { matchId } = req.params; // Match ID to fetch scorecard for

  try {
    // Fetch scorecard data from EntitySport
    const urlScorecard = `https://rest.entitysport.com/v2/matches/${matchId}/scorecard?token=${process.env.ENTITYSPORT_API_TOKEN}`;
    const responseScorecard = await axios.get(urlScorecard);
    const playerStats = responseScorecard.data.response.players || [];

    // Fetch match data from skills11 API
    const urlMatches = `http://skills11.in/api/match/getMatches`;
    const responseMatches = await axios.get(urlMatches);
    const allPlayers = responseMatches.data.players || [];

    // Map player stats and include profile information
    const scoreboardData = playerStats.map((player) => {
      const batting = player.batting || {}; // Ensure batting data exists

      // Find player profile in allPlayers data using player ID
      const playerProfile = allPlayers.find((p) => p.pid === player.pid) || {};

      return {
        playerId: player.pid,
        name: player.title,
        run: batting.run || 0, // Use 0 if 'run' doesn't exist
        balls: batting.balls || 0, // Use 0 if 'balls' doesn't exist
        fours: batting.fours || 0, // Use 0 if 'fours' doesn't exist
        sixes: batting.sixes || 0, // Use 0 if 'sixes' doesn't exist
        strikeRate: batting.strikeRate || 0, // Use 0 if 'strikeRate' doesn't exist
        profile: {
          image: playerProfile.image || "N/A", // Add player profile image
          country: playerProfile.country || "Unknown", // Add player country
          role: playerProfile.role || "Unknown", // Add player role
        },
      };
    });

    // Return the formatted player stats as the response
    res.status(200).json({
      matchId,
      scoreboardData,
    });
  } catch (error) {
    console.error("Error fetching match scorecard:", error.message);
    res.status(500).json({ error: "Failed to fetch match scorecard data" });
  }
});



