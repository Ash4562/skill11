const express = require('express');
const { registerAdmin, loginAdmin, logoutAdmin, registeredUser, getPanDetails, verifyOTP } = require('../../controllers/adminAuthController/authController');
const router = express.Router();


router.post('/register', registerAdmin);
router.post('/login', loginAdmin);
router.post('/verify-otp', verifyOTP);
router.post('/logout', logoutAdmin);
router.get("/alluser", registeredUser)
router.get("/pan", getPanDetails)

module.exports = router;