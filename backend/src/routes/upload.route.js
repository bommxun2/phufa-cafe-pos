// src/routes/upload.route.js
const express = require('express');
const router = express.Router();
const {
  uploadProfileImage,
  uploadMenuImage,
} = require('../middlewares/upload.middleware');
const {
  handleProfileImageUpload,
  handleMenuImageUpload,
  handleUploadError,
} = require('../controllers/upload/upload.controller');

router.post(
  '/profile-image',
  uploadProfileImage.single('profileImage'),
  handleProfileImageUpload,
  handleUploadError,
);

router.post(
  '/menu-image',
  uploadMenuImage.single('menuImage'),
  handleMenuImageUpload,
  handleUploadError,
);

module.exports = router;
