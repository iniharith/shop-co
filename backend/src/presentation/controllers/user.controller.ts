import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { statusCodes } from "../../shared/constants/api.constant";
import userUsecase from "../../application/usecases/user/user.usecase";
import { AuthRequest } from "../../domain/types/api";

class UserController {
    public getProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
        const userId = req.userId;
        if (!userId) {
            res.status(statusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
            return;
        }

        const profile = await userUsecase.getProfile(userId);
        
        res.status(statusCodes.OK).json({
            success: true,
            data: {
                name: profile.name,
                email: profile.email,
                role: profile.role,
                avatar: profile.avatar,
                verified: profile.verified,
                phoneNumber: profile.phoneNumber,
                address: profile.address
            }
        });
    });

    public updateProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
        const userId = req.userId;
        if (!userId) {
            res.status(statusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
            return;
        }

        const updatedProfile = await userUsecase.updateProfile(userId, req.body);
        
        res.status(statusCodes.OK).json({
            success: true,
            message: "Profile updated successfully",
            data: {
                name: updatedProfile.name,
                email: updatedProfile.email,
                role: updatedProfile.role,
                avatar: updatedProfile.avatar,
                verified: updatedProfile.verified,
                phoneNumber: updatedProfile.phoneNumber,
                address: updatedProfile.address
            }
        });
    });
}

export default new UserController();
