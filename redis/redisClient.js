//import { Redis } from "@upstash/redis";
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

//upstash connection 
// export const redis = new Redis({
//   url: process.env.REST_URL,
//   token: process.env.TOKEN,
// });


export const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  username: process.env.REDIS_USERNAME || "default",
  password: process.env.REDIS_PASSWORD,

  //Important for production-like behavior
  maxRetriesPerRequest: null,
  enableReadyCheck: true,

  reconnectOnError(err) {
    console.error("Redis reconnect error:", err);
    return true;
  },
});

// Debug logs (optional)
redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});