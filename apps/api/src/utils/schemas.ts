import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const projectCreateSchema = z.object({
  name: z.string().min(2),
  description: z.string().max(300).optional(),
});

export const projectUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().max(300).nullable().optional(),
  archived: z.boolean().optional(),
});

export const taskCreateSchema = z.object({
  title: z.string().min(2),
  description: z.string().max(400).optional(),
  status: z.enum(["TODO", "DOING", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate: z.string().datetime().optional(),
});

export const taskUpdateSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().max(400).nullable().optional(),
  status: z.enum(["TODO", "DOING", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate: z.string().datetime().nullable().optional(),
});
