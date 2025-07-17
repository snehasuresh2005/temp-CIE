import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import StatusBarChart from "@/components/StatusBarChart";
import { BarChart3, ClipboardCheck, List, XCircle, Clock } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  APPROVED: "Assigned",
  IN_PROGRESS: "In Progress",
  DONE: "Awaiting Approval",
  COMPLETED: "Completed",
  REJECTED: "Rejected"
};

export default function DeveloperFeedbacks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState("analytics");
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all");
  const [historyPage, setHistoryPage] = useState(1);
  const historyRowsPerPage = 8;
  const [resubmittingId, setResubmittingId] = useState<string | null>(null);
  const [resubmittedIds, setResubmittedIds] = useState<string[]>([]);

  // Tab filters
  const awaiting = feedbacks.filter(i => i.status === "APPROVED");
  const inProgress = feedbacks.filter(i => i.status === "IN_PROGRESS" || i.status === "APPROVED" || i.status === "DONE");
  const rejected = feedbacks.filter(i => i.status === "REJECTED");
  const history = feedbacks.filter(i => ["COMPLETED"].includes(i.status));

  // Combine rejected and in-progress/approved tasks for unified pagination
  const combinedTasks = [...rejected, ...inProgress];
  const [tasksPage, setTasksPage] = useState(1);
  const cardsPerPage = 5;
  const tasksTotalPages = Math.max(1, Math.ceil(combinedTasks.length / cardsPerPage));
  const paginatedTasks = combinedTasks.slice((tasksPage - 1) * cardsPerPage, tasksPage * cardsPerPage);

  // Pagination for rejected tasks
  const [rejectedPage, setRejectedPage] = useState(1);
  const rejectedCardsPerPage = 5;
  const rejectedTotalPages = Math.max(1, Math.ceil(rejected.length / rejectedCardsPerPage));
  const paginatedRejected = rejected.slice((rejectedPage - 1) * rejectedCardsPerPage, rejectedPage * rejectedCardsPerPage);

  // Add a helper for image preview
  function ImagePreview({ src }: { src?: string }) {
    if (!src) return null;
    return (
      <a href={src} target="_blank" rel="noopener noreferrer">
        <img src={src} alt="Screenshot" className="h-12 w-12 object-cover rounded border hover:scale-150 transition-transform duration-200" />
      </a>
    );
  }

  // Add state for rectified image upload
  const [rectifiedImage, setRectifiedImage] = useState<File | null>(null);
  const [rectifiedImagePreview, setRectifiedImagePreview] = useState<string | null>(null);
  const [rectifiedForId, setRectifiedForId] = useState<string | null>(null);

  const handleRectifiedImageChange = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0] || null;
    setRectifiedImage(file);
    setRectifiedForId(id);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setRectifiedImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setRectifiedImagePreview(null);
    }
  };

  const handleMarkDoneWithImage = async (id: string) => {
    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append("action", "done");
      if (rectifiedImage && rectifiedForId === id) {
        formData.append("rectifiedImage", rectifiedImage);
      }
      const res = await fetch(`/api/feedbacks/${id}`, {
        method: "PATCH",
        headers: { "x-user-id": user?.id || "" },
        body: formData,
      });
      if (res.ok) {
        fetchFeedbacks();
        toast({ title: "Success", description: `Feedback marked as done` });
        setRectifiedImage(null);
        setRectifiedImagePreview(null);
        setRectifiedForId(null);
      } else {
        const err = await res.json();
        throw new Error(err.error);
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to update feedback", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/feedbacks?developer_id=me", {
        headers: { "x-user-id": user?.id || "" },
      });
      const data = await res.json();
      setFeedbacks(data.feedbacks || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load feedbacks", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: string) => {
    if (action === "done" && rejected.some(i => i.id === id)) {
      setResubmittingId(id);
      setResubmittedIds(prev => [...prev, id]);
      // Actually update the status to DONE in the backend
      // Do not return early; let the PATCH request proceed
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/feedbacks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-id": user?.id || "" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchFeedbacks();
        toast({ title: "Success", description: `Feedback marked as ${action}` });
      } else {
        const err = await res.json();
        throw new Error(err.error);
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to update feedback", variant: "destructive" });
    } finally {
      setActionLoading(false);
      setResubmittingId(null);
    }
  };

  // Analytics
  const analytics = {
    total: feedbacks.length,
    awaiting: awaiting.length,
    inProgress: inProgress.length,
    rejected: rejected.length,
    completed: history.filter(i => i.status === "COMPLETED").length,
  };

  // Filter and paginate history
  const filteredHistory = history.filter(feedback => {
    const matchesSearch =
      historySearchTerm.trim() === "" ||
      feedback.title.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      feedback.description.toLowerCase().includes(historySearchTerm.toLowerCase());
    const matchesStatus =
      historyStatusFilter === "all" || feedback.status === historyStatusFilter;
    return matchesSearch && matchesStatus;
  });
  const historyTotalPages = Math.max(1, Math.ceil(filteredHistory.length / historyRowsPerPage));
  const paginatedHistory = filteredHistory.slice(
    (historyPage - 1) * historyRowsPerPage,
    historyPage * historyRowsPerPage
  );
  // Reset page if filter/search changes
  useEffect(() => { setHistoryPage(1); }, [historySearchTerm, historyStatusFilter]);

  return (
    <div className="space-y-6">
      {/* Card-style navigation */}
      <div className="flex flex-row gap-6 justify-center items-center my-6">
        {[ 
          { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'purple' },
          { id: 'tasks', label: 'List of Tasks', icon: List, color: 'green' },
          { id: 'rejected', label: 'Rejected Tasks', icon: XCircle, color: 'red' },
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
        {tab === 'analytics' && (
          <Card>
            <CardHeader>
              <CardTitle>Feedbacks Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Stat Cards Row - match PM dashboard style */}
              <div className="flex flex-row flex-wrap gap-2 mb-6 justify-center">
                <div className="flex-1 min-w-[100px] max-w-[140px] bg-white rounded shadow-sm px-2 py-1 flex flex-col items-center justify-center text-center border border-gray-200">
                  <div className="text-xs text-gray-500 font-medium mb-0.5">Total</div>
                  <div className="text-lg font-bold leading-tight">{analytics.total}</div>
                </div>
                <div className="flex-1 min-w-[100px] max-w-[140px] bg-white rounded shadow-sm px-2 py-1 flex flex-col items-center justify-center text-center border border-gray-200">
                  <div className="text-xs text-gray-500 font-medium mb-0.5">In Progress</div>
                  <div className="text-lg font-bold leading-tight">{analytics.inProgress}</div>
                </div>
                <div className="flex-1 min-w-[100px] max-w-[140px] bg-white rounded shadow-sm px-2 py-1 flex flex-col items-center justify-center text-center border border-gray-200">
                  <div className="text-xs text-gray-500 font-medium mb-0.5">Rejected</div>
                  <div className="text-lg font-bold leading-tight">{analytics.rejected}</div>
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
                  { label: 'In Progress', count: analytics.inProgress, color: '#2196F3' },
                  { label: 'Completed', count: analytics.completed, color: '#4CAF50' },
                  { label: 'Rejected', count: analytics.rejected, color: '#F44336' },
                ]}
              />
            </CardContent>
          </Card>
        )}
        {tab === 'tasks' && (
          <Card>
            <CardHeader>
              <CardTitle>List of Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <div>Loading...</div> : combinedTasks.length === 0 ? <div className="text-gray-500">No available tasks.</div> : (
                <>
                  <div className="space-y-3">
                    {paginatedTasks.map(feedback => (
                      feedback.status === 'REJECTED' ? (
                        <div key={feedback.id} className="border-2 border-red-400 rounded p-3 bg-red-50">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{feedback.title}</div>
                            <div className="flex gap-2 items-center">
                              <Badge variant="destructive">Rejected</Badge>
                              {resubmittedIds.includes(feedback.id) && <Badge className="bg-yellow-400 text-black">Resubmitted</Badge>}
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">{feedback.description}</div>
                          <div className="mt-2"><ImagePreview src={feedback.image} /></div>
                          {feedback.rejection_reason && (
                            <div className="text-xs text-red-600 mt-1 font-semibold">Reason: {feedback.rejection_reason}</div>
                          )}
                          <div className="flex gap-2 mt-2 items-center">
                            {!(resubmittedIds.includes(feedback.id)) && (
                              <>
                                <input type="file" accept="image/*" onChange={e => handleRectifiedImageChange(e, feedback.id)} />
                                {rectifiedImagePreview && rectifiedForId === feedback.id && (
                                  <img src={rectifiedImagePreview} alt="Rectified Preview" className="h-12 w-12 object-cover rounded border" />
                                )}
                                <Button size="sm" disabled={actionLoading || resubmittingId === feedback.id} onClick={() => handleMarkDoneWithImage(feedback.id)}>Resubmit as Done</Button>
                              </>
                            )}
                            {resubmittingId === feedback.id && <span className="text-xs text-red-500 ml-2 animate-pulse">Resubmitting...</span>}
                          </div>
                        </div>
                      ) : (
                        <div key={feedback.id} className="border rounded p-3 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{feedback.title}</div>
                            <Badge variant="outline">{STATUS_LABELS[feedback.status]}</Badge>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">{feedback.description}</div>
                          <div className="mt-2"><ImagePreview src={feedback.image} /></div>
                          {feedback.status !== "DONE" && feedback.status !== "COMPLETED" && (
                            <div className="flex gap-2 mt-2 items-center">
                              <input type="file" accept="image/*" onChange={e => handleRectifiedImageChange(e, feedback.id)} />
                              {rectifiedImagePreview && rectifiedForId === feedback.id && (
                                <img src={rectifiedImagePreview} alt="Rectified Preview" className="h-12 w-12 object-cover rounded border" />
                              )}
                              <Button size="sm" disabled={actionLoading} onClick={() => handleMarkDoneWithImage(feedback.id)}>Mark as Done</Button>
                            </div>
                          )}
                        </div>
                      )
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <Button size="sm" variant="outline" onClick={() => setTasksPage(p => Math.max(1, p - 1))} disabled={tasksPage === 1}>Previous</Button>
                    <span className="text-xs text-gray-600">Page {tasksPage} of {tasksTotalPages}</span>
                    <Button size="sm" variant="outline" onClick={() => setTasksPage(p => Math.min(tasksTotalPages, p + 1))} disabled={tasksPage === tasksTotalPages}>Next</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
        {tab === 'rejected' && (
          <Card>
            <CardHeader>
              <CardTitle>Rejected Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <div>Loading...</div> : rejected.length === 0 ? <div className="text-gray-500">No rejected tasks.</div> : (
                <>
                  <div className="space-y-3">
                    {paginatedRejected.map(feedback => (
                      <div key={feedback.id} className="border rounded p-3 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{feedback.title}</div>
                          <Badge variant="outline">{STATUS_LABELS[feedback.status]}</Badge>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{feedback.description}</div>
                        {feedback.rejection_reason && (
                          <div className="text-xs text-red-600 mt-1 font-semibold">Reason: {feedback.rejection_reason}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <Button size="sm" variant="outline" onClick={() => setRejectedPage(p => Math.max(1, p - 1))} disabled={rejectedPage === 1}>Previous</Button>
                    <span className="text-xs text-gray-600">Page {rejectedPage} of {rejectedTotalPages}</span>
                    <Button size="sm" variant="outline" onClick={() => setRejectedPage(p => Math.min(rejectedTotalPages, p + 1))} disabled={rejectedPage === rejectedTotalPages}>Next</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
        {tab === 'history' && (
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
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left font-bold text-gray-700 px-4 py-3">Title</th>
                      <th className="text-left font-bold text-gray-700 px-4 py-3">Description</th>
                      <th className="text-left font-bold text-gray-700 px-4 py-3">Screenshot</th>
                      <th className="text-left font-bold text-gray-700 px-4 py-3">Rectified Screenshot</th>
                      <th className="text-left font-bold text-gray-700 px-4 py-3">Status</th>
                      <th className="text-left font-bold text-gray-700 px-4 py-3">Date</th>
                      <th className="text-left font-bold text-gray-700 px-4 py-3">Rejection Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedHistory.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-400">No history found.</td>
                      </tr>
                    ) : (
                      paginatedHistory.map((feedback) => (
                        <tr key={feedback.id} className="border-t">
                          <td className="px-4 py-3 align-top font-medium text-sm truncate">{feedback.title}</td>
                          <td className="px-4 py-3 align-top text-sm truncate">{feedback.description}</td>
                          <td className="px-4 py-3 align-top"><ImagePreview src={feedback.image} /></td>
                          <td className="px-4 py-3 align-top"><ImagePreview src={feedback.rectifiedImage} /></td>
                          <td className="px-4 py-3 align-top text-sm">
                            <Badge variant={feedback.status === 'REJECTED' ? 'destructive' : 'outline'}>{STATUS_LABELS[feedback.status]}</Badge>
                          </td>
                          <td className="px-4 py-3 align-top text-sm whitespace-nowrap">{new Date(feedback.updated_at || feedback.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3 align-top text-sm text-red-600">{feedback.status === 'REJECTED' && feedback.rejection_reason ? feedback.rejection_reason : '-'}</td>
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