import { Document } from "mongoose";
import { Roles } from "../types/user.type";

export interface IUser {
    name: string;
    email: string;
    role: Roles;
    password: string;
    avatar?: string;
    verified: boolean;
    phoneNumber?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    };
}


export interface IUserDocument extends IUser, Document {
    avatar: string;
    comparePassword(password: string): boolean;
}
