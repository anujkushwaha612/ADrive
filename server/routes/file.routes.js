import express from "express";
import validateIDMiddleware from "../middlewares/validateID.middleware.js";
import { deleteFile, getFileById, renameFile, uploadFile } from "../controllers/file.controller.js";
const router = express.Router();

router.param("parentDirId", validateIDMiddleware);
router.param("id", validateIDMiddleware);

router.get("/:id", getFileById);
router.post("/:parentDirId?", uploadFile);
router.patch("/:id", renameFile);
router.delete("/:id", deleteFile);

export default router;
