const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");

app.use(cookieParser(process.env.COOKIE_SECRET));

// Middlewares
app.use(express.json());

// CORS configuration - allow local dev and deployed frontends
// NOTE: you must add whatever front-end origin is currently hosting your client
// (Render, Vercel, Netlify, etc.).  Browser will reject cookies if the origin is
// not permitted or if credentials are disabled.
const allowedOrigins = [
    "http://localhost:5173", // local Vite dev
    "https://job-portal-frontend-p1qk.onrender.com", // deployed Render frontend (example)
    "https://your-vercel-app.vercel.app", // <-- replace with actual Vercel origin
    // Add more origins as needed for different environments
];

// use a dynamic origin callback so we can log and make debugging easier
app.use(
    cors({
        origin: function (origin, callback) {
            console.log("CORS check for origin", origin);
            // allow requests like Postman (no origin) and any in the list
            if (!origin || allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        methods: ["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
        optionsSuccessStatus: 200, // some clients expect 200 on OPTIONS
    })
);

// log every incoming request's origin and cookies for debugging
app.use((req, res, next) => {
    console.log(`request ${req.method} ${req.originalUrl} from`, req.headers.origin);
    console.log("  cookies:", req.cookies);
    console.log("  signedCookies:", req.signedCookies);
    next();
});

// Custom Middlewares
const {
    authenticateUser,
} = require("./Middleware/UserAuthenticationMiddleware");

// Routers
const JobRouter = require("./Router/JobRouter");
const UserRouter = require("./Router/UserRouter");
const AuthRouter = require("./Router/AuthRouter");
const AdminRouter = require("./Router/AdminRouter");
const ApplicationRouter = require("./Router/ApplicationRouter");

// Connecting routes
app.use("/api/v1/Jobs", authenticateUser, JobRouter);
app.use("/api/v1/Users", authenticateUser, UserRouter);
app.use("/api/v1/Auth", AuthRouter);
app.use("/api/v1/Admin", authenticateUser, AdminRouter);
app.use("/api/v1/Application", authenticateUser, ApplicationRouter);

module.exports = app;
