const Trade = require("../models/trade");

async function createTrade(data) {
  return await Trade.create(data);
}

module.exports = { createTrade };