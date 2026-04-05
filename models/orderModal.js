import mongoose from "mongoose";
import tradeModal from "./schema/tradeSchema";

module.exports = {
  add_order: async (data) => {
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

  get_order_Id: async (id) => {
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

  all_order: async (skip, limit) => {
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

  update_order: async (id, data) => {
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

  delete_order: async (id) => {
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
