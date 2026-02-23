import mongoose, { Document, Schema } from "mongoose";

const AnimalReportSchema: Schema = new Schema(
    {
        species: { type: String, required: true, trim: true },
        location: {
            address: { type: String, required: true, trim: true },
            lat:     { type: Number, required: true },
            lng:     { type: Number, required: true },
        },
        description: { type: String, trim: true, default: null },
        imageUrl: { type: String, required: true },
        reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    },
    { timestamps: true }
);

export interface IAnimalReport extends Document {
    _id: mongoose.Types.ObjectId;
    species: string;
    location: {
        address: string;
        lat: number;
        lng: number;
    };
    description?: string | null;
    imageUrl: string;
    reportedBy: mongoose.Types.ObjectId;
    status: "pending" | "approved" | "rejected";
    createdAt: Date;
    updatedAt: Date;
}

export const AnimalReportModel = mongoose.model<IAnimalReport>(
    "AnimalReport",
    AnimalReportSchema
);