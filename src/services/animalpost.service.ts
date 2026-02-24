import { CreateAnimalPostDTO, UpdateAnimalPostDTO, UpdateAnimalPostStatusDTO } from "../dtos/animalpost.dto";
import { AnimalPostRepository } from "../repositories/animalpost.repository";
import { HttpError } from "../errors/http-error";
import { IAnimalPost } from "../models/animalpost.model";

let animalPostRepository = new AnimalPostRepository();

export class AnimalPostService {
  async createPost(data: CreateAnimalPostDTO): Promise<IAnimalPost> {
    try {
      if (!data.species || !data.gender || !data.breed || !data.age || !data.location || !data.description) {
        throw new HttpError(400, "All required fields must be provided");
      }

      if (!data.photos || data.photos.length === 0) {
        throw new HttpError(400, "At least one photo is required");
      }

      if (data.photos.length > 5) {
        throw new HttpError(400, "Maximum 5 photos allowed");
      }

      const postData: Partial<IAnimalPost> = {
        species: data.species,
        gender: data.gender as "Male" | "Female", // ← fix
        breed: data.breed,
        age: data.age,
        location: data.location,
        description: data.description,
        photos: data.photos,
        status: "Available",
      };

      const newPost = await animalPostRepository.createPost(postData as any);
      return newPost;
    } catch (error: any) {
      throw new HttpError(error.statusCode ?? 500, error.message || "Failed to create animal post");
    }
  }

  async getAllPosts(): Promise<IAnimalPost[]> {
    try {
      return await animalPostRepository.getAllPosts();
    } catch (error: any) {
      throw new HttpError(error.statusCode ?? 500, error.message || "Failed to fetch animal posts");
    }
  }

  async getMyAdoptions(userId: string): Promise<IAnimalPost[]> {
    try {
      if (!userId) throw new HttpError(400, "User ID is required");
      return await animalPostRepository.getMyAdoptions(userId);
    } catch (error: any) {
      throw new HttpError(error.statusCode ?? 500, error.message || "Failed to fetch your adoptions");
    }
  }

  async getPostsBySpecies(species: string): Promise<IAnimalPost[]> {
    try {
      if (!species) throw new HttpError(400, "Species is required");
      return await animalPostRepository.getPostsBySpecies(species);
    } catch (error: any) {
      throw new HttpError(error.statusCode ?? 500, error.message || "Failed to fetch posts by species");
    }
  }

  async getPostById(id: string): Promise<IAnimalPost> {
    try {
      if (!id) throw new HttpError(400, "Post ID is required");
      const post = await animalPostRepository.getPostById(id);
      if (!post) throw new HttpError(404, "Animal post not found");
      return post;
    } catch (error: any) {
      throw new HttpError(error.statusCode ?? 500, error.message || "Failed to fetch animal post");
    }
  }

  async updatePost(id: string, data: UpdateAnimalPostDTO): Promise<IAnimalPost> {
    try {
      if (!id) throw new HttpError(400, "Post ID is required");

      const post = await animalPostRepository.getPostById(id);
      if (!post) throw new HttpError(404, "Animal post not found");

      const updateData: Partial<IAnimalPost> = {
        species: data.species ?? post.species,
        gender: (data.gender ?? post.gender) as "Male" | "Female", // ← fix
        breed: data.breed ?? post.breed,
        age: data.age ?? post.age,
        location: data.location ?? post.location,
        description: data.description ?? post.description,
        photos: data.photos ?? post.photos,
      };

      const updatedPost = await animalPostRepository.updatePost(id, updateData as any);
      return updatedPost!;
    } catch (error: any) {
      throw new HttpError(error.statusCode ?? 500, error.message || "Failed to update animal post");
    }
  }

  async updatePostStatus(id: string, data: UpdateAnimalPostStatusDTO): Promise<IAnimalPost> {
    try {
      if (!id) throw new HttpError(400, "Post ID is required");

      if (!data.status || !["Available", "Adopted"].includes(data.status)) {
        throw new HttpError(400, "Invalid status. Must be Available or Adopted");
      }

      const post = await animalPostRepository.getPostById(id);
      if (!post) throw new HttpError(404, "Animal post not found");

      const updatedPost = await animalPostRepository.updatePostStatus(id, data.status, data.adoptedBy);
      return updatedPost!;
    } catch (error: any) {
      throw new HttpError(error.statusCode ?? 500, error.message || "Failed to update post status");
    }
  }

  async deletePost(id: string): Promise<void> {
    try {
      if (!id) throw new HttpError(400, "Post ID is required");
      const post = await animalPostRepository.getPostById(id);
      if (!post) throw new HttpError(404, "Animal post not found");
      await animalPostRepository.deletePost(id);
    } catch (error: any) {
      throw new HttpError(error.statusCode ?? 500, error.message || "Failed to delete animal post");
    }
  }
}

export const animalPostService = new AnimalPostService();