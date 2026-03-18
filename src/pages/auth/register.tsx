import { useState } from "react";
import { Link, useNavigate } from "react-router";
// @ts-ignore
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, GraduationCap, Loader2, UserPlus, School, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { BACKEND_URL } from "@/constants/index";

const schema = z.object({
  name:     z.string().min(2, "Name must be at least 2 characters"),
  email:    z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirm:  z.string(),
  role:     z.enum(["student", "teacher"]),
}).refine(d => d.password === d.confirm, {
  message: "Passwords don't match", path: ["confirm"],
});
type FormData = z.infer<typeof schema>;

const ROLES = [
  { id: "student" as const, label: "Student",  icon: GraduationCap, desc: "Join classes with invite codes",  color: "text-green-600", bg: "bg-green-500/10 border-green-200 dark:border-green-800" },
  { id: "teacher" as const, label: "Teacher",  icon: School,         desc: "Create and manage your classes", color: "text-blue-600",  bg: "bg-blue-500/10  border-blue-200  dark:border-blue-800"  },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "student" },
  });
  const roleVal = watch("role");

  const onSubmit = async (data: FormData) => {
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, email: data.email, password: data.password, role: data.role }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Registration failed."); return; }

      localStorage.setItem("nc_token", json.token);
      localStorage.setItem("nc_user",  JSON.stringify(json.user));
      setSuccess(true);
      setTimeout(() => navigate("/", { replace: true }), 1400);
    } catch {
      setError("Network error — is the server running?");
    } finally { setLoading(false); }
  };

  if (success) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold">Account Created!</h2>
        <p className="text-muted-foreground text-sm">Taking you to your dashboard…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4 mx-auto">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Create your account</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Join NetClass · <span className="text-primary font-medium">First account auto-becomes Admin</span>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Role picker */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">I want to…</p>
            <Controller control={control} name="role" render={({ field }: any) => (
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(r => {
                  const Icon   = r.icon;
                  const active = field.value === r.id;
                  return (
                    <button key={r.id} type="button" onClick={() => field.onChange(r.id)}
                      className={cn("flex flex-col items-center gap-1 p-4 rounded-lg border-2 transition-all text-center",
                        active ? `${r.bg} ${r.color} border-current` : "border-border text-muted-foreground hover:border-muted-foreground/50")}>
                      <Icon className={cn("w-6 h-6", active ? r.color : "")} />
                      <span className="text-sm font-semibold">{r.label}</span>
                      <span className="text-[10px] leading-tight opacity-70">{r.desc}</span>
                    </button>
                  );
                })}
              </div>
            )} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" placeholder="Jane Smith" autoComplete="name"
              {...register("name")} className={errors.name ? "border-destructive" : ""} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" autoComplete="email"
              {...register("email")} className={errors.email ? "border-destructive" : ""} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPw ? "text" : "password"} placeholder="••••••"
                  autoComplete="new-password" {...register("password")}
                  className={cn("pr-9", errors.password ? "border-destructive" : "")} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm</Label>
              <Input id="confirm" type={showPw ? "text" : "password"} placeholder="••••••"
                autoComplete="new-password" {...register("confirm")}
                className={errors.confirm ? "border-destructive" : ""} />
              {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account…</>
              : <><UserPlus className="w-4 h-4 mr-2" />Create Account</>}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
