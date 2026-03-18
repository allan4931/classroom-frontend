import { useTable } from "@refinedev/react-table";
import { useList } from "@refinedev/core";
import { useMemo, useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Subject, Department } from "@/types";
import type { ColumnDef } from "@tanstack/react-table";
import { ListView } from "@/components/refine-ui/views/list-view.tsx";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb.tsx";
import { DataTable } from "@/components/refine-ui/data-table/data-table.tsx";
import { CreateButton } from "@/components/refine-ui/buttons/create.tsx";
import { DeleteButton } from "@/components/refine-ui/buttons/delete.tsx";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export default function SubjectsList() {
  const { isAdmin } = useCurrentUser();
  const [searchQ, setSearchQ] = useState("");
  const [deptF, setDeptF] = useState("all");

  const deptsQuery = useList<Department>({ resource: "departments", pagination: { pageSize: 100 } });
  const depts = deptsQuery.result?.data ?? [];

  const searchFilters = searchQ ? [{ field: "name", operator: "contains" as const, value: searchQ }] : [];
  const deptFilters = deptF !== "all" ? [{ field: "department", operator: "eq" as const, value: deptF }] : [];

  const columns = useMemo<ColumnDef<Subject>[]>(() => [
    { id: "code", accessorKey: "code", size: 100, header: () => <p className="column-title">Code</p>, cell: ({ getValue }) => <Badge variant="secondary" className="font-mono">{getValue<string>()}</Badge> },
    { id: "name", accessorKey: "name", size: 220, header: () => <p className="column-title">Subject</p>, cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span> },
    { id: "department", accessorKey: "department.name", size: 160, header: () => <p className="column-title">Department</p>, cell: ({ getValue }) => <Badge variant="outline">{getValue<string>() ?? "—"}</Badge> },
    { id: "description", accessorKey: "description", size: 280, header: () => <p className="column-title">Description</p>, cell: ({ getValue }) => <span className="text-muted-foreground text-sm line-clamp-1">{getValue<string>() || "—"}</span> },
    ...(isAdmin ? [{
      id: "actions", size: 80, header: () => <p className="column-title">Actions</p>,
      cell: ({ row }: { row: { original: Subject } }) => <DeleteButton resource="subjects" recordItemId={row.original.id} variant="outline" size="sm" />,
    }] : []),
  ] as ColumnDef<Subject>[], [isAdmin]);

  const table = useTable<Subject>({
    columns,
    refineCoreProps: {
      resource: "subjects",
      pagination: { pageSize: 10, mode: "server" },
      filters: { permanent: [...searchFilters, ...deptFilters] },
      sorters: { initial: [{ field: "id", order: "desc" }] },
    },
  });

  return (
    <ListView>
      <Breadcrumb />
      <h1 className="page-title">Subjects</h1>
      <div className="intro-row">
        <p className="text-muted-foreground">All subjects across departments.</p>
        <div className="actions-row">
          <div className="search-field"><Search className="search-icon" /><Input type="text" placeholder="Search…" className="pl-10 w-full" value={searchQ} onChange={e => setSearchQ(e.target.value)} /></div>
          <div className="flex gap-2">
            <Select value={deptF} onValueChange={setDeptF}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {depts.map((d: Department) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {isAdmin && <CreateButton resource="subjects" />}
          </div>
        </div>
      </div>
      <DataTable table={table} />
    </ListView>
  );
}
