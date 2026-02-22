import z from "zod";

export const SendMessageDTO = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message cannot exceed 2000 characters")
    .trim(),
});

export type SendMessageDTO = z.infer<typeof SendMessageDTO>;
