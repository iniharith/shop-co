"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/** @Service */
class JwtService {
    constructor() {
        if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET || !process.env.JWT_TOKEN) {
            throw new Error("JWT secrets are missing. Please set them in environment variables.");
        }
        this.accessSecret = process.env.JWT_ACCESS_SECRET;
        this.refreshSecret = process.env.JWT_REFRESH_SECRET;
        this.tokenSecret = process.env.JWT_TOKEN;
    }
    generateAccessToken(payload) {
        try {
            const token = jsonwebtoken_1.default.sign(payload, this.accessSecret, { expiresIn: "1d" });
            return token;
        }
        catch (error) {
            throw new Error("Failed to generate access token");
        }
    }
    generateToken(payload, expireTime = "1d") {
        try {
            const token = jsonwebtoken_1.default.sign(payload, this.tokenSecret, { expiresIn: expireTime });
            return token;
        }
        catch (error) {
            throw new Error("Failed to generate token");
        }
    }
    generateRefreshToken(payload) {
        try {
            const token = jsonwebtoken_1.default.sign(payload, this.refreshSecret, { expiresIn: "30d" });
            return token;
        }
        catch (error) {
            throw new Error("Failed to generate refresh token");
        }
    }
    verifyAccessToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.accessSecret);
        }
        catch (error) {
            throw new Error("Invalid access token");
        }
    }
    verifyRefreshToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.refreshSecret);
        }
        catch (error) {
            throw new Error("Invalid refresh token");
        }
    }
    verifyToken(token, type) {
        try {
            const secret = {
                access: this.accessSecret,
                refresh: this.refreshSecret,
                token: this.tokenSecret
            }[type];
            return jsonwebtoken_1.default.verify(token, secret);
        }
        catch (error) {
            throw new Error(`Invalid ${type} token`);
        }
    }
}
exports.default = JwtService;
