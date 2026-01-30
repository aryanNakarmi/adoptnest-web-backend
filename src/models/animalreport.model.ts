import mongoose, { Document, Schema } from "mongoose";

export interface IAnimalReport extends Document {
    _id: mongoose.Types.ObjectId;
    species: string;
    location: string;
    description?: string;
    imageUrl: string;
    reportedBy: mongoose.Types.ObjectId; // User ID reference
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}

const AnimalReportSchema: Schema = new Schema<IAnimalReport>(
    {
        species: {
            type: String,
            required: [true, 'Species is required'],
            trim: true,
        },
        location: {
            type: String,
            required: [true, 'Location is required'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: null,
        },
        imageUrl: {
            type: String,
            required: [true, 'Image is required'],
        },
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Reporter is required'],
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

export const AnimalReportModel = mongoose.model<IAnimalReport>(
    'AnimalReport',
    AnimalReportSchema
);