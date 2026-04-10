import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import NavBar from "@/components/NavBar"
import ProjectsView from "@/components/ProjectsView"
import { DEFAULT_CRITERIA } from "@/lib/criteria"

export default async function ProjectsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const [projects, unassignedDeals, criteriaRow] = await Promise.all([
    prisma.project.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        deals: {
          orderBy: { createdAt: "desc" },
          include: { addedBy: { select: { name: true } } },
        },
      },
    }),
    prisma.deal.findMany({
      where: { projectId: null },
      orderBy: { createdAt: "desc" },
      include: { addedBy: { select: { name: true } } },
    }),
    prisma.investmentCriteria.findUnique({ where: { id: "singleton" } }),
  ])

  const criteria = criteriaRow ?? DEFAULT_CRITERIA

  return (
    <div className="min-h-screen">
      <NavBar user={session.user} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <ProjectsView
          initialProjects={JSON.parse(JSON.stringify(projects))}
          initialUnassigned={JSON.parse(JSON.stringify(unassignedDeals))}
          criteria={criteria}
        />
      </main>
    </div>
  )
}
