import mongoose from "mongoose";
import orderModel from "./schema/orderSchema";

module.exports = {
  add_order: async (data) => {
    return new Promise(async (resolve, reject) => {
      await new orderModel(data)
        .save()
        .then((result) => {
          resolve(result);
        })
        .catch((error) => {
          console.log(error, "sasas");
          reject(error);
        });
    });
  },

  get_order_Id: async (id) => {
    return new Promise(async (resolve, reject) => {
      await orderModel
        .findById(id)
        .then((result) => {
          resolve(result);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  get_all_order: async (skip, limit) => {
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
  },

  update_order: async (id, data) => {
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
  },

  delete_order: async (id) => {
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
  },
};
