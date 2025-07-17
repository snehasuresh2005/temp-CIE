import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import StatusBarChart from "@/components/StatusBarChart";
import { BarChart3, CheckCircle, List, ShieldCheck, Clock } from "lucide-react";

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
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all");
  const [historyPage, setHistoryPage] = useState(1);
  const historyRowsPerPage = 8;

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

  // Pagination state for each tab (move below array definitions)
  const [pendingPage, setPendingPage] = useState(1);
  const [tasksPage, setTasksPage] = useState(1);
  const [finalPage, setFinalPage] = useState(1);
  const cardsPerPage = 5;
  // Paginated arrays
  const paginatedPending = pending.slice((pendingPage - 1) * cardsPerPage, pendingPage * cardsPerPage);
  const paginatedTasks = developerTasks.slice((tasksPage - 1) * cardsPerPage, tasksPage * cardsPerPage);
  const paginatedFinal = awaitingFinal.slice((finalPage - 1) * cardsPerPage, finalPage * cardsPerPage);
  const pendingTotalPages = Math.max(1, Math.ceil(pending.length / cardsPerPage));
  const tasksTotalPages = Math.max(1, Math.ceil(developerTasks.length / cardsPerPage));
  const finalTotalPages = Math.max(1, Math.ceil(awaitingFinal.length / cardsPerPage));

  // Filter and paginate history
  const filteredHistory = history.filter(insight => {
    const matchesSearch =
      historySearchTerm.trim() === "" ||
      insight.title.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      insight.description.toLowerCase().includes(historySearchTerm.toLowerCase());
    const matchesStatus =
      historyStatusFilter === "all" || insight.status === historyStatusFilter;
    return matchesSearch && matchesStatus;
  });
  const historyTotalPages = Math.max(1, Math.ceil(filteredHistory.length / historyRowsPerPage));
  const paginatedHistory = filteredHistory.slice(
    (historyPage - 1) * historyRowsPerPage,
    historyPage * historyRowsPerPage
  );
  // Reset page if filter/search changes
  useEffect(() => { setHistoryPage(1); }, [historySearchTerm, historyStatusFilter]);

  // Analytics
  const analytics = {
    total: insights.length,
    pending: pending.length,
    completed: history.filter(i => i.status === "COMPLETED").length,
    rejected: history.filter(i => i.status === "REJECTED").length,
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Card-style navigation */}
      <div className="flex flex-row gap-6 justify-center items-center my-6">
        {[ 
          { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'purple' },
          { id: 'pending', label: 'Awaiting Insights', icon: CheckCircle, color: 'blue' },
          { id: 'tasks', label: 'Tasks Assigned', icon: List, color: 'green' },
          { id: 'final-approval', label: 'Final Approval', icon: ShieldCheck, color: 'indigo' },
          { id: 'history', label: 'History', icon: Clock, color: 'orange' },
        ].map(tabObj => {
          const isActive = tab === tabObj.id;
          const colorClass = isActive
            ? `border-${tabObj.color}-500 bg-${tabObj.color}-50 ring-2 ring-${tabObj.color}-400 text-${tabObj.color}-600`
            : `border-gray-200 hover:border-${tabObj.color}-300 hover:bg-${tabObj.color}-50 bg-white text-gray-800`;
          return (
            <button
              key={tabObj.id}
              className={`flex flex-col items-center justify-center px-8 py-6 rounded-2xl border transition-all duration-200 shadow-sm min-w-[220px] max-w-[260px] h-[110px] text-center select-none ${colorClass}`}
              onClick={() => setTab(tabObj.id)}
            >
              <tabObj.icon className={`h-6 w-6 mb-1 ${isActive ? `text-${tabObj.color}-600` : `text-${tabObj.color}-400`}`} />
              <span className={`text-base font-medium ${isActive ? `text-${tabObj.color}-600` : 'text-gray-800'}`}>{tabObj.label}</span>
            </button>
          );
        })}
      </div>
      {/* Tab content with consistent top margin */}
      <div className="mt-2">
        {tab === "analytics" && (
          <Card>
            <CardHeader>
              <CardTitle>Insights Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Stat Cards Row - like lab/library coordinator */}
              <div className="flex flex-row flex-wrap gap-2 mb-6 justify-center">
                <div className="flex-1 min-w-[100px] max-w-[140px] bg-white rounded shadow-sm px-2 py-1 flex flex-col items-center justify-center text-center border border-gray-200">
                  <div className="text-xs text-gray-500 font-medium mb-0.5">Total</div>
                  <div className="text-lg font-bold leading-tight">{analytics.total}</div>
                </div>
                <div className="flex-1 min-w-[100px] max-w-[140px] bg-white rounded shadow-sm px-2 py-1 flex flex-col items-center justify-center text-center border border-gray-200">
                  <div className="text-xs text-gray-500 font-medium mb-0.5">Awaiting Insights</div>
                  <div className="text-lg font-bold leading-tight">{pending.length}</div>
                </div>
                <div className="flex-1 min-w-[100px] max-w-[140px] bg-white rounded shadow-sm px-2 py-1 flex flex-col items-center justify-center text-center border border-gray-200">
                  <div className="text-xs text-gray-500 font-medium mb-0.5">Final Approval</div>
                  <div className="text-lg font-bold leading-tight">{awaitingFinal.length}</div>
                </div>
                <div className="flex-1 min-w-[100px] max-w-[140px] bg-white rounded shadow-sm px-2 py-1 flex flex-col items-center justify-center text-center border border-gray-200">
                  <div className="text-xs text-gray-500 font-medium mb-0.5">Completed</div>
                  <div className="text-lg font-bold leading-tight">{analytics.completed}</div>
                </div>
              </div>
              {/* StatusBarChart remains below */}
              <StatusBarChart
                title=""
                data={[
                  { label: 'Pending', count: analytics.pending, color: '#FFC107' },
                  { label: 'Completed', count: analytics.completed, color: '#4CAF50' },
                  { label: 'Rejected', count: analytics.rejected, color: '#F44336' },
                ]}
              />
            </CardContent>
          </Card>
        )}
        {tab === "pending" && (
          <Card>
            <CardHeader>
              <CardTitle>Awaiting Insights</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <div>Loading...</div> : pending.length === 0 ? <div className="text-gray-500">No pending insights.</div> : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                  <table className="min-w-full text-base">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left font-bold text-gray-700">Title</th>
                        <th className="px-6 py-3 text-left font-bold text-gray-700">Description</th>
                        <th className="px-6 py-3 text-left font-bold text-gray-700">Status</th>
                        <th className="px-6 py-3 text-left font-bold text-gray-700">Submitted</th>
                        <th className="px-6 py-3 text-left font-bold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedPending.map(insight => (
                        <tr key={insight.id} className="border-t text-base">
                          <td className="px-6 py-3 align-top font-medium">{insight.title}</td>
                          <td className="px-6 py-3 align-top">{insight.description}</td>
                          <td className="px-6 py-3 align-top"><Badge variant="outline">{STATUS_LABELS[insight.status]}</Badge></td>
                          <td className="px-6 py-3 align-top">{new Date(insight.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-3 align-top">
                            <div className="flex flex-row items-center gap-2">
                              <Button size="sm" className="px-3 py-1" disabled={actionLoading} onClick={() => handleAction(insight.id, "approve")}>Approve</Button>
                              <Button size="sm" className="px-3 py-1" variant="destructive" disabled={actionLoading} onClick={() => handleAction(insight.id, "reject")}>Reject</Button>
                              <Input
                                placeholder="Rejection reason"
                                value={rejectionReasons[insight.id] || ""}
                                onChange={e => setRejectionReasons(prev => ({ ...prev, [insight.id]: e.target.value }))}
                                className="w-48"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-between items-center mt-4">
                    <Button size="sm" variant="outline" onClick={() => setPendingPage(p => Math.max(1, p - 1))} disabled={pendingPage === 1}>Previous</Button>
                    <span className="text-xs text-gray-600">Page {pendingPage} of {pendingTotalPages}</span>
                    <Button size="sm" variant="outline" onClick={() => setPendingPage(p => Math.min(pendingTotalPages, p + 1))} disabled={pendingPage === pendingTotalPages}>Next</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {tab === "final-approval" && (
          <Card>
            <CardHeader>
              <CardTitle>Final Approval (Developer Marked as Done)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <div>Loading...</div> : awaitingFinal.length === 0 ? <div className="text-gray-500">No tasks awaiting final approval.</div> : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                  <table className="min-w-full text-base">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left font-bold text-gray-700">Title</th>
                        <th className="px-6 py-3 text-left font-bold text-gray-700">Description</th>
                        <th className="px-6 py-3 text-left font-bold text-gray-700">Status</th>
                        <th className="px-6 py-3 text-left font-bold text-gray-700">Submitted</th>
                        <th className="px-6 py-3 text-left font-bold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedFinal.map(insight => (
                        <tr key={insight.id} className="border-t text-base">
                          <td className="px-6 py-3 align-top font-medium">{insight.title}</td>
                          <td className="px-6 py-3 align-top">{insight.description}</td>
                          <td className="px-6 py-3 align-top"><Badge variant="outline">{STATUS_LABELS[insight.status]}</Badge></td>
                          <td className="px-6 py-3 align-top">{new Date(insight.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-3 align-top">
                            <div className="flex flex-row items-center gap-2">
                              <Button size="sm" className="px-3 py-1" disabled={actionLoading} onClick={() => handleAction(insight.id, "complete")}>Approve</Button>
                              <Button size="sm" className="px-3 py-1" variant="destructive" disabled={actionLoading} onClick={() => handleAction(insight.id, "reject")}>Reject</Button>
                              <Input
                                placeholder="Rejection reason"
                                value={rejectionReasons[insight.id] || ""}
                                onChange={e => setRejectionReasons(prev => ({ ...prev, [insight.id]: e.target.value }))}
                                className="w-48"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-between items-center mt-4">
                    <Button size="sm" variant="outline" onClick={() => setFinalPage(p => Math.max(1, p - 1))} disabled={finalPage === 1}>Previous</Button>
                    <span className="text-xs text-gray-600">Page {finalPage} of {finalTotalPages}</span>
                    <Button size="sm" variant="outline" onClick={() => setFinalPage(p => Math.min(finalTotalPages, p + 1))} disabled={finalPage === finalTotalPages}>Next</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {tab === "tasks" && (
          <Card>
            <CardHeader>
              <CardTitle>Tasks Assigned</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <div>Loading...</div> : developerTasks.length === 0 ? <div className="text-gray-500">No tasks available for developers.</div> : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                  <table className="min-w-full text-base">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left font-bold text-gray-700">Title</th>
                        <th className="px-6 py-3 text-left font-bold text-gray-700">Description</th>
                        <th className="px-6 py-3 text-left font-bold text-gray-700">Status</th>
                        <th className="px-6 py-3 text-left font-bold text-gray-700">Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTasks.map(insight => (
                        <tr key={insight.id} className="border-t text-base">
                          <td className="px-6 py-3 align-top font-medium">{insight.title}</td>
                          <td className="px-6 py-3 align-top">{insight.description}</td>
                          <td className="px-6 py-3 align-top"><Badge variant="outline">{STATUS_LABELS[insight.status]}</Badge></td>
                          <td className="px-6 py-3 align-top">{new Date(insight.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-3 align-top">
                            
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-between items-center mt-4">
                    <Button size="sm" variant="outline" onClick={() => setTasksPage(p => Math.max(1, p - 1))} disabled={tasksPage === 1}>Previous</Button>
                    <span className="text-xs text-gray-600">Page {tasksPage} of {tasksTotalPages}</span>
                    <Button size="sm" variant="outline" onClick={() => setTasksPage(p => Math.min(tasksTotalPages, p + 1))} disabled={tasksPage === tasksTotalPages}>Next</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {tab === "history" && (
          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search and filter controls */}
              <div className="flex items-center space-x-4 mb-4">
                <Input
                  placeholder="Search by title or description..."
                  value={historySearchTerm || ''}
                  onChange={e => setHistorySearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={historyStatusFilter || 'all'}
                  onChange={e => setHistoryStatusFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              {/* Table */}
              <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                <table className="min-w-full text-base">
                  <thead>
                    <tr>
                      <th className="text-left font-bold text-gray-700 px-6 py-3">Title</th>
                      <th className="text-left font-bold text-gray-700 px-6 py-3">Description</th>
                      <th className="text-left font-bold text-gray-700 px-6 py-3">Status</th>
                      <th className="text-left font-bold text-gray-700 px-6 py-3">Date</th>
                      <th className="text-left font-bold text-gray-700 px-6 py-3">Rejection Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-400">No history found.</td>
                      </tr>
                    ) : (
                      paginatedHistory.map((insight) => (
                        <tr key={insight.id} className="border-t text-base">
                          <td className="px-6 py-3 align-top font-medium text-sm truncate">{insight.title}</td>
                          <td className="px-6 py-3 align-top text-sm truncate">{insight.description}</td>
                          <td className="px-6 py-3 align-top text-sm">
                            <Badge variant={insight.status === 'REJECTED' ? 'destructive' : 'outline'}>{STATUS_LABELS[insight.status]}</Badge>
                          </td>
                          <td className="px-6 py-3 align-top text-sm whitespace-nowrap">{new Date(insight.updated_at || insight.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-3 align-top text-sm text-red-600">{insight.status === 'REJECTED' && insight.rejection_reason ? insight.rejection_reason : '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {/* Pagination Controls */}
                <div className="flex justify-between items-center p-2 border-t bg-gray-50">
                  <button
                    className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    disabled={historyPage === 1}
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-600">
                    Page {historyPage} of {historyTotalPages}
                  </span>
                  <button
                    className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                    onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                    disabled={historyPage === historyTotalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 