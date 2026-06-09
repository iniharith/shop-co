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
exports.UserUsecase = void 0;
const user_repository_1 = require("../../../infrastructure/db/repositories/user.repository");
const jwt_1 = __importDefault(require("../../../shared/utils/jwt"));
class UserUsecase {
    constructor() {
        this.userRepository = new user_repository_1.UserRepository();
        this.jwtService = new jwt_1.default();
    }
    loginUser(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userRepository.findByEmail(email);
            if (!user) {
                throw new Error("User not found");
            }
            if (!user.comparePassword(password)) {
                throw new Error("Invalid password");
            }
            const accessToken = this.jwtService.generateAccessToken({ userId: user._id });
            const refreshToken = this.jwtService.generateRefreshToken({ userId: user._id });
            return { user, accessToken, refreshToken };
        });
    }
    registerUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!user.email || !user.password || !user.name) {
                throw new Error("Email, password and name are required");
            }
            const existingUser = yield this.userRepository.findByEmail(user.email);
            if (existingUser) {
                throw new Error("User already exists");
            }
            const newUser = yield this.userRepository.create(user);
            const accessToken = this.jwtService.generateAccessToken({ userId: newUser._id });
            const refreshToken = this.jwtService.generateRefreshToken({ userId: newUser._id });
            return { user: newUser, accessToken, refreshToken };
        });
    }
    getUsersByRole(role) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.userRepository.getUsersByRole(role);
        });
    }
}
exports.UserUsecase = UserUsecase;
exports.default = new UserUsecase();
