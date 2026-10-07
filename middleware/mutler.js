import multer from "multer";
import storage from "../config/storage.js";

const upload = multer({ storage });

export default upload;