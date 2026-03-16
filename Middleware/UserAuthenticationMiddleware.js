const createHttpError = require("http-errors");
const jwt = require("jsonwebtoken");
const UserModel = require("../Model/UserModel");

exports.authenticateUser = async (req, res, next) => {
    console.log("authenticateUser middleware invoked");
    console.log("  all cookies:", req.cookies);
    console.log("  all signed cookies:", req.signedCookies);
    const token = req.signedCookies[process.env.COOKIE_NAME];
    console.log(`  received cookie token: ${token}`);

    if (!token) {
        console.log("  no token found in signed cookies");
        return next(createHttpError(401, "Unauthorized User"));
    }
    try {
        const { ID, role } = jwt.verify(token, process.env.JWT_SECRET);
        console.log(`  token verified, ID=${ID}, role=${role}`);
        req.user = await UserModel.findOne({ _id: ID, role }).select(
            "-password"
        );
        if (!req.user) {
            console.log("  user lookup failed");
            return next(createHttpError(401, "Unauthorized User"));
        }
        console.log("  user found", req.user);
        next();
    } catch (error) {
        console.log("  token verification error", error.message);
        next(createHttpError(401, "Unauthorized User"));
    }
};
