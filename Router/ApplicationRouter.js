const express = require("express");
const axios = require("axios");
const ApplicationRouter = express.Router();

const {
    authenticateUser,
} = require("./../Middleware/UserAuthenticationMiddleware");

// Controllers
const ApplicationController = require("../Controller/ApplicationController");

// Middlewares
const { checkInput } = require("../Validation/ApplicationDataRules");
const {
    inputValidationMiddleware,
} = require("../Validation/ValidationMiddleware");
const {
    userAuthorizationHandler,
} = require("./../Middleware/UserAuthorizationMiddleware");

// Authentication routes
ApplicationRouter.get(
  "/download-resume",
  userAuthorizationHandler("recruiter"), // only recruiter can download
  async (req, res) => {
    try {
      const { url } = req.query;

      if (!url) {
        return res.status(400).json({ message: "Resume URL required" });
      }

      const response = await axios.get(url, {
        responseType: "stream", // 🔥 BETTER THAN arraybuffer
      });

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=resume.pdf"
      );
      res.setHeader("Content-Type", "application/pdf");

      response.data.pipe(res); // 🔥 stream directly
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Resume download failed" });
    }
  }
);

ApplicationRouter.get(
    "/applicant-jobs",
    userAuthorizationHandler("user"),
    ApplicationController.getCandidateAppliedJobs
);

ApplicationRouter.post(
    "/apply",
    checkInput,
    inputValidationMiddleware,
    userAuthorizationHandler("user"),
    ApplicationController.applyInJob
);

ApplicationRouter.get(
    "/recruiter-jobs",
    userAuthorizationHandler("recruiter"),
    ApplicationController.getRecruiterPostJobs
);

ApplicationRouter.patch(
    "/:id",
    userAuthorizationHandler("recruiter"),
    ApplicationController.updateJobStatus
);


module.exports = ApplicationRouter;
