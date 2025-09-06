import express from "express";
import { rm, writeFile } from "fs/promises";
// import foldersData from '../foldersDB.json' with {type: "json"} ;
// import filesData from '../filesDB.json' with {type: "json"} ;
import validateIDMiddleware from "../middlewares/validateID.middleware.js";
import { Db, ObjectId } from "mongodb";

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
    const db = req.db;
    const _id = req.params.id ? new ObjectId(req.params.id) : user.rootDirId;
    const dirCollection = db.collection("directories");

    // const folderData = foldersData.find((folder) => folder.userId === user.id && folder.id === id)
    const directoryData = await dirCollection.findOne({
      _id,
    });
    if (!directoryData) {
      return res.status(403).json({
        message: "You dont have access to this file",
      });
    }
    // const files = folderData.files.map((fileId) =>
    //   filesData.find((file) => file.id === fileId)
    // );
    // const directories = folderData.directories
    //   .map((directoryId) =>
    //     foldersData.find((folder) => folder.id === directoryId)
    //   )
    //   .map(({ id, name }) => ({ id, name }));
    const files = await db
      .collection("files")
      .find({
        parentDirId: directoryData._id,
      })
      .toArray();

    const directories = await dirCollection
      .find({ parentDirId: _id })
      .toArray();

    return res.status(200).json({
      ...directoryData,
      files: files.map((file) => ({ ...file, id: file._id })),
      directories: directories.map((dir) => ({ ...dir, id: dir._id })),
    });
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
    const db = req.db;
    const parentDirId = req.params.parentDirId
      ? new ObjectId(req.params.parentDirId)
      : user.rootDirId;

    const { dirname } = req.body || "New Folder";
    const dirCollection = db.collection("directories");

    // const id = crypto.randomUUID();

    const newDirectoryData = {
      userId: user._id,
      name: dirname,
      parentDirId,
    };
    // const parentDirData = foldersData.find((folder) => folder.id === parentDirId && folder.userId === user.id);
    const parentDirData = await dirCollection.findOne({
      _id: new ObjectId(parentDirId),
    });
    if (!parentDirData) {
      return res.status(404).json({
        message: "Parent directory does not exist",
      });
    }

    // parentDirData.directories.push(id);
    // foldersData.push(newDirectoryData);
    await dirCollection.insertOne(newDirectoryData);
    // await writeFile("./foldersDB.json", JSON.stringify(foldersData));
    return res.status(201).json({
      message: "Directory created successfully",
    });
  } catch (error) {
    next(error);
  }
});

// router.patch('/:id', async (req, res, next) => {
//   const db = req.db;
//   const user = req.user;
//   const { id } = req.params;
//   const { newDirName } = req.body;

//   try {
//     // find matching dir
//     const dirCollection = db.collection('directories');
//     const dirData = await dirCollection.findOne({ _id: new ObjectId(id) });

//     if (!dirData) return res.status(404).json({ message: 'Directory not found!' });
//     console.log(user._id);
//     console.log(dirData.userId);
//     // Check if the directory belongs to the user
//     if (!dirData.userId.equals(user._id)) {
//       return res.status(403).json({ message: 'You are not authorized to rename this directory!' });
//     }
//     await dirCollection.updateOne({ _id: new ObjectId(id) }, { $set: { name: newDirName } });
//     res.status(200).json({ message: 'Directory Renamed!' });
//   } catch (err) {
//     next(err);
//   }
// });

router.patch("/:id", async (req, res, next) => {
  const user = req.user;
  const { id } = req.params;
  const { newDirName } = req.body;
  console.log(newDirName);
  const db = req.db;
  const dirCollection = db.collection("directories");
  try {
    await dirCollection.updateOne(
      {
        _id: new ObjectId(id),
        userId: user._id,
      },
      { $set: { name: newDirName } }
    );
    res.status(200).json({ message: "Directory Renamed!" });
  } catch (err) {
    next(err);
  }
});

// async function deleteDirectory(dirId, user) {
//   const directoryIndex = foldersData.findIndex(
//     (dir) => dir.id === dirId && dir.userId === user.id
//   );
//   if (directoryIndex === -1) return;
//   const directoryData = foldersData[directoryIndex];
//   foldersData.splice(directoryIndex, 1);
//   try {
//     for (const fileId of directoryData.files) {
//       const fileIndex = filesData.findIndex(
//         (file) => file.id === fileId && file.userId === user.id
//       );
//       const { extension } = filesData[fileIndex];
//       await rm(`./storage/${fileId}${extension}`);
//       filesData.splice(fileIndex, 1);
//     }

//     for (const dirId of directoryData.directories) {
//       await deleteDirectory(dirId, user);
//     }

//     await writeFile("./filesDB.json", JSON.stringify(filesData));
//     await writeFile("./foldersDB.json", JSON.stringify(foldersData));
//   } catch (error) {
//     console.log("deleteDirectory error :- ", error);
//   }
// }

// router.delete("/:id", async (req, res) => {
//   const { id } = req.params;
//   const user = req.user;
//   if (id === req.user.rootDirId) {
//     return res.status(400).json({ error: "Cannot delete root directory" });
//   }
//   try {
//     const directoryData = foldersData.find(
//       (dir) => dir.id === id && dir.userId === req.user.id
//     );
//     if (!directoryData) {
//       return res.status(403).json({
//         message: "Unauthorised Acccess",
//       });
//     }
//     const parentDirData = foldersData.find(
//       (dir) =>
//         dir.id === directoryData.parentDirId && dir.userId === req.user.id
//     );
//     parentDirData.directories = parentDirData.directories.filter(
//       (dirId) => dirId !== id
//     );
//     await deleteDirectory(id, user);
//     return res.status(200).json({ message: "Folder deleted successfully!" });
//   } catch (error) {
// return res.status(500).json({
//   message: "Failed to delete the directory",
// });
//   }
// });

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = req.db;

    // 1. Find directory
    const parentDirectoryData = await db.collection("directories").findOne({ _id: new ObjectId(id) });
    if (!parentDirectoryData) {
      return res.status(404).json({ message: "Directory not found" });
    }

    // 2. Get all files in directory
    const files = await db.collection("files").find({
      parentDirId: parentDirectoryData._id,
    }).toArray();

    // 3. Get all subdirectories (one level deep)
    const directories = await db.collection("directories").find({
      parentDirId: parentDirectoryData._id,
    }).toArray();

    // 4. Delete files from storage + DB
    await Promise.all(
      files.map(async (file) => {
        const fileId = file._id?.toString();
        const filePath = `./storage/${fileId}${file.extension}`;
        try {
          await rm(filePath);
        } catch (err) {
          console.error(`Failed to delete file: ${filePath}`, err);
        }
        await db.collection("files").deleteOne({ _id: file._id });
      })
    );

    // 5. Delete subdirectories
    await Promise.all(
      directories.map(async (directory) => {
        await db.collection("directories").deleteOne({ _id: directory._id });
      })
    );

    // 6. Delete parent directory
    await db.collection("directories").deleteOne({ _id: parentDirectoryData._id });

    return res.status(200).json({
      message: "Directory deleted successfully",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to delete the directory",
    });
  }
});


export default router;
