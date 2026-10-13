
import sharp from "sharp";
import { Readable } from "stream";
import cloudinary from "../config/cloudinary.js"

const compressAndUploadImage = async (file) => {
  const image = sharp(file.buffer, {
    failOn: "error"
  });

  const metadata = await image.metadata();

  let compressedBuffer;
  let format;

  switch (metadata.format) {
    case "jpeg":
      compressedBuffer = await image
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer();
      format = "jpg";
      break;

    case "png":
      compressedBuffer = await image
        .png({ compressionLevel: 9, effort: 6 })
        .toBuffer();
      format = "png";
      break;

    case "webp":
      compressedBuffer = await image
        .webp({ quality: 80, effort: 4 })
        .toBuffer();
      format = "webp";
      break;

    case "avif":
      compressedBuffer = await image
        .avif({ quality: 75, effort: 4 })
        .toBuffer();
      format = "avif";
      break;

    default:
      throw new Error("Unsupported image format");
  }

  const uploadResult = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "shoeVariants",
        resource_type: "image",
        format
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result?.secure_url) {
          return reject(new Error("Cloudinary upload failed"));
        }

        resolve(result);
      }
    );

    Readable.from(compressedBuffer).pipe(uploadStream);
  });

  return {
    url: uploadResult.secure_url,
    width: metadata.width,
    height: metadata.height,
    originalSize: file.size,
    compressedSize: compressedBuffer.length
  };
};

export default compressAndUploadImage;
