import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

export default function FacultyFeedbacks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const cardsPerPage = 2;
  const totalPages = Math.max(1, Math.ceil(feedbacks.length / cardsPerPage));
  const paginatedFeedbacks = feedbacks.slice((page - 1) * cardsPerPage, page * cardsPerPage);

  // Static sidebar section names for now (replace with dynamic if available)
  const sidebarSections = [
    "Dashboard",
    "Courses",
    "Lab Components",
    "Library",
    "Locations",
    "Project Management",
    "Feedbacks",
    "Settings"
  ];

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/feedbacks?created_by=me", {
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !category) {
      toast({ title: "Error", description: "Title, description, and category are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      if (image) formData.append("image", image);
      const res = await fetch("/api/feedbacks", {
        method: "POST",
        headers: { "x-user-id": user?.id || "" },
        body: formData,
      });
      if (res.ok) {
        setTitle("");
        setDescription("");
        setCategory("");
        setImage(null);
        setImagePreview(null);
        fetchFeedbacks();
        toast({ title: "Success", description: "Feedback submitted" });
      } else {
        const err = await res.json();
        throw new Error(err.error);
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to submit feedback", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-12 max-w-2xl w-full mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Submit a Feedback</CardTitle>
          <CardDescription>Share suggestions, report bugs, or request improvements for the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  disabled={submitting}
                  maxLength={100}
                />
              </div>
              <div className="flex-1">
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  disabled={submitting}
                  required
                >
                  <option value="">Select Category</option>
                  {sidebarSections.map(section => (
                    <option key={section} value={section}>{section}</option>
                  ))}
                </select>
              </div>
            </div>
            <Textarea
              placeholder="Describe your feedback or issue..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              disabled={submitting}
              maxLength={1000}
            />
            <div>
              <label className="block text-sm font-medium mb-1">Upload Screenshot (optional)</label>
              <div className="flex items-center gap-2">
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={submitting}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={submitting}
                >
                  <Upload className="h-4 w-4" /> Upload
                </Button>
                <span className="text-xs text-gray-500">{image ? image.name : "No file chosen"}</span>
              </div>
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="mt-2 max-h-40 rounded border" />
              )}
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="primary" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 