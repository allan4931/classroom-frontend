import { useTable } from "@refinedev/react-table";
import { useMemo, useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Department } from "@/types";
import type { ColumnDef } from "@tanstack/react-table";
import { ListView } from "@/components/refine-ui/views/list-view.tsx";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb.tsx";
import { DataTable } from "@/components/refine-ui/data-table/data-table.tsx";
import { CreateButton } from "@/components/refine-ui/buttons/create.tsx";
import { DeleteButton } from "@/components/refine-ui/buttons/delete.tsx";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function DepartmentsList() {
  const { isAdmin } = useCurrentUser();
  const [searchQ, setSearchQ] = useState("");
  const searchFilters = searchQ ? [{ field: "search", operator: "contains" as const, value: searchQ }] : [];

  const columns = useMemo<ColumnDef<Department>[]>(() => [
    { id: "code", accessorKey: "code", size: 90, header: () => <p className="column-title">Code</p>, cell: ({ getValue }) => <Badge className="font-mono">{getValue<string>()}</Badge> },
    { id: "name", accessorKey: "name", size: 250, header: () => <p className="column-title">Name</p>, cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span> },
    { id: "description", accessorKey: "description", size: 350, header: () => <p className="column-title">Description</p>, cell: ({ getValue }) => <span className="text-muted-foreground text-sm line-clamp-1">{getValue<string>() || "—"}</span> },
    ...(isAdmin ? [{
      id: "actions", size: 80, header: () => <p className="column-title">Actions</p>,
      cell: ({ row }: any) => <DeleteButton resource="departments" recordItemId={row.original.id} variant="outline" size="sm" />,
    }] : []),
  ] as ColumnDef<Department>[], [isAdmin]);

  const table = useTable<Department>({
    columns,
    refineCoreProps: {
      resource: "departments",
      pagination: { pageSize: 10, mode: "server" },
      filters: { permanent: [...searchFilters] },
      sorters: { initial: [{ field: "id", order: "desc" }] },
    },
  });

  return (
    <ListView>
      <Breadcrumb />
      <h1 className="page-title">Departments</h1>
      <div className="intro-row">
        <p className="text-muted-foreground">Academic departments — required to create subjects.</p>
        <div className="actions-row">
          <div className="search-field"><Search className="search-icon" /><Input type="text" placeholder="Search…" className="pl-10 w-full" value={searchQ} onChange={e => setSearchQ(e.target.value)} /></div>
          {isAdmin && <CreateButton resource="departments" />}
        </div>
      </div>
      <DataTable table={table} />
    </ListView>
  );
}
