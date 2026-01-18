import { UserService } from "../services/user.service";
import { CreateUserDTO, LoginUserDTO } from "../dtos/user.dto";
import { Request, Response } from "express";
import z from "zod";

let userService = new UserService();

export class AuthController {
    async register(req: Request, res: Response) {
        try {
            const parsedData = CreateUserDTO.safeParse(req.body); // validate request body
            if (!parsedData.success) { // validation failed
                return res.status(400).json(
                    { success: false, message: z.prettifyError(parsedData.error) }
                )
            }
            const userData: CreateUserDTO = parsedData.data;
            const newUser = await userService.createUser(userData);
             return res.status(201).json({
                success: true,
                message: "User registered successfully",
                data: {
                    _id: newUser._id,
                    fullName: newUser.fullName,
                    email: newUser.email,
                    phoneNumber: newUser.phoneNumber || null,
                    username: newUser.username || null,
                    profilePicture: newUser.profilePicture || null,
                    role: newUser.role,
                }
            });
        } catch (error: Error | any) { // exception handling
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Registration Failed" }
            );
        }
    }

    async login(req: Request, res: Response) {
        try {
            const parsedData = LoginUserDTO.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json(
                    { success: false, message: z.prettifyError(parsedData.error) }
                )
            }
            const loginData: LoginUserDTO = parsedData.data;
            const { token, user } = await userService.loginUser(loginData);
            return res.status(200).json(
                { success: true, message: "Login successful",
                 data:  {
                    _id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    username: user.username,
                    profilePicture: user.profilePicture,
                    role: user.role,
                }, token }
            );

        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async getAllUsers(req: Request, res: Response) {
        try {
            const users = await userService.getAllUsers();
            return res.status(200).json({
                success: true,
                message: "Users retrieved successfully",
                data: users.map(user => ({
                    _id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    phoneNumber: user.phoneNumber || null,
                    username: user.username || null,
                    profilePicture: user.profilePicture || null,
                    role: user.role,
                    createdAt: user.createdAt,
                })),
                count: users.length
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Failed to fetch users" }
            );
        }
    }

    async getUserById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            
            if (!id) {
                return res.status(400).json(
                    { success: false, message: "User ID is required" }
                );
            }

            const user = await userService.getUserById(id);
            
            if (!user) {
                return res.status(404).json(
                    { success: false, message: "User not found" }
                );
            }

            return res.status(200).json({
                success: true,
                message: "User retrieved successfully",
                data: {
                    _id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    phoneNumber: user.phoneNumber || null,
                    username: user.username || null,
                    profilePicture: user.profilePicture || null,
                    role: user.role,
                    createdAt: user.createdAt,
                }
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Failed to fetch user" }
            );
        }
    }

    async deleteUser(req: Request, res: Response) {
        try {
            const { id } = req.params;
            
            if (!id) {
                return res.status(400).json(
                    { success: false, message: "User ID is required" }
                );
            }

            const user = await userService.getUserById(id);
            
            if (!user) {
                return res.status(404).json(
                    { success: false, message: "User not found" }
                );
            }

            await userService.deleteUser(id);

            return res.status(200).json({
                success: true,
                message: "User deleted successfully",
                data: { _id: id }
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Failed to delete user" }
            );
        }
    }
}
