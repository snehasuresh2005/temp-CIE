import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";

export default function FacultyInsights() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/insights?created_by=me", {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      toast({ title: "Error", description: "Title and description are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user?.id || "" },
        body: JSON.stringify({ title, description }),
      });
      if (res.ok) {
        setTitle("");
        setDescription("");
        fetchInsights();
        toast({ title: "Success", description: "Insight submitted" });
      } else {
        const err = await res.json();
        throw new Error(err.error);
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to submit insight", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Submit an Insight</CardTitle>
          <CardDescription>Share suggestions, report bugs, or request improvements for the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={submitting}
              maxLength={100}
            />
            <Textarea
              placeholder="Describe your insight or issue..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              disabled={submitting}
              maxLength={1000}
            />
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Insight"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Your Submitted Insights</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : insights.length === 0 ? (
            <div className="text-gray-500 text-sm">No insights submitted yet.</div>
          ) : (
            <div className="space-y-3">
              {insights.map(insight => (
                <div key={insight.id} className="border rounded p-3 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{insight.title}</div>
                    <Badge variant="outline">{insight.status}</Badge>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{insight.description}</div>
                  <div className="text-xs text-gray-400 mt-1">Submitted: {new Date(insight.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 