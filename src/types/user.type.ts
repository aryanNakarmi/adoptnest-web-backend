import z from "zod";

export const UserSchema = z.object({
    email: z.email(),
    password: z.string().min(6),
    fullName: z.string(),
    phoneNumber: z.string().optional(),
    profilePicture: z.string().optional(),
    role: z.enum(["user", "admin"]).optional().default("user"),
}); 

export type UserType = z.infer<typeof UserSchema>;