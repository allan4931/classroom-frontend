import { useGetIdentity, useUpdate, useNotification } from "@refinedev/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import type { CurrentUser } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, GraduationCap, School, ShieldCheck, Save, User } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});
type FormValues = z.infer<typeof schema>;

const ROLE_CONFIG = {
  admin:   { label: "Admin",   icon: ShieldCheck,   color: "text-violet-600", bg: "bg-violet-500/10 border-violet-500/30" },
  teacher: { label: "Teacher", icon: School,         color: "text-blue-600",   bg: "bg-blue-500/10   border-blue-500/30"   },
  student: { label: "Student", icon: GraduationCap,  color: "text-green-600",  bg: "bg-green-500/10  border-green-500/30"  },
};

export default function ProfilePage() {
  const { data: identity, refetch } = useGetIdentity<CurrentUser>();
  const updateMutation = useUpdate();
  const [isLoading, setIsLoading] = useState(false);
  const { open: notify } = useNotification();
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (identity) reset({ name: identity.name });
  }, [identity]);

  const onSubmit = (values: FormValues) => {
    if (!identity?.id) return;
    setIsLoading(true);
    updateMutation.mutate(
      { resource: "users", id: identity.id, values },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
          // Update localStorage
          const raw = localStorage.getItem("nc_user");
          if (raw) {
            try {
              const u = JSON.parse(raw);
              localStorage.setItem("nc_user", JSON.stringify({ ...u, name: values.name }));
            } catch {}
          }
          notify?.({ type: "success", message: "Profile updated!" });
          refetch?.();
        },
        onSettled: () => {
          setIsLoading(false);
        },
      }
    );
  };

  if (!identity) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  const cfg = ROLE_CONFIG[identity.role] ?? ROLE_CONFIG.student;
  const RIcon = cfg.icon;
  const initials = identity.name.split(" ").filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join("");

  return (
    <div className="container mx-auto max-w-xl px-4 pb-12">
      <div className="py-6">
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account information</p>
      </div>

      {/* Hero card */}
      <Card className="border-0 shadow-sm overflow-hidden mb-5">
        <div className="h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
        <CardContent className="pt-0 pb-6 px-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
            <Avatar className="w-20 h-20 border-4 border-background shadow-md">
              <AvatarImage src={identity.image} />
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="pb-1">
              <h2 className="text-xl font-bold">{identity.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-muted-foreground">{identity.email}</p>
                <Badge variant="outline" className={`${cfg.bg} ${cfg.color} flex items-center gap-1 text-xs`}>
                  <RIcon className="w-3 h-3" />{cfg.label}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit form */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />Account Details
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Your name" {...register("name")} className={errors.name ? "border-destructive" : ""} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={identity.email} disabled className="opacity-60 cursor-not-allowed" />
              <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>

            <div className="space-y-1.5">
              <Label>Role</Label>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border ${cfg.bg} ${cfg.color} text-sm font-medium`}>
                <RIcon className="w-4 h-4" />{cfg.label}
              </div>
              <p className="text-xs text-muted-foreground">Role can only be changed by an admin.</p>
            </div>

            <Separator />

            <Button type="submit" disabled={isLoading || !isDirty} className="w-full">
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
                : saved ? <><Save className="w-4 h-4 mr-2 text-green-500" />Saved!</>
                : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account info */}
      <Card className="border-0 shadow-sm mt-5">
        <CardContent className="pt-5 pb-5 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Info</p>
          <div className="flex justify-between text-sm py-1">
            <span className="text-muted-foreground">User ID</span>
            <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{String(identity.id).slice(0, 12)}…</code>
          </div>
          <div className="flex justify-between text-sm py-1">
            <span className="text-muted-foreground">Account Type</span>
            <span className="font-medium capitalize">{identity.role}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
