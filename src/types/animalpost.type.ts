import z from "zod";

export const AnimalPostSchema = z.object({
   species: z
        .string()
        .min(2, "Species must be at least 2 characters")
        .max(50, "Species cannot exceed 50 characters")
        .transform((val) =>
            val
            .toLowerCase()
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
        ),

    gender: z
        .enum(["Male", "Female"])
        .refine(
            (val) => ["Male", "Female"].includes(val),
            { message: "Gender must be Male or Female" }
        ),

    breed: z
        .string()
        .min(1, "Breed is required")
        .min(2, "Breed must be at least 2 characters")
        .trim(),

    age: z
        .number()
        .min(0, "Age must be 0 or greater")
        .int("Age must be a whole number"),

    location: z
        .string()
        .min(1, "Location is required") 
        .min(3, "Location must be at least 3 characters")
        .trim(),

    description: z
        .string()
        .max(2000, "Description cannot exceed 2000 characters")
        .trim()
        .optional()
        .nullable(),

    photos: z
        .array(z.string().min(1, "Photo URL is required"))
        .min(1, "At least one photo is required")
        .max(5, "Maximum 5 photos allowed"),

    // Optional for DB storage
    status: z.enum(["Available", "Adopted"]).optional(),
    adoptedBy: z.string().optional().nullable(),
    adoptedDate: z.date().optional().nullable(),
});

export type AnimalPostType = z.infer<typeof AnimalPostSchema>;