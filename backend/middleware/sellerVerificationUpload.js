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

let upload;

if (IS_CLOUD) {
  upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 3 }
  });
} else {
  const uploadRoot = path.join(__dirname, '..', 'uploads', 'seller-verification');
  fs.mkdirSync(uploadRoot, { recursive: true });

  upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadRoot),
      filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
      }
    }),
    limits: { fileSize: 10 * 1024 * 1024, files: 3 }
  });
}

const fileFilter = (req, file, cb) => {
  const isImage = file.mimetype.startsWith('image/');
  const isPdf = file.mimetype === 'application/pdf';

  if (file.fieldname === 'idDocument' && (isImage || isPdf)) return cb(null, true);
  if ((file.fieldname === 'photo' || file.fieldname === 'faceVerification') && isImage) return cb(null, true);

  cb(new Error('Invalid file type for seller verification documents'));
};

const uploadSellerVerification = upload.fields([
  { name: 'idDocument', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
  { name: 'faceVerification', maxCount: 1 }
]);

// ── Helper: upload a single buffer to Cloudinary ──────────────────────────────
function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'openbazar/seller-verification', ...options },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

// ── Upload all in-memory files to Cloudinary (call after multer middleware) ───
async function processVerificationUploads(req) {
  if (!IS_CLOUD) return;

  const fields = ['idDocument', 'photo', 'faceVerification'];
  
  for (const field of fields) {
    const file = req.files?.[field]?.[0];
    if (file && file.buffer) {
      const url = await uploadBufferToCloudinary(file.buffer, {
        resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image'
      });
      file.path = url;
    }
  }
}

module.exports = { uploadSellerVerification, processVerificationUploads, cloudinary };
