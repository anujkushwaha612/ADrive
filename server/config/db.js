import { MongoClient } from "mongodb";

export const client = new MongoClient("mongodb://127.0.0.1:27017/storageApp");

export async function connectDB() {
  await client.connect();
  const db = client.db();
  console.log("DB connected")

  return db;
}

process.on("SIGINT", async () => {
  try {
    console.log("Client Disconnected");
    await client.close();
  } catch (err) {
    console.error("Error while disconnecting client:", err);
  } finally {
    process.exit(0); // optionally exit cleanly
  }
});

