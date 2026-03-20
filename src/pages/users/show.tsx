import { useShow, useList } from "@refinedev/core";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { User, ClassDetails } from "@/types";
import { ShowView, ShowViewHeader } from "@/components/refine-ui/views/show-view.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Calendar, GraduationCap, School, ShieldCheck, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ROLE_CONFIG = {
  admin:   { label: "Admin",   icon: ShieldCheck,  color: "text-violet-600", bg: "bg-violet-500/10 border-violet-500/30" },
  teacher: { label: "Teacher", icon: School,        color: "text-blue-600",   bg: "bg-blue-500/10 border-blue-500/30" },
  student: { label: "Student", icon: GraduationCap, color: "text-green-600",  bg: "bg-green-500/10 border-green-500/30" },
};

export default function UsersShow() {
  const { query } = useShow<User>({ resource: "users" });
  const { isAdmin } = useCurrentUser();
  const userData = query.data?.data;
  const { isLoading, isError } = query;

  // ✅ Refine v5: correct useList API, no queryOptions
  const { data: classesResult, isLoading: classesLoading } = useList<ClassDetails>({
    resource: "classes",
    pagination: { pageSize: 5 },
  });
  const classesData = classesResult?.data;

  if (isLoading || isError || !userData) {
    return (
      <ShowView className="class-view">
        <ShowViewHeader resource="users" title="User Profile" />
        <div className="space-y-4 mt-6 max-w-xl">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </ShowView>
    );
  }

  const { name, email, role, image, createdAt } = userData;
  const cfg     = ROLE_CONFIG[role] ?? ROLE_CONFIG.student;
  const RIcon   = cfg.icon;
  const initials= name.split(" ").filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join("");
  const joinDate= createdAt ? new Date(createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—";

  return (
    <ShowView className="class-view">
      <ShowViewHeader resource="users" title="User Profile" />
      <div className="max-w-2xl mx-auto space-y-4 mt-2">

        {/* Hero */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
          <CardContent className="pt-0 pb-6 px-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
              <Avatar className="w-20 h-20 border-4 border-background shadow-md">
                <AvatarImage src={image} alt={name} />
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <h2 className="text-xl font-bold">{name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground">{email}</p>
                  <Badge variant="outline" className={`${cfg.bg} ${cfg.color} flex items-center gap-1 text-xs`}>
                    <RIcon className="w-3 h-3" />{cfg.label}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm"><Mail className="w-4 h-4 text-muted-foreground shrink-0" /><span className="truncate">{email}</span></div>
              <div className="flex items-center gap-3 text-sm"><Calendar className="w-4 h-4 text-muted-foreground shrink-0" /><span>Joined {joinDate}</span></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Role</span><Badge variant="secondary" className="capitalize">{role}</Badge></div>
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Status</span><Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/10 border-green-500/20">Active</Badge></div>
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">ID</span><code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{String(userData.id).slice(0, 10)}…</code></div>
            </CardContent>
          </Card>
        </div>

        {/* Teacher classes */}
        {role === "teacher" && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />Teaching Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {classesLoading
                ? <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                : !classesData?.filter(c => (c as any).teacher?.id === userData.id || c.teacherId === userData.id).length
                ? <p className="text-sm text-muted-foreground">No classes assigned.</p>
                : (
                  <div className="space-y-2">
                    {classesData
                      ?.filter(c => (c as any).teacher?.id === userData.id || c.teacherId === userData.id)
                      .map(cls => (
                        <a key={cls.id} href={`/classes/show/${cls.id}`}
                          className="flex items-center justify-between p-3 rounded-md bg-muted/40 hover:bg-muted/70 transition-colors">
                          <div>
                            <p className="text-sm font-medium">{cls.name}</p>
                            <p className="text-xs text-muted-foreground">{(cls as any).subject?.name}</p>
                          </div>
                          <Badge variant={cls.status === "active" ? "default" : "secondary"} className="text-xs">{cls.status}</Badge>
                        </a>
                      ))}
                  </div>
                )}
            </CardContent>
          </Card>
        )}
      </div>
    </ShowView>
  );
}
