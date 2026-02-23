import z from "zod";

export const CreateAnimalReportDTO = z.object({
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
});

export type CreateAnimalReportDTO = z.infer<typeof CreateAnimalReportDTO>;

export const RejectReportDTO = z.object({
    rejectionReason: z
        .string()
        .min(1, "Rejection reason is required")
        .min(5, "Please provide a detailed reason")
        .max(300, "Reason cannot exceed 300 characters")
        .trim(),
});

export type RejectReportDTO = z.infer<typeof RejectReportDTO>;