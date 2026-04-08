const Wallet = require("../models/wallet");

async function lockFunds(userId, amount, session) {
  const wallet = await Wallet.findOne({ userId }).session(session);

  if (!wallet) throw new Error("Wallet not found");

  if (wallet.balance < amount) {
    throw new Error("Insufficient balance");
  }

  wallet.balance -= amount;
  wallet.locked += amount;

  await wallet.save({ session });

  return wallet;
}

async function unlockFunds(userId, amount, session) {
  const wallet = await Wallet.findOne({ userId }).session(session);

  wallet.locked -= amount;
  wallet.balance += amount;

  await wallet.save({ session });
}

async function settleTrade(buyerId, sellerId, totalCost, session) {
  const buyer = await Wallet.findOne({ userId: buyerId }).session(session);
  const seller = await Wallet.findOne({ userId: sellerId }).session(session);

  buyer.locked -= totalCost;
  seller.balance += totalCost;

  await buyer.save({ session });
  await seller.save({ session });
}

module.exports = {
  lockFunds,
  unlockFunds,
  settleTrade,
};