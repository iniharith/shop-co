/**
 * Coded by Harith
 * Kampungcetak ®
 */
export interface IUser {
    _id: string;
    name: string;
    email: string;
    role: Roles;
    password: string;
    avatar: string;
    verified: boolean;
}

export enum Roles {
  CLIENT = "client",
  ADMIN = "admin",
  SYSADMIN = "sysadmin",
  DESIGNER = "designer",
  BOSS = "boss",
  PRODUCTION = "production"
}
