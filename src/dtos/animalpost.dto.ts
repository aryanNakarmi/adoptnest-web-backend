import z from "zod";
import { AnimalPostSchema } from "../types/animalpost.type";

export const CreateAnimalPostDTO = AnimalPostSchema.pick({
    species: true,
    gender: true,
    breed: true,
    age: true,
    location: true,
    description: true,
    photos: true,
});

export type CreateAnimalPostDTO = z.infer<typeof CreateAnimalPostDTO>;

export const UpdateAnimalPostDTO = AnimalPostSchema.partial().pick({
    species: true,
    gender: true,
    breed: true,
    age: true,
    location: true,
    description: true,
    photos: true,
});

export type UpdateAnimalPostDTO = z.infer<typeof UpdateAnimalPostDTO>;

export const UpdateAnimalPostStatusDTO = z.object({
    status: z.enum(["Available", "Adopted"]),
    adoptedBy: z.string().optional(),
});

export type UpdateAnimalPostStatusDTO = z.infer<typeof UpdateAnimalPostStatusDTO>;