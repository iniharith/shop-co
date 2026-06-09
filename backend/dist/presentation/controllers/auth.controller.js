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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const user_usecase_1 = require("../../application/usecases/user/user.usecase");
const api_constant_1 = require("../../shared/constants/api.constant");
/**  @Controller */
class AuthController {
    constructor() {
        this.authUsecase = new user_usecase_1.UserUsecase();
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
            try {
                const { email, password } = req.body;
                if (!email || !password) {
                    return res.status(api_constant_1.statusCodes.BAD_REQUEST).json({
                        success: false,
                        message: "Email and password are required"
                    });
                }
                const { user, accessToken, refreshToken } = yield this.authUsecase.loginUser(email, password);
                res.status(api_constant_1.statusCodes.OK).json({
                    success: true,
                    message: "User logged in successfully",
                    user,
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
                res.status(api_constant_1.statusCodes.CREATED).json({
                    success: true,
                    message: "User registered successfully",
                    user,
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
