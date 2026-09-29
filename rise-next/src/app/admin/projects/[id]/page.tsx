import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { serialize } from "@/lib/queries";
import ProjectForm from "@/components/admin/ProjectForm";
import ProjectTabs from "@/components/admin/ProjectTabs";
import { archiveProjectAction } from "../../actions";
export default async function EditProject({ params }: { params: { id: string } }) {
  const p = await prisma.project.findUnique({ where: { id: params.id } }); if (!p) notFound();
  return (
    <div><ProjectTabs id={p.id} name={p.name} slug={p.slug} /><ProjectForm project={serialize(p)} />
      <form action={archiveProjectAction.bind(null, p.id)} className="mt-8"><button className="text-sm text-red-600">Archive this project</button></form>
    </div>
  );
}
