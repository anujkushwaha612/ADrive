import { model, Schema } from "mongoose";

const directorySchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    parentDirId: {
        type: Schema.Types.ObjectId,
        ref: "Directory",
        default: null,
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

const Directory = model("Directory", directorySchema);
export default Directory;