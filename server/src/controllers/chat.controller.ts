import type { Request, Response } from "express";
import { createChatMessageSchema, listChatMessagesQuerySchema } from "../validators/chat.validator";
import * as chatService from "../services/chat.service";

export async function listMessages(req: Request, res: Response) {
  const query = listChatMessagesQuerySchema.parse(req.query);
  const messages = await chatService.listChatMessages({
    channel: query.channel,
    district: query.district,
    limit: query.limit,
  });

  return res.status(200).json({
    success: true,
    data: messages,
  });
}

export async function createMessage(req: Request, res: Response) {
  const payload = createChatMessageSchema.parse(req.body);
  const message = await chatService.createChatMessage(payload);
  return res.status(201).json({
    success: true,
    data: message,
  });
}
