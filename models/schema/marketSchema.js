import mongoose from "mongoose";

const marketSchema = new mongoose.Schema(
  {
    title: { type: String, default: "", required: true },
    market_img: { type: String, default: "" },
    slug: { type: String, default: "" },
    menu_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "menus",
      required: true,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "submenus",
      required: true,
    },
    tags: [],
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admins",
      required: true,
    },
    pricing_model: {
      type: String,
      enum: ["AMM", "ORDERBOOK", "FIXED_ODDS", "PARIMUTUEL", "HYBRID"],
      default: "AMM",
    },
    amm_model: {
      type: String,
      enum: ["LMSR", "CPMM", "CSMM"],
      default: "LMSR",
    },
    market_type: {
      type: String,
      enum: ["Binary", "Multi_Outcome", "Scalar"],
      default: "Binary",
    },
    settlement_status: {
      type: String,
      enum: ["Pending", "Settled", "Failed"],
      default: "Pending",
    },
    visibility: {
      type: String,
      enum: ["Public", "Unlisted"],
      default: "Unlisted",
    },
    market_mode: {
      type: String,
      enum: ["Annually", "Monthly", "Daily"],
      default: "Annually",
      required: true,
    },
    start_date: { type: Date, default: "" },
    end_date: { type: Date, default: "" },
    open_time: { type: String, default: "", required: true },
    closed_time: { type: String, default: "", required: true },
    min_trade_amount: { type: Number, default: 0 },
    max_trade_amount: { type: Number, default: 0 },
    outcomes: [],
    market_context: { type: Boolean, default: false },
    important_information: { type: String, default: "" },
    rules_summary: [
      {
        outcomes_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "outcomes",
        },
        desc: { type: String, default: "" },
      },
    ],
    series: { type: String, default: "", unique: true, required: true },
    event: { type: String, default: "", unique: true, required: true },
    market_id: { type: String, default: "", unique: true, required: true },
    additional_prohibitions: { type: String, default: "" },
    about: { type: String, default: "" },
    is_paused: { type: Boolean, default: false },
    volume: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Inactive", "Active", "Resolved", "Cancelled"],
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

const marketModel =
  mongoose.models.market || mongoose.model("market", marketSchema);
module.exports = marketModel;
