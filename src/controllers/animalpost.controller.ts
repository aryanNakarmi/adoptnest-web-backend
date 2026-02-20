import { Request, Response } from "express";
import { animalPostService } from "../services/animalpost.service";
import { CreateAnimalPostDTO, UpdateAnimalPostDTO, UpdateAnimalPostStatusDTO } from "../dtos/animalpost.dto";
import z from "zod";

export class AnimalPostController {
  async createPost(req: Request, res: Response) {
    try {
      const { species, gender, breed, age, location, description } = req.body;
      const photos = req.files ? (req.files as Express.Multer.File[]).map(f => f.path.replace('public', '')) : [];

      // Validate request body
      const parsedData = CreateAnimalPostDTO.safeParse({
        species,
        gender,
        breed,
        age: parseInt(age),
        location,
        description,
        photos,
      });

      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      const newPost = await animalPostService.createPost(parsedData.data);

      return res.status(201).json({
        success: true,
        message: "Animal post created successfully",
        data: {
          _id: newPost._id,
          species: newPost.species,
          gender: newPost.gender,
          breed: newPost.breed,
          age: newPost.age,
          location: newPost.location,
          description: newPost.description,
          photos: newPost.photos,
          status: newPost.status,
          adoptedBy: newPost.adoptedBy || null,
          createdAt: newPost.createdAt,
          updatedAt: newPost.updatedAt,
        },
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Failed to create animal post",
      });
    }
  }

  async getAllPosts(req: Request, res: Response) {
    try {
      const posts = await animalPostService.getAllPosts();

      return res.status(200).json({
        success: true,
        message: "Animal posts retrieved successfully",
        data: posts,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Failed to fetch animal posts",
      });
    }
  }

  async getPostsBySpecies(req: Request, res: Response) {
    try {
      const { species } = req.params;

      if (!species) {
        return res.status(400).json({
          success: false,
          message: "Species parameter is required",
        });
      }

      const posts = await animalPostService.getPostsBySpecies(species);

      return res.status(200).json({
        success: true,
        message: "Animal posts retrieved successfully",
        data: posts,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Failed to fetch animal posts by species",
      });
    }
  }

  async getPostById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Post ID is required",
        });
      }

      const post = await animalPostService.getPostById(id);

      return res.status(200).json({
        success: true,
        message: "Animal post retrieved successfully",
        data: {
          _id: post._id,
          species: post.species,
          gender: post.gender,
          breed: post.breed,
          age: post.age,
          location: post.location,
          description: post.description,
          photos: post.photos,
          status: post.status,
          adoptedBy: post.adoptedBy || null,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        },
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Failed to fetch animal post",
      });
    }
  }

  async updatePost(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Post ID is required",
        });
      }

      const { species, gender, breed, age, location, description } = req.body;
      const photos = req.files ? (req.files as Express.Multer.File[]).map(f => f.path.replace('public', '')) : undefined;

      const updateData: any = {
        species,
        gender,
        breed,
        age: age ? parseInt(age) : undefined,
        location,
        description,
        photos,
      };

      // Remove undefined fields
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

      // Validate update data
      const parsedData = UpdateAnimalPostDTO.safeParse(updateData);

      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      const post = await animalPostService.updatePost(id, parsedData.data);

      return res.status(200).json({
        success: true,
        message: "Animal post updated successfully",
        data: {
          _id: post._id,
          species: post.species,
          gender: post.gender,
          breed: post.breed,
          age: post.age,
          location: post.location,
          description: post.description,
          photos: post.photos,
          status: post.status,
          adoptedBy: post.adoptedBy || null,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        },
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Failed to update animal post",
      });
    }
  }

  async updatePostStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Post ID is required",
        });
      }

      const { status, adoptedBy } = req.body;

      // Validate status update data
      const parsedData = UpdateAnimalPostStatusDTO.safeParse({ status, adoptedBy });

      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      const post = await animalPostService.updatePostStatus(id, parsedData.data);

      return res.status(200).json({
        success: true,
        message: "Animal post status updated successfully",
        data: {
          _id: post._id,
          species: post.species,
          gender: post.gender,
          breed: post.breed,
          age: post.age,
          location: post.location,
          description: post.description,
          photos: post.photos,
          status: post.status,
          adoptedBy: post.adoptedBy || null,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        },
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Failed to update animal post status",
      });
    }
  }

  async deletePost(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Post ID is required",
        });
      }

      await animalPostService.deletePost(id);

      return res.status(200).json({
        success: true,
        message: "Animal post deleted successfully",
        data: { _id: id },
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Failed to delete animal post",
      });
    }
  }
}