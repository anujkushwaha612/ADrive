import Session from "../models/session.model.js";

export default async function checkAuth(req, res, next) {
  const { sessionId } = req.signedCookies;
  if (!sessionId) {
    res.clearCookie("sessionId");
    return res.status(401).json({ error: "Not logged!" });
  }

  const session = await Session.findById(sessionId).populate("user");
  if (!session) {
    res.clearCookie("sessionId");
    return res.status(401).json({ error: "Not logged!" });
  }
  req.user = session.user;
  next();
}
