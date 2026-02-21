import { CreateAnimalPostDTO, UpdateAnimalPostDTO, UpdateAnimalPostStatusDTO } from "../dtos/animalpost.dto";
import { AnimalPostRepository } from "../repositories/animalpost.repository";
import { HttpError } from "../errors/http-error";
import { IAnimalPost } from "../models/animalpost.model";

let animalPostRepository = new AnimalPostRepository();

export class AnimalPostService {
  /**
   * Create new animal post
   */
  async createPost(data: CreateAnimalPostDTO): Promise<IAnimalPost> {
    try {
      // Validation
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
        gender: data.gender,
        breed: data.breed,
        age: data.age,
        location: data.location,
        description: data.description,
        photos: data.photos,
        status: "Available",
      };

      const newPost = await animalPostRepository.createPost(postData);
      return newPost;
    } catch (error: any) {
      throw new HttpError(error.statusCode ?? 500, error.message || "Failed to create animal post");
    }
  }

  /**
   * Get all animal posts
   */
  async getAllPosts(): Promise<IAnimalPost[]> {
    try {
      const posts = await animalPostRepository.getAllPosts();
      return posts;
    } catch (error: any) {
      throw new HttpError(error.statusCode ?? 500, error.message || "Failed to fetch animal posts");
    }
  }

  async getMyAdoptions(userId: string): Promise<IAnimalPost[]> {
    try {
      if (!userId) {
        throw new HttpError(400, "User ID is required");
      }

      const posts = await animalPostRepository.getMyAdoptions(userId);
      return posts;
    } catch (error: any) {
      throw new HttpError(error.statusCode ?? 500, error.message || "Failed to fetch your adoptions");
    }
  }

  /**
   * Get posts by species
   */
  async getPostsBySpecies(species: string): Promise<IAnimalPost[]> {
    try {
      if (!species) {
        throw new HttpError(400, "Species is required");
      }

      const posts = await animalPostRepository.getPostsBySpecies(species);
      return posts;
    } catch (error: any) {
      throw new HttpError(error.statusCode ?? 500, error.message || "Failed to fetch posts by species");
    }
  }

  /**
   * Get single post by ID
   */
  async getPostById(id: string): Promise<IAnimalPost> {
    try {
      if (!id) {
        throw new HttpError(400, "Post ID is required");
      }

      const post = await animalPostRepository.getPostById(id);
      if (!post) {
        throw new HttpError(404, "Animal post not found");
      }

      return post;
    } catch (error: any) {
      throw new HttpError(error.statusCode ?? 500, error.message || "Failed to fetch animal post");
    }
  }

  /**
   * Update animal post
   */
  async updatePost(id: string, data: UpdateAnimalPostDTO): Promise<IAnimalPost> {
    try {
      if (!id) {
        throw new HttpError(400, "Post ID is required");
      }

      const post = await animalPostRepository.getPostById(id);
      if (!post) {
        throw new HttpError(404, "Animal post not found");
      }

      // Only update provided fields
      const updateData: Partial<IAnimalPost> = {
        species: data.species ?? post.species,
        gender: data.gender ?? post.gender,
        breed: data.breed ?? post.breed,
        age: data.age ?? post.age,
        location: data.location ?? post.location,
        description: data.description ?? post.description,
        photos: data.photos ?? post.photos,
      };

      const updatedPost = await animalPostRepository.updatePost(id, updateData);
      return updatedPost!;
    } catch (error: any) {
      throw new HttpError(error.statusCode ?? 500, error.message || "Failed to update animal post");
    }
  }

  /**
   * Update post status (Available → Adopted or vice versa)
   */
  async updatePostStatus(id: string, data: UpdateAnimalPostStatusDTO): Promise<IAnimalPost> {
    try {
      if (!id) {
        throw new HttpError(400, "Post ID is required");
      }

      if (!data.status || !["Available", "Adopted"].includes(data.status)) {
        throw new HttpError(400, "Invalid status. Must be Available or Adopted");
      }

      const post = await animalPostRepository.getPostById(id);
      if (!post) {
        throw new HttpError(404, "Animal post not found");
      }

      const updatedPost = await animalPostRepository.updatePostStatus(
        id,
        data.status,
        data.adoptedBy
      );

      return updatedPost!;
    } catch (error: any) {
      throw new HttpError(error.statusCode ?? 500, error.message || "Failed to update post status");
    }
  }

  /**
   * Delete animal post
   */
  async deletePost(id: string): Promise<void> {
    try {
      if (!id) {
        throw new HttpError(400, "Post ID is required");
      }

      const post = await animalPostRepository.getPostById(id);
      if (!post) {
        throw new HttpError(404, "Animal post not found");
      }

      await animalPostRepository.deletePost(id);
    } catch (error: any) {
      throw new HttpError(error.statusCode ?? 500, error.message || "Failed to delete animal post");
    }
  }
}

export const animalPostService = new AnimalPostService();