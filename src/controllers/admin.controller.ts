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
            const { page, size, search } = req.query;
            
            const { users, pagination } = await userService.getAllUsers({
                page: page as string | undefined,
                size: size as string | undefined,
                search: search as string | undefined
            });
            
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
                pagination: pagination
            });
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Failed to fetch users"
            });
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
            const { fullName, email, phoneNumber, role } = req.body;

            const updateData: any = {};
            
            // Only include fields that are provided
            if (fullName) updateData.fullName = fullName;
            if (email) updateData.email = email;
            if (phoneNumber) updateData.phoneNumber = phoneNumber;
            
            // Validate and add role
            if (role && ["user", "admin"].includes(role)) {
                updateData.role = role; 
            }
            
            if (req.file) {
                updateData.profilePicture = `/profile_pictures/${req.file.filename}`;
            }

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: "No fields to update" 
                });
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