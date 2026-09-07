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
exports.AuthController = void 0;
const user_usecase_1 = require("../../application/usecases/user/user.usecase");
const api_constant_1 = require("../../shared/constants/api.constant");
const jwt_1 = __importDefault(require("../../shared/utils/jwt"));
const user_model_1 = __importDefault(require("../../infrastructure/db/models/user.model"));
const AuditLog_1 = require("../../domain/entities/AuditLog");
/**  @Controller */
class AuthController {
    constructor() {
        this.authUsecase = new user_usecase_1.UserUsecase();
    }
    logAuthEvent(req, action, summary, actorId, actorName, actorRole) {
        var _a, _b;
        void AuditLog_1.AuditLog.create({
            actorId: actorId || '',
            actorName: actorName || ((_a = req.body) === null || _a === void 0 ? void 0 : _a.email) || 'Unknown',
            actorRole: actorRole || 'public',
            source: actorId ? 'admin' : 'public',
            action,
            entityType: 'auth',
            entityId: actorId || undefined,
            summary,
            metadata: { email: (_b = req.body) === null || _b === void 0 ? void 0 : _b.email },
            method: req.method,
            route: req.originalUrl.split('?')[0],
            ip: req.ip,
            userAgent: req.get('user-agent'),
        }).catch(err => console.error('[AuditLog] Auth log failed:', err.message));
    }
    /**
     * @description Login user
     * @Method POST
     * @Route /api/auth/login
     * @Body email: string, password: string
     * @Response 200 - User logged in successfully
     * @Response 400 - Email and password are required
     * @Response 500 - Internal server error
     * @ResponseJson {success: boolean, message: string, user: User, accessToken: string, refreshToken: string}
     */
    login(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { email, password } = req.body;
                if (!email || !password) {
                    return res.status(api_constant_1.statusCodes.BAD_REQUEST).json({
                        success: false,
                        message: "Email and password are required"
                    });
                }
                const { user, accessToken, refreshToken } = yield this.authUsecase.loginUser(email, password);
                const safeUser = user.toObject();
                delete safeUser.password;
                this.logAuthEvent(req, 'login', `login: ${email}`, user._id.toString(), user.name, user.role);
                res.status(api_constant_1.statusCodes.OK).json({
                    success: true,
                    message: "User logged in successfully",
                    user: safeUser,
                    accessToken,
                    refreshToken
                });
            }
            catch (error) {
                this.logAuthEvent(req, 'login_failed', `login_failed: ${((_a = req.body) === null || _a === void 0 ? void 0 : _a.email) || 'unknown'} - ${error.message}`);
                next(error);
            }
        });
    }
    /**
     * @description Register user
     * @Method POST
     * @Route /api/auth/register
     * @Body email: string, password: string, name: string
     * @Response 201 - User registered successfully
     * @Response 400 - Email, password and name are required
     * @Response 500 - Internal server error
     * @ResponseJson {success: boolean, message: string, user: User, accessToken: string, refreshToken: string}
     */
    register(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password, name } = req.body;
                if (!email || !password || !name) {
                    return res.status(api_constant_1.statusCodes.BAD_REQUEST).json({
                        success: false,
                        message: "Email, password and name are required"
                    });
                }
                const { user, accessToken, refreshToken } = yield this.authUsecase.registerUser({ email, password, name });
                const safeUser = user.toObject();
                delete safeUser.password;
                this.logAuthEvent(req, 'register', `register: ${email}`, user._id.toString(), user.name, 'client');
                res.status(api_constant_1.statusCodes.CREATED).json({
                    success: true,
                    message: "User registered successfully",
                    user: safeUser,
                    accessToken,
                    refreshToken
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description Refresh access token using a valid refresh token
     * @Method POST
     * @Route /api/auth/refresh
     * @Body refreshToken: string
     * @ResponseJson {success: boolean, accessToken: string, refreshToken: string}
     */
    refresh(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const refreshToken = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.__refreshToken) || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.refreshToken);
                if (!refreshToken) {
                    return res.status(api_constant_1.statusCodes.BAD_REQUEST).json({
                        success: false,
                        message: "Refresh token required"
                    });
                }
                const { accessToken, refreshToken: newRefreshToken } = yield this.authUsecase.refreshTokens(refreshToken);
                return res.status(api_constant_1.statusCodes.OK).json({
                    success: true,
                    message: "Token refreshed",
                    accessToken,
                    refreshToken: newRefreshToken
                });
            }
            catch (error) {
                return res.status(api_constant_1.statusCodes.UNAUTHORIZED).json({
                    success: false,
                    message: error.message || "Invalid refresh token"
                });
            }
        });
    }
    /**
     * @description Generate a one-time (time-limited) magic login link for a user.
     *              Only sysadmin and boss may create these links.
     * @Method POST
     * @Route /api/auth/magic-link
     * @Body userId: string OR email: string
     * @ResponseJson {success: boolean, token: string, expiresIn: number}
     */
    generateMagicLink(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { userId, email } = req.body;
                if (!userId && !email) {
                    return res.status(api_constant_1.statusCodes.BAD_REQUEST).json({
                        success: false,
                        message: "userId or email is required"
                    });
                }
                const user = yield user_model_1.default.findOne(userId ? { _id: userId } : { email: String(email).toLowerCase().trim() }).lean();
                if (!user) {
                    return res.status(api_constant_1.statusCodes.NOT_FOUND).json({
                        success: false,
                        message: "User not found"
                    });
                }
                const jwtService = new jwt_1.default();
                const token = jwtService.generateToken({ userId: user._id.toString(), purpose: "magic-login" }, "7d");
                this.logAuthEvent(req, 'magic_link', `magic_link: generated for ${user.email}`, req.userId, (_a = req.user) === null || _a === void 0 ? void 0 : _a.name, req.role);
                return res.status(api_constant_1.statusCodes.OK).json({
                    success: true,
                    token,
                    expiresIn: 7,
                    user: {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                    },
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description Log a user in without a password by exchanging a magic link token.
     * @Method POST
     * @Route /api/auth/magic-login
     * @Body magicToken: string
     * @ResponseJson {success: boolean, message: string, user: User, accessToken: string, refreshToken: string}
     */
    magicLogin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { magicToken } = req.body;
                if (!magicToken) {
                    return res.status(api_constant_1.statusCodes.BAD_REQUEST).json({
                        success: false,
                        message: "magicToken is required"
                    });
                }
                const jwtService = new jwt_1.default();
                let decoded;
                try {
                    decoded = jwtService.verifyToken(magicToken, "token");
                }
                catch (error) {
                    this.logAuthEvent(req, 'login_failed', `login_failed: invalid magic token from ${req.ip || 'unknown'}`);
                    return res.status(api_constant_1.statusCodes.UNAUTHORIZED).json({
                        success: false,
                        message: "Invalid or expired login link"
                    });
                }
                if ((decoded === null || decoded === void 0 ? void 0 : decoded.purpose) !== "magic-login" || !(decoded === null || decoded === void 0 ? void 0 : decoded.userId)) {
                    this.logAuthEvent(req, 'login_failed', `login_failed: invalid magic link purpose from ${req.ip || 'unknown'}`);
                    return res.status(api_constant_1.statusCodes.UNAUTHORIZED).json({
                        success: false,
                        message: "Invalid login link"
                    });
                }
                const user = yield user_model_1.default.findById(decoded.userId);
                if (!user) {
                    return res.status(api_constant_1.statusCodes.NOT_FOUND).json({
                        success: false,
                        message: "User not found or blocked"
                    });
                }
                const accessToken = jwtService.generateAccessToken({ userId: user._id });
                const refreshToken = jwtService.generateRefreshToken({ userId: user._id });
                const safeUser = user.toObject();
                delete safeUser.password;
                this.logAuthEvent(req, 'magic_login', `magic_login: ${user.email}`, user._id.toString(), user.name, user.role);
                return res.status(api_constant_1.statusCodes.OK).json({
                    success: true,
                    message: "User logged in successfully",
                    user: safeUser,
                    accessToken,
                    refreshToken
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.AuthController = AuthController;
exports.default = new AuthController();
