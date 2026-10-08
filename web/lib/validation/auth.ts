import { z } from "zod";

// Mirrors the server rules (api internal/application/auth + transport validate):
// email format, password >= 8, name required.
export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Your name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});

// Register screen only: the prototype's required "I agree" checkbox. UI-only, never sent to the API.
export const registerFormSchema = registerSchema.extend({
  terms: z.boolean().refine((v) => v, "Please accept the Terms & Conditions"),
});

export const forgotSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export const resetSchema = z
  .object({
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match" });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerFormSchema>;
export type ForgotValues = z.infer<typeof forgotSchema>;
export type ResetValues = z.infer<typeof resetSchema>;
