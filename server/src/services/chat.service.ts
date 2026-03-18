import { type Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

interface ListChatInput {
  channel?: string;
  district?: string;
  limit: number;
}

interface CreateChatInput {
  senderId?: string;
  senderName: string;
  message: string;
  channel: string;
  district?: string;
}

export async function listChatMessages(input: ListChatInput) {
  const where: Prisma.ChatMessageWhereInput = {};
  if (input.channel) where.channel = input.channel;
  if (input.district) where.district = input.district;

  return prisma.chatMessage.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: input.limit,
  });
}

export async function createChatMessage(input: CreateChatInput) {
  const data: Prisma.ChatMessageCreateInput = {
    senderName: input.senderName,
    message: input.message,
    channel: input.channel,
    district: input.district ?? null,
  };

  if (input.senderId) {
    data.sender = { connect: { id: input.senderId } };
  }

  return prisma.chatMessage.create({ data });
}
