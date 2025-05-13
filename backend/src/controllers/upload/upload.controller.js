// src/controllers/upload/upload.controller.js

const multer = require('multer');

// Controller สำหรับ /uploads/profile-image
exports.handleProfileImageUpload = (req, res) => {
  if (!req.file) {
    return res.status(400).json({message: 'No file uploaded.'});
  }
  // req.file ถูกสร้างโดย multer และมีข้อมูลไฟล์ที่อัปโหลด
  // สร้าง URL แบบ relative สำหรับการเข้าถึงไฟล์
  const relativeFileUrl = `/api/uploads/profiles/${req.file.filename}`;

  res.status(201).json({
    message: 'File uploaded successfully.',
    fileUrl: relativeFileUrl,
  });
};

// Controller สำหรับ /uploads/menu-image
exports.handleMenuImageUpload = (req, res) => {
  // TODO: Implement admin/owner privilege check here if needed
  // const user = req.user; // from auth middleware
  // if (user.role !== 'admin' && user.role !== 'owner') {
  //   return res.status(403).json({ message: "Admin or owner privileges required." });
  // }

  if (!req.file) {
    return res.status(400).json({message: 'No file uploaded.'});
  }
  const relativeFileUrl = `/api/uploads/menus/${req.file.filename}`;

  res.status(201).json({
    message: 'File uploaded successfully.',
    fileUrl: relativeFileUrl,
  });
};

// Middleware สำหรับจัดการ Error จาก Multer โดยเฉพาะ
exports.handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res
        .status(400)
        .json({message: 'File too large. Maximum size is 2MB.'});
    }
    // จัดการ error อื่นๆ ของ multer ที่นี่
    return res.status(400).json({message: err.message});
  } else if (err) {
    // Error จาก fileFilter (invalid type) หรือ error อื่นๆ
    return res.status(400).json({message: err.message});
  }
  // ถ้าไม่มี error จาก multer, ส่งต่อไปยัง error handler ปกติ
  next(err);
};
