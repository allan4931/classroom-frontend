import { useCreate, useList, useNavigation } from "@refinedev/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import type { Department } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, BookOpen, CheckCircle2, AlertCircle, Info } from "lucide-react";

/** Same meaningful-word check used in departments/create.tsx */
function isMeaningful(val: string) {
  return /[a-zA-Z]{2,}/.test(val) &&
    (val.split("").filter(c => !/[a-zA-Z0-9\s\-'&\/().]/.test(c)).length / val.length) <= 0.3;
}

const schema = z.object({
  name: z
    .string()
    .min(3, "At least 3 characters")
    .max(120)
    .refine(isMeaningful, "Name must contain meaningful words, not random characters."),
  code: z
    .string()
    .min(2, "At least 2 characters")
    .max(15, "Max 15 characters")
    .regex(/^[A-Za-z0-9]+$/, "Code must be letters and numbers only (e.g. BIO101)"),
  departmentId: z.coerce.number({ invalid_type_error: "Select a department" }).min(1, "Select a department"),
  description: z
    .string()
    .max(300)
    .refine(v => !v || isMeaningful(v), "Description must contain meaningful words.")
    .optional(),
});
type FV = z.infer<typeof schema>;

const F = ({ label, required, error, hint, children }: {
  label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium">
      {label}{required && <span className="text-destructive ml-0.5">*</span>}
    </Label>
    {children}
    {hint && !error && <p className="text-xs text-muted-foreground flex items-center gap-1"><Info className="w-3 h-3" />{hint}</p>}
    {error && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
  </div>
);

export default function SubjectsCreate() {
  const { list }       = useNavigation();
  const createMutation = useCreate();
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FV>({
    resolver: zodResolver(schema),
  });

  const codeVal = watch("code") ?? "";

  const deptsQuery = useList<Department>({ resource: "departments", pagination: { pageSize: 100 } });
  const depts = deptsQuery.result?.data ?? [];

  const onSubmit = (v: FV) => {
    setIsLoading(true);
    createMutation.mutate(
      { resource: "subjects", values: { ...v, code: v.code.toUpperCase() } },
      {
        onSuccess: () => { setDone(true); setTimeout(() => list("subjects"), 1200); },
        onSettled: () => setIsLoading(false),
      }
    );
  };

  if (done) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-green-600" />
      </div>
      <h2 className="text-xl font-bold">Subject Created!</h2>
    </div>
  );

  return (
    <div className="container mx-auto max-w-xl px-4 pb-12">
      <div className="flex items-center gap-3 py-6">
        <Button variant="ghost" size="icon" onClick={() => list("subjects")}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">Create Subject</h1>
          <p className="text-sm text-muted-foreground">Add a subject to a department</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6 space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-violet-500/10"><BookOpen className="w-4 h-4 text-violet-600" /></div>
              <h3 className="font-semibold">Subject Details</h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <F label="Subject Name" required error={errors.name?.message}
                hint="e.g. Introduction to Biology">
                <Input placeholder="Introduction to Biology"
                  {...register("name")}
                  className={errors.name ? "border-destructive" : ""} />
              </F>
              <F label="Code" required error={errors.code?.message}
                hint="2–15 alphanumeric chars, e.g. BIO101">
                <Input
                  placeholder="BIO101"
                  value={codeVal.toUpperCase()}
                  onChange={e => setValue("code", e.target.value.toUpperCase())}
                  className={errors.code ? "border-destructive" : ""}
                  maxLength={15}
                />
              </F>
            </div>

            <F label="Department" required error={errors.departmentId?.message}>
              <Select
                value={watch("departmentId") ? String(watch("departmentId")) : ""}
                onValueChange={v => setValue("departmentId", Number(v))}
                disabled={deptsQuery.query?.isLoading}
              >
                <SelectTrigger className={errors.departmentId ? "border-destructive" : ""}>
                  <SelectValue placeholder={deptsQuery.query?.isLoading ? "Loading departments..." : depts.length === 0 ? "No departments yet" : "Pick a department"} />
                </SelectTrigger>
                <SelectContent>
                  {deptsQuery.query?.isLoading ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Loading departments...
                    </div>
                  ) : (
                    <>
                      {depts.map(d => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.name}
                          {d.code && <span className="text-muted-foreground text-xs ml-1.5">({d.code})</span>}
                        </SelectItem>
                      ))}
                      {depts.length === 0 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">Create a department first</div>
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>
            </F>

            <F label="Description" error={errors.description?.message}
              hint="Brief overview of what this subject covers">
              <Textarea
                placeholder="e.g. An introduction to biological concepts, cell theory, and genetics."
                rows={3}
                {...register("description")}
                className={errors.description ? "border-destructive" : ""}
              />
            </F>

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || isLoading}>
              {(isSubmitting || isLoading)
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</>
                : "Create Subject"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
