/**
 * Coded by Harith
 * Kampungcetak ®
 */
import type { NextFunction, Request, Response } from "express";
import JwtService from "../../shared/utils/jwt";
import userSchema from "../../infrastructure/db/models/user.model";
import type { JwtPayload } from "jsonwebtoken";
import { messages, statusCodes } from "../../shared/constants/api.constant";
import { AuthRequest } from "../../domain/types/api";

const authUserCache = new Map<string, { user: any; expiresAt: number }>();


export const authMiddilware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { authorization: authHeader } = req.headers;
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            console.log('no access token')
            res.status(statusCodes.UNAUTHORIZED);
            throw new Error(messages.UNAUTHORIZED);
        }

        const jwt = new JwtService();
        const { userId } = jwt.verifyAccessToken(token) as JwtPayload

        if (!userId) {
            res.status(statusCodes.NOT_FOUND);
            throw new Error(messages.NOT_FOUND);
        }
        const cached = authUserCache.get(userId as string);
        let user = cached && cached.expiresAt > Date.now() ? cached.user : null;
        if (!user) {
            user = await userSchema.findById(userId)
                .select('_id role verified name email avatar phoneNumber')
                .lean();
            if (user) authUserCache.set(userId as string, { user, expiresAt: Date.now() + 30_000 });
        }
        if (!user) {
            console.log('user not found or user is Blocked');
            res.status(statusCodes.BAD_REQUEST);
            throw new Error("user not found or user is Blocked");
        }

        req.userId = userId as string;
        req.role = user.role;
        (req as any).user = user;
        next();
    } catch (error) {
        console.log('error', (error as Error).message)
        res.status(statusCodes.UNAUTHORIZED).json({ message: "user token is expired" })

    }


};




export const refreshTokenMidllWare = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

        const refreshToken = req.cookies?.__refreshToken || req.body.refreshToken;

        if (refreshToken) {
            const jwt = new JwtService();
            const { userId } = jwt.verifyRefreshToken(refreshToken) as JwtPayload
            console.log('userId', userId)
            if (!userId) {
                res.status(statusCodes.UNAUTHORIZED);
                throw new Error("user not found");
            }

            const user = await userSchema.findById(userId);
            if (!user) {
                console.log('user not found or user is Blocked');
                res.status(statusCodes.BAD_REQUEST);
                throw new Error("user not found or user is Blocked");
            }
            req.userId = userId as string;
            next();
        } else {
            console.log('no refresh token')
            res.status(statusCodes.UNAUTHORIZED).json({ message: "user token is expired" })

        }
    } catch (error) {
        console.log(error, 'refresh token error');
        res.status(statusCodes.UNAUTHORIZED).json({ message: "user token is expired" })
    }
}

export const authorizeRoles = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.role || !roles.includes(req.role)) {
            res.status(statusCodes.UNAUTHORIZED).json({ message: "Access denied: insufficient role" });
            return;
        }
        next();
    };
};

export default authMiddilware
