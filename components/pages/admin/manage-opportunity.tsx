import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/auth-provider';
import { User as UserIcon } from 'lucide-react';
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
    setForm({
      ...opp,
      startDate: opp.startDate?.slice(0, 10) || '',
      endDate: opp.endDate?.slice(0, 10) || '',
      applicationStartDate: opp.applicationStartDate?.slice(0, 10) || '',
      applicationEndDate: opp.applicationEndDate?.slice(0, 10) || '',
    });
    setEditingId(opp.id);
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

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Opportunities</h2>
        <Button onClick={() => setShowForm(f => !f)} variant="default">
          {showForm ? 'Cancel' : 'Add New Opportunity'}
        </Button>
      </div>
      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Opportunity' : 'Add New Opportunity'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingId ? handleUpdate : handleSubmit} className="space-y-4">
              <div>
                <label className="block font-medium">Title</label>
                <Input name="title" value={form.title} onChange={handleChange} required />
              </div>
              <div>
                <label className="block font-medium">Type</label>
                <select name="type" value={form.type} onChange={handleChange} className="input">
                  <option value="INTERN">Intern</option>
                  <option value="TA">TA</option>
                  <option value="RA">RA</option>
                </select>
              </div>
              <div>
                <label className="block font-medium">Description</label>
                <Textarea name="description" value={form.description} onChange={handleChange} required />
              </div>
              <div className="flex gap-4">
                <div>
                  <label className="block font-medium">Start Date</label>
                  <Input type="date" name="startDate" value={form.startDate} onChange={handleChange} required />
                </div>
                <div>
                  <label className="block font-medium">End Date</label>
                  <Input type="date" name="endDate" value={form.endDate} onChange={handleChange} required />
                </div>
              </div>
              <div className="flex gap-4">
                <div>
                  <label className="block font-medium">Application Start</label>
                  <Input type="date" name="applicationStartDate" value={form.applicationStartDate} onChange={handleChange} required />
                </div>
                <div>
                  <label className="block font-medium">Application End</label>
                  <Input type="date" name="applicationEndDate" value={form.applicationEndDate} onChange={handleChange} required />
                </div>
              </div>
              <div>
                <label className="block font-medium">Remuneration</label>
                <select name="remuneration" value={form.remuneration} onChange={handleChange} className="input">
                  <option value="PAID">Paid</option>
                  <option value="UNPAID">Unpaid</option>
                </select>
              </div>
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
                      <SelectItem key={faculty.id} value={faculty.user.id}>
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
              {error && <div className="text-red-600">{error}</div>}
              <Button type="submit" variant="default" disabled={loading}>
                {loading ? 'Creating...' : 'Create Opportunity'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
      <h3 className="text-xl font-semibold mb-2">All Opportunities</h3>
      <div className="space-y-4">
        {opportunities.length === 0 && <div>No opportunities found.</div>}
        {opportunities.map((opp) => {
          return (
            <Card key={opp.id} className="border p-4 rounded">
              <CardContent>
                <div className="font-bold text-lg">{opp.title} <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">{opp.type}</span></div>
                <div className="text-gray-600 mb-2">{opp.description}</div>
                <div className="flex items-center gap-2 text-sm mb-1">
                  <UserIcon className="h-4 w-4 text-gray-500" />
                  {opp.faculty?.user?.name && opp.faculty?.user?.email ? (
                    <span>{opp.faculty.user.name} <span className="text-gray-400">({opp.faculty.user.email})</span></span>
                  ) : (
                    <span>{opp.facultyInChargeId}</span>
                  )}
                </div>
                <div className="text-sm">Application Window: {opp.applicationStartDate?.slice(0,10)} to {opp.applicationEndDate?.slice(0,10)}</div>
                <div className="text-sm">Capacity: {opp.capacity}</div>
                <div className="text-sm">Applicants: {opp.applications?.length ?? 0}</div>
                <div className="text-sm">Status: {opp.status}</div>
                <div className="flex gap-2 mt-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteId(opp.id)}>Delete</Button>
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
                  <Button variant="secondary" size="sm" onClick={() => handleEdit(opp)}>Edit</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 