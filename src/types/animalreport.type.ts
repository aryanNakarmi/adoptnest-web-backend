import z from "zod";

export const AnimalReportSchema = z.object({
    species: z
        .string()
        .min(1, "Species is required")
        .min(2, "Species must be at least 2 characters")
        .trim(),

    location: z.object({
        address: z.string().min(3, "Location address is required").trim(),
        lat: z.number(),
        lng: z.number(),
    }),

    description: z
        .string()
        .max(500, "Description cannot exceed 500 characters")
        .trim()
        .optional()
        .nullable(),

    imageUrl: z
        .string()
        .min(1, "Image URL is required"),

    reportedBy: z.string().optional(),
    status: z.enum(["pending", "approved", "rejected"]).optional(),
});

export type AnimalReportType = z.infer<typeof AnimalReportSchema>;