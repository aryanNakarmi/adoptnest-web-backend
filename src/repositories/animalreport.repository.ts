import { AnimalReportModel, IAnimalReport } from "../models/animalreport.model";
import { AnimalReportType } from "../types/animalreport.type";

export interface IAnimalReportRepository {
    createReport(reportData: Partial<AnimalReportType & { reportedBy: string }>): Promise<IAnimalReport>;
    getReportById(id: string): Promise<IAnimalReport | null>;
    getAllReports(): Promise<IAnimalReport[]>;
    getReportsBySpecies(species: string): Promise<IAnimalReport[]>;
    getMyReports(userId: string): Promise<IAnimalReport[]>;
    updateReportStatus(id: string, status: "pending" | "approved" | "rejected", rejectionReason?: string): Promise<IAnimalReport | null>;
    deleteReport(id: string): Promise<boolean>;
}

// MongoDB Implementation
export class AnimalReportRepository implements IAnimalReportRepository {
    async createReport(reportData: Partial<AnimalReportType & { reportedBy: string }>): Promise<IAnimalReport> {
        const report = new AnimalReportModel(reportData);
        return await report.save();
    }

    async getReportById(id: string): Promise<IAnimalReport | null> {
        return await AnimalReportModel.findById(id).populate("reportedBy", "fullName email");
    }

    async getAllReports(): Promise<IAnimalReport[]> {
        return await AnimalReportModel.find().populate("reportedBy", "fullName email").sort({ createdAt: -1 });
    }

    async getReportsBySpecies(species: string): Promise<IAnimalReport[]> {
        return await AnimalReportModel.find({ species: { $regex: species, $options: "i" } })
            .populate("reportedBy", "fullName email")
            .sort({ createdAt: -1 });
    }

    async getMyReports(userId: string): Promise<IAnimalReport[]> {
        return await AnimalReportModel.find({ reportedBy: userId })
            .populate("reportedBy", "fullName email")
            .sort({ createdAt: -1 });
    }

    async updateReportStatus(id: string, status: "pending" | "approved" | "rejected", rejectionReason?: string): Promise<IAnimalReport | null> {
        const report = await AnimalReportModel.findById(id);
        if (!report) return null;

        report.status = status;
        if (status === "rejected" && rejectionReason) {
            report.description = `${report.description || ""}\nRejection reason: ${rejectionReason}`;
        }
        await report.save();
        return report;
    }

    async deleteReport(id: string): Promise<boolean> {
        const result = await AnimalReportModel.findByIdAndDelete(id);
        return result ? true : false;
    }
}
