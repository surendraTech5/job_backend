const cloudinary = require("../Utils/Cloudinary");
const UserModel = require("../Model/UserModel");
const streamifier = require("streamifier");

exports.uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: false,
        message: "No file uploaded",
      });
    }

    const streamUpload = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "resumes",
            resource_type: "raw",
          },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

    const result = await streamUpload();

    await UserModel.findByIdAndUpdate(req.user._id, {
      resume: result.secure_url,
    });

    res.status(200).json({
      status: true,
      message: "Resume uploaded successfully",
      data: result.secure_url,
    });
  } catch (error) {
    next(error);
  }
};