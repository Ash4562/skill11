const { getContestByMatchId } = require("../../controllers/userController/teamListController");
const { Protected } = require("../../middlewares/Protected");

const router = require("express").Router();

router.get("/get-allcontest/:match_id", Protected, getContestByMatchId);

module.exports = router;