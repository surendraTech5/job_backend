const express = require("express");
const router = express.Router();
const multer = require("multer");
const { uploadResume } = require("../Controller/ResumeController");
const { userAuthorizationHandler } = require("../Middleware/UserAuthorizationMiddleware");
const { authenticateUser } = require("../Middleware/UserAuthenticationMiddleware");

const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/upload",
  authenticateUser,
  userAuthorizationHandler("user", "recruiter"),
  upload.single("resume"),
  uploadResume
);

module.exports = router;