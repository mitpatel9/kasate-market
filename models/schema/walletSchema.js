import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    wallet: {
      balance: { type: Number, default: 0 },
      lockedBalance: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ["Inactive", "Active"],
      default: "Inactive",
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

export const walletModel =
  mongoose.models.wallet || mongoose.model("wallet", walletSchema);

