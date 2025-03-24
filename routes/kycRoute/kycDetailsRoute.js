const express = require('express');
const { createPanDetail } = require('../../controllers/kycDetails/kycDetailsControllers');
const { Protected } = require('../../middlewares/Protected');

const router = express.Router();

router.post('/create', Protected, createPanDetail);

module.exports = router;
