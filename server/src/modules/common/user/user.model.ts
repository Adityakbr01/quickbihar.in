import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose, { Document, Schema, Types } from "mongoose";
import { ENV } from "@/config/env.config";

export interface IUserIdentity {
  provider: "google" | "password";
  providerId: string;
  email: string;
  linkedAt: Date;
}

export interface IUser extends Document {
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  avatar?: {
    url: string;
    fileId: string;
  };
  fcmToken?: string;
  password?: string;
  roleId: Types.ObjectId;
  isVerified?: boolean;
  isBlocked?: boolean;
  isPhoneVerified?: boolean;
  /** Set to true for users originally created by the OTP flow whose email is a synthetic `<phone>@quickbihar.local`. They must add a real email before using email-password auth. */
  legacyOtpOnly?: boolean;
  /** All credentials attached to this account (Google sub, password fingerprint). Email is the natural linking key. */
  identities?: IUserIdentity[];
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  deletionReason?: string;
  refreshToken?: string;
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      unique: true,
      index: true,
      sparse: true,
    },
    avatar: {
      url: String,
      fileId: String
    },
    password: {
      type: String,
      // No longer required at the schema level — Google-only users have no password.
      required: false,
    },
    roleId: {
      type: Types.ObjectId,
      ref: "Role",
      required: true,
      index: true,
    },
    isVerified: { type: Boolean, default: false, index: true },
    isBlocked: { type: Boolean, default: false, index: true },
    isPhoneVerified: { type: Boolean, default: false, index: true },
    legacyOtpOnly: { type: Boolean, default: false, index: true },
    identities: {
      type: [
        {
          provider: {
            type: String,
            enum: ["google", "password"],
            required: true,
          },
          providerId: { type: String, required: true },
          email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
          },
          linkedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    deletedAt: {
      type: Date,
      index: true,
    },
    deletedBy: {
      type: Types.ObjectId,
      ref: "User",
    },
    deletionReason: {
      type: String,
      trim: true,
    },
    refreshToken: {
      type: String,
    },
    fcmToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to hash password
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  // Google-only users have no password; skip hashing if undefined/empty.
  if (!this.password) return;

  this.password = await bcrypt.hash(this.password, 10);
});

// Instance method to check password
userSchema.methods.isPasswordCorrect = async function (password: string) {
  if (!this.password) return false;
  return await bcrypt.compare(password, this.password);
};

// Instance method to generate Access Token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    ENV.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "1d",
    }
  );
};

// Instance method to generate Refresh Token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    ENV.REFRESH_TOKEN_SECRET,
    {
      expiresIn: ENV.REFRESH_TOKEN_EXPIRY as any,
    }
  );
};

// ── Auth-redesign indexes (Phase 3) ──────────────────────────────
// Compound unique index on identities prevents the same Google `sub` from
// being linked to two different accounts.
userSchema.index(
  { "identities.provider": 1, "identities.providerId": 1 },
  { unique: true, partialFilterExpression: { "identities.0": { $exists: true } } }
);
// Email lookup index for identity records.
userSchema.index({ "identities.email": 1 });

export const User = mongoose.model<IUser>("User", userSchema);
