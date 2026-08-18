/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { Request, Response, NextFunction } from "express";
import { UserUsecase } from "../../application/usecases/user/user.usecase";
import { statusCodes } from "../../shared/constants/api.constant";
import JwtService from "../../shared/utils/jwt";
import userSchema from "../../infrastructure/db/models/user.model";
import { AuthRequest } from "../../domain/types/api";
import { AuditLog } from "../../domain/entities/AuditLog";


/**  @Controller */
export class AuthController {
    /**
     * @description User usecase
     */
    private readonly authUsecase: UserUsecase

    constructor() {
        this.authUsecase = new UserUsecase();
    }

    private logAuthEvent(req: Request, action: string, summary: string, actorId?: string, actorName?: string, actorRole?: string) {
        void AuditLog.create({
            actorId: actorId || '',
            actorName: actorName || req.body?.email || 'Unknown',
            actorRole: actorRole || 'public',
            source: actorId ? 'admin' : 'public',
            action,
            entityType: 'auth',
            entityId: actorId || undefined,
            summary,
            metadata: { email: req.body?.email },
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
    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(statusCodes.BAD_REQUEST).json({
                    success: false,
                    message: "Email and password are required"
                });
            }
            const { user, accessToken, refreshToken } = await this.authUsecase.loginUser(email, password);
            const safeUser = user.toObject();
            delete (safeUser as any).password;
            this.logAuthEvent(req, 'login', `login: ${email}`, user._id.toString(), user.name, user.role);
            res.status(statusCodes.OK).json({
                success: true,
                message: "User logged in successfully",
                user: safeUser,
                accessToken,
                refreshToken
            });
        } catch (error) {
            this.logAuthEvent(req, 'login_failed', `login_failed: ${req.body?.email || 'unknown'} - ${(error as Error).message}`);
            next(error);
        }

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
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password, name } = req.body;
            if (!email || !password || !name) {
                return res.status(statusCodes.BAD_REQUEST).json({
                    success: false,
                    message: "Email, password and name are required"
                });
            }
            const { user, accessToken, refreshToken } = await this.authUsecase.registerUser({ email, password, name });
            const safeUser = user.toObject();
            delete (safeUser as any).password;
            this.logAuthEvent(req, 'register', `register: ${email}`, user._id.toString(), user.name, 'client');
            res.status(statusCodes.CREATED).json({
                success: true,
                message: "User registered successfully",
                user: safeUser,
                accessToken,
                refreshToken
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @description Refresh access token using a valid refresh token
     * @Method POST
     * @Route /api/auth/refresh
     * @Body refreshToken: string
     * @ResponseJson {success: boolean, accessToken: string, refreshToken: string}
     */
    async refresh(req: Request, res: Response, next: NextFunction) {
        try {
            const refreshToken = (req as any).cookies?.__refreshToken || req.body?.refreshToken;
            if (!refreshToken) {
                return res.status(statusCodes.BAD_REQUEST).json({
                    success: false,
                    message: "Refresh token required"
                });
            }
            const { accessToken, refreshToken: newRefreshToken } = await this.authUsecase.refreshTokens(refreshToken);
            return res.status(statusCodes.OK).json({
                success: true,
                message: "Token refreshed",
                accessToken,
                refreshToken: newRefreshToken
            });
        } catch (error) {
            return res.status(statusCodes.UNAUTHORIZED).json({
                success: false,
                message: (error as Error).message || "Invalid refresh token"
            });
        }
    }
    /**
     * @description Generate a one-time (time-limited) magic login link for a user.
     *              Only sysadmin and boss may create these links.
     * @Method POST
     * @Route /api/auth/magic-link
     * @Body userId: string OR email: string
     * @ResponseJson {success: boolean, token: string, expiresIn: number}
     */
    async generateMagicLink(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { userId, email } = req.body;
            if (!userId && !email) {
                return res.status(statusCodes.BAD_REQUEST).json({
                    success: false,
                    message: "userId or email is required"
                });
            }

            const user = await userSchema.findOne(
                userId ? { _id: userId } : { email: String(email).toLowerCase().trim() }
            ).lean();

            if (!user) {
                return res.status(statusCodes.NOT_FOUND).json({
                    success: false,
                    message: "User not found"
                });
            }

            const jwtService = new JwtService();
            const token = jwtService.generateToken(
                { userId: user._id.toString(), purpose: "magic-login" },
                "7d"
            );

            this.logAuthEvent(req, 'magic_link', `magic_link: generated for ${user.email}`, req.userId, (req as any).user?.name, req.role);
            return res.status(statusCodes.OK).json({
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
        } catch (error) {
            next(error);
        }
    }

    /**
     * @description Log a user in without a password by exchanging a magic link token.
     * @Method POST
     * @Route /api/auth/magic-login
     * @Body magicToken: string
     * @ResponseJson {success: boolean, message: string, user: User, accessToken: string, refreshToken: string}
     */
    async magicLogin(req: Request, res: Response, next: NextFunction) {
        try {
            const { magicToken } = req.body;
            if (!magicToken) {
                return res.status(statusCodes.BAD_REQUEST).json({
                    success: false,
                    message: "magicToken is required"
                });
            }

            const jwtService = new JwtService();
            let decoded: any;
            try {
                decoded = jwtService.verifyToken(magicToken, "token");
            } catch (error) {
                this.logAuthEvent(req, 'login_failed', `login_failed: invalid magic token from ${req.ip || 'unknown'}`);
                return res.status(statusCodes.UNAUTHORIZED).json({
                    success: false,
                    message: "Invalid or expired login link"
                });
            }

            if (decoded?.purpose !== "magic-login" || !decoded?.userId) {
                this.logAuthEvent(req, 'login_failed', `login_failed: invalid magic link purpose from ${req.ip || 'unknown'}`);
                return res.status(statusCodes.UNAUTHORIZED).json({
                    success: false,
                    message: "Invalid login link"
                });
            }

            const user = await userSchema.findById(decoded.userId);
            if (!user) {
                return res.status(statusCodes.NOT_FOUND).json({
                    success: false,
                    message: "User not found or blocked"
                });
            }

            const accessToken = jwtService.generateAccessToken({ userId: user._id });
            const refreshToken = jwtService.generateRefreshToken({ userId: user._id });

            const safeUser = user.toObject();
            delete (safeUser as any).password;

            this.logAuthEvent(req, 'magic_login', `magic_login: ${user.email}`, user._id.toString(), user.name, user.role);
            return res.status(statusCodes.OK).json({
                success: true,
                message: "User logged in successfully",
                user: safeUser,
                accessToken,
                refreshToken
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new AuthController();
