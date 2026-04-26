const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Cloudinary is configured from env vars:
//   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'openbazar/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 1200, crop: 'limit', quality: 'auto' }]
  }
});

const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'openbazar/products/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'webm']
  }
});

// Fallback to disk storage if Cloudinary is not configured (local dev)
const isDiskMode =
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET;

let upload;

if (isDiskMode) {
  const path = require('path');
  const fs = require('fs');
  const multerDisk = require('multer');

  const uploadRoot = path.join(__dirname, '..', 'uploads', 'products');
  fs.mkdirSync(uploadRoot, { recursive: true });

  const diskStorage = multerDisk.diskStorage({
    destination: (req, file, cb) => cb(null, uploadRoot),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    }
  });

  upload = multerDisk({
    storage: diskStorage,
    limits: { fileSize: 10 * 1024 * 1024, files: 4 }
  });
  console.log('[Upload] Using local disk storage (Cloudinary not configured)');
} else {
  upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024, files: 4 } });
  console.log('[Upload] Using Cloudinary storage');
}

const uploadProductMedia = upload.fields([
  { name: 'photos', maxCount: 3 },
  { name: 'video', maxCount: 1 }
]);

module.exports = { uploadProductMedia, cloudinary };
