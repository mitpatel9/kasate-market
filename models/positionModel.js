import mongoose from "mongoose";
import positionModel from "./schema/positionSchema";

module.exports = {
  add_position: async (data) => {
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
  },

  get_position_Id: async (id) => {
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
  },

  get_all_position: async (skip, limit) => {
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
  },

  update_position: async (id, data) => {
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
  },

  delete_position: async (id) => {
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
  },
};
