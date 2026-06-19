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
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const api_constant_1 = require("../../shared/constants/api.constant");
const user_usecase_1 = __importDefault(require("../../application/usecases/user/user.usecase"));
class UserController {
    constructor() {
        this.getStaff = (0, express_async_handler_1.default)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const staff = yield user_usecase_1.default.getStaff();
            res.status(api_constant_1.statusCodes.OK).json({ success: true, data: staff });
        }));
        this.getProfile = (0, express_async_handler_1.default)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.userId;
            if (!userId) {
                res.status(api_constant_1.statusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
                return;
            }
            const profile = yield user_usecase_1.default.getProfile(userId);
            res.status(api_constant_1.statusCodes.OK).json({
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
        }));
        this.updateProfile = (0, express_async_handler_1.default)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.userId;
            if (!userId) {
                res.status(api_constant_1.statusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
                return;
            }
            const updatedProfile = yield user_usecase_1.default.updateProfile(userId, req.body);
            res.status(api_constant_1.statusCodes.OK).json({
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
        }));
    }
}
exports.default = new UserController();
