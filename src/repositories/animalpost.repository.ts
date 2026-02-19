import { AnimalPostModel, IAnimalPost } from "../models/animalpost.model";
import { AnimalPostType } from "../types/animalpost.type";


export interface IAnimalPostRepository {
  createPost(postData: Partial<AnimalPostType & { postedBy?: string }>): Promise<IAnimalPost>;
  getPostById(id: string): Promise<IAnimalPost | null>;
  getAllPosts(): Promise<IAnimalPost[]>;
  getPostsBySpecies(species: string): Promise<IAnimalPost[]>;
  getMyPosts(userId: string): Promise<IAnimalPost[]>;
  updatePostStatus(id: string, status: "Available" | "Adopted", adoptedBy?: string): Promise<IAnimalPost | null>;
  updatePost(id: string, updateData: Partial<AnimalPostType>): Promise<IAnimalPost | null>;
  deletePost(id: string): Promise<boolean>;
}

export class AnimalPostRepository implements IAnimalPostRepository {
  async createPost(postData: Partial<AnimalPostType & { postedBy?: string }>): Promise<IAnimalPost> {
    const post = new AnimalPostModel(postData);
    return await post.save();
  }

  async getPostById(id: string): Promise<IAnimalPost | null> {
    return await AnimalPostModel.findById(id).populate("adoptedBy", "fullName email");
  }

  async getAllPosts(): Promise<IAnimalPost[]> {
    return await AnimalPostModel.find()
      .populate("adoptedBy", "fullName email")
      .sort({ createdAt: -1 });
  }

  async getPostsBySpecies(species: string): Promise<IAnimalPost[]> {
    return await AnimalPostModel.find({ species: { $regex: species, $options: "i" } })
      .populate("adoptedBy", "fullName email")
      .sort({ createdAt: -1 });
  }

  async getMyPosts(userId: string): Promise<IAnimalPost[]> {
    return await AnimalPostModel.find({ postedBy: userId })
      .populate("adoptedBy", "fullName email")
      .sort({ createdAt: -1 });
  }

  async updatePostStatus(id: string, status: "Available" | "Adopted", adoptedBy?: string): Promise<IAnimalPost | null> {
    const update: any = { status };
    if (status === "Adopted") update.adoptedBy = adoptedBy || null;
    else update.adoptedBy = null;

    return await AnimalPostModel.findByIdAndUpdate(id, update, { new: true });
  }

  async updatePost(id: string, updateData: Partial<AnimalPostType>): Promise<IAnimalPost | null> {
    return await AnimalPostModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deletePost(id: string): Promise<boolean> {
    const result = await AnimalPostModel.findByIdAndDelete(id);
    return !!result;
  }
}

export const animalPostRepository = new AnimalPostRepository();
