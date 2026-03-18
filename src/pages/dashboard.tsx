import { useList } from "@refinedev/core";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { ClassDetails, Subject, User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  GraduationCap, BookOpen, Users, Building2, TrendingUp, ArrowRight,
  Plus, Activity, Zap, ChevronRight, School, ShieldCheck, Star,
  CalendarDays, Key,
} from "lucide-react";

type Dept = { id: number; name: string; code: string };

function StatCard({ title, value, sub, icon: Icon, gradient, loading }: {
  title: string; value: string | number; sub: string;
  icon: React.ElementType; gradient: string; loading?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all group">
      <div className={`absolute inset-0 opacity-[0.07] group-hover:opacity-[0.13] transition-opacity ${gradient}`} />
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">{title}</p>
            {loading ? <Skeleton className="h-8 w-14 mb-1" /> : <p className="text-3xl font-bold tracking-tight">{value}</p>}
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
          <div className={`p-2.5 rounded-xl ${gradient} bg-opacity-15`}>
            <Icon className="w-5 h-5 text-foreground/70" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ClassRow({ cls }: { cls: ClassDetails }) {
  const sub     = (cls as any).subject?.name ?? "—";
  const teacher = (cls as any).teacher?.name ?? "Unassigned";
  const cap     = cls.capacity ?? 0;
  const enrolled= (cls as any).enrollmentCount ?? 0;
  const pct     = cap > 0 ? Math.round((enrolled / cap) * 100) : 0;
  return (
    <a href={`/classes/show/${cls.id}`}
      className="flex items-center gap-3 py-3 -mx-3 px-3 rounded-lg hover:bg-muted/40 transition-colors group">
      <div className="w-9 h-9 rounded-lg shrink-0 overflow-hidden bg-primary/10 flex items-center justify-center">
        {cls.bannerUrl
          ? <img src={cls.bannerUrl} alt="" className="w-full h-full object-cover" />
          : <GraduationCap className="w-4 h-4 text-primary/60" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{cls.name}</p>
        <p className="text-xs text-muted-foreground">{sub} · {teacher}</p>
        {cap > 0 && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <Progress value={pct} className="h-1 flex-1 max-w-[80px]" />
            <span className="text-[10px] text-muted-foreground">{enrolled}/{cap}</span>
          </div>
        )}
      </div>
      <Badge variant={cls.status === "active" ? "default" : "secondary"} className="text-[10px] shrink-0">{cls.status}</Badge>
      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0" />
    </a>
  );
}

function UserRow({ user }: { user: User }) {
  const initials = user.name.split(" ").filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join("");
  const icons    = { admin: ShieldCheck, teacher: School, student: GraduationCap } as any;
  const colors   = { admin: "text-violet-600", teacher: "text-blue-600", student: "text-green-600" } as any;
  const RIcon    = icons[user.role] ?? Users;
  return (
    <a href={`/users/show/${user.id}`}
      className="flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-lg hover:bg-muted/40 transition-colors">
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarImage src={user.image} />
        <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user.name}</p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>
      <RIcon className={`w-3.5 h-3.5 shrink-0 ${colors[user.role] ?? ""}`} />
    </a>
  );
}

function QA({ href, icon: Icon, label, desc, color }: {
  href: string; icon: React.ElementType; label: string; desc: string; color: string;
}) {
  return (
    <a href={href} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-all group">
      <div className={`p-2 rounded-md ${color}`}><Icon className="w-4 h-4" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium group-hover:text-primary transition-colors">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0" />
    </a>
  );
}

export default function Dashboard() {
  const { user, isAdmin, isTeacher, isStudent } = useCurrentUser();

  // Always fetch — backend RBAC filters by role
  const classesQuery = useList<ClassDetails>({
    resource: "classes", pagination: { pageSize: 6 },
  });
  const classesData = classesQuery.result?.data;
  const classLoading = classesQuery.query?.isLoading;
  const subjectsQuery = useList<Subject>({ resource: "subjects",    pagination: { pageSize: 1 } });
  const subjectsData = subjectsQuery.result?.data;
  const teachersQuery = useList<User>({
    resource: "users",
    filters: [{ field: "role", operator: "eq", value: "teacher" }],
    pagination: { pageSize: 5 },
  });
  const teachersData = teachersQuery.result?.data;
  const studentsQuery = useList<User>({
    resource: "users",
    filters: [{ field: "role", operator: "eq", value: "student" }],
    pagination: { pageSize: 1 },
  });
  const studentsData = studentsQuery.result?.data;
  const deptsQuery = useList<Dept>({ resource: "departments", pagination: { pageSize: 1 } });
  const deptsData = deptsQuery.result?.data;
  const recentUsersQuery = useList<User>({ resource: "users",       pagination: { pageSize: 5 } });
  const recentUsersData = recentUsersQuery.result?.data;

  const classes       = classesData ?? [];
  const totalClasses  = classesQuery.result?.total ?? 0;
  const totalSubjects = subjectsQuery.result?.total ?? 0;
  const totalTeachers = teachersQuery.result?.total ?? 0;
  const totalStudents = studentsQuery.result?.total ?? 0;
  const totalDepts    = deptsQuery.result?.total ?? 0;
  const recentUsers   = recentUsersData ?? [];
  const activeClasses = classes.filter((c: ClassDetails) => c.status === "active").length;
  const activePct     = totalClasses > 0 ? Math.round((activeClasses / totalClasses) * 100) : 0;

  const now     = new Date();
  const hour    = now.getHours();
  const greet   = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dayStr  = now.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const roleBadge = (
    <Badge variant="outline" className={
      isAdmin   ? "border-violet-500/40 text-violet-600 bg-violet-500/5" :
      isTeacher ? "border-blue-500/40 text-blue-600 bg-blue-500/5"      :
                  "border-green-500/40 text-green-600 bg-green-500/5"
    }>
      {isAdmin   && <><ShieldCheck className="w-3 h-3 mr-1" />Admin</>}
      {isTeacher && <><School className="w-3 h-3 mr-1" />Teacher</>}
      {isStudent && <><GraduationCap className="w-3 h-3 mr-1" />Student</>}
    </Badge>
  );

  return (
    <div className="container mx-auto px-4 pb-12 max-w-6xl">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{dayStr}, {dateStr}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex flex-wrap items-center gap-2.5">
            {greet}, {user?.name?.split(" ")[0] ?? "there"} 👋
            {user && roleBadge}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAdmin   && "Full system control — manage users, classes, and more."}
            {isTeacher && "Your classes and students, all in one place."}
            {isStudent && "View your enrolled classes and join new ones."}
            {!user     && "Loading your dashboard…"}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {(isAdmin || isTeacher) && (
            <Button asChild size="sm">
              <a href="/classes/create"><Plus className="w-4 h-4 mr-1.5" />New Class</a>
            </Button>
          )}
          {isStudent && (
            <Button asChild size="sm" variant="outline">
              <a href="/classes"><Key className="w-4 h-4 mr-1.5" />Join a Class</a>
            </Button>
          )}
        </div>
      </div>

      {/* Stats — admin sees all, others see subset */}
      <div className={`grid gap-3 mb-6 ${isAdmin ? "grid-cols-2 lg:grid-cols-5" : "grid-cols-2"}`}>
        <StatCard title="Classes"  value={totalClasses}  sub={`${activeClasses} active`} icon={GraduationCap} gradient="bg-blue-500" loading={classLoading} />
        {isAdmin && <>
          <StatCard title="Subjects"    value={totalSubjects} sub="Across all depts"        icon={BookOpen}   gradient="bg-violet-500" />
          <StatCard title="Teachers"    value={totalTeachers} sub="Instructors"             icon={Users}      gradient="bg-amber-500" />
          <StatCard title="Students"    value={totalStudents} sub="Enrolled learners"       icon={GraduationCap} gradient="bg-green-500" />
          <StatCard title="Departments" value={totalDepts}    sub="Academic divisions"      icon={Building2}  gradient="bg-rose-500" />
        </>}
        {(isTeacher || isStudent) && (
          <StatCard title={isTeacher ? "My Students" : "Subjects"}
            value={isTeacher ? totalStudents : totalSubjects}
            sub={isTeacher ? "Across your classes" : "Available subjects"}
            icon={isTeacher ? Users : BookOpen} gradient="bg-green-500" />
        )}
      </div>

      {/* Admin class health */}
      {isAdmin && (
        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          <Card className="sm:col-span-2 border-0 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />Class Health
                </CardTitle>
                <span className="text-xs text-muted-foreground">{totalClasses} total</span>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Active</span>
                  <span className="font-medium">{activeClasses} / {totalClasses}</span>
                </div>
                <Progress value={activePct} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { label: "Active",   count: activeClasses,             color: "bg-green-500",            muted: "bg-green-50 dark:bg-green-900/20" },
                  { label: "Inactive", count: totalClasses - activeClasses, color: "bg-muted-foreground/40", muted: "bg-muted/50" },
                ].map(s => (
                  <div key={s.label} className={`flex items-center gap-2 p-2.5 rounded-md ${s.muted}`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${s.color} shrink-0`} />
                    <div><p className="text-sm font-bold">{s.count}</p><p className="text-[10px] text-muted-foreground">{s.label}</p></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />Ratios
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-3">
              {[
                { label: "Students / Teacher", val: totalTeachers > 0 ? (totalStudents / totalTeachers).toFixed(1) : "—", icon: Users,    color: "text-blue-600" },
                { label: "Classes / Subject",  val: totalSubjects > 0 ? (totalClasses  / totalSubjects).toFixed(1) : "—",  icon: BookOpen,  color: "text-violet-600" },
                { label: "Subjects / Dept",    val: totalDepts    > 0 ? (totalSubjects / totalDepts).toFixed(1)    : "—",  icon: Building2, color: "text-rose-600" },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <r.icon className={`w-3.5 h-3.5 ${r.color}`} />
                    <span className="text-xs text-muted-foreground">{r.label}</span>
                  </div>
                  <span className="text-sm font-bold">{r.val}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main 2-col */}
      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-2 pt-5 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary" />
                {isStudent ? "Your Classes" : "Recent Classes"}
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-xs h-7 px-2">
                <a href="/classes" className="flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></a>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {classLoading ? (
              <div className="space-y-3">{[...Array(4)].map((_,i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
            ) : classes.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <GraduationCap className="w-6 h-6 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {isStudent ? "You haven't joined any classes yet." : "No classes yet."}
                </p>
                {isStudent && <Button asChild size="sm" variant="outline"><a href="/classes"><Key className="w-3.5 h-3.5 mr-1.5" />Join with Invite Code</a></Button>}
                {(isAdmin || isTeacher) && <Button asChild size="sm"><a href="/classes/create"><Plus className="w-3.5 h-3.5 mr-1.5" />Create first class</a></Button>}
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {classes.map((cls: ClassDetails) => <ClassRow key={cls.id} cls={cls} />)}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-5 px-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-1.5">
              {isAdmin && <>
                <QA href="/classes/create"     icon={GraduationCap} label="New Class"       desc="Set up a class"       color="bg-blue-500/10 text-blue-600"    />
                <QA href="/subjects/create"    icon={BookOpen}      label="New Subject"     desc="Add to a department"  color="bg-violet-500/10 text-violet-600" />
                <QA href="/departments/create" icon={Building2}     label="New Department"  desc="Organise subjects"    color="bg-rose-500/10 text-rose-600"    />
                <QA href="/users"              icon={Users}         label="Manage Users"    desc={`${totalStudents + totalTeachers} members`} color="bg-amber-500/10 text-amber-600" />
              </>}
              {isTeacher && <>
                <QA href="/classes/create" icon={GraduationCap} label="Create Class"  desc="Start a new class"       color="bg-blue-500/10 text-blue-600"    />
                <QA href="/classes"        icon={BookOpen}      label="My Classes"    desc="View all your classes"   color="bg-violet-500/10 text-violet-600" />
                <QA href="/profile"        icon={Users}         label="My Profile"    desc="Update your info"        color="bg-amber-500/10 text-amber-600"  />
              </>}
              {isStudent && <>
                <QA href="/classes"  icon={Key}           label="Join a Class"  desc="Enter invite code"       color="bg-green-500/10 text-green-600"  />
                <QA href="/classes"  icon={GraduationCap} label="My Classes"    desc="View enrolled classes"   color="bg-blue-500/10 text-blue-600"    />
                <QA href="/profile"  icon={Users}         label="My Profile"    desc="Update your info"        color="bg-amber-500/10 text-amber-600"  />
              </>}
            </CardContent>
          </Card>

          {isAdmin && recentUsers.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 pt-5 px-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />Recent Members
                  </CardTitle>
                  <Button asChild variant="ghost" size="sm" className="text-xs h-7 px-2">
                    <a href="/users" className="flex items-center gap-1">All <ArrowRight className="w-3 h-3" /></a>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-0.5">{recentUsers.map((u: User) => <UserRow key={u.id} user={u} />)}</div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Getting started tip */}
      <div className="mt-6 p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3">
        <Star className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-primary">
            {isAdmin && "Admin Setup Guide"}
            {isTeacher && "Teacher Guide"}
            {isStudent && "Getting Started"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isAdmin && <>Set up in order: <a href="/departments" className="underline text-foreground">Departments</a> → <a href="/subjects" className="underline text-foreground">Subjects</a> → <a href="/users" className="underline text-foreground">Add Teachers</a> → <a href="/classes/create" className="underline text-foreground">Create Classes</a>. Share invite codes with students.</>}
            {isTeacher && <>Create your first <a href="/classes/create" className="underline text-foreground">class</a>. An invite code is auto-generated — share it with your students.</>}
            {isStudent && <>Go to <a href="/classes" className="underline text-foreground">Classes</a>, click "Join Class", and enter the invite code from your teacher.</>}
          </p>
        </div>
      </div>
    </div>
  );
}
