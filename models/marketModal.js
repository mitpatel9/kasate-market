import mongoose from "mongoose";
import marketModal from "./schema/marketSchema";

module.exports = {
  add_market: async (data) => {
    return new Promise(async (resolve, reject) => {
      await new marketModal(data)
        .save()
        .then((result) => {
          resolve(result);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  get_market_Id: async (id) => {
    return new Promise(async (resolve, reject) => {
      await marketModal
        .findById(id)
        .then((result) => {
          resolve(result);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  all_market: async () => {
    return new Promise(async (resolve, reject) => {
      await marketModal
        .aggregate([
          {
            $match: {
              status: "Active",
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

  get_all_market: async (skip, limit) => {
    return new Promise(async (resolve, reject) => {
      await marketModal
        .aggregate([
          {
            $lookup: {
              from: "menus",
              let: { menu_id: "$menu_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ["$_id", "$$menu_id"] }],
                    },
                  },
                },
              ],
              as: "menu_id",
            },
          },
          {
            $lookup: {
              from: "submenus",
              let: { category_id: "$category_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ["$_id", "$$category_id"] }],
                    },
                  },
                },
              ],
              as: "category_id",
            },
          },
          {
            $lookup: {
              from: "admins",
              let: { creatorId: "$creatorId" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ["$_id", "$$creatorId"] }],
                    },
                  },
                },
              ],
              as: "creatorId",
            },
          },
          {
            $addFields: {
              outcomes: {
                $map: {
                  input: "$outcomes",
                  as: "o",
                  in: { $toObjectId: "$$o" },
                },
              },
            },
          },
          {
            $lookup: {
              from: "outcomes",
              localField: "outcomes",
              foreignField: "_id",
              as: "outcomes",
            },
          },
          {
            $addFields: {
              tags: {
                $map: {
                  input: "$tags",
                  as: "t",
                  in: { $toObjectId: "$$t" },
                },
              },
            },
          },
          {
            $lookup: {
              from: "tags",
              localField: "tags",
              foreignField: "_id",
              as: "tags",
            },
          },
          {
            $unwind: {
              path: "$rules_summary",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "outcomes",
              let: {
                outcomeId: "$rules_summary.outcomes_id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ["$_id", "$$outcomeId"],
                    },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    title: 1,
                  },
                },
              ],
              as: "rules_summary.outcomes_id",
            },
          },
          {
            $unwind: {
              path: "$rules_summary.outcomes_id",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $group: {
              _id: "$_id",
              doc: { $first: "$$ROOT" },
              rules_summary: { $push: "$rules_summary" },
            },
          },
          {
            $replaceRoot: {
              newRoot: {
                $mergeObjects: ["$doc", { rules_summary: "$rules_summary" }],
              },
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

  get_market_category: async (category, sub) => {
    return new Promise(async (resolve, reject) => {
      let obj = { status: "Active", visibility: "Public" };

      if (category) {
        obj.menu_id = new mongoose.Types.ObjectId(category);
      }
      if (sub) {
        obj.category_id = new mongoose.Types.ObjectId(sub);
      }
      await marketModal
        .aggregate([
          {
            $match: obj,
          },
          {
            $addFields: {
              outcomes: {
                $map: {
                  input: "$outcomes",
                  as: "o",
                  in: { $toObjectId: "$$o" },
                },
              },
            },
          },
          {
            $lookup: {
              from: "outcomes",
              localField: "outcomes",
              foreignField: "_id",
              as: "outcomes",
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

  update_market: async (id, data) => {
    return new Promise(async (resolve, reject) => {
      await marketModal
        .findByIdAndUpdate(id, data)
        .then((result) => {
          resolve(result);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  delete_market: async (id) => {
    return new Promise(async (resolve, reject) => {
      await marketModal
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
