import mongoose, { Document, Schema } from "mongoose";
import { AnimalReportType } from "../types/animalreport.type"; // the Zod type we created

const AnimalReportSchema: Schema = new Schema<AnimalReportType>(
    {
        species: { type: String, required: true, trim: true },
        location: { type: String, required: true, trim: true },
        description: { type: String, trim: true, default: null },
        imageUrl: { type: String, required: true },
        reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    },
    { timestamps: true }
);

export interface IAnimalReport extends AnimalReportType, Document {
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export const AnimalReportModel = mongoose.model<IAnimalReport>(
    "AnimalReport",
    AnimalReportSchema
);
