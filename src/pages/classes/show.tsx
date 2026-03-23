import { useState } from "react";
import { useShow } from "@refinedev/core";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { ClassDetails, User } from "@/types";
import { ShowView, ShowViewHeader } from "@/components/refine-ui/views/show-view.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Check, Users, Calendar, RefreshCw, Loader2, ChevronDown, ChevronUp, School } from "lucide-react";
import { BACKEND_URL } from "@/constants";
import { getToken } from "@/providers/auth";

const DAY_LABELS: Record<string, string> = { monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun" };

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
      {children}
    </div>
  );
}

export default function ClassesShow() {
  const { query } = useShow<ClassDetails>({ resource: "classes" });
  const { isAdmin, isTeacher, isStudent, user: currentUser } = useCurrentUser();
  const classDetails = query.data?.data;
  const { isLoading, isError } = query;

  const [codeCopied, setCodeCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [roster, setRoster] = useState<User[] | null>(null);
  const [rosterLoading, setRosterLoading] = useState(false);

  if (isLoading || isError || !classDetails) {
    return (
      <ShowView className="class-view class-show">
        <ShowViewHeader resource="classes" title="Class Details" />
        <p className="state-message mt-6 text-muted-foreground">
          {isLoading ? "Loading…" : isError ? "Failed to load class." : "Class not found."}
        </p>
      </ShowView>
    );
  }

  const { name, description, status, capacity, bannerUrl, subject, teacher, department, schedules, inviteCode, enrollmentCount } = classDetails;
  const displayCode = newCode ?? inviteCode;
  const teacherName = teacher?.name ?? "Unknown";
  const initials = teacherName.split(" ").filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join("");
  const placeholderUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherName)}&background=4f7df3&color=fff&size=80`;

  const canManage = isAdmin || (isTeacher && teacher?.id === currentUser?.id);

  const copyCode = () => {
    if (displayCode) { navigator.clipboard.writeText(displayCode); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); }
  };

  const regenerateKey = async () => {
    setRegenerating(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/classes/${classDetails.id}/regenerate-key`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (res.ok) setNewCode(json.data?.inviteCode);
    } catch {}
    finally { setRegenerating(false); }
  };

  const loadRoster = async () => {
    if (roster !== null) { setRosterOpen(o => !o); return; }
    setRosterLoading(true); setRosterOpen(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/classes/${classDetails.id}/students`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      setRoster(json.data ?? []);
    } catch { setRoster([]); }
    finally { setRosterLoading(false); }
  };

  return (
    <ShowView className="class-view class-show">
      <ShowViewHeader resource="classes" title="Class Details" />

      {/* Banner */}
      <div className="banner">
        {bannerUrl
          ? <img src={bannerUrl} alt={name} className="w-full aspect-[5/1] rounded-xl object-cover shadow-md" />
          : <div className="h-48 w-full bg-gradient-to-r from-primary/20 to-primary/5 rounded-xl" />}
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mt-4">
        {/* Main details */}
        <Card className="lg:col-span-2 details-card">
          <CardContent className="pt-6 space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <h1 className="text-xl font-bold">{name}</h1>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                  <Users className="w-3 h-3" />{enrollmentCount ?? 0}/{capacity}
                </Badge>
                <Badge variant={status === "active" ? "default" : "secondary"} data-status={status}>{status.toUpperCase()}</Badge>
              </div>
            </div>

            <Separator />

            {/* Teacher + Department */}
            <div className="grid sm:grid-cols-2 gap-6">
              <Section label="Instructor">
                <div className="flex items-center gap-3">
                  <Avatar className="w-11 h-11">
                    <AvatarImage src={teacher?.image ?? placeholderUrl} />
                    <AvatarFallback className="font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-primary">{teacherName}</p>
                    <p className="text-xs text-muted-foreground">{teacher?.email}</p>
                  </div>
                </div>
              </Section>

              <Section label="Department">
                <div className="space-y-0.5">
                  <p className="text-base font-bold text-primary">{department?.name ?? "—"}</p>
                  {department?.description && <p className="text-xs text-muted-foreground line-clamp-2">{department.description}</p>}
                </div>
              </Section>
            </div>

            <Separator />

            {/* Subject */}
            <Section label="Subject">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono">Code: {subject?.code ?? "—"}</Badge>
                <span className="font-semibold text-primary">{subject?.name}</span>
              </div>
              {subject?.description && <p className="text-sm text-muted-foreground mt-1">{subject.description}</p>}
            </Section>

            {/* Schedule */}
            {schedules && schedules.length > 0 && <>
              <Separator />
              <Section label="Schedule">
                <div className="flex flex-wrap gap-2">
                  {schedules.map((s, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      <Calendar className="w-3 h-3 mr-1" />
                      {DAY_LABELS[s.day?.toLowerCase()] ?? s.day} · {s.startTime}–{s.endTime}
                    </Badge>
                  ))}
                </div>
              </Section>
            </>}
          </CardContent>
        </Card>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Invite code card — admin/teacher */}
          {canManage && displayCode && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 pt-5 px-5">
                <CardTitle className="text-sm font-semibold">Invite Code</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-3">
                <div className="flex items-center justify-between bg-muted rounded-lg px-4 py-3">
                  <span className="font-mono font-bold tracking-widest text-xl">{displayCode}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyCode}>
                    {codeCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Share this code with students so they can join.</p>
                <Button variant="outline" size="sm" className="w-full" onClick={regenerateKey} disabled={regenerating}>
                  {regenerating ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Regenerating…</> : <><RefreshCw className="w-3.5 h-3.5 mr-2" />Regenerate Code</>}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Student roster toggle — admin/teacher */}
          {canManage && (
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-5 pb-5 px-5">
                <Button variant="outline" className="w-full flex items-center justify-between" onClick={loadRoster}>
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />View Student Roster
                  </span>
                  {rosterOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>

                {rosterOpen && (
                  <div className="mt-4 space-y-2">
                    {rosterLoading ? (
                      <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                    ) : !roster?.length ? (
                      <p className="text-sm text-muted-foreground text-center py-3">No students enrolled yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {roster.map(s => {
                          const ini = s.name.split(" ").filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join("");
                          return (
                            <div key={s.id} className="flex items-center gap-2.5 p-2 rounded-md hover:bg-muted/40 transition-colors">
                              <Avatar className="w-7 h-7">
                                <AvatarImage src={s.image} />
                                <AvatarFallback className="text-[10px] font-bold bg-green-500/10 text-green-700">{ini}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{s.name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{s.email}</p>
                              </div>
                            </div>
                          );
                        })}
                        <p className="text-xs text-muted-foreground text-right pt-1">{roster.length} student{roster.length !== 1 ? "s" : ""}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Student join info */}
          {isStudent && (
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-5 pb-5 px-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-md bg-green-500/10"><School className="w-4 h-4 text-green-600" /></div>
                  <p className="font-semibold text-sm">You're enrolled</p>
                </div>
                <p className="text-xs text-muted-foreground">You have access to all class materials and updates.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ShowView>
  );
}
