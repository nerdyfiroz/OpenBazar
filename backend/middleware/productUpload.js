const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadRoot = path.join(__dirname, '..', 'uploads', 'products');
fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadRoot),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const isPhoto = file.fieldname === 'photos' && file.mimetype.startsWith('image/');
  const isVideo = file.fieldname === 'video' && file.mimetype.startsWith('video/');

  if (isPhoto || isVideo) return cb(null, true);
  cb(new Error('Only image files are allowed in photos and a single video file is allowed in video'));
};

const uploadProductMedia = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 4
  }
}).fields([
  { name: 'photos', maxCount: 3 },
  { name: 'video', maxCount: 1 }
]);

module.exports = { uploadProductMedia };
