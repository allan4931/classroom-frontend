import { useList } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { useMemo, useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { ClassDetails, Subject, User } from "@/types";
import type { ColumnDef } from "@tanstack/react-table";
import { ListView } from "@/components/refine-ui/views/list-view.tsx";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb.tsx";
import { DataTable } from "@/components/refine-ui/data-table/data-table.tsx";
import { CreateButton } from "@/components/refine-ui/buttons/create.tsx";
import { ShowButton } from "@/components/refine-ui/buttons/show.tsx";
import { DeleteButton } from "@/components/refine-ui/buttons/delete.tsx";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Key, Loader2, Check } from "lucide-react";
import { BACKEND_URL } from "@/constants";
import { getToken } from "@/providers/auth";

export default function ClassesList() {
  const { isAdmin, isTeacher, isStudent } = useCurrentUser();
  const [search, setSearch]   = useState("");
  const [subjectF, setSubjectF] = useState("all");
  const [teacherF, setTeacherF] = useState("all");
  const [statusF, setStatusF]  = useState("all");

  const [joinOpen, setJoinOpen]     = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining]       = useState(false);
  const [joinMsg, setJoinMsg]       = useState<{ type: "error" | "success"; text: string } | null>(null);

  // ✅ Refine v5: useList returns { data: { data, total } | undefined, isLoading }
  // Only fetch subjects/teachers when relevant — use standard boolean, not queryOptions
  const { data: subjectsResult } = useList<Subject>({
    resource: "subjects",
    pagination: { pageSize: 100 },
  });
  const subjects = (isStudent ? [] : subjectsResult?.data) ?? [];

  const { data: teachersResult } = useList<User>({
    resource: "users",
    filters: [{ field: "role", operator: "eq", value: "teacher" }],
    pagination: { pageSize: 100 },
  });
  const teachers = (isAdmin ? teachersResult?.data : []) ?? [];

  const searchFilters  = search     ? [{ field: "name",    operator: "contains" as const, value: search    }] : [];
  const subjectFilters = subjectF !== "all" ? [{ field: "subject", operator: "eq" as const, value: subjectF }] : [];
  const teacherFilters = teacherF !== "all" ? [{ field: "teacher", operator: "eq" as const, value: teacherF }] : [];
  const statusFilters  = statusF  !== "all" ? [{ field: "status",  operator: "eq" as const, value: statusF  }] : [];

  const columns = useMemo<ColumnDef<ClassDetails>[]>(() => [
    {
      id: "banner", accessorKey: "bannerUrl", size: 60, header: () => null,
      cell: ({ getValue }) => (
        <div className="w-9 h-9 rounded overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
          {getValue<string>() ? <img src={getValue<string>()} className="w-full h-full object-cover" alt="" /> : null}
        </div>
      ),
    },
    {
      id: "name", accessorKey: "name", size: 200, header: () => <p className="column-title">Class</p>,
      cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
    },
    {
      id: "status", accessorKey: "status", size: 90, header: () => <p className="column-title">Status</p>,
      cell: ({ getValue }) => {
        const s = getValue<string>();
        return <Badge variant={s === "active" ? "default" : "secondary"} className="text-xs">{s}</Badge>;
      },
    },
    {
      id: "subject", accessorKey: "subject.name", size: 140, header: () => <p className="column-title">Subject</p>,
      cell: ({ getValue }) => <span className="text-muted-foreground text-sm">{getValue<string>() ?? "—"}</span>,
    },
    ...(isStudent ? [] : [{
      id: "teacher", accessorKey: "teacher.name", size: 140, header: () => <p className="column-title">Teacher</p>,
      cell: ({ row }: { row: { original: ClassDetails } }) => (
        <span className="text-sm">{row.original.teacher?.name ?? "—"}</span>
      ),
    }]),
    {
      id: "capacity", accessorKey: "capacity", size: 75, header: () => <p className="column-title">Cap.</p>,
      cell: ({ getValue }) => <span className="tabular-nums text-sm">{getValue<number>()}</span>,
    },
    {
      id: "actions", size: isAdmin ? 150 : 90, header: () => <p className="column-title">Actions</p>,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <ShowButton resource="classes" recordItemId={row.original.id} variant="outline" size="sm">View</ShowButton>
          {isAdmin && <DeleteButton resource="classes" recordItemId={row.original.id} variant="outline" size="sm" />}
        </div>
      ),
    },
  ] as ColumnDef<ClassDetails>[], [isAdmin, isStudent]);

  const table = useTable<ClassDetails>({
    columns,
    refineCoreProps: {
      resource: "classes",
      pagination: { pageSize: 10, mode: "server" },
      filters: { permanent: [...searchFilters, ...subjectFilters, ...teacherFilters, ...statusFilters] },
      sorters: { initial: [{ field: "id", order: "desc" }] },
    },
  });

  const handleJoin = async () => {
    if (!inviteCode.trim()) { setJoinMsg({ type: "error", text: "Enter an invite code." }); return; }
    setJoining(true); setJoinMsg(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/classes/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ inviteCode: inviteCode.trim().toUpperCase() }),
      });
      const json = await res.json();
      if (!res.ok) { setJoinMsg({ type: "error", text: json.error ?? "Failed to join." }); }
      else {
        setJoinMsg({ type: "success", text: json.data?.message ?? "Joined!" });
        setInviteCode("");
        table.refineCore.tableQuery.refetch();
        setTimeout(() => setJoinOpen(false), 1500);
      }
    } catch { setJoinMsg({ type: "error", text: "Network error." }); }
    finally { setJoining(false); }
  };

  return (
    <ListView>
      <Breadcrumb />
      <h1 className="page-title">{isStudent ? "My Classes" : "Classes"}</h1>

      <div className="intro-row">
        <p className="text-muted-foreground">{isStudent ? "Classes you are enrolled in." : "Manage all classes."}</p>
        <div className="actions-row">
          {!isStudent && (
            <div className="search-field">
              <Search className="search-icon" />
              <Input type="text" placeholder="Search…" className="pl-10 w-full" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {!isStudent && subjects.length > 0 && (
              <Select value={subjectF} onValueChange={setSubjectF}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Subject" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((s: Subject) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {isAdmin && teachers.length > 0 && (
              <Select value={teacherF} onValueChange={setTeacherF}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Teacher" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teachers</SelectItem>
                  {teachers.map((t: User) => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Select value={statusF} onValueChange={setStatusF}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {isStudent && (
              <Button onClick={() => { setJoinOpen(true); setJoinMsg(null); setInviteCode(""); }} size="sm" className="gap-1.5">
                <Key className="w-3.5 h-3.5" />Join Class
              </Button>
            )}
            {(isAdmin || isTeacher) && <CreateButton resource="classes" />}
          </div>
        </div>
      </div>

      <DataTable table={table} />

      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Key className="w-4 h-4 text-primary" />Join a Class</DialogTitle>
            <DialogDescription>Enter the 7-character invite code your teacher shared with you.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="invite">Invite Code</Label>
              <Input
                id="invite"
                placeholder="e.g. ABC1234"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                disabled={joining || joinMsg?.type === "success"}
                className="font-mono tracking-widest text-center text-lg uppercase"
                maxLength={10}
              />
            </div>
            {joinMsg && (
              <p className={`text-sm flex items-center gap-1.5 ${joinMsg.type === "success" ? "text-green-600" : "text-destructive"}`}>
                {joinMsg.type === "success" ? <Check className="w-3.5 h-3.5" /> : null}
                {joinMsg.text}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJoinOpen(false)} disabled={joining}>Cancel</Button>
            <Button onClick={handleJoin} disabled={joining || joinMsg?.type === "success"}>
              {joining ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Joining…</> : "Join"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ListView>
  );
}
