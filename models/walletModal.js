import mongoose from "mongoose";
import walletModel from "./schema/walletSchema";

module.exports = {
  add_wallet: async (data) => {
    return new Promise(async (resolve, reject) => {
      await new walletModel(data)
        .save()
        .then((result) => {
          resolve(result);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  get_wallet_Id: async (id) => {
    return new Promise(async (resolve, reject) => {
      await walletModel
        .findById(id)
        .then((result) => {
          resolve(result);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  get_all_wallet: async (skip, limit) => {
    return new Promise(async (resolve, reject) => {
      await walletModel
        .aggregate([
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

  update_wallet: async (id, data) => {
    return new Promise(async (resolve, reject) => {
      await walletModel
        .findByIdAndUpdate(id, data)
        .then((result) => {
          resolve(result);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  delete_wallet: async (id) => {
    return new Promise(async (resolve, reject) => {
      await walletModel
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
