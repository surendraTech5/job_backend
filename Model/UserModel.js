const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
      trim: true,
    },
    password: { type: String, required: true },
    location: { type: String },
    gender: { type: String },
    role: {
      type: String,
      enum: ["admin", "recruiter", "user"],
      default: "user",
    },
    resume: { type: String,
      default: ""
    },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();

    const saltRounds =
      process.env.NODE_ENV === "production"
        ? parseInt(process.env.BCRYPT_SALT_ROUNDS_PROD)
        : parseInt(process.env.BCRYPT_SALT_ROUNDS_DEV);

    const salt = await bcrypt.genSalt(saltRounds);
    this.password = await bcrypt.hash(this.password, salt);

    next();
  } catch (err) {
    next(err);
  }
});

const UserModel = mongoose.model("User", UserSchema);
module.exports = UserModel;