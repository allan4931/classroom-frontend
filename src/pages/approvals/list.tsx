import { useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Navigate } from "react-router";
import type { PendingRegistration } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  CheckCircle2, XCircle, Clock, Users, School, GraduationCap,
  Loader2, ChevronDown, ChevronUp, RefreshCw,
} from "lucide-react";
import { BACKEND_URL } from "@/constants";
import { getToken } from "@/providers/auth";

async function fetchPending(status: string): Promise<{ data: PendingRegistration[]; total: number }> {
  // Check what's in localStorage
  const rawToken = localStorage.getItem('nc_token');
  const secureToken = localStorage.getItem('nc_secure_nc_token');
  
  console.log('=== APPROVALS TOKEN DEBUG ===');
  console.log('Raw token:', rawToken);
  console.log('Secure token:', secureToken);
  
  // Try to decode secure token if it exists
  let actualToken = rawToken;
  if (!actualToken && secureToken) {
    try {
      actualToken = JSON.parse(atob(secureToken));
    } catch (e) {
      console.error('Failed to decode secure token:', e);
    }
  }
  
  console.log('Actual token:', actualToken ? 'exists' : 'missing');
  console.log('========================');
  
  if (!actualToken) {
    console.log('No token found, returning empty data');
    return { data: [], total: 0 };
  }
  
  console.log('APPROVALS PAGE - Fetching:', `${BACKEND_URL}/api/approvals?status=${status}&limit=50`);
  
  const res  = await fetch(`${BACKEND_URL}/api/approvals?status=${status}&limit=50`, {
    headers: { Authorization: `Bearer ${actualToken}` },
  });
  
  console.log('APPROVALS PAGE - Response status:', res.status);
  
  const json = await res.json();
  console.log('APPROVALS PAGE - Response data:', json);
  return { data: json.data ?? [], total: json.pagination?.total ?? 0 };
}

function ApplicantCard({
  item, onApprove, onReject, loading,
}: {
  item: PendingRegistration;
  onApprove: (id: string) => void;
  onReject:  (id: string, reason: string) => void;
  loading: boolean;
}) {
  const [expanded, setExpanded]   = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason]       = useState("");

  const initials = item.name.split(" ").filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join("");
  const isTeacher = item.role === "teacher";
  const date = new Date(item.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <>
      <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="pt-4 pb-4 px-5">
          <div className="flex items-start gap-4">
            <Avatar className="w-10 h-10 shrink-0">
              <AvatarFallback className={`text-sm font-bold ${isTeacher ? "bg-blue-500/10 text-blue-700" : "bg-green-500/10 text-green-700"}`}>
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <p className="font-semibold text-sm truncate">{item.name}</p>
                <Badge variant="outline" className={isTeacher ? "text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 text-xs" : "text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 text-xs"}>
                  {isTeacher ? <><School className="w-3 h-3 mr-1" />Teacher</> : <><GraduationCap className="w-3 h-3 mr-1" />Student</>}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">{item.email}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Applied {date}</p>
            </div>

            {item.status === "pending" && (
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => onApprove(item.id)} disabled={loading}>
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Approve</>}
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
                  onClick={() => setRejectOpen(true)} disabled={loading}>
                  <XCircle className="w-3.5 h-3.5 mr-1" />Reject
                </Button>
              </div>
            )}

            {item.status !== "pending" && (
              <Badge variant={item.status === "approved" ? "default" : "secondary"} className="text-xs shrink-0">
                {item.status === "approved" ? <><CheckCircle2 className="w-3 h-3 mr-1" />Approved</> : <><XCircle className="w-3 h-3 mr-1" />Rejected</>}
              </Badge>
            )}
          </div>

          {/* Expandable notes */}
          {item.notes && (
            <div className="mt-3 border-t pt-3">
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setExpanded(e => !e)}>
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                Applicant notes
              </button>
              {expanded && (
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded-md p-3">
                  {item.notes}
                </p>
              )}
            </div>
          )}

          {item.rejectionReason && (
            <div className="mt-2 text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-2">
              <span className="font-medium text-destructive">Rejection reason:</span> {item.rejectionReason}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejection dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Rejecting <strong>{item.name}</strong>'s application. You can provide an optional reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Textarea
              placeholder="Optional: explain why this application was rejected…"
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { onReject(item.id, reason); setRejectOpen(false); }}>
              <XCircle className="w-4 h-4 mr-2" />Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function ApprovalsPage() {
  const { isAdmin } = useCurrentUser();
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingList, setPendingList]   = useState<PendingRegistration[] | null>(null);
  const [approvedList, setApprovedList] = useState<PendingRegistration[] | null>(null);
  const [rejectedList, setRejectedList] = useState<PendingRegistration[] | null>(null);
  const [totals, setTotals] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [pageLoading, setPageLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  if (!isAdmin) return <Navigate to="/" replace />;

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async (tab: string) => {
    setPageLoading(true);
    try {
      const { data, total } = await fetchPending(tab);
      setTotals(t => ({ ...t, [tab]: total }));
      if (tab === "pending")  setPendingList(data);
      if (tab === "approved") setApprovedList(data);
      if (tab === "rejected") setRejectedList(data);
    } catch { showToast("Failed to load registrations.", "error"); }
    finally  { setPageLoading(false); }
  };

  // Load on first render and tab switch
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const map: Record<string, PendingRegistration[] | null> = {
      pending: pendingList, approved: approvedList, rejected: rejectedList,
    };
    if (!map[tab]) load(tab);
  };

  // Initial load
  if (pendingList === null && !pageLoading) load("pending");

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      // Get token the same way as fetchPending
      const rawToken = localStorage.getItem('nc_token');
      const secureToken = localStorage.getItem('nc_secure_nc_token');
      
      let actualToken = rawToken;
      if (!actualToken && secureToken) {
        try {
          actualToken = JSON.parse(atob(secureToken));
        } catch (e) {
          console.error('Failed to decode secure token:', e);
        }
      }
      
      if (!actualToken) {
        showToast("No authentication token found.", "error");
        return;
      }
      
      const res  = await fetch(`${BACKEND_URL}/api/approvals/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${actualToken}` },
      });
      const json = await res.json();
      if (!res.ok) { showToast(json.error ?? "Approval failed.", "error"); return; }
      showToast(json.data?.message ?? "Approved!", "success");
      // Refresh pending list
      setPendingList(null);
      setApprovedList(null);
      load("pending");
    } catch { showToast("Network error.", "error"); }
    finally  { setActionLoading(null); }
  };

  const handleReject = async (id: string, reason: string) => {
    setActionLoading(id);
    try {
      // Get token the same way as fetchPending
      const rawToken = localStorage.getItem('nc_token');
      const secureToken = localStorage.getItem('nc_secure_nc_token');
      
      let actualToken = rawToken;
      if (!actualToken && secureToken) {
        try {
          actualToken = JSON.parse(atob(secureToken));
        } catch (e) {
          console.error('Failed to decode secure token:', e);
        }
      }
      
      if (!actualToken) {
        showToast("No authentication token found.", "error");
        return;
      }
      
      const res  = await fetch(`${BACKEND_URL}/api/approvals/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${actualToken}` },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json();
      if (!res.ok) { showToast(json.error ?? "Rejection failed.", "error"); return; }
      showToast("Registration rejected.", "success");
      setPendingList(null);
      setRejectedList(null);
      load("pending");
    } catch { showToast("Network error.", "error"); }
    finally  { setActionLoading(null); }
  };

  const currentList = activeTab === "pending" ? pendingList : activeTab === "approved" ? approvedList : rejectedList;

  return (
    <div className="container mx-auto max-w-3xl px-4 pb-12">
      <div className="py-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Approval Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">Review and approve pending teacher and student registrations.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setPendingList(null); setApprovedList(null); setRejectedList(null); load("pending"); }} disabled={pageLoading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${pageLoading ? "animate-spin" : ""}`} />Refresh
        </Button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${toast.type === "success" ? "bg-green-500/10 border border-green-500/20 text-green-700" : "bg-destructive/10 border border-destructive/20 text-destructive"}`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6 w-full">
          <TabsTrigger value="pending" className="flex-1 gap-2">
            <Clock className="w-3.5 h-3.5" />
            Pending
            {totals.pending > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                {totals.pending}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex-1 gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" />Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex-1 gap-2">
            <XCircle className="w-3.5 h-3.5" />Rejected
          </TabsTrigger>
        </TabsList>

        {(["pending", "approved", "rejected"] as const).map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-3 mt-0">
            {pageLoading && activeTab === tab ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
              </div>
            ) : !currentList?.length ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  {tab === "pending" ? <Clock className="w-6 h-6 text-muted-foreground/40" /> : <Users className="w-6 h-6 text-muted-foreground/40" />}
                </div>
                <p className="text-sm text-muted-foreground">
                  {tab === "pending" ? "No pending registrations." : tab === "approved" ? "No approved registrations yet." : "No rejected registrations."}
                </p>
              </div>
            ) : (
              currentList.map(item => (
                <ApplicantCard
                  key={item.id}
                  item={item}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  loading={actionLoading === item.id}
                />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
