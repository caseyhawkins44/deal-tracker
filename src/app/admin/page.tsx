import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import NavBar from "@/components/NavBar"
import AdminUsersPanel from "@/components/AdminUsersPanel"
import AdminInviteCode from "@/components/AdminInviteCode"

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (me?.role !== "admin") redirect("/")

  const [rawUsers, appSettings] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { deals: true, comments: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.appSettings.findUnique({ where: { id: "singleton" } }),
  ])

  const users = rawUsers.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))

  return (
    <div className="min-h-screen">
      <NavBar user={session.user} />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Admin Portal</h1>
          <p className="text-gray-500 text-sm">{users.length} user{users.length !== 1 ? "s" : ""} registered</p>
        </div>
        <AdminInviteCode currentCode={appSettings?.inviteCode ?? null} />
        <div className="mt-8">
          <AdminUsersPanel users={users} currentUserId={session.user.id!} />
        </div>
      </main>
    </div>
  )
}
