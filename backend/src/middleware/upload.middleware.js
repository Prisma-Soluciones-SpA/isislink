const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes JPG, PNG o WebP'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 }
});

const processProfileImage = async (req, res, next) => {
  if (!req.file) return next();

  const uploadDir = path.join(__dirname, '../../', process.env.UPLOAD_DIR || 'uploads/profiles');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const filename = `profile_${req.user?.id || Date.now()}_${Date.now()}.webp`;
  const filepath = path.join(uploadDir, filename);

  try {
    await sharp(req.file.buffer)
      .resize(800, 800, { fit: 'cover', position: 'center' })
      .webp({ quality: 85 })
      .toFile(filepath);

    req.file.filename = filename;
    req.file.path = filepath;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { upload, processProfileImage };
