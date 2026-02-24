import mongoose, { Schema, Document } from "mongoose";

// ── Adoption Request sub-document ──
export interface IAdoptionRequest {
  userId: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  requestedAt: Date;
}

export interface IAnimalPost extends Document {
  species: string;
  gender: string;
  breed: string;
  age: number;
  location: string;
  description: string;
  photos: string[];
  status: "Available" | "Adopted";
  adoptedBy?: mongoose.Types.ObjectId;
  adoptedDate?: Date;
  adoptionRequests: IAdoptionRequest[]; // ← NEW
  createdAt: Date;
  updatedAt: Date;
}

const AdoptionRequestSchema = new Schema<IAdoptionRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    requestedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const AnimalPostSchema = new Schema<IAnimalPost>(
  {
    species: { type: String, required: true },
    gender: { type: String, required: true, enum: ["Male", "Female"] },
    breed: { type: String, required: true },
    age: { type: Number, required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    photos: { type: [String], required: true },
    status: {
      type: String,
      enum: ["Available", "Adopted"],
      default: "Available",
    },
    adoptedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    adoptedDate: { type: Date, default: null },
    adoptionRequests: { type: [AdoptionRequestSchema], default: [] }, // ← NEW
  },
  { timestamps: true },
);

export const AnimalPostModel = mongoose.model<IAnimalPost>(
  "AnimalPost",
  AnimalPostSchema,
);
