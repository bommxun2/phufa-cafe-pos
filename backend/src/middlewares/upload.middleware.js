// src/middlewares/upload.middleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ตรวจสอบและสร้าง directory ถ้ายังไม่มี
const ensureDirectoryExistence = filePath => {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
};

// กำหนดค่าสำหรับ storage engine (ที่จัดเก็บไฟล์)
const createStorageConfig = destinationPath => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const fullPath = path.join(__dirname, `../../uploads/${destinationPath}`);
      ensureDirectoryExistence(fullPath + '/dummy'); // สร้าง dir ถ้ายังไม่มี
      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
      // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน (randomname.xxx)
      // ใช้ randomName เพื่อให้ชื่อไฟล์ไม่ซ้ำกัน
      const randomName = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, randomName + path.extname(file.originalname));
    },
  });
};

// กำหนด filter สำหรับประเภทไฟล์
const imageFileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/webp'
  ) {
    cb(null, true); // อนุญาตไฟล์
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, PNG are allowed.'), false); // ไม่อนุญาต
  }
};

// สร้าง Multer instances สำหรับแต่ละประเภทการอัปโหลด
const uploadProfileImage = multer({
  storage: createStorageConfig('profiles'), // เก็บใน /uploads/profiles/
  limits: {
    fileSize: 1024 * 1024 * 2, // 2MB
  },
  fileFilter: imageFileFilter,
});

const uploadMenuImage = multer({
  storage: createStorageConfig('menus'), // เก็บใน /uploads/menus/
  limits: {
    fileSize: 1024 * 1024 * 2, // 2MB
  },
  fileFilter: imageFileFilter,
});

module.exports = {
  uploadProfileImage,
  uploadMenuImage,
};
