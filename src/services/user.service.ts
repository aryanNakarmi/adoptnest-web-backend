import { CreateUserDTO, LoginUserDTO } from "../dtos/user.dto";
import { UserRepository } from "../repositories/user.repository";
import  bcryptjs from "bcryptjs"
import { HttpError } from "../errors/http-error";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { IUser } from "../models/user.model";

let userRepository = new UserRepository();

export class UserService {
 async createUser(data: CreateUserDTO) {
    const emailCheck = await userRepository.getUserByEmail(data.email);
    if (emailCheck) {
        throw new HttpError(403, "Email already in use");
    }

    // hash password
    const hashedPassword = await bcryptjs.hash(data.password, 10);

    const userData: Partial<IUser> = {
        fullName: data.fullName,
        email: data.email,
        password: hashedPassword,
        phoneNumber: data.phoneNumber ?? undefined,
        profilePicture: data.profilePicture ?? undefined, // <-- fix here
        role: data.role ?? "user"
    };

    const newUser = await userRepository.createUser(userData);
    return newUser;
}


    async   loginUser(data: LoginUserDTO){
        const user =  await userRepository.getUserByEmail(data.email);
        if(!user){
            throw new HttpError(404, "User not found");
        }
        // compare password
        const validPassword = await bcryptjs.compare(data.password, user.password);
        // plaintext, hashed
        if(!validPassword){
            throw new HttpError(401, "Invalid credentials");
        }
        // generate jwt
        const payload = { // user identifier
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            role: user.role
        }
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' }); // 30 days
        return { token, user }
    }

    async getAllUsers() {
        try {
            const users = await userRepository.getAllUsers();
            return users;
        } catch (error: Error | any) {
            throw new HttpError(500, error.message || "Failed to fetch users");
        }
    }

    async getUserById(id: string) {
        try {
            if (!id) {
                throw new HttpError(400, "User ID is required");
            }
            const user = await userRepository.getUserById(id);
            if (!user) {
                throw new HttpError(404, "User not found");
            }
            return user;
        } catch (error: Error | any) {
            throw new HttpError(error.statusCode ?? 500, error.message || "Failed to fetch user");
        }
    }

    async deleteUser(id: string) {
        try {
            if (!id) {
                throw new HttpError(400, "User ID is required");
            }
            const user = await userRepository.getUserById(id);
            if (!user) {
                throw new HttpError(404, "User not found");
            }
            const deletedUser = await userRepository.deleteUser(id);
            return deletedUser;
        } catch (error: Error | any) {
            throw new HttpError(error.statusCode ?? 500, error.message || "Failed to delete user");
        }
    }
async updateUser(id: string, data: Partial<CreateUserDTO>) {
    try {
        if (!id) throw new HttpError(400, "User ID is required");

        const user = await userRepository.getUserById(id);
        if (!user) throw new HttpError(404, "User not found");

        // Check email uniqueness
        if (data.email && data.email !== user.email) {
            const emailCheck = await userRepository.getUserByEmail(data.email);
            if (emailCheck) throw new HttpError(403, "Email already in use");
        }

        // Map DTO to IUser-compatible object
        const updateData: Partial<IUser> = {
            fullName: data.fullName,
            email: data.email,
            phoneNumber: data.phoneNumber ?? undefined,
            profilePicture: data.profilePicture ?? undefined,
            role: data.role ?? user.role
        };

        // Hash password if provided
        if (data.password) {
            updateData.password = await bcryptjs.hash(data.password, 10);
        }

        const updatedUser = await userRepository.updateUser(id, updateData);
        return updatedUser;
    } catch (error: any) {
        throw new HttpError(error.statusCode ?? 500, error.message || "Failed to update user");
    }
}
}