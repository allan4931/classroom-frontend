import { useTable } from "@refinedev/react-table";
import { useMemo, useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { User } from "@/types";
import type { ColumnDef } from "@tanstack/react-table";
import { ListView } from "@/components/refine-ui/views/list-view.tsx";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb.tsx";
import { DataTable } from "@/components/refine-ui/data-table/data-table.tsx";
import { ShowButton } from "@/components/refine-ui/buttons/show.tsx";
import { DeleteButton } from "@/components/refine-ui/buttons/delete.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, GraduationCap, School, ShieldCheck, UserCircle2 } from "lucide-react";

const ROLE_META = {
  admin:   { label: "Admin",   icon: ShieldCheck,   variant: "default"    as const, color: "text-violet-600" },
  teacher: { label: "Teacher", icon: School,         variant: "secondary"  as const, color: "text-blue-600"   },
  student: { label: "Student", icon: GraduationCap,  variant: "outline"    as const, color: "text-green-600"  },
};

export default function UsersList() {
  const { isAdmin, user: currentUser } = useCurrentUser();
  const [searchQ, setSearchQ] = useState("");
  const [roleF, setRoleF] = useState("all");

  const roleFilters   = roleF    !== "all" ? [{ field: "role",   operator: "eq"       as const, value: roleF    }] : [];
  const searchFilters = searchQ           ? [{ field: "search", operator: "contains"  as const, value: searchQ  }] : [];

  const columns = useMemo<ColumnDef<User>[]>(() => [
    {
      id: "avatar", size: 52, header: () => null,
      cell: ({ row }) => {
        const u = row.original;
        const ini = u.name.split(" ").filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join("");
        return (
          <Avatar className="w-8 h-8">
            <AvatarImage src={u.image} alt={u.name} />
            <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">{ini}</AvatarFallback>
          </Avatar>
        );
      },
    },
    {
      id: "name", accessorKey: "name", size: 220, header: () => <p className="column-title">Name</p>,
      cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
    },
    {
      id: "email", accessorKey: "email", size: 260, header: () => <p className="column-title">Email</p>,
      cell: ({ getValue }) => <span className="text-muted-foreground text-sm">{getValue<string>()}</span>,
    },
    {
      id: "role", accessorKey: "role", size: 110, header: () => <p className="column-title">Role</p>,
      cell: ({ getValue }) => {
        const role = getValue<string>();
        const meta = ROLE_META[role as keyof typeof ROLE_META] ?? { label: role, icon: UserCircle2, variant: "outline" as const };
        const Icon = meta.icon;
        return (
          <Badge variant={meta.variant} className="flex items-center gap-1 w-fit capitalize">
            <Icon className="w-3 h-3" />{meta.label}
          </Badge>
        );
      },
    },
    {
      id: "joined", accessorKey: "createdAt", size: 120, header: () => <p className="column-title">Joined</p>,
      cell: ({ getValue }) => {
        const d = getValue<string>();
        return <span className="text-xs text-muted-foreground">{d ? new Date(d).toLocaleDateString() : "—"}</span>;
      },
    },
    {
      id: "actions", size: isAdmin ? 140 : 90, header: () => <p className="column-title">Actions</p>,
      cell: ({ row }) => {
        const isSelf = row.original.id === currentUser?.id;
        return (
          <div className="flex items-center gap-1.5">
            <ShowButton resource="users" recordItemId={row.original.id} variant="outline" size="sm">View</ShowButton>
            {isAdmin && !isSelf && <DeleteButton resource="users" recordItemId={row.original.id} variant="outline" size="sm" />}
          </div>
        );
      },
    },
  ], [isAdmin, currentUser]);

  const table = useTable<User>({
    columns,
    refineCoreProps: {
      resource: "users",
      pagination: { pageSize: 15, mode: "server" },
      filters: { permanent: [...roleFilters, ...searchFilters] },
      sorters: { initial: [{ field: "createdAt", order: "desc" }] },
    },
  });

  return (
    <ListView>
      <Breadcrumb />
      <h1 className="page-title">Users</h1>
      <div className="intro-row">
        <p className="text-muted-foreground">Manage all system users.</p>
        <div className="actions-row">
          <div className="search-field">
            <Search className="search-icon" />
            <Input type="text" placeholder="Search name or email…" className="pl-10 w-full"
              value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          </div>
          <Select value={roleF} onValueChange={setRoleF}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="All roles" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="student">Students</SelectItem>
              <SelectItem value="teacher">Teachers</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DataTable table={table} />
    </ListView>
  );
}
