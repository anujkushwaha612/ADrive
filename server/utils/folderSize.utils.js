import Directory from "../models/directory.model.js";

export const handleFolderSizeUpdate = async (parentDirId, size) => {
    const parents = [];
    while (parentDirId) {
        const directory = await Directory.findById(parentDirId, "parentDirId").lean();
        if (!directory) {
            break;
        }
        parents.push(directory._id);
        parentDirId = directory.parentDirId;
    }

    if (parents.length > 0) {
        await Directory.updateMany({
            _id: { $in: parents }
        }, {
            $inc: { size: size }
        })
    }
}