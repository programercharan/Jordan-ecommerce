import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary-v2";
import cloudinary from "./cloudinary.js";

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "shoeVariants",
        allowed_formats: ["jpg", "jpeg", "png", "webp","avif"]
    }
});

const upload = multer({ storage });

export default upload;