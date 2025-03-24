const axios = require("axios");
const asyncHandler = require("express-async-handler");
const pointsCalculator = require("../../utils/pointsCalculator");
const UserContest = require("../../models/user/UserContest");
const Contest = require("../../models/admin/Contest");


exports.getAllMatches = asyncHandler(async (req, res) => {
  try {
    const url = process.env.ENTITY_URL;

    if (!url) {
      throw new Error("ENTITYSPORT_API_TOKEN is not defined in the environment variables.");
    }

    const response = await axios.get(url);
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error fetching matches:", error.message);
    res.status(500).json({ message: "Failed to fetch matches", error: error.message });
  }
});

// Fetch Teams by Competition ID
exports.getTeams = asyncHandler(async (req, res) => {
  const { competitionId } = req.params;
  const url = `https://rest.entitysport.com/v2/competitions/${competitionId}/squads?token=${process.env.ENTITYSPORT_API_TOKEN}`
  const response = await axios.get(url);
  res.status(200).json(response.data);
});

// Fetch Match Squads by Match ID
exports.getMatchSquads = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const url = `https://rest.entitysport.com/v2/matches/${matchId}/squads?token=${process.env.ENTITYSPORT_API_TOKEN}`
  const response = await axios.get(url);
  res.status(200).json(response.data);
});


exports.getMatchStats = asyncHandler(async (req, res) => {
  const { matchId } = req.params;

  try {
    const url = `https://rest.entitysport.com/v2/matches/${matchId}/live?token=${process.env.ENTITYSPORT_API_TOKEN}`
    const response = await axios.get(url)
    console.log(response);


    const { players = [], innings = [] } = response.data.response || {};

    const roles = {
      WK: [],
      BAT: [],
      AR: [],
      BOWL: [],
    };

    const playerPoints = players.filter((player) => {
      const role = player.role || "BAT";
      const stats = player.stats || {};
      const points = pointsCalculator(stats, role);


      if (role === "wk" || role === "bat" || role === "all" || role === "bowl") {
        const teamName = player.team || "Unknown Team";
        const playerObject = {
          playerId: player.pid,
          name: player.title || "Unknown Player",
          role,
          team: teamName,
          points,
          credits: player.credits || 0,
        };

        if (role === "wk") {
          roles.WK.push(playerObject);
        } else if (role === "bat") {
          roles.BAT.push(playerObject);
        } else if (role === "all") {
          roles.AR.push(playerObject);
        } else if (role === "bowl") {
          roles.BOWL.push(playerObject);
        }

        return true;
      }
      return false;
    });


    Object.keys(roles).forEach(role => {
      if (roles[role].length === 0) {
        delete roles[role];
      }
    });

    const overs = innings[0]?.overs || 0;
    const runs = innings[0]?.runs || 0;

    res.status(200).json({
      matchId,
      roles,
      players: playerPoints,
      overs,
      runs,
    });
  } catch (error) {
    console.error("Error fetching match stats:", error.message);
    res.status(500).json({ error: "Failed to fetch match stats" });
  }
});



exports.userJoinContest = asyncHandler(async (req, res) => {
  const { matchId, selectedPlayers, captainId, viceCaptainId, contestId, cid } = req.body;
  const userId = req.user._id;

  // Validate captain and vice-captain
  if (!captainId || !viceCaptainId) {
    return res.status(400).json({ error: "Both captain and vice-captain are required to create the team." });
  }

  // Validate selected players (exactly 11 and no duplicates)
  if (selectedPlayers.length !== 11) {
    return res.status(400).json({ error: "You must select exactly 11 players." });
  }

  if (new Set(selectedPlayers).size !== selectedPlayers.length) {
    return res.status(400).json({ error: "Duplicate player IDs are not allowed in the selected players." });
  }

  try {
    // Check if the user has already joined the contest for the given match with the same set of players
    const existingUserContest = await UserContest.findOne({ userId, contestId, matchId });
    if (existingUserContest) {
      const existingPlayerIds = existingUserContest.selectedPlayers.map(player => player.playerId.toString());
      const arePlayersSame = selectedPlayers.every(player => existingPlayerIds.includes(player.toString()));

      if (arePlayersSame) {
        return res.status(400).json({ error: "You have already joined the contest with the same players. Please select different players." });
      }
    }

    // Fetch contest details to check max participants
    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    if (contest.current_participants >= contest.max_participants) {
      return res.status(400).json({ error: "The contest has already reached the maximum number of participants." });
    }

    // Fetch squads from external API to validate selected players, captain, and vice-captain
    const url = `https://rest.entitysport.com/v2/competitions/${cid}/squads?token=${process.env.ENTITYSPORT_API_TOKEN}`;
    const response = await axios.get(url);

    if (!response.data.response.squads || response.data.response.squads.length === 0) {
      return res.status(400).json({ error: "No squads data available" });
    }

    const team1Players = response.data.response.squads[0].players || [];
    const team2Players = response.data.response.squads[1].players || [];
    const allPlayers = [...team1Players, ...team2Players];

    // Filter selected players from all available players
    const filteredPlayers = allPlayers.filter(player => selectedPlayers.includes(player.pid));

    // Validate captain and vice-captain
    const isCaptainValid = filteredPlayers.some(player => player.pid.toString() === captainId.toString());
    const isViceCaptainValid = filteredPlayers.some(player => player.pid.toString() === viceCaptainId.toString());

    if (!isCaptainValid || !isViceCaptainValid) {
      return res.status(400).json({ error: "The selected captain and vice-captain must be among the selected players." });
    }

    // Map players to include points and roles
    const playerPoints = filteredPlayers.map(player => {
      const stats = player.fantasy_player_rating || {};
      const role = player.playing_role || "";

      return {
        playerId: player.pid,
        name: player.title,
        role,
        points: pointsCalculator(stats, role),
        isCaptain: player.pid.toString() === captainId.toString(),
        isViceCaptain: player.pid.toString() === viceCaptainId.toString(),
      };
    });

    // Save user contest participation
    const userContest = new UserContest({
      matchId,
      contestId,
      userId,
      selectedPlayers: playerPoints,
      captainId,
      viceCaptainId,
    });
    await userContest.save();

    // Update contest participant count
    contest.current_participants += 1;
    await contest.save();

    res.status(200).json({
      message: "Successfully joined the contest",
      matchId,
      playerPoints,
    });
  } catch (error) {
    console.error("Error in userJoinContest:", error.message);
    res.status(500).json({ error: "Failed to process the selected players." });
  }
});



exports.myContest = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    // Fetch user contests and populate the necessary fields
    const userContests = await UserContest.find({ userId })
      .populate('contestId', 'contest_name contest_category prize_pool entry_fee max_participants current_participants prize_distribution')
      .populate('matchId', 'title date_start date_end venue teama teamb');

    if (!userContests || userContests.length === 0) {
      return res.status(404).json({ error: "You have not joined any contests yet." });
    }

    // Format contest details for response
    const contestDetails = userContests.map((userContest) => {
      const { contestId, matchId, selectedPlayers, captainId, viceCaptainId } = userContest;

      return {
        contestId: contestId._id,
        contestName: contestId.contest_name,
        contestCategory: contestId.contest_category,
        prizePool: contestId.prize_pool || 0,
        entryFee: contestId.entry_fee || 0,
        maxParticipants: contestId.max_participants || 0,
        currentParticipants: contestId.current_participants || 0,
        prizeDistribution: contestId.prize_distribution || [],
        matchId: matchId._id,
        matchTitle: matchId.title,
        dateStart: matchId.date_start,
        dateEnd: matchId.date_end,
        venue: matchId.venue,
        teama: matchId.teama,
        teamb: matchId.teamb,
        selectedPlayers: selectedPlayers.map(player => ({
          playerId: player.playerId,
          name: player.name,
          role: player.role,
          points: player.points,
          isCaptain: player.playerId === captainId,
          isViceCaptain: player.playerId === viceCaptainId,
        })),
        captainId,
        viceCaptainId,
      };
    });

    res.status(200).json({
      message: "My Contests retrieved successfully",
      contests: contestDetails,
    });
  } catch (error) {
    console.error("Error in myContest:", error.message);
    res.status(500).json({ error: "Failed to fetch your contests. Please try again later." });
  }
});


// GET Endpoint to fetch live points for a match
exports.getLivePoints = asyncHandler(async (req, res) => {
  const { matchId } = req.params; // Get the matchId from URL params

  // Fetch match squads from external API (e.g., Entity Sport)
  const url = `https://rest.entitysport.com/v2/matches/${matchId}/squads?token=${process.env.ENTITYSPORT_API_TOKEN}`
  const response = await axios.get(url);
  const playersData = response.data.response.players;

  // Map through players and calculate their points
  const playerPoints = playersData.map((player) => {
    const stats = player.stats || {};
    const role = player.role || ""; // Default to "BT" if no role is specified
    const caption = player.caption || "No Caption Available"; // Default if no caption
    const voicecaption = player.voicecaption || "No Voice Caption Available"; // Default if no voice caption

    return {
      playerId: player.pid,
      name: player.title,
      role,
      points: pointsCalculator(stats, role),
      caption, // Add caption here
      voicecaption, // Add voicecaption here
    };
  });

  res.status(200).json({
    matchId,
    playerPoints,
  });
});