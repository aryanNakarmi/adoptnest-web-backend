import mongoose, { Document, Schema } from "mongoose";

export interface IAnimalReport extends Document {
    _id: mongoose.Types.ObjectId;
    species: string;              // Dog, Cat, Bird, etc.
    location: string;             // Where animal was found/lost
    description?: string;         // Optional description
    animalType: 'lost' | 'found'; // Type of report
    imageUrl: string;             // Photo of animal
    videoUrl?: string;            // Optional video
    
    reportedBy: mongoose.Types.ObjectId;  // Client (User) who reported
    reportedAt: Date;
    
    status: 'pending' | 'approved' | 'rejected'; // Admin approval status
    approvedBy?: mongoose.Types.ObjectId;        // Admin who approved
    approvedAt?: Date;
    rejectionReason?: string;                    // Why rejected
    
    claimedBy?: mongoose.Types.ObjectId;        // If animal was claimed
    claimedAt?: Date;
    
    createdAt: Date;
    updatedAt: Date;
}

const AnimalReportSchema: Schema = new Schema<IAnimalReport>(
    {
        species: { 
            type: String, 
            required: [true, 'Species is required'],
            trim: true 
        },
        location: { 
            type: String, 
            required: [true, 'Location is required'],
            trim: true 
        },
        description: { 
            type: String,
            trim: true,
            default: null 
        },
        animalType: {
            type: String,
            enum: ['lost', 'found'],
            required: [true, 'Animal type is required']
        },
        imageUrl: { 
            type: String, 
            required: [true, 'Image is required'] 
        },
        videoUrl: { 
            type: String, 
            default: null 
        },
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Reporter is required']
        },
        reportedAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        approvedAt: {
            type: Date,
            default: null
        },
        rejectionReason: {
            type: String,
            default: null
        },
        claimedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        claimedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

export const AnimalReportModel = mongoose.model<IAnimalReport>(
    'AnimalReport',
    AnimalReportSchema
);