import mongoose from "mongoose";
import { positionModel } from "./schema/positionSchema.js";

export const add_position = async (data) => {
  return new Promise(async (resolve, reject) => {
    await new positionModel(data)
      .save()
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export const get_position_Id = async (id) => {
  return new Promise(async (resolve, reject) => {
    await positionModel
      .findById(id)
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export const getOrCreatePosition = async (userId, marketId, outcomeId) => {
  return new Promise(async (resolve, reject) => {
    await positionModel
      .findOneAndUpdate(
        { user: userId, market: marketId, outcome: outcomeId },
        {
          $setOnInsert: {
            user: userId,
            market: marketId,
            outcome: outcomeId,
            yesShares: 0,
            noShares: 0,
            yesAvgPrice: 0,
            noAvgPrice: 0,
            realizedPnl: 0,
            unrealizedPnl: 0,
          },
        },
        { new: true, upsert: true },
      )
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export const get_all_position = async (skip, limit) => {
  return new Promise(async (resolve, reject) => {
    await positionModel
      .aggregate([
        {
          $lookup: {
            from: "markets",
            let: { market: "$market" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$_id", "$$market"] }],
                  },
                },
              },
            ],
            as: "market",
          },
        },

        {
          $lookup: {
            from: "users",
            let: { user: "$user" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$_id", "$$user"] }],
                  },
                },
              },
            ],
            as: "user",
          },
        },

        {
          $facet: {
            data: [
              {
                $skip: 0,
              },
              {
                $limit: 10,
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

export const update_position = async (id, data) => {
  return new Promise(async (resolve, reject) => {
    await positionModel
      .findByIdAndUpdate(id, data)
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export const delete_position = async (id) => {
  return new Promise(async (resolve, reject) => {
    await positionModel
      .findOneAndDelete({ _id: id })
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
};
