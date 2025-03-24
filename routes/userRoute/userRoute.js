const express = require("express");
const router = express.Router();

const {
    logoutUser,
    registerOrLoginUser,
    verifyOtpForUser,
    deleteUser
} = require("../../controllers/userAuthController/authController");

router
    .post("/register-login", registerOrLoginUser)
    .post("/verify-otp", verifyOtpForUser)
    .get("/delete/:_id", deleteUser)

router
    .post("/logout", logoutUser);

module.exports = router;
