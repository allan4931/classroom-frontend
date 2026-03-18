import { useCreate, useNavigation } from "@refinedev/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Building2, CheckCircle2, AlertCircle } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "At least 2 characters"),
  code: z.string().min(2, "At least 2 characters"),
  description: z.string().optional(),
});
type FV = z.infer<typeof schema>;

const F = ({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
    {error && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
  </div>
);

export default function DepartmentsCreate() {
  const { list } = useNavigation();
  const createMutation = useCreate();
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FV>({ resolver: zodResolver(schema) });
  const codeVal = watch("code") ?? "";
  const onSubmit = (v: FV) => {
    setIsLoading(true);
    createMutation.mutate(
      { resource: "departments", values: { ...v, code: v.code.toUpperCase() } }, 
      { onSuccess: () => { setDone(true); setTimeout(() => list("departments"), 1200); }, onSettled: () => setIsLoading(false) }
    );
  };

  if (done) return <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4"><div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle2 className="w-8 h-8 text-green-600" /></div><h2 className="text-xl font-bold">Department Created!</h2></div>;

  return (
    <div className="container mx-auto max-w-xl px-4 pb-12">
      <div className="flex items-center gap-3 py-6">
        <Button variant="ghost" size="icon" onClick={() => list("departments")}><ArrowLeft className="w-4 h-4" /></Button>
        <div><h1 className="text-2xl font-bold">Create Department</h1><p className="text-sm text-muted-foreground">Add an academic department</p></div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6 space-y-5">
            <div className="flex items-center gap-2 mb-2"><div className="p-1.5 rounded-md bg-rose-500/10"><Building2 className="w-4 h-4 text-rose-600" /></div><h3 className="font-semibold">Department Details</h3></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <F label="Name" required error={errors.name?.message}><Input placeholder="Computer Science" {...register("name")} /></F>
              <F label="Code" required error={errors.code?.message}><Input placeholder="CS" value={codeVal.toUpperCase()} onChange={e => setValue("code", e.target.value.toUpperCase())} /></F>
            </div>
            <F label="Description" error={errors.description?.message}><Textarea placeholder="Brief description…" rows={3} {...register("description")} /></F>
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || isLoading}>
              {(isSubmitting || isLoading) ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</> : "Create Department"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
