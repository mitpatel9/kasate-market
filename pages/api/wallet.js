import dbConnect from "@/lib/mongodb";
import nextConnect from "next-connect";
import walletModel from "@/models/walletModal";

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
    const wallet = await walletModel.add_wallet(req.body);
    return res.status(201).json({
      success: true,
      data: wallet,
      msg: "Wallet has been created successfully.",
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
      const wallet = await walletModel.get_wallet_Id(req.query.id);
      return res.status(200).json({
        success: true,
        data: wallet,
        msg: "Wallet get successfully..",
      });
    } else if ((req.query.skip, req.query.limit)) {
      const wallet = await walletModel.get_all_wallet(
        req.query.skip,
        req.query.limit,
      );
      return res.status(200).json({
        success: true,
        data: wallet,
        msg: "Wallet get successfully..",
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
    await walletModel.update_wallet(req.body.id, req.body);
    return res
      .status(201)
      .json({ success: true, msg: "Wallet data has been Updated." });
  } catch {
    return res.status(400).json({ success: false, msg: "Wrong Details" });
  }
});

//delete request
apiRoute.delete(async (req, res) => {
  res.setHeader("Allow", ["DELETE"]);
  try {
    await dbConnect();
    const wallet = await walletModel.delete_wallet(req.query.id);
    return res.status(200).json({
      success: true,
      data: wallet,
      msg: "Wallet has been deleted successfully.",
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
