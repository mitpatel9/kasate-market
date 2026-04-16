import { Redis } from "@upstash/redis";
import dotenv from "dotenv";

dotenv.config();

export const redis = new Redis({
  url: process.env.REST_URL,
  token: process.env.TOKEN,
});

export function connectRedis() {
  console.log("Redis client initialized");
  return redis;
}
