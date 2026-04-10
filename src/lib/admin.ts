import { prisma } from "@/lib/prisma"

export async function requireAdmin(userId: string): Promise<boolean> {
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  return me?.role === "admin"
}
