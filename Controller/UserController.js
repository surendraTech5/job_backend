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

        const isUserExists = await UserModel.findOne({ email });
        if (isUserExists) {
            const isPasswordMatched = await bcrypt.compare(
                password,
                isUserExists.password
            );
            if (isPasswordMatched) {
                const tokenObj = {
                    ID: isUserExists._id,
                    role: isUserExists.role,
                };
                const TOKEN = JWTGenerator(tokenObj);

                const one_day = 1000 * 60 * 60 * 24; //since token expire in 1day

                // log some request info for debugging
                console.log("loginUser called, origin:", req.headers.origin);
                console.log("loginUser headers:", req.headers);

                // cookies must be sent over HTTPS when `secure: true`.  Set the flag in
                // production only (Render/prod domains are HTTPS); running locally over
                // http will prevent the browser from storing the cookie otherwise.
                const cookieOptions = {
                    expires: new Date(Date.now() + one_day),
                    secure: process.env.NODE_ENV === "production",
                    httpOnly: true, // restricts access from client-side scripts
                    signed: true, // keeps cookie tamper-proof
                    sameSite: "None", // required for cross-site POSTs (login) to deliver cookie
                };
                console.log("setting auth cookie, options:", cookieOptions, "NODE_ENV=", process.env.NODE_ENV);
                res.cookie(process.env.COOKIE_NAME, TOKEN, cookieOptions);
                res.status(200).json({
                    status: true,
                    message: "Login Successfully",
                });
            } else {
                next(createError(500, "Email or Password not matched"));
            }
        } else {
            next(createError(500, "User not found!!!"));
        }
    } catch (error) {
        next(createError(500, `something wrong: ${error.message}`));
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
