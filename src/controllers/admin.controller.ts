import { UserService } from "../services/user.service";
import { Request, Response } from "express";

let userService = new UserService();

export class AdminController {
    async createUser(req: Request, res: Response) {
        try {
            const { fullName, email, phoneNumber, password } = req.body;
            const profilePicture = req.file ? `/profile_pictures/${req.file.filename}` : null;

            const newUser = await userService.createUser({
                fullName,
                email,
                phoneNumber,
                password,
                profilePicture,
            });

            return res.status(201).json({
                success: true,
                message: "User created successfully",
                data: {
                    _id: newUser._id,
                    fullName: newUser.fullName,
                    email: newUser.email,
                    phoneNumber: newUser.phoneNumber || null,
                    profilePicture: newUser.profilePicture || null,
                    role: newUser.role,
                }
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Failed to create user" }
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
                return res.status(400).json({ success: false, message: "User ID is required" });
            }

            const user = await userService.getUserById(id);
            
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            return res.status(200).json({
                success: true,
                message: "User retrieved successfully",
                data: {
                    _id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    phoneNumber: user.phoneNumber || null,
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

    async updateUser(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { fullName, email, phoneNumber } = req.body;

            const updateData: any = { fullName, email, phoneNumber };
            if (req.file) {
                updateData.profilePicture = `/profile_pictures/${req.file.filename}`;
            }

            const user = await userService.updateUser(id, updateData);
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            return res.status(200).json({
                success: true,
                message: "User updated successfully",
                data: {
                    _id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    phoneNumber: user.phoneNumber || null,
                    profilePicture: user.profilePicture || null,
                    role: user.role,
                }
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Failed to update user" }
            );
        }
    }

    async deleteUser(req: Request, res: Response) {
        try {
            const { id } = req.params;
            
            if (!id) {
                return res.status(400).json({ success: false, message: "User ID is required" });
            }

            const user = await userService.getUserById(id);
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
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