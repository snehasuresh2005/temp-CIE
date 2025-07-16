import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";

const STATUS_LABELS: Record<string, string> = {
  APPROVED: "Assigned",
  IN_PROGRESS: "In Progress",
  DONE: "Awaiting Approval",
  COMPLETED: "Completed",
  REJECTED: "Rejected"
};

export default function DeveloperInsights() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState("analytics");
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/insights?developer_id=me", {
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
      const res = await fetch(`/api/insights/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-id": user?.id || "" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchInsights();
        toast({ title: "Success", description: `Insight marked as ${action}` });
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
  const awaiting = insights.filter(i => i.status === "APPROVED");
  const inProgress = insights.filter(i => i.status === "IN_PROGRESS" || i.status === "APPROVED" || i.status === "DONE");
  const rejected = insights.filter(i => i.status === "REJECTED");
  const history = insights.filter(i => ["COMPLETED"].includes(i.status));

  // Analytics
  const analytics = {
    total: insights.length,
    awaiting: awaiting.length,
    inProgress: inProgress.length,
    rejected: rejected.length,
    completed: history.filter(i => i.status === "COMPLETED").length,
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="mb-4">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="awaiting">Awaiting Approval</TabsTrigger>
          <TabsTrigger value="tasks">List of Tasks</TabsTrigger>
          <TabsTrigger value="rejected">Rejected Tasks</TabsTrigger>
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
                <div>Awaiting: <span className="font-bold">{analytics.awaiting}</span></div>
                <div>In Progress: <span className="font-bold">{analytics.inProgress}</span></div>
                <div>Rejected: <span className="font-bold">{analytics.rejected}</span></div>
                <div>Completed: <span className="font-bold">{analytics.completed}</span></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="awaiting">
          <Card>
            <CardHeader>
              <CardTitle>Awaiting Approval</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <div>Loading...</div> : awaiting.length === 0 ? <div className="text-gray-500">No insights awaiting action.</div> : (
                <div className="space-y-3">
                  {awaiting.map(insight => (
                    <div key={insight.id} className="border rounded p-3 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{insight.title}</div>
                        <Badge variant="outline">{STATUS_LABELS[insight.status]}</Badge>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{insight.description}</div>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" disabled={actionLoading} onClick={() => handleAction(insight.id, "start")}>Start</Button>
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
              <CardTitle>List of Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <div>Loading...</div> : inProgress.length === 0 ? <div className="text-gray-500">No assigned or in-progress tasks.</div> : (
                <div className="space-y-3">
                  {inProgress.map(insight => (
                    <div key={insight.id} className="border rounded p-3 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{insight.title}</div>
                        <Badge variant="outline">{STATUS_LABELS[insight.status]}</Badge>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{insight.description}</div>
                      {insight.status !== "DONE" && (
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" disabled={actionLoading} onClick={() => handleAction(insight.id, "done")}>Mark as Done</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <div>Loading...</div> : rejected.length === 0 ? <div className="text-gray-500">No rejected tasks.</div> : (
                <div className="space-y-3">
                  {rejected.map(insight => (
                    <div key={insight.id} className="border rounded p-3 bg-red-50">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{insight.title}</div>
                        <Badge variant="destructive">Rejected</Badge>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{insight.description}</div>
                      {insight.rejection_reason && (
                        <div className="text-xs text-red-600 mt-1 font-semibold">Reason: {insight.rejection_reason}</div>
                      )}
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