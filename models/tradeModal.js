import mongoose from "mongoose";
import tradeModal from "./schema/tradeSchema";

module.exports = {
  add_trade: async (data) => {
    return new Promise(async (resolve, reject) => {
      await new tradeModal(data)
        .save()
        .then((result) => {
          resolve(result);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  get_trade_Id: async (id) => {
    return new Promise(async (resolve, reject) => {
      await tradeModal
        .findById(id)
        .then((result) => {
          resolve(result);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  all_trade: async (skip, limit) => {
    return new Promise(async (resolve, reject) => {
      await tradeModal
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
            $facet: {
              data: [
                {
                  $skip: Number(skip),
                },
                {
                  $limit: Number(limit),
                },
              ],
              totalcount: [
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

  update_trade: async (id, data) => {
    return new Promise(async (resolve, reject) => {
      await tradeModal
        .findByIdAndUpdate(id, data)
        .then((result) => {
          resolve(result);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  delete_trade: async (id) => {
    return new Promise(async (resolve, reject) => {
      await tradeModal
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
