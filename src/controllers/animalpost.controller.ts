import { Request, Response } from "express";
import { animalPostService } from "../services/animalpost.service";
import { CreateAnimalPostDTO, UpdateAnimalPostDTO, UpdateAnimalPostStatusDTO } from "../dtos/animalpost.dto";
import z from "zod";

export class AnimalPostController {
  async createPost(req: Request, res: Response) {
    try {
      const { species, gender, breed, age, location, description } = req.body;
      const photos = req.files
        ? (req.files as Express.Multer.File[]).map(f => `/animal_posts/${f.filename}`)
        : [];

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
        data: newPost,
      });
    } catch (error: any) {
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
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Failed to fetch animal posts",
      });
    }
  }

  async getMyAdoptions(req: Request, res: Response) {
    try {
      // Get user ID from authenticated request
      const userId = (req as any).user?._id || (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const posts = await animalPostService.getMyAdoptions(userId);

      return res.status(200).json({
        success: true,
        message: "Your adoptions retrieved successfully",
        data: posts,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Failed to fetch your adoptions",
      });
    }
  }

  async getPostsBySpecies(req: Request, res: Response) {
    try {
      const { species } = req.params;
      if (!species) {
        return res.status(400).json({ success: false, message: "Species parameter is required" });
      }

      const posts = await animalPostService.getPostsBySpecies(species);
      return res.status(200).json({
        success: true,
        message: "Animal posts retrieved successfully",
        data: posts,
      });
    } catch (error: any) {
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
        return res.status(400).json({ success: false, message: "Post ID is required" });
      }

      const post = await animalPostService.getPostById(id);
      return res.status(200).json({
        success: true,
        message: "Animal post retrieved successfully",
        data: post,
      });
    } catch (error: any) {
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
        return res.status(400).json({ success: false, message: "Post ID is required" });
      }

      const { species, gender, breed, age, location, description } = req.body;

      // ✅ FIX: Handle existingPhotos as FormData array
      let existingPhotosList: string[] = [];

      if (req.body.existingPhotos) {
        // If it's a string, convert to array
        if (typeof req.body.existingPhotos === 'string') {
          existingPhotosList = [req.body.existingPhotos];
        }
        // If it's already an array
        else if (Array.isArray(req.body.existingPhotos)) {
          existingPhotosList = req.body.existingPhotos;
        }
      }

      // New photos uploaded
      const newPhotos = req.files
        ? (req.files as Express.Multer.File[]).map(file => `/animal_posts/${file.filename}`)
        : [];

      // ✅ Merge existing (kept) photos with new photos
      const mergedPhotos = [...existingPhotosList, ...newPhotos];

      const updateData: any = {
        species,
        gender,
        breed,
        age: age ? parseInt(age) : undefined,
        location,
        description,
        photos: mergedPhotos.length > 0 ? mergedPhotos : undefined,
      };

      // Remove undefined fields
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

      const parsedData = UpdateAnimalPostDTO.safeParse(updateData);
      if (!parsedData.success) {
        return res.status(400).json({ success: false, message: parsedData.error.message });
      }

      const post = await animalPostService.updatePost(id, parsedData.data);

      return res.status(200).json({
        success: true,
        message: "Animal post updated successfully",
        data: post,
      });
    } catch (error: any) {
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
        return res.status(400).json({ success: false, message: "Post ID is required" });
      }

      const { status, adoptedBy } = req.body;
      const parsedData = UpdateAnimalPostStatusDTO.safeParse({ status, adoptedBy });

      if (!parsedData.success) {
        return res.status(400).json({ success: false, message: z.prettifyError(parsedData.error) });
      }

      const post = await animalPostService.updatePostStatus(id, parsedData.data);

      return res.status(200).json({
        success: true,
        message: "Animal post status updated successfully",
        data: post,
      });
    } catch (error: any) {
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
        return res.status(400).json({ success: false, message: "Post ID is required" });
      }

      await animalPostService.deletePost(id);
        
      return res.status(200).json({
        success: true,
        message: "Animal post deleted successfully",
        data: { _id: id },
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Failed to delete animal post",
      });
    }
  }
}