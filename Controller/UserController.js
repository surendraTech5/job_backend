const UserModel = require("../Model/UserModel");
const createError = require("http-errors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const JWTGenerator = require("../Utils/JWTGenerator");

exports.getAllUser = async (req, res, next) => {
    try {
        const result = await UserModel.find({}).select("-password");
        if (result.length !== 0) {
            res.status(200).json({
                status: true,
                result,
            });
        } else {
            next(createError(200, "User list is empty"));
        }
    } catch (error) {
        next(createError(500, error.message));
    }
};

exports.getMe = async (req, res, next) => {
    try {
        const me = req.user;
        if (!me) {
            next(createError(500, "Please login first"));
        } else {
            res.status(200).json({
                status: true,
                result: me,
            });
        }
    } catch (error) {
        next(createError(500, error.message));
    }
};

exports.logOut = async (req, res, next) => {
    try {
        // use same secure logic as login so browser will clear the cookie correctly
        const logoutOpts = {
            sameSite: "None",
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            expires: new Date(0), // Set to a date in the past
            path: "/", // Ensure this matches the path set during login
        };
        res.cookie(process.env.COOKIE_NAME, "", logoutOpts)
            .status(200)
            .json({
                status: true,
                message: "Logout done",
            });
    } catch (error) {
        next(createError(500, error.message));
    }
};

exports.getSingleUser = async (req, res, next) => {
    res.send("get single user");
};

exports.addUser = async (req, res, next) => {
    const data = req.body;
    console.log("addUser called with payload:", data);
    try {
        const isUserExists = await UserModel.findOne({ email: data.email });
        console.log("existing user check", isUserExists);
        if (isUserExists) {
            next(createError(500, "Email Already exists"));
        } else {
            const count = await UserModel.countDocuments();
            const isFirstUser = count === 0;
            console.log("number of users in db", count, "first?", isFirstUser);
            // allow client to request a recruiter role at registration
            if (!isFirstUser) {
                // if role provided and valid, use it; otherwise default to 'user'
                if (data.role === "recruiter") {
                    req.body.role = "recruiter";
                } else {
                    req.body.role = "user";
                }
            } else {
                // first registered account becomes admin regardless
                req.body.role = "admin";
            }

            const newUser = new UserModel(data);
            console.log("saving new user to Mongo:", newUser);
            const result = await newUser.save();
            console.log("save result", result);

            res.status(200).json({
                status: true,
                message: "Registered Successfully",
            });
        }
    } catch (error) {
        console.error("addUser error", error);
        next(createError(500, error.message));
    }
};

// helper that explicitly sets recruiter role (used by dedicated route below)
exports.addRecruiter = async (req, res, next) => {
    // force the body role
    req.body.role = "recruiter";
    // reuse addUser logic
    return exports.addUser(req, res, next);
};

exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log("body::::::::::::",req.body)

    if (!email || !password)
      return next(createError(400, "Email and Password required"));

    // Find user
    const user = await UserModel.findOne({ email });
    console.log("user found :::::;",user)
    if (!user) return next(createError(404, "User not found"));
    let isPasswordMatched = false;

    if (process.env.NODE_ENV === "production") {
      isPasswordMatched = await bcrypt.compare(password, user.password);
    } else {
      isPasswordMatched = await bcrypt.compare(password, user.password);
    }

    if (!isPasswordMatched)
      return next(createError(401, "Email or Password not matched"));
    const tokenObj = { ID: user._id, role: user.role };
    const TOKEN = JWTGenerator(tokenObj);

    // Set cookie
    const oneDay = 24 * 60 * 60 * 1000;
    res.cookie(process.env.COOKIE_NAME, TOKEN, {
      expires: new Date(Date.now() + oneDay),
      secure: process.env.NODE_ENV === "production", // HTTPS only in prod
      httpOnly: true,
      signed: true,
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });

    res.status(200).json({
      status: true,
      message: "Login Successfully",
    });
  } catch (error) {
    next(createError(500, `Something went wrong: ${error.message}`));
  }
};

exports.updateUser = async (req, res, next) => {
    const data = req.body;
    try {
        if (req?.user?.email !== data?.email) {
            next(createError(500, `You have no permission to update`));
        } else {
            const updateUser = await UserModel.updateOne(
                { _id: req.user._id },
                { $set: data }
            );

            if (updateUser.nModified > 0) {
                const updatedUser = await UserModel.findById(
                    req.user._id
                ).select("-password");
                res.status(200).json({
                    status: true,
                    message: "Profile Updated",
                    result: updatedUser,
                });
            } else {
                res.status(200).json({
                    status: false,
                    message: "No changes were made",
                    result: null,
                });
            }
        }
    } catch (error) {
        next(createError(500, `Something went wrong: ${error.message}`));
    }
};

exports.deleteUser = async (req, res, next) => {
    const { id } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            next(createError(400, "Invalid User ID format"));
        }

        const isUserExists = await UserModel.findOne({ _id: id });
        if (!isUserExists) {
            res.status(500).json({
                status: false,
                message: "User not found",
            });
        } else {
            const result = await UserModel.findByIdAndDelete(id);
            res.status(200).json({
                status: true,
                message: "User Deleted",
            });
        }
    } catch (error) {
        next(createError(500, `something wrong: ${error.message}`));
    }
};

exports.deleteAllUser = async (req, res, next) => {
    try {
        result = await UserModel.deleteMany({});
        res.status(201).json({
            status: true,
            message: "All userd deleted",
        });
    } catch (error) {
        next(createError(500, `something wrong: ${error.message}`));
    }
};
