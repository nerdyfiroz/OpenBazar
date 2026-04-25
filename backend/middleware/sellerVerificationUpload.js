const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadRoot = path.join(__dirname, '..', 'uploads', 'seller-verification');
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
  const isImage = file.mimetype.startsWith('image/');
  const isPdf = file.mimetype === 'application/pdf';

  if (file.fieldname === 'idDocument' && (isImage || isPdf)) return cb(null, true);
  if ((file.fieldname === 'photo' || file.fieldname === 'faceVerification') && isImage) return cb(null, true);

  cb(new Error('Invalid file type for seller verification documents'));
};

const uploadSellerVerification = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 3
  }
}).fields([
  { name: 'idDocument', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
  { name: 'faceVerification', maxCount: 1 }
]);

module.exports = { uploadSellerVerification };
