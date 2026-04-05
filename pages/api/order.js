import dbConnect from "../../lib/mongodb";
import nextConnect from "next-connect";
import orderModal from "../../models/orderModal";

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
    const order = await orderModal.add_order(req.body);
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
      const order = await orderModal.get_order_Id(req.query.id);
      return res.status(200).json({
        success: true,
        data: order,
        msg: "Order get succesfully..",
      });
    } else if ((req.query.skip, req.query.limit)) {
      const order = await orderModal.get_all_order(
        req.query.skip,
        req.query.limit,
      );
      return res.status(200).json({
        success: true,
        data: order,
        msg: "Order get succesfully..",
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
    await orderModal.update_order(req.body.id, req.body);
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
    const order = await orderModal.delete_order(req.query.id);
    return res.status(200).json({
      success: true,
      data: order,
      msg: "Order has been delete succesfully.",
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
