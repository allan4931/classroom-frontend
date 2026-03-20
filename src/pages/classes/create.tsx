import { useCreate, useList, useNavigation } from "@refinedev/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Subject, User } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Plus, Trash2, Clock, GraduationCap, BookOpen, Activity, CheckCircle2, AlertCircle } from "lucide-react";

const schema = z.object({
  name:        z.string().min(2, "At least 2 characters").max(100),
  description: z.string().optional(),
  subjectId:   z.coerce.number({ invalid_type_error: "Select a subject" }).min(1, "Select a subject"),
  teacherId:   z.string().optional(),
  capacity:    z.coerce.number().min(1).max(999).default(30),
  status:      z.enum(["active", "inactive"]).default("active"),
  bannerUrl:   z.string().optional(),
});
type FV = z.infer<typeof schema>;

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

const Field = ({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
    {error && <p className="text-xs text-destructive flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" />{error}</p>}
  </div>
);

export default function CreateClass() {
  const { list } = useNavigation();
  const createMutation = useCreate();
  const [isLoading, setIsLoading] = useState(false);
  const { isAdmin, isTeacher, user: currentUser } = useCurrentUser();
  const [schedules, setSchedules] = useState<{ day: string; startTime: string; endTime: string }[]>([]);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FV>({
    resolver: zodResolver(schema) as any,
    defaultValues: { status: "active", capacity: 30 },
  });

  // ✅ Refine v5: correct useList API
  const { data: subjectsResult } = useList<Subject>({ resource: "subjects", pagination: { pageSize: 100 } });
  const subjects = subjectsResult?.data ?? [];

  const { data: teachersResult } = useList<User>({
    resource: "users",
    filters: [{ field: "role", operator: "eq", value: "teacher" }],
    pagination: { pageSize: 100 },
  });
  // Only pass teachers to the selector when admin
  const teachers = (isAdmin ? teachersResult?.data : []) ?? [];

  const addSlot    = () => setSchedules(s => [...s, { day: "Monday", startTime: "09:00", endTime: "10:00" }]);
  const removeSlot = (i: number) => setSchedules(s => s.filter((_, x) => x !== i));
  const updateSlot = (i: number, k: string, v: string) => setSchedules(s => s.map((item, x) => x === i ? { ...item, [k]: v } : item));

  const onSubmit = (values: FV) => {
    const teacherId = isTeacher ? (currentUser?.id ?? "") : (values.teacherId ?? "");
    setIsLoading(true);
    createMutation.mutate(
      { resource: "classes", values: { ...values, teacherId, schedules } },
      { onSuccess: () => { setSuccess(true); setTimeout(() => list("classes"), 1500); }, onSettled: () => setIsLoading(false) }
    );
  };

  if (success) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-green-600" />
      </div>
      <h2 className="text-xl font-bold">Class Created!</h2>
      <p className="text-sm text-muted-foreground">Redirecting…</p>
    </div>
  );

  const busy = isSubmitting || isLoading;

  return (
    <div className="container mx-auto max-w-2xl px-4 pb-12">
      <div className="flex items-center gap-3 py-6">
        <Button variant="ghost" size="icon" onClick={() => list("classes")}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create a Class</h1>
          <p className="text-sm text-muted-foreground">
            {isTeacher ? "You will automatically be assigned as the teacher" : "Set up a new class"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-5">
          {/* Identity */}
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-blue-500/10"><GraduationCap className="w-4 h-4 text-blue-600" /></div>
                <h3 className="font-semibold">Class Identity</h3>
              </div>
              <Field label="Class Name" required error={errors.name?.message}>
                <Input placeholder="e.g. Introduction to Biology — Section A" {...register("name")} className={errors.name ? "border-destructive" : ""} />
              </Field>
              <Field label="Description" error={errors.description?.message}>
                <Textarea placeholder="What will students learn?" rows={3} {...register("description")} />
              </Field>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-violet-500/10"><BookOpen className="w-4 h-4 text-violet-600" /></div>
                <h3 className="font-semibold">{isAdmin ? "Subject & Teacher" : "Subject"}</h3>
              </div>
              <div className={isAdmin ? "grid sm:grid-cols-2 gap-4" : ""}>
                <Field label="Subject" required error={errors.subjectId?.message}>
                  <Select value={watch("subjectId") ? String(watch("subjectId")) : ""} onValueChange={v => setValue("subjectId", Number(v))}>
                    <SelectTrigger className={errors.subjectId ? "border-destructive" : ""}>
                      <SelectValue placeholder={subjects.length === 0 ? "No subjects yet" : "Pick a subject"} />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(s => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          <span className="font-medium">{s.name}</span>
                          {s.code && <span className="text-muted-foreground text-xs ml-1.5">({s.code})</span>}
                        </SelectItem>
                      ))}
                      {subjects.length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">Create a subject first</div>}
                    </SelectContent>
                  </Select>
                </Field>

                {isAdmin && (
                  <Field label="Teacher" error={errors.teacherId?.message}>
                    <Select value={watch("teacherId") ?? ""} onValueChange={v => setValue("teacherId", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder={teachers.length === 0 ? "No teachers yet" : "Pick a teacher"} />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map(t => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            <div className="flex items-center gap-2">
                              {t.image
                                ? <img src={t.image} className="w-5 h-5 rounded-full object-cover" alt="" />
                                : <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">{t.name.charAt(0)}</div>}
                              {t.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </div>
              {isTeacher && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-blue-500/8 border border-blue-500/20 text-sm text-blue-700 dark:text-blue-400">
                  <GraduationCap className="w-4 h-4 shrink-0" />
                  You will be automatically assigned as the teacher.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-amber-500/10"><Activity className="w-4 h-4 text-amber-600" /></div>
                <h3 className="font-semibold">Settings</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Capacity" error={errors.capacity?.message}>
                  <Input type="number" min={1} max={999} placeholder="30" {...register("capacity")} />
                </Field>
                <Field label="Status" required error={errors.status?.message}>
                  <Select value={watch("status") ?? "active"} onValueChange={v => setValue("status", v as "active" | "inactive")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Active</span></SelectItem>
                      <SelectItem value="inactive"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />Inactive</span></SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-green-500/10"><Clock className="w-4 h-4 text-green-600" /></div>
                  <div>
                    <h3 className="font-semibold">Schedule <span className="text-muted-foreground font-normal text-sm">(optional)</span></h3>
                    <p className="text-xs text-muted-foreground">Recurring weekly time slots</p>
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addSlot}><Plus className="w-3.5 h-3.5 mr-1" />Add Slot</Button>
              </div>
              {schedules.length === 0
                ? <div className="border border-dashed rounded-md p-6 text-center"><p className="text-xs text-muted-foreground">No slots yet — click "Add Slot"</p></div>
                : (
                  <div className="space-y-2">
                    {schedules.map((slot, i) => (
                      <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center p-3 rounded-md border bg-muted/20">
                        <select className="text-sm rounded border bg-background px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring" value={slot.day} onChange={e => updateSlot(i, "day", e.target.value)}>
                          {DAYS.map(d => <option key={d}>{d}</option>)}
                        </select>
                        <input type="time" className="text-sm rounded border bg-background px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring" value={slot.startTime} onChange={e => updateSlot(i, "startTime", e.target.value)} />
                        <input type="time" className="text-sm rounded border bg-background px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring" value={slot.endTime} onChange={e => updateSlot(i, "endTime", e.target.value)} />
                        <Button type="button" variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeSlot(i)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    ))}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {schedules.map((s, i) => <Badge key={i} variant="secondary" className="text-xs">{s.day.slice(0, 3)} · {s.startTime}–{s.endTime}</Badge>)}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating Class…</> : <><GraduationCap className="w-4 h-4 mr-2" />Create Class</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
