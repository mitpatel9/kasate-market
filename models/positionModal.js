import mongoose from "mongoose";
import positionModal from "./schema/positionSchema";

module.exports = {
  add_position: async (data) => {
    return new Promise(async (resolve, reject) => {
      await new positionModal(data)
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
      await positionModal
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
      await positionModal
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

  update_position: async (id, data) => {
    return new Promise(async (resolve, reject) => {
      await positionModal
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
      await positionModal
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
