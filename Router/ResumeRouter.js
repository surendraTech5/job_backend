const express = require("express");
const router = express.Router();
const multer = require("multer");
const { uploadResume, getResumes } = require("../Controller/ResumeController");
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
router.get(
  "/all",
  authenticateUser,
  userAuthorizationHandler("user", "recruiter", "admin"),
  getResumes
);
module.exports = router;