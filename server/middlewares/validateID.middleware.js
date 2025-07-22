export default function (req, res, next, id) {
  const regexExp =
    /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;
  if (!regexExp.test(id)) {
    return res.status(400).json({
      error: `Invalid ID : ${id}`,
    });
  }
  next();
}
