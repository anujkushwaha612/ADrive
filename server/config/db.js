import mongoose from "mongoose";

export async function connectDB() {
  try {
    await mongoose.connect("mongodb://anuj:anuj123@localhost:27017/storageApp");
    console.log("DB connected")
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  try {
    console.log("Client Disconnected");
    await mongoose.disconnect();
  } catch (err) {
    console.error("Error while disconnecting client:", err);
  } finally {
    process.exit(0); // optionally exit cleanly
  }
});

