/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { z } from "zod";

export interface IAddress {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    address: string;
    customerName: string;
    orderNotes?: string;
}

export const addressSchema = z.object({
    street: z.string().min(1, {
        message: "Please enter a valid address",
    }),
    address: z.string().min(1, {
        message: "Please enter a valid address",
    }),
    city: z.string().min(1, {
        message: "Please enter a valid city",
    }),
    state: z.string().min(1, {
        message: "Please enter a valid state",
    }),
    country: z.string().min(1, {
        message: "Please enter a valid country",
    }),
    postalCode: z
        .string()
        .min(1, {
            message: "Please enter a valid pincode",
        })
        .max(6, {
            message: "Please enter a valid pincode",
        })
        .regex(/^\d+$/, {
            message: "Please enter a valid pincode",
        }),
    customerName: z.string().min(1, {
        message: "Please enter your full name",
    }),
    orderNotes: z.string().optional(),
});
