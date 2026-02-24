import { Request, Response } from "express";
import { animalPostService } from "../services/animalpost.service";
import { AnimalPostModel } from "../models/animalpost.model";
import {
  CreateAnimalPostDTO,
  UpdateAnimalPostDTO,
  UpdateAnimalPostStatusDTO,
} from "../dtos/animalpost.dto";
import z from "zod";

interface AuthRequest extends Request {
  user?: any;
}

export class AnimalPostController {
  async createPost(req: Request, res: Response) {
    try {
      const { species, gender, breed, age, location, description } = req.body;
      const photos = req.files
        ? (req.files as Express.Multer.File[]).map(
            (f) => `/animal_posts/${f.filename}`,
          )
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
      if (!parsedData.success)
        return res
          .status(400)
          .json({ success: false, message: z.prettifyError(parsedData.error) });
      const newPost = await animalPostService.createPost(parsedData.data);
      return res
        .status(201)
        .json({
          success: true,
          message: "Animal post created successfully",
          data: newPost,
        });
    } catch (error: any) {
      return res
        .status(error.statusCode ?? 500)
        .json({
          success: false,
          message: error.message || "Failed to create animal post",
        });
    }
  }

  async getAllPosts(req: Request, res: Response) {
    try {
      const posts = await animalPostService.getAllPosts();
      return res
        .status(200)
        .json({
          success: true,
          message: "Animal posts retrieved successfully",
          data: posts,
        });
    } catch (error: any) {
      return res
        .status(error.statusCode ?? 500)
        .json({
          success: false,
          message: error.message || "Failed to fetch animal posts",
        });
    }
  }

  async getMyAdoptions(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: "User not authenticated" });
      const posts = await animalPostService.getMyAdoptions(userId);
      return res
        .status(200)
        .json({
          success: true,
          message: "Your adoptions retrieved successfully",
          data: posts,
        });
    } catch (error: any) {
      return res
        .status(error.statusCode ?? 500)
        .json({
          success: false,
          message: error.message || "Failed to fetch your adoptions",
        });
    }
  }

  async getPostsBySpecies(req: Request, res: Response) {
    try {
      const { species } = req.params;
      if (!species)
        return res
          .status(400)
          .json({ success: false, message: "Species parameter is required" });
      const posts = await animalPostService.getPostsBySpecies(species);
      return res
        .status(200)
        .json({
          success: true,
          message: "Animal posts retrieved successfully",
          data: posts,
        });
    } catch (error: any) {
      return res
        .status(error.statusCode ?? 500)
        .json({
          success: false,
          message: error.message || "Failed to fetch animal posts by species",
        });
    }
  }

  async getPostById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id)
        return res
          .status(400)
          .json({ success: false, message: "Post ID is required" });
      const post = await animalPostService.getPostById(id);
      return res
        .status(200)
        .json({
          success: true,
          message: "Animal post retrieved successfully",
          data: post,
        });
    } catch (error: any) {
      return res
        .status(error.statusCode ?? 500)
        .json({
          success: false,
          message: error.message || "Failed to fetch animal post",
        });
    }
  }

  async updatePost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id)
        return res
          .status(400)
          .json({ success: false, message: "Post ID is required" });
      const { species, gender, breed, age, location, description } = req.body;
      let existingPhotosList: string[] = [];
      if (req.body.existingPhotos) {
        existingPhotosList =
          typeof req.body.existingPhotos === "string"
            ? [req.body.existingPhotos]
            : req.body.existingPhotos;
      }
      const newPhotos = req.files
        ? (req.files as Express.Multer.File[]).map(
            (f) => `/animal_posts/${f.filename}`,
          )
        : [];
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
      Object.keys(updateData).forEach(
        (key) => updateData[key] === undefined && delete updateData[key],
      );
      const parsedData = UpdateAnimalPostDTO.safeParse(updateData);
      if (!parsedData.success)
        return res
          .status(400)
          .json({ success: false, message: parsedData.error.message });
      const post = await animalPostService.updatePost(id, parsedData.data);
      return res
        .status(200)
        .json({
          success: true,
          message: "Animal post updated successfully",
          data: post,
        });
    } catch (error: any) {
      return res
        .status(error.statusCode ?? 500)
        .json({
          success: false,
          message: error.message || "Failed to update animal post",
        });
    }
  }

  async updatePostStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id)
        return res
          .status(400)
          .json({ success: false, message: "Post ID is required" });
      const { status, adoptedBy } = req.body;
      const parsedData = UpdateAnimalPostStatusDTO.safeParse({
        status,
        adoptedBy,
      });
      if (!parsedData.success)
        return res
          .status(400)
          .json({ success: false, message: z.prettifyError(parsedData.error) });
      const post = await animalPostService.updatePostStatus(
        id,
        parsedData.data,
      );
      return res
        .status(200)
        .json({
          success: true,
          message: "Animal post status updated successfully",
          data: post,
        });
    } catch (error: any) {
      return res
        .status(error.statusCode ?? 500)
        .json({
          success: false,
          message: error.message || "Failed to update animal post status",
        });
    }
  }

  async deletePost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id)
        return res
          .status(400)
          .json({ success: false, message: "Post ID is required" });
      await animalPostService.deletePost(id);
      return res
        .status(200)
        .json({
          success: true,
          message: "Animal post deleted successfully",
          data: { _id: id },
        });
    } catch (error: any) {
      return res
        .status(error.statusCode ?? 500)
        .json({
          success: false,
          message: error.message || "Failed to delete animal post",
        });
    }
  }

  // ===================== REQUEST ADOPTION (USER) =====================
  async requestAdoption(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: "Not authenticated" });

      const post = await AnimalPostModel.findById(id);
      if (!post)
        return res
          .status(404)
          .json({ success: false, message: "Post not found" });

      if (post.status === "Adopted") {
        return res
          .status(400)
          .json({
            success: false,
            message: "This animal has already been adopted",
          });
      }

      // Check if user already requested
      const alreadyRequested = post.adoptionRequests.some(
        (r) => r.userId.toString() === userId.toString(),
      );
      if (alreadyRequested) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "You have already sent an adoption request for this animal",
          });
      }

      // Add request
      post.adoptionRequests.push({
        userId,
        fullName: req.user.fullName,
        email: req.user.email,
        requestedAt: new Date(),
      });

      await post.save();

      return res.status(200).json({
        success: true,
        message:
          "Adoption request sent successfully! The admin will be in touch.",
      });
    } catch (error: any) {
      return res
        .status(500)
        .json({
          success: false,
          message: error.message || "Failed to send adoption request",
        });
    }
  }

  // ===================== CANCEL ADOPTION REQUEST (USER) =====================
  async cancelAdoptionRequest(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      const post = await AnimalPostModel.findById(id);
      if (!post)
        return res
          .status(404)
          .json({ success: false, message: "Post not found" });

      post.adoptionRequests = post.adoptionRequests.filter(
        (r) => r.userId.toString() !== userId.toString(),
      );

      await post.save();

      return res
        .status(200)
        .json({ success: true, message: "Adoption request cancelled" });
    } catch (error: any) {
      return res
        .status(500)
        .json({
          success: false,
          message: error.message || "Failed to cancel request",
        });
    }
  }

  // ===================== GET ADOPTION REQUESTS (ADMIN) =====================
  async getAdoptionRequests(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const post = await AnimalPostModel.findById(id).select(
        "adoptionRequests breed species status",
      );
      if (!post)
        return res
          .status(404)
          .json({ success: false, message: "Post not found" });
      return res.status(200).json({
        success: true,
        message: "Adoption requests fetched",
        count: post.adoptionRequests.length,
        data: post.adoptionRequests,
      });
    } catch (error: any) {
      return res
        .status(500)
        .json({
          success: false,
          message: error.message || "Failed to fetch requests",
        });
    }
  }
}
