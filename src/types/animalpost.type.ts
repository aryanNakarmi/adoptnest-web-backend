import z from "zod";

export const AnimalPostSchema = z.object({
    species: z
        .string()
        .min(1, "Species is required")
        .min(2, "Species must be at least 2 characters")
        .trim(),

    gender: z.enum(["Male", "Female"], "Gender is required"),

    age: z.number()
        .refine((val) => typeof val === "number", {
            message: "Age must be a number",
        })
        .min(0, "Age must be 0 or greater"),

    location: z
        .string()
        .min(1, "Location is required")
        .min(3, "Location must be at least 3 characters")
        .trim(),

    description: z
        .string()
        .max(1000, "Description cannot exceed 1000 characters")
        .trim()
        .optional()
        .nullable(),

    photos: z
        .array(z.string().min(1, "Photo URL is required"))
        .min(1, "At least one photo is required"),

    // Optional for DB storage
    status: z.enum(["Available", "Adopted"]).optional(),
    adoptedBy: z.string().optional(),
});

export type AnimalPostType = z.infer<typeof AnimalPostSchema>;
