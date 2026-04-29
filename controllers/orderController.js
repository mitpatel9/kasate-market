//import { processOrder } from "../engine/matchingEngine.js";
import dbConnect from "../lib/mongodb.js";
import { processOrder } from "../engine/matchingEngine.js";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 8);

function generateUniqueOrderId(marketId, outcomeId) {
  return `KASATE_${marketId}_${outcomeId}_${nanoid()}`;
}

export async function placeOrder(req, res) {
  try {
    const { marketId, outcomeId, userId, quantity } = req.body;

    await dbConnect();

    // Validation
    if (!marketId) {
      return res
        .status(400)
        .json({ success: false, msg: "marketId is required" });
    }

    if (!outcomeId) {
      return res
        .status(400)
        .json({ success: false, msg: "outcomeId is required" });
    }

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, msg: "userId is required" });
    }

    if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
      return res
        .status(400)
        .json({ success: false, msg: "Quantity must be a positive integer" });
    }

    const uniqueId = generateUniqueOrderId(
      req?.body.marketId,
      req.body.outcomeId,
    );
    //order object
    const order = {
      ...req.body,
      orderId: uniqueId,
      status: "OPEN",
    };

    // Process order matching
    try {
      await processOrder(order);
    } catch (matchingError) {
      return res.status(500).json({
        success: false,
        msg: "Order matching error:",
        error: matchingError.message,
      });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, msg: "Server Error", error: error.message });
  }
}
