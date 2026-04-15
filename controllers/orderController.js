//import { processOrder } from "../engine/matchingEngine.js";
import dbConnect from "../lib/mongodb.js";
import { add_order } from "../models/orderModel.js";

export async function placeOrder(req, res) {
  try {
    const { marketId, outcomeId, userId, quantity } = req.body;

    await dbConnect();

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

    if (quantity === undefined || quantity === null) {
      return res
        .status(400)
        .json({ success: false, msg: "Quantity is required" });
    }

    // order create
    const order = await add_order({
      ...req.body,
      status: "OPEN",
    });

    return res.status(201).json({
      success: true,
      data: order,
      msg: "Your order has been created successfully.",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, msg: "Server Error", error: error.message });
  }
}
