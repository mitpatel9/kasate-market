import express from "express";
import { connectRedis } from "./redis/redisClient.js";
import orderRoutes from "./routes/orderRoutes.js";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

// Initialize server configuration
const PORT = process.env.PORT || 3000;
const app = express();

// MIDDLEWARE
// Parse incoming JSON request bodies
app.use(express.json());

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Initialize Redis connection for caching and data operations
connectRedis();

// ===== ROUTES =====
// Health check endpoint - returns server status
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    msg: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

// Order-related API routes
app.use("/api", orderRoutes);

// ===== ERROR HANDLING MIDDLEWARE =====
// Centralized error handler for all server errors
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    msg: err.message || "Server Error",
  });
});

// ===== 404 NOT FOUND HANDLER =====
app.use((req, res) => {
  res.status(404).json({ success: false, msg: "Route not found" });
});

// ===== SERVER STARTUP =====
// Start the Express server and listen for incoming requests
app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});
