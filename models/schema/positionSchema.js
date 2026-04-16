import mongoose from "mongoose";

const positionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    market: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "markets",
      required: true,
    },
    yesShares: {
      type: Number,
      default: 0,
    },
    noShares: {
      type: Number,
      default: 0,
    },
    yesAvgPrice: { type: Number, default: 0 },
    noAvgPrice: { type: Number, default: 0 },
  },
  { timestamps: true },
);

//Prevent duplicate positions (one per user per market)
positionSchema.index({ user: 1, market: 1 }, { unique: true });

export const positionModel =
  mongoose.models.position || mongoose.model("position", positionSchema);

