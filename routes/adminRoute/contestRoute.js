const express = require('express');
const { createContest, getContestByMatchId, getAllContests } = require('../../controllers/adminController/contestController');
const router = express.Router()


router.post("/create-contest", createContest)
router.get("/get-allcontest", getAllContests);
router.get("/get-contest/:match_id", getContestByMatchId);

module.exports = router;