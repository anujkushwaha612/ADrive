import express from "express";
import { rm, writeFile } from "fs/promises";
import foldersData from '../foldersDB.json' with {type: "json"} ;
import filesData from '../filesDB.json' with {type: "json"} ;
import validateIDMiddleware from "../middlewares/validateID.middleware.js";

const router = express.Router();

//! Why ./storage still serves content on hitiing "/" route
//? Your Project Structure (assumed)
//? Suppose your project looks like this:
//? project-root/
//? │
//? ├── storage/
//? │     └── ...your files/folders
//? │
//? ├── routes/
//? │     └── directory.routes.js  (contains your route code)
//? │
//? ├── app.js / server.js         (your main entry point)
//? │
//? └── package.json
//! How File Paths Work in Node.js
//* Relative paths in Node (./storage/...) are almost always resolved relative to the working directory (process.cwd()), not the file containing the code.
//* When you start your app (probably with node app.js in project-root), the default working directory is the root of your project, regardless of where directory.routes.js lives.

router.param("parentDirId", validateIDMiddleware);
router.param("id", validateIDMiddleware);

router.get("/:id?", async (req, res, next) => {
  //   try {
  //     const directoryname = path.join("/", req.params[0]);
  //     const fullDirPath = `./storage/${directoryname ? directoryname : ""}`;
  //     const dirEntries = await fs.readdir(fullDirPath, {
  //       withFileTypes: true,
  //     });

  //     const filesList = dirEntries.map((entry) => ({
  //       name: entry.name,
  //       type: entry.isDirectory() ? "directory" : "file",
  //     }));
  //     res.json(filesList);
  //   } catch (err) {
  //     res.status(500).json({ error: err.toString() });
  //   }
  try {
    const user = req.user;
    const id = req.params.id || user.rootDirId;

    const folderData = foldersData.find((folder) => folder.userId === user.id && folder.id === id)
    if (!folderData) {
      return res.status(403).json({
        message: "You dont have access to this file",
      });
    }
    const files = folderData.files.map((fileId) =>
      filesData.find((file) => file.id === fileId)
    );
    const directories = folderData.directories
      .map((directoryId) =>
        foldersData.find((folder) => folder.id === directoryId)
      )
      .map(({ id, name }) => ({ id, name }));
    return res.status(200).json({ ...folderData, files, directories });
  } catch (error) {
    error.message = "Failed to get the directory";
    next(error);
  }
});

router.post("/:parentDirId?", async (req, res, next) => {
  try {
    // const directoryname = path.join("/", req.params[0]);

    // await mkdir(`./storage/${directoryname}`);
    // res.json({
    //   message: "Folder created successfully",
    // });
    const user = req.user;
    const parentDirId = req.params.parentDirId || user.rootDirId;
    
    const { dirname } = req.body || "New Folder";
    
    const id = crypto.randomUUID();

    const newDirectoryData = {
      id,
      userId : user.id,
      name: dirname,
      parentDirId,
      files: [],
      directories: [],
    };
    const parentDirData = foldersData.find((folder) => folder.id === parentDirId && folder.userId === user.id);
    if (!parentDirData) {
      return res.status(404).json({
        message: "Parent directory does not exist",
      });
    }
    parentDirData.directories.push(id);
    foldersData.push(newDirectoryData);
    await writeFile("./foldersDB.json", JSON.stringify(foldersData));
    return res.status(201).json({
      message: "Directory created successfully",
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { newDirname } = req.body;
    if (!newDirname) {
      return res.status(400).json({
        message: "valid directory name is reqired",
      });
    }
    const dirData = foldersData.find((folder) => folder.id === id && folder.userId === req.user.id);
    if (!dirData) {
      return res.status(404).json({
        message: "No such directory exist",
      });
    }
    dirData.name = newDirname;
    await writeFile("./foldersDB.json", JSON.stringify(foldersData));
    return res.status(200).json({
      message: "Directory renamed successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to rename directory",
    });
  }
});

async function deleteDirectory(dirId , user) {
  const directoryIndex = foldersData.findIndex((dir) => dir.id === dirId && dir.userId === user.id);
  if (directoryIndex === -1) return;
  const directoryData = foldersData[directoryIndex];
  foldersData.splice(directoryIndex, 1);
  try {
    for (const fileId of directoryData.files) {
      const fileIndex = filesData.findIndex((file) => file.id === fileId && file.userId === user.id);
      const { extension } = filesData[fileIndex];
      await rm(`./storage/${fileId}${extension}`);
      filesData.splice(fileIndex, 1);
    }

    for (const dirId of directoryData.directories) {
      await deleteDirectory(dirId,user);
    }

    await writeFile("./filesDB.json", JSON.stringify(filesData));
    await writeFile("./foldersDB.json", JSON.stringify(foldersData));
  } catch (error) {
    console.log("deleteDirectory error :- ", error);
  }
}

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  if (id === req.user.rootDirId) {
    return res.status(400).json({ error: "Cannot delete root directory" });
  }
  try {
    const directoryData = foldersData.find((dir) => dir.id === id && dir.userId === req.user.id);
    if (!directoryData) {
      return res.status(403).json({
        message: "Unauthorised Acccess",
      });
    }
    const parentDirData = foldersData.find(
      (dir) => dir.id === directoryData.parentDirId && dir.userId === req.user.id
    );
    parentDirData.directories = parentDirData.directories.filter(
      (dirId) => dirId !== id
    );
    await deleteDirectory(id , user);
    return res.status(200).json({ message: "Folder deleted successfully!" });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete the directory",
    });
  }
});

export default router;
