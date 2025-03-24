const router = require("express").Router();
const matchController = require("../../controllers/userController/matchController");
const { Protected } = require("../../middlewares/Protected");

router
    .get("/getMatches", matchController.getAllMatches)
    .get("/teams/:competitionId", matchController.getTeams)
    .get("/players/:matchId", matchController.getMatchSquads)
    .get("/match-stats/:matchId", matchController.getMatchStats)
    .post("/selected-players", Protected, matchController.userJoinContest)
    .get('/live-points/:matchId', matchController.getLivePoints)
    .get("/my-contest", Protected, matchController.myContest)
module.exports = router;
