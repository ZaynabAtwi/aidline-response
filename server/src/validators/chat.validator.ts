import { z } from "zod";

export const createChatMessageSchema = z.object({
  senderId: z.string().optional(),
  senderName: z.string().min(2).max(120),
  message: z.string().min(1).max(4000),
  channel: z.string().min(1).max(120).default("general"),
  district: z.string().min(2).max(120).optional(),
});

export const listChatMessagesQuerySchema = z.object({
  channel: z.string().optional(),
  district: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
