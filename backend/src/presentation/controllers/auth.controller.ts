/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { Request, Response, NextFunction } from "express";
import { UserUsecase } from "../../application/usecases/user/user.usecase";
import { statusCodes } from "../../shared/constants/api.constant";


/**  @Controller */
export class AuthController {
    /**
     * @description User usecase
     */
    private readonly authUsecase: UserUsecase

    constructor() {
        this.authUsecase = new UserUsecase();
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
            res.status(statusCodes.OK).json({
                success: true,
                message: "User logged in successfully",
                user,
                accessToken,
                refreshToken
            });
        } catch (error) {
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
            res.status(statusCodes.CREATED).json({
                success: true,
                message: "User registered successfully",
                user,
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
}

export default new AuthController();
