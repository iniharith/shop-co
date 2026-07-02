/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { config } from "dotenv";
import { Roles } from "../../domain/types/user.type";
import { UserRepository } from "../../infrastructure/db/repositories/user.repository";
config();


export const initAdmin = async () => {
    const userRepository = new UserRepository();
    const adminEmail = process.env.ADMIN_EMAIL || "admin@kampungcetak.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin";

    let user = await userRepository.findByEmail(adminEmail);
    if (!user) {
        user = await userRepository.create({ email: adminEmail, password: adminPassword, role: Roles.ADMIN, name: "Admin", verified: true });
    }
    console.log("🎉 Admin created successfully");
}


