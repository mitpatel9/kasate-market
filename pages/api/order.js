import dbConnect from "@/lib/mongodb";
import nextConnect from "next-connect";
import orderModel from "@/models/orderModel";

const apiRoute = nextConnect({
  onError(error, req, res) {
    console.log(error);
    res.status(500).json({
      status: false,
      msg: `internal server issue, ${error.message}`,
    });
  },
  onNoMatch(req, res) {
    res
      .status(405)
      .json({ status: false, error: `Method '${req.method}' Not Allowed` });
  },
});

//post request
apiRoute.post(async (req, res) => {
  res.setHeader("Allow", ["POST"]);
  try {
    await dbConnect();
    const order = await orderModel.add_order(req.body);
    return res.status(201).json({
      success: true,
      data: order,
      msg: "Order has been created successfully.",
    });
  } catch {
    return res.status(400).json({ success: false, msg: "Wrong Details" });
  }
});

//get request
apiRoute.get(async (req, res) => {
  res.setHeader("Allow", ["GET"]);
  try {
    await dbConnect();
    if (req.query.id) {
      const order = await orderModel.get_order_Id(req.query.id);
      return res.status(200).json({
        success: true,
        data: order,
        msg: "Order get successfully..",
      });
    } else if ((req.query.skip, req.query.limit)) {
      const order = await orderModel.get_all_order(
        req.query.skip,
        req.query.limit,
      );
      return res.status(200).json({
        success: true,
        data: order,
        msg: "Order get successfully..",
      });
    }
  } catch {
    return res.status(400).json({ success: false, msg: "Wrong Details" });
  }
});

//put request
apiRoute.put(async (req, res) => {
  res.setHeader("Allow", ["PUT"]);
  try {
    await dbConnect();
    await orderModel.update_order(req.body.id, req.body);
    return res
      .status(201)
      .json({ success: true, msg: "Order data has been Updated." });
  } catch {
    return res.status(400).json({ success: false, msg: "Wrong Details" });
  }
});

//delete request
apiRoute.delete(async (req, res) => {
  res.setHeader("Allow", ["DELETE"]);
  try {
    await dbConnect();
    const order = await orderModel.delete_order(req.query.id);
    return res.status(200).json({
      success: true,
      data: order,
      msg: "Order has been deleted successfully.",
    });
  } catch {
    return res.status(400).json({ success: false, msg: "Wrong Details" });
  }
});

export const config = {
  api: {
    bodyParser: true, // Disallow body parsing, consume as stream
  },
};
export default apiRoute;
