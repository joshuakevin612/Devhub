import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(39)
    .regex(/^[a-zA-Z0-9-]+$/, "Username may only contain letters, numbers and hyphens"),
  password: z.string().min(8).max(100),
  name: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const favoriteDeveloperSchema = z.object({
  githubUsername: z.string().min(1).max(39),
  note: z.string().max(500).optional(),
});

export const favoriteRepoSchema = z.object({
  owner: z.string().min(1).max(100),
  repoName: z.string().min(1).max(200),
  note: z.string().max(500).optional(),
});
