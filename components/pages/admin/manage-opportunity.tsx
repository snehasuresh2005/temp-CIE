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
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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
  facultyId: '',
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
  facultyId: string;
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
  const [editMode, setEditMode] = useState(false);
  const [tab, setTab] = useState<'all' | 'TA' | 'INTERN' | 'RA'>('all');
  const [remunerationFilter, setRemunerationFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');

  useEffect(() => {
    fetch('/api/opportunities')
      .then(res => res.json())
      .then((data: Opportunity[]) => setOpportunities(data));
    fetch('/api/faculty')
      .then(res => res.json())
      .then(data => setFacultyOptions(data.faculty || []));
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
      filePath: opp.filePath || '',
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
    <div className="p-4">
      <Tabs value={tab} onValueChange={v => setTab(v as 'all' | 'TA' | 'INTERN' | 'RA')} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Opportunities</TabsTrigger>
          <TabsTrigger value="TA">TA</TabsTrigger>
          <TabsTrigger value="INTERN">Intern</TabsTrigger>
          <TabsTrigger value="RA">RA</TabsTrigger>
        </TabsList>
        <div className="flex items-center mb-4">
          <label className="mr-2 font-medium">Filter by Remuneration:</label>
          <select
            className="input w-32"
            value={remunerationFilter}
            onChange={e => setRemunerationFilter(e.target.value as 'ALL' | 'PAID' | 'UNPAID')}
          >
            <option value="ALL">All</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
          </select>
        </div>
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogTrigger asChild>
          <Button variant="default">
            Add New Opportunity
        </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <Card className="mb-0 shadow-none border-none">
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
                  <label className="block font-medium">Description</label>
                  <Textarea name="description" value={form.description} onChange={handleChange} required />
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
                <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="facultyId">Faculty</Label>
                <Select
                  value={form.facultyId}
                  onValueChange={value => setForm(f => ({ ...f, facultyId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    {facultyOptions.map(faculty => (
                      <SelectItem key={faculty.id} value={faculty.id}>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium">Start Date</label>
                    <Input type="date" name="startDate" value={form.startDate} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className="block font-medium">End Date</label>
                    <Input type="date" name="endDate" value={form.endDate} onChange={handleChange} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium">Application Start Date</label>
                    <Input type="date" name="applicationStartDate" value={form.applicationStartDate} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className="block font-medium">Application End Date</label>
                    <Input type="date" name="applicationEndDate" value={form.applicationEndDate} onChange={handleChange} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium">File Path</label>
                    <Input name="filePath" value={form.filePath} onChange={handleChange} />
                  </div>
              </div>
              {error && <div className="text-red-600">{error}</div>}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
              <Button type="submit" variant="default" disabled={loading}>
                    {editingId ? (loading ? 'Updating...' : 'Update Opportunity') : (loading ? 'Creating...' : 'Create Opportunity')}
              </Button>
                </div>
            </form>
          </CardContent>
        </Card>
        </DialogContent>
      </Dialog>
      <Button
        variant={editMode ? "default" : "outline"}
        onClick={() => setEditMode((v) => !v)}
      >
        {editMode ? "Editing..." : "Edit Mode"}
      </Button>
      <TabsContent value="all">
        <h3 className="text-xl font-semibold mb-2">All Opportunities</h3>
        <div className="flex flex-col items-start gap-4">
          {opportunities.filter(opp =>
            (remunerationFilter === 'ALL' || opp.remuneration === remunerationFilter)
          ).length === 0 && <div>No opportunities found.</div>}
          {opportunities.filter(opp =>
            (remunerationFilter === 'ALL' || opp.remuneration === remunerationFilter)
          ).map((opp) => (
            <div key={opp.id} className="admin-card">
              <div className="font-bold text-lg">{opp.title} <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">{opp.type}</span></div>
              <div className="text-gray-600 mb-2">{opp.description}</div>
              <div className="flex items-center gap-2 text-sm mb-1">
                <UserIcon className="h-4 w-4 text-gray-500" />
                {opp.faculty?.user?.name && opp.faculty?.user?.email ? (
                  <span>{opp.faculty.user.name} <span className="text-gray-400">({opp.faculty.user.email})</span></span>
                ) : (
                  <span>{opp.facultyId}</span>
                )}
              </div>
              <div className="text-sm">Application Window: {opp.applicationStartDate?.slice(0,10)} to {opp.applicationEndDate?.slice(0,10)}</div>
              <div className="text-sm">Capacity: {opp.capacity}</div>
              <div className="text-sm">Applicants: {opp.applications?.length ?? 0}</div>
              <div className="text-sm">Status: {opp.status}</div>
              {editMode && (
                <div className="flex gap-2 mt-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="btn-delete" onClick={() => setDeleteId(opp.id)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{marginRight: 6}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        Delete
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
                  <button className="btn-edit" onClick={() => handleEdit(opp)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{marginRight: 6}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm-6 6v-2a2 2 0 012-2h2" /></svg>
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="TA">
        <h3 className="text-xl font-semibold mb-2">TA Opportunities</h3>
        <div className="flex flex-col items-start gap-4">
          {opportunities.filter(opp =>
            opp.type === 'TA' && (remunerationFilter === 'ALL' || opp.remuneration === remunerationFilter)
          ).length === 0 && <div>No opportunities found.</div>}
          {opportunities.filter(opp =>
            opp.type === 'TA' && (remunerationFilter === 'ALL' || opp.remuneration === remunerationFilter)
          ).map((opp) => (
            <div key={opp.id} className="admin-card">
              <div className="font-bold text-lg">{opp.title} <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">{opp.type}</span></div>
              <div className="text-gray-600 mb-2">{opp.description}</div>
              <div className="flex items-center gap-2 text-sm mb-1">
                <UserIcon className="h-4 w-4 text-gray-500" />
                {opp.faculty?.user?.name && opp.faculty?.user?.email ? (
                  <span>{opp.faculty.user.name} <span className="text-gray-400">({opp.faculty.user.email})</span></span>
                ) : (
                  <span>{opp.facultyId}</span>
                )}
              </div>
              <div className="text-sm">Application Window: {opp.applicationStartDate?.slice(0,10)} to {opp.applicationEndDate?.slice(0,10)}</div>
              <div className="text-sm">Capacity: {opp.capacity}</div>
              <div className="text-sm">Applicants: {opp.applications?.length ?? 0}</div>
              <div className="text-sm">Status: {opp.status}</div>
              {editMode && (
                <div className="flex gap-2 mt-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="btn-delete" onClick={() => setDeleteId(opp.id)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{marginRight: 6}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        Delete
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
                  <button className="btn-edit" onClick={() => handleEdit(opp)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{marginRight: 6}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm-6 6v-2a2 2 0 012-2h2" /></svg>
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="INTERN">
        <h3 className="text-xl font-semibold mb-2">Intern Opportunities</h3>
        <div className="flex flex-col items-start gap-4">
          {opportunities.filter(opp =>
            opp.type === 'INTERN' && (remunerationFilter === 'ALL' || opp.remuneration === remunerationFilter)
          ).length === 0 && <div>No opportunities found.</div>}
          {opportunities.filter(opp =>
            opp.type === 'INTERN' && (remunerationFilter === 'ALL' || opp.remuneration === remunerationFilter)
          ).map((opp) => (
            <div key={opp.id} className="admin-card">
              <div className="font-bold text-lg">{opp.title} <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">{opp.type}</span></div>
              <div className="text-gray-600 mb-2">{opp.description}</div>
              <div className="flex items-center gap-2 text-sm mb-1">
                <UserIcon className="h-4 w-4 text-gray-500" />
                {opp.faculty?.user?.name && opp.faculty?.user?.email ? (
                  <span>{opp.faculty.user.name} <span className="text-gray-400">({opp.faculty.user.email})</span></span>
                ) : (
                  <span>{opp.facultyId}</span>
                )}
              </div>
              <div className="text-sm">Application Window: {opp.applicationStartDate?.slice(0,10)} to {opp.applicationEndDate?.slice(0,10)}</div>
              <div className="text-sm">Capacity: {opp.capacity}</div>
              <div className="text-sm">Applicants: {opp.applications?.length ?? 0}</div>
              <div className="text-sm">Status: {opp.status}</div>
              {editMode && (
                <div className="flex gap-2 mt-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="btn-delete" onClick={() => setDeleteId(opp.id)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{marginRight: 6}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        Delete
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
                  <button className="btn-edit" onClick={() => handleEdit(opp)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{marginRight: 6}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm-6 6v-2a2 2 0 012-2h2" /></svg>
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="RA">
        <h3 className="text-xl font-semibold mb-2">RA Opportunities</h3>
        <div className="flex flex-col items-start gap-4">
          {opportunities.filter(opp =>
            opp.type === 'RA' && (remunerationFilter === 'ALL' || opp.remuneration === remunerationFilter)
          ).length === 0 && <div>No opportunities found.</div>}
          {opportunities.filter(opp =>
            opp.type === 'RA' && (remunerationFilter === 'ALL' || opp.remuneration === remunerationFilter)
          ).map((opp) => (
            <div key={opp.id} className="admin-card">
                <div className="font-bold text-lg">{opp.title} <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">{opp.type}</span></div>
                <div className="text-gray-600 mb-2">{opp.description}</div>
                <div className="flex items-center gap-2 text-sm mb-1">
                  <UserIcon className="h-4 w-4 text-gray-500" />
                  {opp.faculty?.user?.name && opp.faculty?.user?.email ? (
                    <span>{opp.faculty.user.name} <span className="text-gray-400">({opp.faculty.user.email})</span></span>
                  ) : (
                    <span>{opp.facultyId}</span>
                  )}
                </div>
                <div className="text-sm">Application Window: {opp.applicationStartDate?.slice(0,10)} to {opp.applicationEndDate?.slice(0,10)}</div>
                <div className="text-sm">Capacity: {opp.capacity}</div>
                <div className="text-sm">Applicants: {opp.applications?.length ?? 0}</div>
                <div className="text-sm">Status: {opp.status}</div>
              {editMode && (
                <div className="flex gap-2 mt-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="btn-delete" onClick={() => setDeleteId(opp.id)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{marginRight: 6}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        Delete
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
                  <button className="btn-edit" onClick={() => handleEdit(opp)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{marginRight: 6}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm-6 6v-2a2 2 0 012-2h2" /></svg>
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}
      </div>
      </TabsContent>
      </Tabs>
    </div>
  );
} 