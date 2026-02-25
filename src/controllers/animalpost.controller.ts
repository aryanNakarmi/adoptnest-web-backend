import { Request, Response } from "express";
import { animalPostService } from "../services/animalpost.service";
import { AnimalPostModel } from "../models/animalpost.model";
import { UserModel } from "../models/user.model";
import { CreateAnimalPostDTO, UpdateAnimalPostDTO, UpdateAnimalPostStatusDTO } from "../dtos/animalpost.dto";
import { sendEmail } from "../config/email";
import z from "zod";

interface AuthRequest extends Request {
    user?: any;
}

export class AnimalPostController {
    async createPost(req: Request, res: Response) {
        try {
            const { species, gender, breed, age, location, description } = req.body;
            const photos = req.files ? (req.files as Express.Multer.File[]).map(f => `/animal_posts/${f.filename}`) : [];
            const parsedData = CreateAnimalPostDTO.safeParse({ species, gender, breed, age: parseInt(age), location, description, photos });
            if (!parsedData.success) return res.status(400).json({ success: false, message: z.prettifyError(parsedData.error) });
            const newPost = await animalPostService.createPost(parsedData.data);
            return res.status(201).json({ success: true, message: "Animal post created successfully", data: newPost });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message || "Failed to create animal post" });
        }
    }

    async getAllPosts(req: Request, res: Response) {
        try {
            const posts = await animalPostService.getAllPosts();
            return res.status(200).json({ success: true, message: "Animal posts retrieved successfully", data: posts });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message || "Failed to fetch animal posts" });
        }
    }

    async getMyAdoptions(req: Request, res: Response) {
        try {
            const userId = (req as any).user?._id || (req as any).user?.id;
            if (!userId) return res.status(401).json({ success: false, message: "User not authenticated" });
            const posts = await animalPostService.getMyAdoptions(userId);
            return res.status(200).json({ success: true, message: "Your adoptions retrieved successfully", data: posts });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message || "Failed to fetch your adoptions" });
        }
    }

    async getPostsBySpecies(req: Request, res: Response) {
        try {
            const { species } = req.params;
            if (!species) return res.status(400).json({ success: false, message: "Species parameter is required" });
            const posts = await animalPostService.getPostsBySpecies(species);
            return res.status(200).json({ success: true, message: "Animal posts retrieved successfully", data: posts });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message || "Failed to fetch animal posts by species" });
        }
    }

    async getPostById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ success: false, message: "Post ID is required" });
            const post = await animalPostService.getPostById(id);
            return res.status(200).json({ success: true, message: "Animal post retrieved successfully", data: post });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message || "Failed to fetch animal post" });
        }
    }

    async updatePost(req: Request, res: Response) {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ success: false, message: "Post ID is required" });
            const { species, gender, breed, age, location, description } = req.body;
            let existingPhotosList: string[] = [];
            if (req.body.existingPhotos) {
                existingPhotosList = typeof req.body.existingPhotos === "string" ? [req.body.existingPhotos] : req.body.existingPhotos;
            }
            const newPhotos = req.files ? (req.files as Express.Multer.File[]).map(f => `/animal_posts/${f.filename}`) : [];
            const mergedPhotos = [...existingPhotosList, ...newPhotos];
            const updateData: any = { species, gender, breed, age: age ? parseInt(age) : undefined, location, description, photos: mergedPhotos.length > 0 ? mergedPhotos : undefined };
            Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
            const parsedData = UpdateAnimalPostDTO.safeParse(updateData);
            if (!parsedData.success) return res.status(400).json({ success: false, message: parsedData.error.message });
            const post = await animalPostService.updatePost(id, parsedData.data);
            return res.status(200).json({ success: true, message: "Animal post updated successfully", data: post });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message || "Failed to update animal post" });
        }
    }

    async updatePostStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ success: false, message: "Post ID is required" });
            const { status, adoptedBy } = req.body;
            const parsedData = UpdateAnimalPostStatusDTO.safeParse({ status, adoptedBy });
            if (!parsedData.success) return res.status(400).json({ success: false, message: z.prettifyError(parsedData.error) });

            const post = await animalPostService.updatePostStatus(id, parsedData.data);

            // ── Send congratulations email to the adopted user ──
            if (status === "Adopted" && adoptedBy) {
                try {
                    const fullPost = await AnimalPostModel.findById(id);
                    const requester = fullPost?.adoptionRequests?.find(
                        (r) => r.userId.toString() === adoptedBy.toString()
                    );
                    const adoptedPost = await AnimalPostModel.findById(id).populate("adoptedBy", "fullName email");
                    const adoptedUser = (adoptedPost?.adoptedBy as any) || requester;

                    if (adoptedUser?.email) {
                        const html = `
                            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                                <div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:30px;border-radius:12px 12px 0 0;text-align:center;">
                                    <h1 style="color:white;margin:0;font-size:26px;">Congratulations!</h1>
                                </div>
                                <div style="background:#f9fafb;padding:30px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px;">
                                    <p style="font-size:16px;color:#374151;">Hi <strong>${adoptedUser.fullName || requester?.fullName || "there"}</strong>,</p>
                                    <p style="color:#6b7280;line-height:1.6;">
                                        We are thrilled to let you know that your adoption of
                                        <strong>${(post as any).breed} (${(post as any).species})</strong>
                                        has been <span style="color:#1d4ed8;font-weight:bold;">confirmed</span>.
                                    </p>
                                    <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:15px;border-radius:4px;margin:20px 0;">
                                        <p style="margin:0;color:#1e40af;font-weight:600;">
                                            Our team will contact you soon with next steps for picking up your new companion.
                                            Thank you for giving this animal a loving home.
                                        </p>
                                    </div>
                                    <p style="color:#9ca3af;font-size:13px;margin-top:30px;">— The AdoptNest Team</p>
                                </div>
                            </div>
                        `;
                        sendEmail(
                            adoptedUser.email || requester?.email,
                            `Your Adoption is Confirmed — ${(post as any).breed} is yours!`,
                            html
                        ).catch((err) => console.error("Failed to send adoption email:", err.message));
                    }
                } catch (emailErr: any) {
                    console.error("Email lookup failed:", emailErr.message);
                }
            }

            return res.status(200).json({ success: true, message: "Animal post status updated successfully", data: post });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message || "Failed to update animal post status" });
        }
    }

    async deletePost(req: Request, res: Response) {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ success: false, message: "Post ID is required" });
            await animalPostService.deletePost(id);
            return res.status(200).json({ success: true, message: "Animal post deleted successfully", data: { _id: id } });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message || "Failed to delete animal post" });
        }
    }

    // ===================== REQUEST ADOPTION (USER) =====================
    async requestAdoption(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const userId = req.user?._id;

            if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

            const post = await AnimalPostModel.findById(id);
            if (!post) return res.status(404).json({ success: false, message: "Post not found" });

            if (post.status === "Adopted") {
                return res.status(400).json({ success: false, message: "This animal has already been adopted" });
            }

            const alreadyRequested = post.adoptionRequests.some(
                (r) => r.userId.toString() === userId.toString()
            );
            if (alreadyRequested) {
                return res.status(400).json({ success: false, message: "You have already sent an adoption request for this animal" });
            }

            // ── Fetch full user from DB to get profilePicture ──
            const fullUser = await UserModel.findById(userId).select("fullName email profilePicture").lean();
            const u = fullUser as any;

            post.adoptionRequests.push({
                userId,
                fullName: u?.fullName || req.user.fullName,
                email: u?.email || req.user.email,
                profilePicture: u?.profilePicture || null,
                requestedAt: new Date(),
            });

            await post.save();

            return res.status(200).json({
                success: true,
              message: "Adoption request sent successfully! The admin will be in touch.",
            });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message || "Failed to send adoption request" });
        }
    }

    // ===================== CANCEL ADOPTION REQUEST (USER) =====================
    async cancelAdoptionRequest(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const userId = req.user?._id;

            const post = await AnimalPostModel.findById(id);
            if (!post) return res.status(404).json({ success: false, message: "Post not found" });

            post.adoptionRequests = post.adoptionRequests.filter(
                (r) => r.userId.toString() !== userId.toString()
            );

            await post.save();

            return res.status(200).json({ success: true, message: "Adoption request cancelled" });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message || "Failed to cancel request" });
        }
    }

    // ===================== GET ADOPTION REQUESTS (ADMIN) =====================
    async getAdoptionRequests(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const post = await AnimalPostModel.findById(id).select("adoptionRequests breed species status");
            if (!post) return res.status(404).json({ success: false, message: "Post not found" });
            return res.status(200).json({
                success: true,
                message: "Adoption requests fetched",
                count: post.adoptionRequests.length,
                data: post.adoptionRequests,
            });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message || "Failed to fetch requests" });
        }
    }
}