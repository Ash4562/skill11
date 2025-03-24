const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
  matchId: { type: String, required: true, unique: true },
  teamA: { type: String, required: true },
  teamB: { type: String, required: true },
  status: { type: String, required: true }, // live, upcoming, completed
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }], // Array of player IDs
});

module.exports = mongoose.model("Match", matchSchema);
