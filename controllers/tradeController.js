import Market from "../models/Market.js";
import { buyShares } from "../services/amm.service.js";

export const buy = async (req, res) => {
  try {
    const { marketId, type, amount } = req.body;

    const market = await Market.findById(marketId);
    if (!market) {
      return res.status(404).json({ message: "Market not found" });
    }

    const { updatedMarket, price } = buyShares({
      market,
      type,
      amount,
    });

    await updatedMarket.save();

    // 🔥 Emit real-time update
    const io = req.app.get("io");
    io.to(marketId).emit("price_update", {
      marketId,
      price,
      yesShares: updatedMarket.yesShares,
      noShares: updatedMarket.noShares,
    });

    res.json({
      success: true,
      price,
      market: updatedMarket,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};