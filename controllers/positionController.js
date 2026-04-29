import dbConnect from "../lib/mongodb.js";
import {
  add_position,
  getOrCreatePosition,
  update_position,
} from "../models/positionModel.js";

export async function buyerPosition(trade) {
  await dbConnect();
  const { marketId, outcomeId } = trade;

  // Buyer & Seller
  const buyerId = trade.buyerId;

  //  buyer position find
  let buyerPos = await getOrCreatePosition(buyerId, marketId, outcomeId);

  return buyerPos;
}

export async function sellerPosition(trade) {
  await dbConnect();
  const { marketId, outcomeId } = trade;

  const sellerId = trade.sellerId;

  // SELLER POSITION UPDATE
  let sellerPos = await getOrCreatePosition(sellerId, marketId, outcomeId);

  if (!sellerPos) {
    sellerPos = await add_position({
      user: sellerId,
      market: marketId,
      outcome: outcomeId,
    });
  }

  return sellerPos;
}

export async function updateUserPosition(id, data) {
  try {
    await dbConnect();
    await update_position(id, data);
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, msg: "Server Error", error: error.message });
  }
}
