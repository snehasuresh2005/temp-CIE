import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User as UserIcon, Calendar as CalendarIcon, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  capacity: number;
  status: string;
}

interface Application {
  id: string;
  studentId: string;
  status: string;
  appliedAt: string;
  student: { name: string; email: string; resume_id?: string; resume_path?: string };
  resumePath?: string; // Added this field to the Application interface
  studentName?: string;
  studentUserId?: string;
}

export default function FacultyOpportunity() {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedOppId, setSelectedOppId] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [appLoading, setAppLoading] = useState(false);
  const [appError, setAppError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const typeOptions = Array.from(new Set(opportunities.map(o => o.type)));
  const statusOptions = Array.from(new Set(opportunities.map(o => o.status)));

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch =
      opp.title.toLowerCase().includes(search.toLowerCase()) ||
      opp.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || opp.type === typeFilter;
    const matchesStatus = !statusFilter || opp.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  useEffect(() => {
    const facultyInChargeId = user?.id;
    if (!facultyInChargeId) return;
    setLoading(true);
    fetch('/api/opportunities')
      .then(res => res.json())
      .then((data: Opportunity[]) => setOpportunities(data.filter(o => o.facultyInChargeId === facultyInChargeId)))
      .catch(() => setError('Failed to load opportunities'))
      .finally(() => setLoading(false));
  }, [user]);

  const handleViewApplicants = (oppId: string) => {
    setSelectedOppId(oppId);
    setAppLoading(true);
    setAppError('');
    fetch(`/api/opportunities/${oppId}/applications`, {
      headers: { 'x-user-id': user?.id || '' },
    })
      .then(res => res.json())
      .then((data: Application[] | { error: string }) => {
        if (Array.isArray(data)) {
          setApplications(data);
        } else {
          setApplications([]);
          setAppError(data.error || 'Failed to load applicants');
        }
      })
      .catch(() => setAppError('Failed to load applicants'))
      .finally(() => setAppLoading(false));
  };

  const handleStatusChange = async (applicationId: string, status: 'ACCEPTED' | 'REJECTED') => {
    setAppLoading(true);
    setAppError('');
    try {
      const res = await fetch(`/api/opportunities/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      // Refresh applicants list
      handleViewApplicants(selectedOppId!);
    } catch (err) {
      setAppError('Failed to update status');
    } finally {
      setAppLoading(false);
    }
  };

  // Bulk download resumes handler
  const handleBulkDownloadResumes = async (oppId: string) => {
    setAppLoading(true);
    setAppError("");
    try {
      const res = await fetch(`/api/opportunities/${oppId}/bulk-download-resumes`, {
        headers: { 'x-user-id': user?.id || '' },
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to bulk download resumes');
      // Optionally show a success message or trigger a download
      setAppError('Resumes downloaded to Resume folder.');
    } catch (err: any) {
      setAppError(err.message);
    } finally {
      setAppLoading(false);
    }
  }

  return (
    <div className="w-full p-4">
      <h2 className="text-2xl font-bold mb-4">Faculty Opportunity Management</h2>
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
        <Select value={typeFilter || 'all'} onValueChange={v => setTypeFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {typeOptions.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter || 'all'} onValueChange={v => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statusOptions.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full">
          {filteredOpportunities.length === 0 && <div className='col-span-full'>No assigned opportunities found.</div>}
          {filteredOpportunities.map(opp => (
            <Card key={opp.id} className="border p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow bg-white flex flex-col h-full">
              <CardContent className="flex flex-col flex-1">
                <div className="font-bold text-lg mb-1">{opp.title} <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">{opp.type}</span></div>
                <div className="text-gray-600 mb-2 line-clamp-2">{opp.description}</div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                  <div><span className="font-medium">Due Date:</span> {opp.applicationEndDate?.slice(0,10)}</div>
                  <div><span className="font-medium">Capacity:</span> {opp.capacity}</div>
                  <div><span className="font-medium">Status:</span> <span className={opp.status === 'OPEN' ? 'text-green-600' : 'text-gray-600'}>{opp.status}</span></div>
                </div>
                <div className="mt-auto pt-2 flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="mt-2" variant="default" onClick={() => handleViewApplicants(opp.id)}>
                        View Applicants
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[80vw] max-w-[1100px] p-10">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Applicants - {opp.title}</DialogTitle>
                      </DialogHeader>
                      {appError && <div className="text-red-600 mb-2">{appError}</div>}
                      {appLoading ? (
                        <div>Loading applicants...</div>
                      ) : (
                        <div className="overflow-x-auto">
                          {(!Array.isArray(applications) || applications.length === 0) ? (
                            <div>No applicants yet.</div>
                          ) : (
                            <table className="w-full text-base table-fixed">
                              <thead>
                                <tr className="border-b">
                                  <th className="py-3 px-4 text-left w-1/4">Student</th>
                                  <th className="py-3 px-4 text-left w-1/6">Status</th>
                                  {applications.some(app => app.appliedAt) && <th className="py-3 px-4 text-left w-1/6 min-w-[140px]">Applied Date</th>}
                                  <th className="py-3 px-4 text-left w-1/6">Resume</th>
                                  <th className="py-3 px-4 text-left w-1/4">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {applications.map(app => (
                                  <tr key={app.id} className="border-b align-middle hover:bg-gray-50 transition">
                                    <td className="py-4 px-4 whitespace-normal">
                                      <div className="flex items-center gap-2">
                                        <UserIcon className="h-5 w-5 text-gray-500" />
                                        <span className="font-semibold text-base">{app.studentName || '-'}</span>
                                      </div>
                                      {app.studentUserId && <div className="text-xs text-gray-500 break-all ml-7">{app.studentUserId}</div>}
                                    </td>
                                    <td className="py-4 px-4">
                                      <span className={
                                        app.status === 'ACCEPTED'
                                          ? 'border border-green-500 text-green-700 bg-green-50 px-3 py-1 rounded font-semibold'
                                          : app.status === 'REJECTED'
                                          ? 'border border-red-500 text-red-700 bg-red-50 px-3 py-1 rounded font-semibold'
                                          : 'border border-yellow-500 text-yellow-700 bg-yellow-50 px-3 py-1 rounded font-semibold'
                                      }>
                                        {app.status.charAt(0) + app.status.slice(1).toLowerCase()}
                                      </span>
                                    </td>
                                    <td className="py-4 px-4 min-w-[140px]">
                                      {app.appliedAt ? (
                                        <div className="flex items-center gap-2">
                                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                                          <span>{app.appliedAt.slice(0,10)}</span>
                                        </div>
                                      ) : null}
                                    </td>
                                    <td className="py-4 px-4">
                                      {app.resumePath ? (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          asChild
                                          className="w-full max-w-[140px]"
                                        >
                                          <a
                                            href={app.resumePath.startsWith('/') ? app.resumePath : `/resumes/${app.resumePath}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            View Resume
                                          </a>
                                        </Button>
                                      ) : (
                                        <span>No Resume</span>
                                      )}
                                    </td>
                                    <td className="py-4 px-4 w-40 min-w-max">
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          className="bg-green-600 hover:bg-green-700 text-white px-3"
                                          onClick={() => handleStatusChange(app.id, 'ACCEPTED')}
                                          disabled={app.status === 'ACCEPTED'}
                                        >
                                          <CheckCircle className="h-4 w-4 mr-1" /> Accept
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          className="px-3"
                                          onClick={() => handleStatusChange(app.id, 'REJECTED')}
                                          disabled={app.status === 'REJECTED'}
                                        >
                                          <XCircle className="h-4 w-4 mr-1" /> Reject
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 