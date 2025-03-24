const axios = require("axios");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Client connected for live updates");

    socket.on("join-match", (matchId) => {
      setInterval(async () => {
        const url = `https://rest.entitysport.com/v2/matches/${matchId}/live?token=${process.env.ENTITYSPORT_API_TOKEN}`;
        const response = await axios.get(url);
        const matchData = response.data.response;

        // Broadcast Live Match Updates
        io.to(socket.id).emit("live-update", {
          teams: matchData.teams,
          overs: matchData.innings[0]?.overs || 0,
          runs: matchData.innings[0]?.runs || 0,
        });
      }, 10000); // 10-second interval
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });
};
