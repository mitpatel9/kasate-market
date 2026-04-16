//import { processOrder } from "../engine/matchingEngine.js";
import dbConnect from "../lib/mongodb.js";
import { add_order } from "../models/orderModel.js";
import { processOrder } from "../engine/matchingEngine.js";

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

    // order create
    // const order = await add_order({
    //   ...req.body,
    //   status: "OPEN",
    // });

    // Process order matching
    try {
      await processOrder(order.toObject());
    } catch (matchingError) {
      console.error("Order matching error:", matchingError.message);
    }

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
