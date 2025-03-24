const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);

exports.sendOtp = async (phone, otp) => {
  const res = await client.messages.create({
    body: `Your Verfication Code Is ${otp}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });
  console.log(res);
};
