import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import { animalPostService } from "../services/animalpost.service";

// Create a new post
export const createPost = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const post = await animalPostService.createPost(req.body);
    res.status(201).json(post);
  }
);

// Get all posts
export const getAllPosts = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const posts = await animalPostService.getAllPosts();
    res.json(posts);
  }
);

// Get post by ID
export const getPostById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const post = await animalPostService.getPostById(req.params.id);
    res.json(post);
  }
);

// Update post
export const updatePost = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const post = await animalPostService.updatePost(req.params.id, req.body);
    res.json(post);
  }
);

// Update post status
export const updatePostStatus = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const post = await animalPostService.updatePostStatus(req.params.id, req.body);
    res.json(post);
  }
);

// Delete post
export const deletePost = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const success = await animalPostService.deletePost(req.params.id);
    res.json({ success });
  }
);
