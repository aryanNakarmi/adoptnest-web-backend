import z from "zod";

export const CreateAnimalReportDTO = z.object({
    species: z
        .string()
        .min(1, "Species is required")
        .min(2, "Species must be at least 2 characters")
        .trim(),
    
    location: z
        .string()
        .min(1, "Location is required")
        .min(3, "Location must be at least 3 characters")
        .trim(),
    
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

/**
 * Reject Report DTO
 * For admin to reject a report with reason
 * Usage: When admin rejects a pending report
 */
export const RejectReportDTO = z.object({
    rejectionReason: z
        .string()
        .min(1, "Rejection reason is required")
        .min(5, "Please provide a detailed reason")
        .max(300, "Reason cannot exceed 300 characters")
        .trim(),
});

export type RejectReportDTO = z.infer<typeof RejectReportDTO>;