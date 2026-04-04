import { prisma } from "@/lib/prisma"
import type { ActivityAction } from "@/generated/prisma/client"

export async function logActivity({
  dealId,
  userId,
  action,
  description,
}: {
  dealId: string
  userId: string
  action: ActivityAction
  description: string
}) {
  await prisma.activityLog.create({
    data: { dealId, userId, action, description },
  })
}
