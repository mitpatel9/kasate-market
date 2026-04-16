import mongoose from "mongoose";
import { walletModel } from "./schema/walletSchema.js";

export const add_wallet = async (data) => {
  return await new walletModel(data).save();
};

export const get_wallet_Id = async (id) => {
  return await walletModel.findById(id);
};

export const get_all_wallet = async (skip, limit) => {
  return await walletModel.aggregate([
    {
      $lookup: {
        from: "users",
        let: { userId: "$userId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$_id", "$$userId"] }],
              },
            },
          },
        ],
        as: "userId",
      },
    },
    {
      $facet: {
        data: [
          {
            $skip: Number(skip),
          },
          {
            $limit: Number(limit),
          },
        ],
        totalCount: [
          {
            $count: "length",
          },
        ],
      },
    },
  ]);
};

export const update_wallet = async (id, data) => {
  return await walletModel.findByIdAndUpdate(id, data, { new: true });
};

export const delete_wallet = async (id) => {
  return await walletModel.findOneAndDelete({ _id: id });
};