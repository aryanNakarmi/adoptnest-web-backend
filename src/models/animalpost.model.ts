import mongoose from 'mongoose';

const animalSchema = new mongoose.Schema(
  {
    species: {
      type: String,
      enum: ['Dog', 'Cat', 'Bird', 'Rabbit', 'Hamster', 'Guinea Pig', 'Other'],
      required: [true, 'Please provide animal species'],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female'],
      required: [true, 'Please provide animal gender'],
    },
    breed: {
      type: String,
      required: [true, 'Please provide animal breed'],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, 'Please provide animal age in months'],
      min: [0, 'Age cannot be negative'],
    },
    description: {
      type: String,
      required: [true, 'Please provide animal description'],
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    photos: [
      {
        type: String,
        required: true,
      },
    ],
    location: {
      type: String,
      required: [true, 'Please provide location'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Available', 'Adopted', 'Pending'],
      default: 'Available',
    },
    adoptionRequirements: {
      type: String,
      default: '',
      maxlength: [1000, 'Adoption requirements cannot exceed 1000 characters'],
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    adoptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    adoptedDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for faster queries
animalSchema.index({ status: 1, createdAt: -1 });
animalSchema.index({ species: 1, location: 1 });
animalSchema.index({ addedBy: 1 });

export default mongoose.model('Animal', animalSchema);