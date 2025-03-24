const express = require('express');
const { getLiveMatchesData } = require('../../controllers/adminController/matchController');
const { protect } = require('../../middlewares/adminAuthProtected');

const router = express.Router();

// Route to fetch live match data
router.get('/live', protect, getLiveMatchesData);

module.exports = router;