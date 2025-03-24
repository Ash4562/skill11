const mongoose = require('mongoose');

const userMatchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  avatar: { type: String },
  players: [{
    name: { type: String },
    points: { type: Number },
  }],
});
module.exports = mongoose.model("Match", userMatchSchema);