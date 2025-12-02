import { model, Schema } from "mongoose";

const fileSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    extension: {
        type: String,
        required: true,
    },
    parentDirId: {
        type: Schema.Types.ObjectId,
        ref: "Directory",
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, {
    strict: "throw",
    versionKey: false
})

const File = model("File", fileSchema);
export default File;