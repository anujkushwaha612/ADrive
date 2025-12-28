import express from "express";
import validateIDMiddleware from "../middlewares/validateID.middleware.js";
import { deleteFile, getFileById, initUpload, renameFile, uploadFile } from "../controllers/file.controller.js";
import checkAuth from "../middlewares/auth.middleware.js";
const router = express.Router();

router.param("parentDirId", validateIDMiddleware);
router.param("id", validateIDMiddleware);

router.get("/:id", checkAuth, getFileById);
router.post("/init-upload", checkAuth, initUpload);
router.post("/:parentDirId?", checkAuth, uploadFile);
router.patch("/:id", checkAuth, renameFile);
router.delete("/:id", checkAuth, deleteFile);

export default router;
