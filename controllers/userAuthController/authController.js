const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// const User = require("../../models/user/User");
const { sendOtp } = require("../../utils/sendOtp");
const sendEmail = require("../../utils/sendEmail");
const { OAuth2Client } = require("google-auth-library");
const validator = require("validator");
const rateLimit = require("express-rate-limit");
const User = require("../../models/user/User");

const otpResendLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 3,
  message: "Too many OTP resend attempts. Please try again later.",
  keyGenerator: (req) => req.body.emailOrPhone,
});

const generateAndSendOtp = async (user, contact, method) => {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const otpExpiry = new Date(Date.now() + 2 * 60 * 1000);
  const hashedOtp = await bcrypt.hash(otp, 10);

  user.otp = hashedOtp;
  user.otpExpiry = otpExpiry;
  await user.save();

  if (method === "phone") {
    await sendOtp(contact, otp);
  } else if (method === "email") {
    await sendEmail({
      to: contact,
      subject: "Your OTP for Login/Registration",
      message: `Your OTP is ${otp}`,
      html: `<p>Your OTP for registration/login is: <b>${otp}</b></p>`,
    });
  }
  return otp;
};

exports.registerOrLoginUser = [
  otpResendLimiter,
  asyncHandler(async (req, res) => {
    try {
      const { emailOrPhone, name, resend } = req.body;

      if (!emailOrPhone) {
        return res
          .status(400)
          .json({ message: "Phone number or Email is required" });
      }

      let contactField, contact;

      if (
        validator.isMobilePhone(emailOrPhone, "en-IN", { strictMode: false })
      ) {
        contactField = "phone";
        contact = emailOrPhone.startsWith("+91")
          ? emailOrPhone
          : `+91${emailOrPhone.replace(/^0?(\d+)$/, "$1")}`;
      } else if (validator.isEmail(emailOrPhone)) {
        contactField = "email";
        contact = emailOrPhone;
      } else {
        return res
          .status(400)
          .json({ message: "Invalid phone number or email format" });
      }

      let user = await User.findOne({ [contactField]: contact });

      if (user) {
        if (resend) {
          await generateAndSendOtp(user, contact, contactField);
          return res
            .status(200)
            .json({ message: `OTP resent successfully to ${contactField}` });
        }

        if (name) user.name = name;

        await user.save();
      } else {
        if (resend) {
          return res.status(404).json({ message: "User not found for resend" });
        }

        user = await User.create({ name, [contactField]: contact });
      }

      await generateAndSendOtp(user, contact, contactField);

      res.status(200).json({
        message: user.isNew
          ? `User registered and OTP sent to ${contactField}`
          : `OTP sent successfully to ${contactField}`,
      });
    } catch (error) {
      console.error("Error in registerOrLoginUser:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }),
];

exports.verifyOtpForUser = asyncHandler(async (req, res) => {
  try {
    const { emailOrPhone, otp } = req.body;

    if (!emailOrPhone || !otp) {
      return res
        .status(400)
        .json({ message: "Phone/Email and OTP are required" });
    }

    let contactField,
      contact = emailOrPhone;

    if (validator.isMobilePhone(emailOrPhone, "en-IN", { strictMode: false })) {
      contactField = "phone";
      contact = contact.startsWith("+91")
        ? contact
        : `+91${emailOrPhone.replace(/^0?(\d+)$/, "$1")}`;
    } else if (validator.isEmail(emailOrPhone)) {
      contactField = "email";
    } else {
      return res
        .status(400)
        .json({ message: "Invalid phone number or email format" });
    }

    const user = await User.findOne({ [contactField]: contact }).select(
      "+otp +otpExpiry"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otpExpiry < Date.now()) {
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new OTP." });
    }

    const isValidOtp = await bcrypt.compare(otp, user.otp);
    if (!isValidOtp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpUsed = false;

    // Generate a new token and invalidate the old one
    const token = jwt.sign({ userId: user._id }, process.env.JWT_KEY, {
      expiresIn: "7d",
    });
    user.currentToken = token;
    await user.save();

    res.cookie("auth", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
    res.status(200).json({
      message: "OTP verified and login successful.",
      token,
      user: {
        name: user.name,
        [contactField]: user[contactField],
      },
    });
  } catch (error) {
    console.error("Error in verifyOtpForUser:", error);
    res
      .status(500)
      .json({ message: "Something went wrong. Please try again later." });
  }
});

exports.continueWithGoogle = asyncHandler(async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    if (!email) {
      return res
        .status(400)
        .json({ message: "Email is required from Google account" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: name || "Guest User",
        email,
        avatar: picture || null,
      });
    }

    // Generate new token and update the currentToken field
    const token = jwt.sign({ userId: user._id }, process.env.JWT_KEY, {
      expiresIn: "7d",
    });
    user.currentToken = token;
    await user.save();

    res.cookie("auth", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message: user.isNew ? "Registration successful" : "Login successful",
      user: {
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Google authentication error:", error.message);
    res
      .status(500)
      .json({
        message: "Google authentication failed. Please try again later.",
      });
  }
});

exports.logoutUser = asyncHandler(async (req, res) => {
  try {
    const token = req.cookies?.auth;
    if (!token) {
      return res.status(400).json({ message: "No user is logged in" });
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Invalidate the current token
    user.currentToken = null;
    await user.save();

    res.clearCookie("auth");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error.message);
    res.status(500).json({ message: "Logout failed. Please try again later." });
  }
});

exports.deleteUser = asyncHandler(async (req, res) => {
  console.log(req.params.id);
  const user = await User.findByIdAndDelete(req.params._id);
  console.log("Deleted user:", user);
    const user1 = await User.findById(req.params._id)
  console.log(user1)

  console.log(user);
  if (!user) {  
      return res.status(404).json({ message: "user not found" });
  }
  res.status(200).json({ message: "user deleted successfully" });
});

