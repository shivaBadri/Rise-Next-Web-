import { prisma } from "@/lib/db";
import { getSession, can } from "@/lib/auth";
import { saveUserAction } from "@/app/admin/actions";
const ROLES = ["SUPER_ADMIN", "ORG_ADMIN", "PROJECT_ADMIN", "SALES_MANAGER", "SALES_EXECUTIVE", "CONTENT_MANAGER", "VIEWER"];
export default async function UsersPage() {
  const me = await getSession();
  if (!can(me, "users:manage")) return <p className="text-ink/60">You don&apos;t have permission to manage users.</p>;
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" }, include: { organization: true } });
  return (
    <div><h1 className="font-display text-3xl">Users & roles</h1>
      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        <div className="card overflow-x-auto lg:col-span-2"><table className="admin-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Org</th><th>Active</th></tr></thead><tbody>
          {users.map((u) => <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td><span className="badge bg-sand">{u.role}</span></td><td>{u.organization?.name ?? "—"}</td><td>{u.isActive ? "✅" : "—"}</td></tr>)}
        </tbody></table></div>
        <form action={async (fd) => { "use server"; await saveUserAction(fd); }} className="card space-y-3 p-4"><h2 className="font-semibold">Add / update user</h2>
          <div><label className="label">Name</label><input name="name" required className="input" /></div>
          <div><label className="label">Email</label><input name="email" type="email" required className="input" /></div>
          <div><label className="label">Password (blank = keep)</label><input name="password" type="password" className="input" /></div>
          <div><label className="label">Role</label><select name="role" className="input">{ROLES.map((r) => <option key={r}>{r}</option>)}</select></div>
          <div><label className="label">Phone</label><input name="phone" className="input" /></div>
          <button className="btn-primary w-full">Save user</button>
        </form>
      </div>
      <div className="card mt-6 p-4 text-sm"><h3 className="font-semibold">Role matrix</h3><ul className="mt-2 grid gap-1 sm:grid-cols-2 text-ink/70">
        <li><b>Super Admin</b> – full platform</li><li><b>Org Admin</b> – all projects of one client, users</li><li><b>Project Admin</b> – assigned projects, inventory, 3D, leads</li><li><b>Sales Manager</b> – inventory status, leads, site visits, assignment</li><li><b>Sales Executive</b> – own assigned leads</li><li><b>Content Manager</b> – website content & media</li><li><b>Viewer</b> – read-only</li></ul></div>
    </div>
  );
}
