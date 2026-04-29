import express from "express";
import { redis } from "./redis/redisClient.js";
import orderRoutes from "./routes/orderRoutes.js";
import cors from "cors";
import dotenv from "dotenv";
import { updatePositions } from "./engine/matchingEngine.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Initialize Redis connection
;

// Routes
app.use("/api", orderRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    msg: err.message || "Server Error",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, msg: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});
