import { ObjectId } from "mongodb";

export default async function checkAuth(req, res, next) {
  const { uid } = req.cookies;
  if (req.method == "PATCH") {
    console.log(uid);
  }
  const db = req.db;
  if (!uid) {
    return res.status(401).json({ error: "Not logged!" });
  }
  const user = await db.collection("users").findOne({ _id: new ObjectId(uid) });
  if (!user) {
    return res.status(401).json({ error: "Not logged!" });
  }
  req.user = user;
  next();
}
