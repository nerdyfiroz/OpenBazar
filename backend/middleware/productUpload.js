const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── Cloudinary (optional — falls back to disk if env vars are missing) ────────
const IS_CLOUD =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

let cloudinary = null;
if (IS_CLOUD) {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// ── Multer: memory storage when using Cloudinary, disk otherwise ──────────────
let upload;

if (IS_CLOUD) {
  // Store files in memory — we upload to Cloudinary manually afterwards
  upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 4 }
  });
} else {
  const uploadRoot = path.join(__dirname, '..', 'uploads', 'products');
  fs.mkdirSync(uploadRoot, { recursive: true });

  upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadRoot),
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
      }
    }),
    limits: { fileSize: 10 * 1024 * 1024, files: 4 }
  });
}

const uploadProductMedia = upload.fields([
  { name: 'photos', maxCount: 3 },
  { name: 'video', maxCount: 1 }
]);

// ── Helper: upload a single buffer to Cloudinary ──────────────────────────────
function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'openbazar/products', ...options },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

// ── Upload all in-memory files to Cloudinary (call after multer middleware) ───
async function processUploads(req) {
  if (!IS_CLOUD) return; // disk storage: files already have a path

  const photoFiles = req.files?.photos || [];
  const videoFile = (req.files?.video || [])[0];

  // Upload photos
  if (photoFiles.length) {
    const urls = await Promise.all(
      photoFiles.map((f) => uploadBufferToCloudinary(f.buffer, { resource_type: 'image' }))
    );
    // Replace in-memory files with Cloudinary URLs stored in file.path
    urls.forEach((url, i) => { photoFiles[i].path = url; });
  }

  // Upload video
  if (videoFile) {
    const url = await uploadBufferToCloudinary(videoFile.buffer, {
      resource_type: 'video',
      folder: 'openbazar/products/videos'
    });
    videoFile.path = url;
  }
}

module.exports = { uploadProductMedia, processUploads, cloudinary };
