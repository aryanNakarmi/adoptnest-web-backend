import { UserModel, IUser } from "../models/user.model";
export interface IUserRepository {
    getUserByEmail(email: string): Promise<IUser | null>;
    createUser(userData: Partial<IUser>): Promise<IUser>;
    getUserById(id: string): Promise<IUser | null>;
    getAllUsers({ page, size, search }: { page: number, size: number, search?: string }): Promise<{ users: IUser[], totalUsers: number }>;  // ← CHANGE THIS LINE
    updateUser(id: string, updateData: Partial<IUser>): Promise<IUser | null>;
    deleteUser(id: string): Promise<boolean>;
}
// mongoDb Implementation of UserRepository
export class UserRepository implements IUserRepository {
    async createUser(userData: Partial<IUser>): Promise<IUser> {
        const user = new UserModel(userData); 
        return await user.save();
    }
    async getUserByEmail(email: string): Promise<IUser | null> {
        const user = await UserModel.findOne({ "email": email })
        return user;
    }

    async getUserById(id: string): Promise<IUser | null> {
        // UserModel.findOne({ "_id": id });
        const user = await UserModel.findById(id);
        return user;
    }
    // async getAllUsers(): Promise<IUser[]> {
    //     const users = await UserModel.find();
    //     return users;
    // }
    async updateUser(id: string, data: Partial<IUser>): Promise<IUser | null> {
    try {
        const user = await UserModel.findByIdAndUpdate(
            id,
            data,
            { new: true }  // ← Returns updated document
        );
        return user;
    } catch (error: Error | any) {
        throw new Error(error.message || "Failed to update user");
    }
}
    async deleteUser(id: string): Promise<boolean> {
        // UserModel.deleteOne({ _id: id });
        const result = await UserModel.findByIdAndDelete(id);
        return result ? true : false;
    }

    async getAllUsers({ page, size, search }: { page: number, size: number, search?: string }): Promise<{ users: IUser[], totalUsers: number }> {
        let filter: any = {}
        
        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { phoneNumber: { $regex: search, $options: "i" } }
            ]
        }
        
        const [users, totalUsers] = await Promise.all([
            UserModel.find(filter)
                .skip((page - 1) * size)
                .limit(size)
                .sort({ createdAt: -1 }),
            UserModel.countDocuments(filter)
        ]);
        
        return { users, totalUsers };
}
}