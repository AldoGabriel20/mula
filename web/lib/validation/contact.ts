import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Your name is required"),
  email: z.string().email("Enter a valid email"),
  message: z.string().trim().min(10, "Tell us a little more (10+ characters)"),
});
export type ContactValues = z.infer<typeof contactSchema>;
