const axios = require("axios");

const apiClient = axios.create({
  baseURL: "https://rest.entitysport.com/v2",
  params: {
    token: process.env.ENTITYSPORT_API_TOKEN, // Ensure the token is picked from .env
  },
});

module.exports = apiClient;
