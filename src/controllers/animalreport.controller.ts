import { AnimalReportModel } from "../models/animalreport.model";
import { CreateAnimalReportDTO } from "../dtos/animalreport.dto";
import { Request, Response } from "express";
import { z } from "zod";
import fs from "fs";
import path from "path";

interface AuthRequest extends Request {
    user?: any;
}

const animalReport = (report: any) => ({
    reportId: report._id.toString(),
    species: report.species,
    location: report.location,
    description: report.description || null,
    imageUrl: report.imageUrl,
    reportedBy: report.reportedBy._id?.toString() || report.reportedBy,
    status: report.status,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
});

export class AnimalReportController {
    // ===================== UPLOAD PHOTO =====================
    async uploadReportPhoto(req: AuthRequest, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: "Please upload a photo" });
            }

            return res.status(200).json({
                success: true,
                message: "Photo uploaded successfully",
                data: req.file.filename,
            });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Failed to upload photo",
            });
        }
    }

    // ===================== CREATE REPORT =====================
    async createReport(req: AuthRequest, res: Response) {
        try {
            const parsedData = CreateAnimalReportDTO.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json({ 
                    success: false, 
                    message: z.prettifyError(parsedData.error) 
                });
            }

            const { species, location, description, imageUrl } = parsedData.data;

            const report = await AnimalReportModel.create({
                species,
                location,
                description,
                imageUrl,
                reportedBy: req.user._id,
                status: "pending",
            });

            await report.populate("reportedBy", "fullName");

            return res.status(201).json({
                success: true,
                message: "Animal report created successfully",
                data: animalReport(report),
            });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Failed to create report",
            });
        }
    }

    // ===================== GET ALL APPROVED REPORTS =====================
    async getAllAnimalReports(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;

            const filter = { status: "approved" };
            const total = await AnimalReportModel.countDocuments(filter);
            const reports = await AnimalReportModel.find(filter)
                .populate("reportedBy", "fullName")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            return res.status(200).json({
                success: true,
                message: "Reports fetched successfully",
                count: reports.length,
                total,
                page,
                pages: Math.ceil(total / limit),
                data: reports.map(animalReport),
            });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Failed to fetch reports",
            });
        }
    }

    // ===================== GET SINGLE REPORT =====================
    async getAnimalReportById(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ success: false, message: "Report ID is required" });

            const report = await AnimalReportModel.findById(id).populate("reportedBy", "fullName");
            if (!report) return res.status(404).json({ success: false, message: "Report not found" });

            // Only approved or owner can view
            if (report.status !== "approved" && req.user?._id !== report.reportedBy._id.toString()) {
                return res.status(403).json({ success: false, message: "You do not have permission to view this report" });
            }

            return res.status(200).json({ success: true, data: animalReport(report) });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Failed to fetch report",
            });
        }
    }

    // ===================== GET MY REPORTS =====================
    async getMyReports(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) return res.status(400).json({ success: false, message: "User ID not provided" });

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;

            const total = await AnimalReportModel.countDocuments({ reportedBy: userId });
            const reports = await AnimalReportModel.find({ reportedBy: userId })
                .populate("reportedBy", "fullName")
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
                data: reports.map(animalReport),
            });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Failed to fetch your reports",
            });
        }
    }

    // ===================== DELETE REPORT =====================
    async deleteReport(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?._id;
            const { id } = req.params;
            if (!userId) return res.status(400).json({ success: false, message: "User ID not provided" });
            if (!id) return res.status(400).json({ success: false, message: "Report ID is required" });

            const report = await AnimalReportModel.findById(id);
            if (!report) return res.status(404).json({ success: false, message: "Report not found" });

            if (report.reportedBy.toString() !== userId.toString() && req.user.role !== "admin") {
                return res.status(403).json({ success: false, message: "Not authorized to delete this report" });
            }

            // Delete image if exists
            if (report.imageUrl) {
                const imagePath = path.join(__dirname, `../public/animal_reports/${report.imageUrl}`);
                try { if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); } 
                catch (err) { console.log("Error deleting image:", err); }
            }

            await AnimalReportModel.findByIdAndDelete(id);
            return res.status(200).json({ success: true, message: "Report deleted successfully" });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Failed to delete report",
            });
        }
    }
}
