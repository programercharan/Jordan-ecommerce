import multer from "multer";

const variantUpload = multer({
  storage: multer.memoryStorage(),

  limits: {
    files: 4,
    fileSize: 15 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif"
    ];

    if (allowedTypes.includes(file.mimetype)) {
      return cb(null, true);
    }

    return cb(
      new Error("Only JPG, PNG, WebP and AVIF images are allowed")
    );
  }
});

export default variantUpload;