const router = require("express").Router();
const userMatchController = require("../../controllers/userController/userMatchController");

router
    .get('/user-leaderboard/:matchId', userMatchController.getLeaderboard)
    .get('/match/:matchId/scoreboard', userMatchController.getMatchScoreboard)
module.exports = router;
