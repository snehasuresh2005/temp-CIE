import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/auth-provider';
import { User as UserIcon, Pencil, X, Search, Filter } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const initialForm = {
  title: '',
  type: 'INTERN',
  description: '',
  startDate: '',
  endDate: '',
  applicationStartDate: '',
  applicationEndDate: '',
  remuneration: 'PAID',
  filePath: '',
  facultyInChargeId: '',
  capacity: 1,
};

interface Opportunity {
  id: string;
  title: string;
  type: string;
  description: string;
  startDate: string;
  endDate: string;
  applicationStartDate: string;
  applicationEndDate: string;
  remuneration: string;
  filePath?: string | null;
  facultyInChargeId: string;
  faculty?: { name?: string; user?: { name?: string; email?: string } };
  capacity: number;
  status: string;
  applications?: { length: number }[];
}

interface Faculty {
  id: string;
  userId: string;
  user: { name: string; email: string };
}

export default function ManageOpportunity() {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [facultyOptions, setFacultyOptions] = useState<Faculty[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const typeOptions = Array.from(new Set(opportunities.map(o => o.type)));
  const statusOptions = Array.from(new Set(opportunities.map(o => o.status)));

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch =
      opp.title.toLowerCase().includes(search.toLowerCase()) ||
      opp.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || opp.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || opp.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  useEffect(() => {
    fetch('/api/opportunities')
      .then(async res => {
        if (!res.ok) throw new Error('Failed to fetch opportunities');
        const text = await res.text();
        return text ? JSON.parse(text) : [];
      })
      .then((data: Opportunity[]) => setOpportunities(data))
      .catch(err => {
        setOpportunities([]);
        setError('Failed to load opportunities');
        console.error(err);
      });
    fetch('/api/faculty')
      .then(async res => {
        if (!res.ok) throw new Error('Failed to fetch faculty');
        const text = await res.text();
        return text ? JSON.parse(text) : { faculty: [] };
      })
      .then(data => setFacultyOptions(data.faculty || []))
      .catch(err => {
        setFacultyOptions([]);
        setError('Failed to load faculty');
        console.error(err);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.id ? { 'x-user-id': user.id } : {}),
        },
        body: JSON.stringify({ ...form, capacity: Number(form.capacity) }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to create');
      const newOpp: Opportunity = await res.json();
      setOpportunities([newOpp, ...opportunities]);
      setForm(initialForm);
      setShowForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/opportunities/${id}`, {
        method: 'DELETE',
        headers: {
          ...(user?.id ? { 'x-user-id': user.id } : {}),
        },
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete');
      setOpportunities(opportunities.filter(o => o.id !== id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setDeleteId(null);
    }
  };

  const handleEdit = (opp: Opportunity) => {
    setEditingId(opp.id);
    setForm({
      title: opp.title,
      type: opp.type,
      description: opp.description,
      startDate: opp.startDate,
      endDate: opp.endDate,
      applicationStartDate: opp.applicationStartDate,
      applicationEndDate: opp.applicationEndDate,
      remuneration: opp.remuneration,
      filePath: opp.filePath || '',
      facultyInChargeId: opp.facultyInChargeId,
      capacity: opp.capacity,
    });
    setShowForm(true);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/opportunities/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.id ? { 'x-user-id': user.id } : {}),
        },
        body: JSON.stringify({ ...form, capacity: Number(form.capacity) }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to update');
      const updatedOpp: Opportunity = await res.json();
      setOpportunities(opportunities.map(o => o.id === updatedOpp.id ? updatedOpp : o));
      setForm(initialForm);
      setShowForm(false);
      setEditingId(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format date as dd/mm/yyyy
  function formatDate(dateStr?: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB');
  }

  return (
    <div className="w-full p-0">
      <div className="flex justify-between items-center mb-6">
        <h2 className="admin-page-title">Opportunities</h2>
        <div className="flex gap-4">
          <button className="btn-edit" onClick={() => setEditMode(e => !e)}>
            {editMode ? 'Editing' : 'Edit Mode'}
          </button>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button onClick={() => setShowForm(true)} variant="default">
                Add New Opportunity
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl w-full">
              <DialogHeader>
                <DialogTitle>Add New Opportunity</DialogTitle>
              </DialogHeader>
              <form onSubmit={editingId ? handleUpdate : handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-medium">Title</label>
                  <Input name="title" value={form.title} onChange={handleChange} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium">Type</label>
                    <select name="type" value={form.type} onChange={handleChange} className="input w-full">
                      <option value="INTERN">Intern</option>
                      <option value="TA">TA</option>
                      <option value="RA">RA</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium">Remuneration</label>
                    <select name="remuneration" value={form.remuneration} onChange={handleChange} className="input w-full">
                      <option value="PAID">Paid</option>
                      <option value="UNPAID">Unpaid</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-medium">Description</label>
                  <Textarea name="description" value={form.description} onChange={handleChange} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium">Start Date</label>
                    <Input type="date" name="startDate" value={form.startDate} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className="block font-medium">End Date</label>
                    <Input type="date" name="endDate" value={form.endDate} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className="block font-medium">Application Start</label>
                    <Input type="date" name="applicationStartDate" value={form.applicationStartDate} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className="block font-medium">Application End</label>
                    <Input type="date" name="applicationEndDate" value={form.applicationEndDate} onChange={handleChange} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="facultyInChargeId">Faculty in charge</Label>
                    <Select
                      value={form.facultyInChargeId}
                      onValueChange={value => setForm(f => ({ ...f, facultyInChargeId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select faculty in charge" />
                      </SelectTrigger>
                      <SelectContent>
                        {facultyOptions.map(faculty => (
                          <SelectItem key={faculty.userId} value={faculty.userId}>
                            {faculty.user.name} ({faculty.user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block font-medium">Capacity</label>
                    <Input type="number" name="capacity" value={form.capacity} onChange={handleChange} min={1} required />
                  </div>
                </div>
                {error && <div className="text-red-600">{error}</div>}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="default" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Opportunity'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-4">All Opportunities</h3>
      <div className="flex flex-col md:flex-row md:items-center md:gap-4 gap-2 mb-6">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search opportunities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <Filter className="h-5 w-5 text-gray-400 mx-2 hidden md:inline-block" />
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          {typeOptions.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          {statusOptions.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full p-0">
        {filteredOpportunities.length === 0 && <div>No opportunities found.</div>}
        {filteredOpportunities.map((opp) => (
          <div key={opp.id} className="rounded-xl bg-blue-50 p-6 shadow-sm border border-blue-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-xl">{opp.title}</div>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${opp.type === 'INTERN' ? 'bg-blue-100 text-blue-700' : opp.type === 'TA' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{opp.type}</span>
            </div>
            <div className="text-gray-600 mb-3">{opp.description}</div>
            <div className="flex flex-col gap-1 text-sm mb-4">
              <div>
                <span className="font-medium">Application:</span>
                <span className="ml-1">{formatDate(opp.applicationStartDate)} - {formatDate(opp.applicationEndDate)}</span>
              </div>
              <div>
                <span className="font-medium">Capacity:</span>
                <span className="ml-1">{opp.capacity}</span>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <span className={`ml-1 ${opp.status === 'OPEN' ? 'text-green-600' : 'text-gray-600'}`}>{opp.status}</span>
              </div>
              <div>
                <span className="font-medium">Applicants:</span>
                <span className="ml-1">{opp.applications?.length ?? 0}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 text-sm mb-4 bg-white/60 rounded p-2">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{opp.faculty?.user?.name}</span>
              </div>
              <span className="text-gray-400 ml-6">{opp.faculty?.user?.email}</span>
            </div>
            {editMode && (
              <div className="flex gap-2 mt-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="btn-delete flex items-center gap-2" onClick={() => setDeleteId(opp.id)}>
                      <X className="h-5 w-5" /> Delete
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to delete this opportunity?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(deleteId!)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <button className="btn-edit flex items-center gap-2" onClick={() => handleEdit(opp)}>
                  <Pencil className="h-5 w-5" /> Edit
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 