import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";

export async function getMyUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) throw new ApiError("User not found", 404);
  return user;
}
