import express from "express";
import { connectRedis } from "./redis/redisClient.js";
import orderRoutes from "./routes/orderRoutes.js";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT ;
const app = express();

app.use(express.json());

//all routes for api
app.use("/api", orderRoutes);

app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});
