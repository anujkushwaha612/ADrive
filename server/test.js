import redisClient from "./redis.js";

const result = await redisClient.json.get("user:1",{
    path: "$.age"
} );

console.log(result);
await redisClient.quit();
