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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Search, GraduationCap, School, ShieldCheck, UserCircle2, Crown, Ban, RefreshCw, Loader2 } from "lucide-react";
import { BACKEND_URL } from "@/constants";
import { getToken } from "@/providers/auth";

const ROLE_META = {
  admin:   { label: "Admin",   icon: ShieldCheck,  variant: "default"   as const, color: "text-violet-600" },
  teacher: { label: "Teacher", icon: School,        variant: "secondary" as const, color: "text-blue-600"   },
  student: { label: "Student", icon: GraduationCap, variant: "outline"   as const, color: "text-green-600"  },
};

/* ── Suspend / reinstate button with confirm dialog ── */
function SuspendButton({ userId, name, suspended, onDone }: {
  userId: string; name: string; suspended: boolean; onDone: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const doAction = async () => {
    setLoading(true);
    const endpoint = suspended ? "reinstate" : "suspend";
    try {
      await fetch(`${BACKEND_URL}/api/users/${userId}/${endpoint}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      onDone();
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className={`h-7 text-xs ${suspended ? "text-green-600 border-green-300" : "text-amber-600 border-amber-300"}`} disabled={loading}>
          {loading ? <Loader2 className="w-3 h-3 animate-spin" />
            : suspended
              ? <><RefreshCw className="w-3 h-3 mr-1" />Reinstate</>
              : <><Ban className="w-3 h-3 mr-1" />Suspend</>}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{suspended ? "Reinstate" : "Suspend"} {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            {suspended
              ? "This will restore the user's access. They will be able to log in again."
              : "This will block the user from logging in. Their data is preserved and they can be reinstated later."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={doAction}
            className={suspended ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"}
          >
            {suspended ? "Yes, reinstate" : "Yes, suspend"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function UsersList() {
  const { user: currentUser } = useCurrentUser();
  const isMainAdmin = (currentUser as any)?.isMainAdmin === true;
  const [searchQ, setSearchQ]   = useState("");
  const [roleF,   setRoleF]     = useState("all");
  const [refresh, setRefresh]   = useState(0); // bump to re-fetch

  const roleFilters   = roleF   !== "all" ? [{ field: "role",   operator: "eq"      as const, value: roleF   }] : [];
  const searchFilters = searchQ           ? [{ field: "search", operator: "contains" as const, value: searchQ }] : [];

  const columns = useMemo<ColumnDef<User>[]>(() => [
    {
      id: "avatar", size: 48, header: () => null,
      cell: ({ row }) => {
        const u   = row.original;
        const ini = u.name.split(" ").filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join("");
        return (
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarImage src={u.image} alt={u.name} />
            <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">{ini}</AvatarFallback>
          </Avatar>
        );
      },
    },
    {
      id: "name", accessorKey: "name", size: 170,
      header: () => <p className="column-title">Name</p>,
      cell: ({ row }) => {
        const u    = row.original;
        const isMA = (u as any).isMainAdmin === true;
        return (
          <div className="flex items-center gap-1.5 min-w-0">
            {isMA && <Crown className="w-3 h-3 text-amber-500 shrink-0" title="Main Admin" />}
            <span className="font-medium truncate">{u.name}</span>
          </div>
        );
      },
    },
    {
      id: "email", accessorKey: "email", size: 210,
      header: () => <p className="column-title">Email</p>,
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-sm block truncate max-w-[200px]">{getValue<string>()}</span>
      ),
    },
    {
      id: "role", accessorKey: "role", size: 110,
      header: () => <p className="column-title">Role</p>,
      cell: ({ getValue }) => {
        const role = getValue<string>();
        const meta = ROLE_META[role as keyof typeof ROLE_META] ?? { label: role, icon: UserCircle2, variant: "outline" as const };
        const Icon = meta.icon;
        return (
          <Badge variant={meta.variant} className="flex items-center gap-1 w-fit">
            <Icon className="w-3 h-3 shrink-0" />{meta.label}
          </Badge>
        );
      },
    },
    {
      id: "status", accessorKey: "status", size: 100,
      header: () => <p className="column-title">Status</p>,
      cell: ({ getValue }) => {
        const s = getValue<string>() ?? "active";
        return (
          <Badge variant="outline" className={
            s === "active"
              ? "text-green-700 border-green-300 bg-green-50 dark:bg-green-900/20 dark:text-green-400 text-xs"
              : "text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 text-xs"
          }>
            {s === "active" ? "Active" : "Suspended"}
          </Badge>
        );
      },
    },
    {
      id: "joined", accessorKey: "createdAt", size: 100,
      header: () => <p className="column-title">Joined</p>,
      cell: ({ getValue }) => {
        const d = getValue<string>();
        return <span className="text-xs text-muted-foreground whitespace-nowrap">{d ? new Date(d).toLocaleDateString() : "—"}</span>;
      },
    },
    {
      id: "actions", size: 200,
      header: () => <p className="column-title">Actions</p>,
      cell: ({ row }) => {
        const u                 = row.original;
        const isSelf            = u.id === currentUser?.id;
        const isTargetMainAdmin = (u as any).isMainAdmin === true;
        const isTargetAdmin     = u.role === "admin";
        const isSuspended       = (u as any).status === "suspended";

        const canDelete  = !isSelf && !isTargetMainAdmin && (isMainAdmin || !isTargetAdmin);
        const canSuspend = !isSelf && !isTargetMainAdmin && (isMainAdmin || !isTargetAdmin);

        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <ShowButton resource="users" recordItemId={u.id} variant="outline" size="sm">View</ShowButton>
            {canSuspend && (
              <SuspendButton
                userId={u.id}
                name={u.name}
                suspended={isSuspended}
                onDone={() => setRefresh(r => r + 1)}
              />
            )}
            {canDelete && !isSuspended && (
              <DeleteButton resource="users" recordItemId={u.id} variant="outline" size="sm" />
            )}
          </div>
        );
      },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [currentUser, isMainAdmin, refresh]);

  const table = useTable<User>({
    columns,
    refineCoreProps: {
      resource: "users",
      pagination: { pageSize: 15, mode: "server" },
      filters:   { permanent: [...roleFilters, ...searchFilters] },
      sorters:   { initial: [{ field: "createdAt", order: "desc" }] },
    },
  });

  // Re-fetch when refresh bumps (after suspend/reinstate)
  useState(() => { if (refresh > 0) table.refineCore.tableQuery.refetch(); });

  return (
    <ListView>
      <Breadcrumb />
      <h1 className="page-title">Users</h1>
      <div className="intro-row">
        <p className="text-muted-foreground">Manage all system users — view, suspend, or remove accounts.</p>
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
