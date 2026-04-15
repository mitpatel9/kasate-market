import { Redis } from "@upstash/redis";
import dotenv from "dotenv";

dotenv.config();

let redis;


export function connectRedis() {
  redis = new Redis({
    url: process.env.REST_URL,
    token: process.env.TOKEN,
  });

  return redis;
}
