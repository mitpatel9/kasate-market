import mongoose from "mongoose";
import { marketModel } from "./schema/marketSchema.js";

export const add_market = async (data) => {
  return await new marketModel(data).save();
};

export const get_market_Id = async (id) => {
  return await marketModel.findById(id);
};

export const all_market = async () => {
  return await marketModel.aggregate([
    {
      $match: {
        status: "Active",
      },
    },
  ]);
};

export const get_all_market = async (skip, limit) => {
  return await marketModel.aggregate([
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
        totalCount: [
          {
            $count: "length",
          },
        ],
      },
    },
  ]);
};

export const get_market_category = async (category, sub) => {
  let obj = { status: "Active", visibility: "Public" };

  if (category) {
    obj.menu_id = new mongoose.Types.ObjectId(category);
  }
  if (sub) {
    obj.category_id = new mongoose.Types.ObjectId(sub);
  }
  return await marketModel.aggregate([
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
  ]);
};

export const update_market = async (id, data) => {
  return await marketModel.findByIdAndUpdate(id, data, { new: true });
};

export const delete_market = async (id) => {
  return await marketModel.findOneAndDelete({ _id: id });
};