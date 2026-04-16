import mongoose from "mongoose";
import { orderModel } from "./schema/orderSchema.js";

export const add_order = async (data) => {
  return await new orderModel(data).save();
};

export const get_order_Id = async (id) => {
  return await orderModel.findById(id);
};

export const get_all_order = async (skip, limit) => {
  return new Promise(async (resolve, reject) => {
    await orderModel
      .aggregate([
        {
          $lookup: {
            from: "markets",
            let: { marketId: "$marketId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$_id", "$$marketId"] }],
                  },
                },
              },
            ],
            as: "marketId",
          },
        },
        {
          $lookup: {
            from: "outcomes",
            let: { outcomeId: "$outcomeId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$_id", "$$outcomeId"] }],
                  },
                },
              },
            ],
            as: "outcomeId",
          },
        },
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
      ])
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export const update_order = async (id, data) => {
  return new Promise(async (resolve, reject) => {
    await orderModel
      .findByIdAndUpdate(id, data)
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export const delete_order = async (id) => {
  return new Promise(async (resolve, reject) => {
    await orderModel
      .findOneAndDelete({ _id: id })
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
};
