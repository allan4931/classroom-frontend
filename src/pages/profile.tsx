import { useGetIdentity, useNotification } from "@refinedev/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState, useCallback } from "react";
import type { CurrentUser, UserProfile } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, GraduationCap, School, ShieldCheck, Save, User,
  Camera, Phone, MapPin, Globe, BookOpen, Bell, Lock,
  CheckCircle2, AlertCircle, Eye, EyeOff,
} from "lucide-react";
import { BACKEND_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "@/constants";
import { getToken } from "@/providers/auth";

/* ── Schemas ─────────────────────────────────────────────────────────────── */
const basicSchema = z.object({
  name: z.string().min(2, "At least 2 characters"),
  bio:  z.string().max(500, "Max 500 characters").optional(),
});

const contactSchema = z.object({
  phone:   z.string().max(30).optional(),
  address: z.string().max(200).optional(),
  website: z
    .string()
    .max(200)
    .refine(v => !v || v.startsWith("http") || v.startsWith("www"), "Enter a valid URL")
    .optional(),
});

const pwSchema = z.object({
  currentPassword: z.string().min(1, "Current password required"),
  newPassword:     z.string().min(6, "At least 6 characters"),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match", path: ["confirmPassword"],
});

type BasicForm   = z.infer<typeof basicSchema>;
type ContactForm = z.infer<typeof contactSchema>;
type PwForm      = z.infer<typeof pwSchema>;

/* ── Role config ─────────────────────────────────────────────────────────── */
const ROLE_CFG = {
  admin:   { label: "Admin",   icon: ShieldCheck,  color: "text-violet-600", bg: "bg-violet-500/10 border-violet-500/30" },
  teacher: { label: "Teacher", icon: School,        color: "text-blue-600",   bg: "bg-blue-500/10   border-blue-500/30"   },
  student: { label: "Student", icon: GraduationCap, color: "text-green-600",  bg: "bg-green-500/10  border-green-500/30"  },
};

/* ── Completeness bar ────────────────────────────────────────────────────── */
function CompletenessBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-rose-500";
  const label = score >= 80 ? "Complete" : score >= 50 ? "Good" : "Incomplete";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium">Profile completeness</span>
        <span className={`font-bold ${score >= 80 ? "text-green-600" : score >= 50 ? "text-amber-600" : "text-rose-600"}`}>
          {score}% — {label}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

/* ── Field wrapper ───────────────────────────────────────────────────────── */
function F({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { data: identity, refetch: refetchIdentity } = useGetIdentity<CurrentUser>();
  const { open: notify } = useNotification();

  const [profile,      setProfile]      = useState<UserProfile | null>(null);
  const [completeness, setCompleteness] = useState(0);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [basicSaving,   setBasicSaving]   = useState(false);
  const [contactSaving, setContactSaving] = useState(false);
  const [prefsUpdating, setPrefsUpdating] = useState(false);
  const [pwSaving,      setPwSaving]      = useState(false);
  const [pwError,       setPwError]       = useState("");
  const [pwSuccess,     setPwSuccess]     = useState(false);
  const [showCurrent,   setShowCurrent]   = useState(false);
  const [showNew,       setShowNew]       = useState(false);
  const [uploadingImg,  setUploadingImg]  = useState(false);

  const [notifPrefs, setNotifPrefs] = useState({
    emailLogin: true, emailApproval: true, emailClasses: true,
  });

  /* ── Load profile ── */
  const loadProfile = useCallback(async () => {
    if (!identity?.id) return;
    setLoadingProfile(true);
    try {
      const res  = await fetch(`${BACKEND_URL}/api/profiles/${identity.id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setProfile(json.data.profile ?? null);
        setCompleteness(json.data.completeness ?? 0);
        if (json.data.profile?.notificationPrefs) {
          setNotifPrefs(json.data.profile.notificationPrefs);
        }
      }
    } catch {}
    finally { setLoadingProfile(false); }
  }, [identity?.id]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  /* ── Forms ── */
  const basicForm = useForm<BasicForm>({
    resolver: zodResolver(basicSchema),
  });
  const contactForm = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });
  const pwForm = useForm<PwForm>({
    resolver: zodResolver(pwSchema),
  });

  /* Pre-fill forms when data arrives */
  useEffect(() => {
    if (identity) basicForm.reset({ name: identity.name, bio: profile?.bio ?? "" });
    if (profile)  contactForm.reset({ phone: profile.phone ?? "", address: profile.address ?? "", website: profile.website ?? "" });
  }, [identity, profile]);

  /* ── Cloudinary upload ── */
  const openCloudinaryWidget = () => {
    if (typeof window === "undefined" || !window.cloudinary) return;
    setUploadingImg(true);
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        multiple: false,
        folder: "netclass/avatars",
        maxFileSize: 5_000_000,
        clientAllowedFormats: ["png", "jpg", "jpeg", "webp"],
        cropping: true,
        croppingAspectRatio: 1,
      },
      async (err, result) => {
        setUploadingImg(false);
        if (err || result.event !== "success") return;
        const { secure_url, public_id } = result.info;
        // Save image to profile
        await saveProfile({ image: secure_url, imageCldPubId: public_id });
      }
    );
    widget.open();
  };

  /* ── Generic save helper → PATCH /api/profiles/:id ── */
  const saveProfile = async (payload: Record<string, unknown>) => {
    if (!identity?.id) return false;
    const res = await fetch(`${BACKEND_URL}/api/profiles/${identity.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      notify?.({ type: "error", message: json.error ?? "Save failed." });
      return false;
    }
    // Update localStorage user
    const raw = localStorage.getItem("nc_user");
    if (raw) {
      try {
        const u = JSON.parse(raw);
        localStorage.setItem("nc_user", JSON.stringify({
          ...u,
          ...(payload.name  ? { name:  payload.name  } : {}),
          ...(payload.image ? { image: payload.image } : {}),
        }));
      } catch {}
    }
    if (json.data) {
      setProfile(json.data.profile ?? null);
      setCompleteness(json.data.completeness ?? 0);
    }
    refetchIdentity?.();
    return true;
  };

  /* ── Handlers ── */
  const onBasicSubmit = async (v: BasicForm) => {
    setBasicSaving(true);
    const ok = await saveProfile({ name: v.name, bio: v.bio ?? "" });
    if (ok) notify?.({ type: "success", message: "Profile updated!" });
    setBasicSaving(false);
  };

  const onContactSubmit = async (v: ContactForm) => {
    setContactSaving(true);
    const ok = await saveProfile({ phone: v.phone ?? "", address: v.address ?? "", website: v.website ?? "" });
    if (ok) notify?.({ type: "success", message: "Contact info saved!" });
    setContactSaving(false);
  };

  const onPrefsChange = async (key: keyof typeof notifPrefs, value: boolean) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    setPrefsUpdating(true);
    await saveProfile({ notificationPrefs: updated });
    setPrefsUpdating(false);
  };

  const onPwSubmit = async (v: PwForm) => {
    if (!identity?.id) return;
    setPwSaving(true); setPwError(""); setPwSuccess(false);
    try {
      const res = await fetch(`${BACKEND_URL}/api/profiles/${identity.id}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ currentPassword: v.currentPassword, newPassword: v.newPassword }),
      });
      const json = await res.json();
      if (!res.ok) { setPwError(json.error ?? "Failed to change password."); return; }
      setPwSuccess(true);
      pwForm.reset();
      setTimeout(() => setPwSuccess(false), 4000);
    } catch { setPwError("Network error."); }
    finally { setPwSaving(false); }
  };

  /* ── Loading state ── */
  if (!identity || loadingProfile) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const cfg      = ROLE_CFG[identity.role] ?? ROLE_CFG.student;
  const RIcon    = cfg.icon;
  const initials = identity.name.split(" ").filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join("");

  return (
    <div className="container mx-auto max-w-3xl px-4 pb-12">
      <div className="py-6">
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account information and preferences</p>
      </div>

      {/* ── Hero ── */}
      <Card className="border-0 shadow-sm overflow-hidden mb-6">
        <div className="h-24 bg-gradient-to-r from-primary/25 via-primary/10 to-violet-500/10" />
        <CardContent className="pt-0 pb-6 px-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            {/* Avatar with upload button */}
            <div className="relative w-fit">
              <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                <AvatarImage src={identity.image} />
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              {CLOUDINARY_CLOUD_NAME && (
                <button
                  type="button"
                  onClick={openCloudinaryWidget}
                  disabled={uploadingImg}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary border-2 border-background flex items-center justify-center hover:bg-primary/90 transition-colors"
                  title="Change photo"
                >
                  {uploadingImg
                    ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                    : <Camera className="w-3.5 h-3.5 text-white" />}
                </button>
              )}
            </div>
            <div className="pb-1 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold">{identity.name}</h2>
                <Badge variant="outline" className={`${cfg.bg} ${cfg.color} flex items-center gap-1 text-xs`}>
                  <RIcon className="w-3 h-3" />{cfg.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{identity.email}</p>
              {profile?.bio && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{profile.bio}</p>}
              <div className="mt-3 max-w-xs">
                <CompletenessBar score={completeness} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Tabs ── */}
      <Tabs defaultValue="basic">
        <TabsList className="mb-6 w-full sm:w-auto">
          <TabsTrigger value="basic"   className="gap-2"><User className="w-3.5 h-3.5" />Basic</TabsTrigger>
          <TabsTrigger value="contact" className="gap-2"><Phone className="w-3.5 h-3.5" />Contact</TabsTrigger>
          <TabsTrigger value="academic" className="gap-2"><BookOpen className="w-3.5 h-3.5" />Academic</TabsTrigger>
          <TabsTrigger value="notifs"  className="gap-2"><Bell className="w-3.5 h-3.5" />Notifications</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Lock className="w-3.5 h-3.5" />Security</TabsTrigger>
        </TabsList>

        {/* ── Basic info ── */}
        <TabsContent value="basic">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4 text-primary" />Basic Information</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5">
              <form onSubmit={basicForm.handleSubmit(onBasicSubmit)} noValidate className="space-y-5">
                <F label="Full Name" error={basicForm.formState.errors.name?.message}>
                  <Input placeholder="Your full name" {...basicForm.register("name")} className={basicForm.formState.errors.name ? "border-destructive" : ""} />
                </F>
                <F label="Bio" error={basicForm.formState.errors.bio?.message}>
                  <Textarea placeholder="Tell others a little about yourself…" rows={3} {...basicForm.register("bio")} className={basicForm.formState.errors.bio ? "border-destructive" : ""} />
                  <p className="text-xs text-muted-foreground">{(basicForm.watch("bio") ?? "").length}/500</p>
                </F>
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
                <Button type="submit" disabled={basicSaving || !basicForm.formState.isDirty} className="w-full">
                  {basicSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : <><Save className="w-4 h-4 mr-2" />Save Basic Info</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Contact ── */}
        <TabsContent value="contact">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Phone className="w-4 h-4 text-primary" />Contact Information</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5">
              <form onSubmit={contactForm.handleSubmit(onContactSubmit)} noValidate className="space-y-5">
                <F label="Phone Number" error={contactForm.formState.errors.phone?.message}>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-10" placeholder="+1 (555) 000-0000" {...contactForm.register("phone")} />
                  </div>
                </F>
                <F label="Address" error={contactForm.formState.errors.address?.message}>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Textarea className="pl-10 min-h-[70px]" placeholder="123 Main St, City, Country" {...contactForm.register("address")} rows={2} />
                  </div>
                </F>
                <F label="Website / Portfolio" error={contactForm.formState.errors.website?.message}>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-10" placeholder="https://yourwebsite.com" {...contactForm.register("website")} />
                  </div>
                </F>
                <Button type="submit" disabled={contactSaving || !contactForm.formState.isDirty} className="w-full">
                  {contactSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : <><Save className="w-4 h-4 mr-2" />Save Contact Info</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Academic info ── */}
        <TabsContent value="academic">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" />Academic Information</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5 space-y-5">
              <AcademicInfoEditor
                initial={profile?.academicInfo ?? {}}
                onSave={async (info) => {
                  const ok = await saveProfile({ academicInfo: info });
                  if (ok) notify?.({ type: "success", message: "Academic info saved!" });
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notification preferences ── */}
        <TabsContent value="notifs">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />Notification Preferences
                {prefsUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground ml-auto" />}
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5 space-y-5">
              {[
                { key: "emailLogin"    as const, label: "Login notifications",  desc: "Email me when a new sign-in is detected on my account" },
                { key: "emailApproval" as const, label: "Approval updates",     desc: "Email me when my registration or a student request is reviewed" },
                { key: "emailClasses" as const,  label: "Class announcements",  desc: "Email me when new classes are created or updated" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between gap-4 py-1">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    checked={notifPrefs[key]}
                    onCheckedChange={v => onPrefsChange(key, v)}
                    disabled={prefsUpdating}
                  />
                </div>
              ))}
              <p className="text-xs text-muted-foreground pt-2">
                Changes save automatically. SMTP must be configured on the server for emails to be delivered.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Security / change password ── */}
        <TabsContent value="security">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Lock className="w-4 h-4 text-primary" />Change Password</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5">
              <form onSubmit={pwForm.handleSubmit(onPwSubmit)} noValidate className="space-y-4 max-w-sm">
                <F label="Current Password" error={pwForm.formState.errors.currentPassword?.message}>
                  <div className="relative">
                    <Input type={showCurrent ? "text" : "password"} placeholder="••••••••" className="pr-10" {...pwForm.register("currentPassword")} />
                    <button type="button" onClick={() => setShowCurrent(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </F>
                <F label="New Password" error={pwForm.formState.errors.newPassword?.message}>
                  <div className="relative">
                    <Input type={showNew ? "text" : "password"} placeholder="Min 6 characters" className="pr-10" {...pwForm.register("newPassword")} />
                    <button type="button" onClick={() => setShowNew(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </F>
                <F label="Confirm New Password" error={pwForm.formState.errors.confirmPassword?.message}>
                  <Input type={showNew ? "text" : "password"} placeholder="Repeat new password" {...pwForm.register("confirmPassword")} />
                </F>

                {pwError && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4 shrink-0" />{pwError}
                  </div>
                )}
                {pwSuccess && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-green-500/10 border border-green-500/20 text-sm text-green-700 dark:text-green-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />Password changed successfully!
                  </div>
                )}

                <Button type="submit" disabled={pwSaving} className="w-full">
                  {pwSaving
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Changing…</>
                    : <><Lock className="w-4 h-4 mr-2" />Change Password</>}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Account Info</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">User ID</span>
                    <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{String(identity.id).slice(0, 12)}…</code>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Account type</span>
                    <span className="font-medium capitalize">{identity.role}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Academic info key-value editor ─────────────────────────────────────── */
type AcademicEntry = { key: string; value: string };

function AcademicInfoEditor({
  initial,
  onSave,
}: {
  initial: Record<string, string>;
  onSave: (info: Record<string, string>) => Promise<void>;
}) {
  const [entries, setEntries] = useState<AcademicEntry[]>(
    Object.entries(initial).map(([key, value]) => ({ key, value }))
  );
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty]   = useState(false);

  const update = (i: number, field: "key" | "value", val: string) => {
    setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e));
    setDirty(true);
  };
  const add    = () => { setEntries(prev => [...prev, { key: "", value: "" }]); setDirty(true); };
  const remove = (i: number) => { setEntries(prev => prev.filter((_, idx) => idx !== i)); setDirty(true); };

  const save = async () => {
    setSaving(true);
    const obj = Object.fromEntries(entries.filter(e => e.key.trim()).map(e => [e.key.trim(), e.value.trim()]));
    await onSave(obj);
    setSaving(false);
    setDirty(false);
  };

  const SUGGESTIONS = ["Institution", "Degree", "Major", "Year", "GPA", "Graduation Year", "Student ID"];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add academic details like your institution, degree, major, or any other relevant information.
      </p>

      {entries.length === 0 && (
        <div className="border border-dashed rounded-lg p-6 text-center">
          <BookOpen className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No academic info yet — click "Add Field" to begin.</p>
        </div>
      )}

      <div className="space-y-2">
        {entries.map((entry, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
            <Input
              list="academic-keys"
              placeholder="Field (e.g. Degree)"
              value={entry.key}
              onChange={e => update(i, "key", e.target.value)}
              className="text-sm"
            />
            <Input
              placeholder="Value"
              value={entry.value}
              onChange={e => update(i, "value", e.target.value)}
              className="text-sm"
            />
            <Button type="button" variant="ghost" size="icon" className="text-destructive h-8 w-8 shrink-0"
              onClick={() => remove(i)}>
              <span className="sr-only">Remove</span>✕
            </Button>
          </div>
        ))}
        <datalist id="academic-keys">
          {SUGGESTIONS.map(s => <option key={s} value={s} />)}
        </datalist>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={add}>+ Add Field</Button>
        <Button type="button" size="sm" onClick={save} disabled={saving || !dirty}>
          {saving ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Saving…</> : <><Save className="w-3.5 h-3.5 mr-2" />Save Academic Info</>}
        </Button>
      </div>
    </div>
  );
}
