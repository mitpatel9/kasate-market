import express from "express";
import {
    placeOrder,
  
} from "../controllers/orderController.js";

const router = express.Router();

// POST - Create a new order
router.post("/order", placeOrder);

 // GET - Get a specific order by ID
//router.get("/order/:orderId", getOrder);

 // PATCH - Cancel an order
// router.patch("/order/:orderId/cancel", cancelOrder);

export default router;