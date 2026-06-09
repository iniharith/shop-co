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
exports.DeliveryBoyUsecase = void 0;
const user_type_1 = require("../../../domain/types/user.type");
const user_repository_1 = require("../../../infrastructure/db/repositories/user.repository");
const jwt_1 = __importDefault(require("../../../shared/utils/jwt"));
class DeliveryBoyUsecase {
    constructor() {
        this.userRepository = new user_repository_1.UserRepository();
        this.jwtService = new jwt_1.default();
    }
    getDeliveryBoys() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.userRepository.getUsersByRole(user_type_1.Roles.DELIVERY_BOY);
        });
    }
    loginDeliveryBoy(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userRepository.findByEmail(email);
            if (!user) {
                throw new Error("Your email is not registered");
            }
            if (!user.comparePassword(password)) {
                throw new Error("Invalid password");
            }
            if (user.role !== user_type_1.Roles.DELIVERY_BOY) {
                throw new Error("You are not a delivery boy");
            }
            if (!user.verified) {
                throw new Error("Your account is not verified by Admin");
            }
            const accessToken = this.jwtService.generateAccessToken({ userId: user._id });
            const refreshToken = this.jwtService.generateRefreshToken({ userId: user._id });
            return { user, accessToken, refreshToken };
        });
    }
    registerDeliveryBoy(user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!user.email || !user.password || !user.name) {
                throw new Error("Email, password and name are required");
            }
            const existingUser = yield this.userRepository.findByEmail(user.email);
            if (existingUser) {
                throw new Error("User already exists");
            }
            const newUser = yield this.userRepository.create(Object.assign(Object.assign({}, user), { role: user_type_1.Roles.DELIVERY_BOY }));
            const accessToken = this.jwtService.generateAccessToken({ userId: newUser._id });
            const refreshToken = this.jwtService.generateRefreshToken({ userId: newUser._id });
            return { user: newUser, accessToken, refreshToken };
        });
    }
}
exports.DeliveryBoyUsecase = DeliveryBoyUsecase;
