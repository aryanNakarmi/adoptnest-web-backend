import { AnimalReportModel } from "../models/animalreport.model";
import { CreateAnimalReportDTO, RejectReportDTO } from "../dtos/animalreport.dto";
import { Request, Response } from "express";
import z from "zod";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";

interface AuthRequest extends Request {
    user?: any;
}

export class AnimalReportController {
    // ===================== UPLOAD PHOTO =====================
    async uploadReportPhoto(req: AuthRequest, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: "Please upload a photo" });
            }

             const imageUrl = `/animal_reports/${req.file.filename}`;
            

            return res.status(200).json({
                success: true,
                message: "Photo uploaded successfully",
                data: imageUrl,
            });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Failed to upload photo",
            });
        }
    }

    // ===================== CREATE REPORT (USER) =====================
    async createReport(req: AuthRequest, res: Response) {
        try {
            const parsedData = CreateAnimalReportDTO.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json({
                    success: false,
                    message: z.prettifyError(parsedData.error),
                });
            }

            const { species, location, description, imageUrl } = parsedData.data;

            const report = await AnimalReportModel.create({
                species,
                location,
                description,
                imageUrl,
                reportedBy: req.user._id, // user id from auth middleware
                status: "pending", // default pending
            });

            return res.status(201).json({
                success: true,
                message: "Animal report created successfully",
                data: report,
            });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Failed to create report",
            });
        }
    }

    // ===================== GET ALL REPORTS (ADMIN) =====================
    async getAllReports(req: AuthRequest, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;

            const total = await AnimalReportModel.countDocuments({});
            const reports = await AnimalReportModel.find({})
                .populate("reportedBy", "fullName email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            return res.status(200).json({
                success: true,
                message: "All reports fetched successfully",
                count: reports.length,
                total,
                page,
                pages: Math.ceil(total / limit),
                data: reports,
            });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Failed to fetch reports",
            });
        }
    }
// ===================== GET REPORT BY ID (ADMIN or OWNER) =====================
async getReportById(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ success: false, message: "Report ID is required" });

        const report = await AnimalReportModel.findById(id).populate("reportedBy", "fullName email");
        if (!report) return res.status(404).json({ success: false, message: "Report not found" });

        // safely get reportedBy ID
        const reportedById = (report.reportedBy as any)?._id?.toString() || report.reportedBy?.toString();

        if (report.status !== "approved" && req.user._id.toString() !== reportedById && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "You do not have permission to view this report" });
        }

        return res.status(200).json({
            success: true,
            message: "Report fetched successfully",
            data: report,
        });
    } catch (error: any) {
        return res.status(error.statusCode ?? 500).json({
            success: false,
            message: error.message || "Failed to fetch report",
        });
    }
}


// ===================== GET MY REPORTS (USER DASHBOARD) =====================
async getMyReports(req: AuthRequest, res: Response) {
    try {
        const userId = new mongoose.Types.ObjectId(req.user._id); // <--- convert string to ObjectId
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const total = await AnimalReportModel.countDocuments({ reportedBy: req.user._id });
        const reports = await AnimalReportModel.find({ reportedBy: req.user._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return res.status(200).json({
            success: true,
            message: "Your reports fetched successfully",
            count: reports.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: reports,
        });
    } catch (error: any) {
        return res.status(error.statusCode ?? 500).json({
            success: false,
            message: error.message || "Failed to fetch your reports",
        });
    }
}


    // ===================== UPDATE REPORT STATUS (ADMIN ONLY) =====================
   async updateReportStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const report = await AnimalReportModel.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    report.status = status;

    await report.save();

    return res.status(200).json({
      success: true,
      message: `Report ${status} successfully`,
      data: report,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update report",
    });
  }
}

// ===================== DELETE REPORT (ADMIN OR OWNER) =====================
async deleteReport(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        if (!id) return res.status(400).json({ success: false, message: "Report ID is required" });

        const report = await AnimalReportModel.findById(id);
        if (!report) return res.status(404).json({ success: false, message: "Report not found" });

        const reportedById = (report.reportedBy as any)?._id?.toString() || report.reportedBy?.toString();

        if (req.user.role !== "admin" && reportedById !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized to delete this report" });
        }

        // Delete image if exists
          if (report.imageUrl) {
                const filename = report.imageUrl.split("/").pop();
                if (filename) {
                    const imagePath = path.join(
                        process.cwd(),
                        "public",
                        "animal_reports",
                        filename
                    );

                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                    }
                }
            }
        await AnimalReportModel.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Report deleted successfully",
        });
    } catch (error: any) {
        return res.status(error.statusCode ?? 500).json({
            success: false,
            message: error.message || "Failed to delete report",
        });
    }
}


// ===================== GET REPORTS BY SPECIES =====================
async getReportsBySpecies(req: AuthRequest, res: Response) {
    try {
        const { species } = req.params;

        if (!species || typeof species !== 'string') {
            return res.status(400).json({
                success: false,
                message: "Species query parameter is required",
            });
        }

        const reports = await AnimalReportModel.find({
            species: { $regex: new RegExp(species, 'i') } // case-insensitive
        }).populate("reportedBy", "fullName email")
          .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: `Reports filtered by species: ${species}`,
            count: reports.length,
            data: reports,
        });
    } catch (error: any) {
        return res.status(error.statusCode ?? 500).json({
            success: false,
            message: error.message || "Failed to fetch reports by species",
        });
    }
}

}
