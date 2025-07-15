import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending Approval",
  APPROVED: "Assigned to Developer",
  IN_PROGRESS: "In Progress",
  DONE: "Awaiting Final Approval",
  COMPLETED: "Completed",
  REJECTED: "Rejected"
};

export default function PlatformManagerInsights() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState("analytics");
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReasons, setRejectionReasons] = useState<{ [id: string]: string }>({});

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/insights", {
        headers: { "x-user-id": user?.id || "" },
      });
      const data = await res.json();
      setInsights(data.insights || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load insights", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: string) => {
    setActionLoading(true);
    try {
      const body: any = { action };
      if (action === "reject" && rejectionReasons[id]) {
        body.rejection_reason = rejectionReasons[id];
      }
      const res = await fetch(`/api/insights/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-id": user?.id || "" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        fetchInsights();
        toast({ title: "Success", description: `Insight ${action}d` });
        setRejectionReasons(prev => ({ ...prev, [id]: "" }));
      } else {
        const err = await res.json();
        throw new Error(err.error);
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to update insight", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  // Tab filters
  const pending = insights.filter(i => i.status === "PENDING");
  const awaitingFinal = insights.filter(i => i.status === "DONE");
  const developerTasks = insights.filter(i => ["APPROVED", "IN_PROGRESS", "DONE"].includes(i.status));
  const history = insights.filter(i => ["COMPLETED", "REJECTED"].includes(i.status));

  // Analytics
  const analytics = {
    total: insights.length,
    pending: pending.length,
    completed: history.filter(i => i.status === "COMPLETED").length,
    rejected: history.filter(i => i.status === "REJECTED").length,
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="mb-4">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="pending">Awaiting Approval</TabsTrigger>
          <TabsTrigger value="tasks">List of Tasks</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Insights Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-8">
                <div>Total: <span className="font-bold">{analytics.total}</span></div>
                <div>Pending: <span className="font-bold">{analytics.pending}</span></div>
                <div>Completed: <span className="font-bold">{analytics.completed}</span></div>
                <div>Rejected: <span className="font-bold">{analytics.rejected}</span></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Awaiting Approval</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <div>Loading...</div> : pending.length === 0 ? <div className="text-gray-500">No pending insights.</div> : (
                <div className="space-y-3">
                  {pending.map(insight => (
                    <div key={insight.id} className="border rounded p-3 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{insight.title}</div>
                        <Badge variant="outline">{STATUS_LABELS[insight.status]}</Badge>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{insight.description}</div>
                      <div className="text-xs text-gray-400 mt-1">Submitted: {new Date(insight.created_at).toLocaleString()}</div>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" disabled={actionLoading} onClick={() => handleAction(insight.id, "approve")}>Approve</Button>
                        <Button size="sm" variant="destructive" disabled={actionLoading} onClick={() => handleAction(insight.id, "reject")}>Reject</Button>
                        <Input
                          placeholder="Rejection reason (optional)"
                          value={rejectionReasons[insight.id] || ""}
                          onChange={e => setRejectionReasons(prev => ({ ...prev, [insight.id]: e.target.value }))}
                          className="ml-2 w-64"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          {/* Awaiting Final Approval for DONE status */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Awaiting Final Approval (Developer Marked as Done)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <div>Loading...</div> : awaitingFinal.length === 0 ? <div className="text-gray-500">No tasks awaiting final approval.</div> : (
                <div className="space-y-3">
                  {awaitingFinal.map(insight => (
                    <div key={insight.id} className="border rounded p-3 bg-yellow-50">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{insight.title}</div>
                        <Badge variant="outline">{STATUS_LABELS[insight.status]}</Badge>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{insight.description}</div>
                      <div className="text-xs text-gray-400 mt-1">Marked done: {new Date(insight.updated_at).toLocaleString()}</div>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" disabled={actionLoading} onClick={() => handleAction(insight.id, "complete")}>Approve</Button>
                        <Button size="sm" variant="destructive" disabled={actionLoading} onClick={() => handleAction(insight.id, "reject")}>Reject</Button>
                        <Input
                          placeholder="Rejection reason (optional)"
                          value={rejectionReasons[insight.id] || ""}
                          onChange={e => setRejectionReasons(prev => ({ ...prev, [insight.id]: e.target.value }))}
                          className="ml-2 w-64"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>List of Tasks (Developer)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <div>Loading...</div> : developerTasks.length === 0 ? <div className="text-gray-500">No tasks assigned.</div> : (
                <div className="space-y-3">
                  {developerTasks.map(insight => (
                    <div key={insight.id} className="border rounded p-3 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{insight.title}</div>
                        <Badge variant="outline">{STATUS_LABELS[insight.status]}</Badge>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{insight.description}</div>
                      <div className="text-xs text-gray-400 mt-1">Assigned: {insight.developer_id || "Unassigned"}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <div>Loading...</div> : history.length === 0 ? <div className="text-gray-500">No history yet.</div> : (
                <div className="space-y-3">
                  {history.map(insight => (
                    <div key={insight.id} className="border rounded p-3 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{insight.title}</div>
                        <Badge variant="outline">{STATUS_LABELS[insight.status]}</Badge>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{insight.description}</div>
                      {insight.status === "REJECTED" && insight.rejection_reason && (
                        <div className="text-xs text-red-600 mt-1 font-semibold">Reason: {insight.rejection_reason}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">Submitted: {new Date(insight.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 