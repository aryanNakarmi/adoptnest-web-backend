import mongoose, { Document, Schema } from "mongoose";
import { AnimalPostType } from "../types/animalpost.type";

const AnimalPostSchema: Schema = new Schema<AnimalPostType>(
    {
        species: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50,
        },
        gender: { 
            type: String, 
            enum: ["Male", "Female"], 
            required: true 
        },
        breed: {
            type: String,
            required: true,
            trim: true
        },
        age: { 
            type: Number, 
            required: true, 
            min: 0 
        },
        location: { 
            type: String, 
            required: true, 
            trim: true 
        },
        description: { 
            type: String, 
            trim: true, 
            maxlength: 2000,
            default: null 
        },
        photos: [{ 
            type: String, 
            required: true 
        }],
        status: { 
            type: String, 
            enum: ["Available", "Adopted"],
            default: "Available" 
        },
        adoptedBy: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User", 
            default: null 
        },
        adoptedDate: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

// Indexes for faster queries
AnimalPostSchema.index({ status: 1, createdAt: -1 });
AnimalPostSchema.index({ species: 1 });
AnimalPostSchema.index({ location: 1 });

export interface IAnimalPost extends AnimalPostType, Document {
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export const AnimalPostModel = mongoose.model<IAnimalPost>("AnimalPost", AnimalPostSchema);