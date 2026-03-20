import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye, EyeOff, GraduationCap, Loader2, LogIn,
  ShieldCheck, School, Clock, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { BACKEND_URL } from "@/constants/index";

const schema = z.object({
  email:    z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password required"),
});
type FormData = z.infer<typeof schema>;

const ROLES = [
  { id: "student",  label: "Student", icon: GraduationCap, color: "text-green-600",  bg: "bg-green-500/10  border-green-200  dark:border-green-800"  },
  { id: "teacher",  label: "Teacher", icon: School,         color: "text-blue-600",   bg: "bg-blue-500/10   border-blue-200   dark:border-blue-800"   },
  { id: "admin",    label: "Admin",   icon: ShieldCheck,    color: "text-violet-600", bg: "bg-violet-500/10 border-violet-200 dark:border-violet-800" },
] as const;

/* ── Pending / rejected screen shown when login returns pending:true ── */
function PendingLoginScreen({ message, email }: { message: string; email: string }) {
  const [checking, setChecking]     = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const res  = await fetch(`${BACKEND_URL}/api/auth/pending-status?email=${encodeURIComponent(email)}`);
      const json = await res.json();
      setCheckResult(json.message ?? "Could not retrieve status.");
    } catch {
      setCheckResult("Could not connect to server. Please try again.");
    } finally { setChecking(false); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
          <Clock className="w-10 h-10 text-amber-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Account Pending Approval</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">{message}</p>
        </div>
        <Button variant="outline" className="w-full" onClick={checkStatus} disabled={checking}>
          {checking
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Checking…</>
            : <><RefreshCw className="w-4 h-4 mr-2" />Check Status</>}
        </Button>
        {checkResult && (
          <div className="p-3 rounded-md bg-primary/5 border border-primary/20 text-sm">{checkResult}</div>
        )}
        <p className="text-sm text-muted-foreground">
          <button className="underline text-primary hover:opacity-80" onClick={() => window.location.reload()}>
            Try logging in again
          </button>{" "}once your account is approved.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPw, setShowPw]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [selectedRole, setSelectedRole] = useState<"student"|"teacher"|"admin">("student");
  const [pendingScreen, setPendingScreen] = useState<{ message: string; email: string } | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });
      const json = await res.json();

      if (!res.ok) {
        // Pending account — show friendly screen instead of raw error
        if (json.pending) {
          setPendingScreen({ message: json.error, email: data.email });
          return;
        }
        setError(json.error ?? "Login failed. Please check your credentials.");
        return;
      }

      localStorage.setItem("nc_token", json.token);
      localStorage.setItem("nc_user",  JSON.stringify(json.user));
      navigate("/", { replace: true });
    } catch {
      setError("Network error — is the server running?");
    } finally { setLoading(false); }
  };

  if (pendingScreen) {
    return <PendingLoginScreen message={pendingScreen.message} email={pendingScreen.email} />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white/30"
              style={{ width: 80 + i * 70, height: 80 + i * 70, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
          ))}
        </div>
        <div className="relative z-10 text-white text-center space-y-6 max-w-md">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">NetClass</h1>
          <p className="text-lg text-white/80 leading-relaxed">
            Your complete classroom management platform — for admins, teachers, and students.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-4">
            {[{ n: "Admin", d: "Full control" }, { n: "Teacher", d: "Manage classes" }, { n: "Student", d: "Join & learn" }].map(x => (
              <div key={x.n} className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-sm font-bold">{x.n}</p>
                <p className="text-xs text-white/70 mt-0.5">{x.d}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/60 pt-2">First account registered becomes Admin automatically.</p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center lg:text-left">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4 lg:hidden mx-auto">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground text-sm mt-1">Sign in to your NetClass account</p>
          </div>

          {/* Decorative role selector */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">I am logging in as…</p>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map(r => {
                const Icon   = r.icon;
                const active = selectedRole === r.id;
                return (
                  <button key={r.id} type="button" onClick={() => setSelectedRole(r.id)}
                    className={cn("flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-sm font-medium",
                      active ? `${r.bg} ${r.color} border-current` : "border-border text-muted-foreground hover:border-muted-foreground/50")}>
                    <Icon className={cn("w-5 h-5", active ? r.color : "text-muted-foreground")} />
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" autoComplete="email"
                {...register("email")} className={errors.email ? "border-destructive" : ""} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPw ? "text" : "password"} placeholder="••••••••"
                  autoComplete="current-password" {...register("password")}
                  className={cn("pr-10", errors.password ? "border-destructive" : "")} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in…</>
                : <><LogIn className="w-4 h-4 mr-2" />Sign In</>}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
