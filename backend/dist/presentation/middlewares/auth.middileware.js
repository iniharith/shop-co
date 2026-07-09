"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.refreshTokenMidllWare = exports.authMiddilware = void 0;
const jwt_1 = __importDefault(require("../../shared/utils/jwt"));
const user_model_1 = __importDefault(require("../../infrastructure/db/models/user.model"));
const api_constant_1 = require("../../shared/constants/api.constant");
const authMiddilware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { authorization: authHeader } = req.headers;
        const token = authHeader && authHeader.split(" ")[1];
        if (!token) {
            console.log('no access token');
            res.status(api_constant_1.statusCodes.UNAUTHORIZED);
            throw new Error(api_constant_1.messages.UNAUTHORIZED);
        }
        const jwt = new jwt_1.default();
        const { userId } = jwt.verifyAccessToken(token);
        if (!userId) {
            res.status(api_constant_1.statusCodes.NOT_FOUND);
            throw new Error(api_constant_1.messages.NOT_FOUND);
        }
        const user = yield user_model_1.default.findById(userId);
        if (!user) {
            console.log('user not found or user is Blocked');
            res.status(api_constant_1.statusCodes.BAD_REQUEST);
            throw new Error("user not found or user is Blocked");
        }
        req.userId = userId;
        req.role = user.role;
        req.user = user;
        next();
    }
    catch (error) {
        console.log('error', error.message);
        res.status(api_constant_1.statusCodes.UNAUTHORIZED).json({ message: "user token is expired" });
    }
});
exports.authMiddilware = authMiddilware;
const refreshTokenMidllWare = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const refreshToken = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.__refreshToken) || req.body.refreshToken;
        if (refreshToken) {
            const jwt = new jwt_1.default();
            const { userId } = jwt.verifyRefreshToken(refreshToken);
            console.log('userId', userId);
            if (!userId) {
                res.status(api_constant_1.statusCodes.UNAUTHORIZED);
                throw new Error("user not found");
            }
            const user = yield user_model_1.default.findById(userId);
            if (!user) {
                console.log('user not found or user is Blocked');
                res.status(api_constant_1.statusCodes.BAD_REQUEST);
                throw new Error("user not found or user is Blocked");
            }
            req.userId = userId;
            next();
        }
        else {
            console.log('no refresh token');
            res.status(api_constant_1.statusCodes.BAD_REQUEST).json({ message: "user token is expired" });
        }
    }
    catch (error) {
        console.log(error, 'refresh token error');
        res.status(api_constant_1.statusCodes.BAD_REQUEST).json({ message: "user token is expired" });
    }
});
exports.refreshTokenMidllWare = refreshTokenMidllWare;
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.role || !roles.includes(req.role)) {
            res.status(api_constant_1.statusCodes.UNAUTHORIZED).json({ message: "Access denied: insufficient role" });
            return;
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
exports.default = exports.authMiddilware;
