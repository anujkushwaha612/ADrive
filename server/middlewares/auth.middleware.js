import User from "../models/user.model.js";

export default async function checkAuth(req, res, next) {
  const { token } = req.signedCookies;
  if (!token) {
    res.clearCookie("token");
    return res.status(401).json({ error: "Not logged!" });
  }

  const { id, expiry } = JSON.parse(token)
  if (expiry < Math.round(Date.now() / 1000)) {
    res.clearCookie("token");
    return res.status(401).json({ error: "Not logged in!" });
  }
  const user = await User.findOne({ _id: id }).lean();
  if (!user) {
    res.clearCookie("token");
    return res.status(401).json({ error: "Not logged!" });
  }
  req.user = user;
  next();
}
