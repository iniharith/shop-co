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
exports.initAdmin = void 0;
const dotenv_1 = require("dotenv");
const user_type_1 = require("../../domain/types/user.type");
const user_repository_1 = require("../../infrastructure/db/repositories/user.repository");
(0, dotenv_1.config)();
const initAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    const userRepository = new user_repository_1.UserRepository();
    let user = yield userRepository.findByEmail(process.env.ADMIN_EMAIL);
    if (!user) {
        user = yield userRepository.create({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, role: user_type_1.Roles.ADMIN, name: "Admin", verified: true });
    }
    console.log("🎉 Admin created successfully");
});
exports.initAdmin = initAdmin;
