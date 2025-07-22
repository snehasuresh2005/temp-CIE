import React, { useEffect, useState, useRef, createRef } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, FileText } from 'lucide-react';

// Types for opportunity and application
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
  faculty?: { user?: { name?: string; email?: string } };
  capacity: number;
  status: string;
  opportunityApplications?: { length: number }[];
}

interface OpportunityApplication {
  id: string;
  opportunityId: string;
  status: string;
  appliedAt: string;
  opportunity?: { title?: string };
}

export default function StudentOpportunity() {
  const { user, isLoading } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [opportunityApplications, setOpportunityApplications] = useState<OpportunityApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [resumeFiles, setResumeFiles] = useState<{ [oppId: string]: File | null }>({});
  const fileInputRefs = useRef<{ [oppId: string]: React.RefObject<HTMLInputElement> }>({});
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
    fetch('/api/opportunities')
      .then(res => res.json())
      .then((data: Opportunity[]) => setOpportunities(data.filter(o => o.status === 'OPEN')));
    if (user && user.role === 'STUDENT') {
      fetch('/api/opportunities/my-applications', {
        headers: { 'x-user-id': user.id },
      })
        .then(res => res.json())
        .then((data: OpportunityApplication[] | any) => setOpportunityApplications(Array.isArray(data) ? data : []));
    }
  }, [user]);

  const getApplicationStatus = (oppId: string) => {
    const app = Array.isArray(opportunityApplications) ? opportunityApplications.find((a) => a.opportunityId === oppId) : undefined;
    return app ? app.status : null;
  };

  const handleResumeChange = (oppId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setResumeFiles(prev => ({ ...prev, [oppId]: file }));
    } else {
      setResumeFiles(prev => ({ ...prev, [oppId]: null }));
      setError('Please select a PDF file.');
    }
  };

  const handleApply = async (oppId: string) => {
    setError('');
    setSuccess('');
    const resumeFile = resumeFiles[oppId];
    if (!resumeFile) {
      setError('Please upload your resume (PDF) before applying.');
      return;
    }
    try {
      // 1. Upload resume
      const fd = new FormData();
      fd.append('file', resumeFile);
      const uploadRes = await fetch('/api/upload-resume', { method: 'POST', body: fd });
      if (!uploadRes.ok) {
        setError('Resume upload failed');
        return;
      }
      const { url: resumePath } = await uploadRes.json();
      // 2. Submit application
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({ opportunityId: oppId, resumePath }),
      });
      if (res.ok) {
        setSuccess('Application submitted!');
        setResumeFiles(prev => ({ ...prev, [oppId]: null }));
        if (fileInputRefs.current[oppId] && fileInputRefs.current[oppId].current) fileInputRefs.current[oppId].current.value = '';
        // Refresh applications
        fetch('/api/opportunities/my-applications')
          .then(res => {
            if (!res.ok) {
              throw new Error('Failed to fetch applications');
            }
            return res.json();
          })
          .then((data: OpportunityApplication[] | any) => setOpportunityApplications(Array.isArray(data) ? data : []))
          .catch(err => {
            setError('Could not load applications');
            setOpportunityApplications([]);
          });
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to apply');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to apply');
    }
  };

  // Helper to format date as dd/mm/yyyy
  function formatDate(dateStr?: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB');
  }

  if (isLoading) return <div>Loading...</div>;
  if (!user || user.role !== 'STUDENT') return <div>You must be logged in as a student to view opportunities.</div>;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Student Opportunities</h2>
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
      {/* Only show error if it's not 'Could not load applications' */}
      {error && error !== 'Could not load applications' && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full">
        {filteredOpportunities.length === 0 && <div className='col-span-full'>No open opportunities found.</div>}
        {filteredOpportunities.map((opp) => {
          // Ensure a ref exists for each opportunity
          if (!fileInputRefs.current[opp.id]) {
            fileInputRefs.current[opp.id] = createRef<HTMLInputElement>();
          }
          const status = getApplicationStatus(opp.id);
          return (
            <div key={opp.id} className="border p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow bg-white flex flex-col h-full group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{opp.title}</span>
                  <span className="ml-1 text-xs bg-gray-100 px-2 py-1 rounded font-semibold tracking-wide border border-gray-200">{opp.type}</span>
                </div>
                {status && (
                  <span
                    className={
                      status === 'ACCEPTED'
                        ? 'inline-block px-3 py-1 rounded-full bg-green-100 text-green-800 font-semibold text-xs shadow-sm'
                        : status === 'REJECTED'
                        ? 'inline-block px-3 py-1 rounded-full bg-red-100 text-red-800 font-semibold text-xs shadow-sm'
                        : 'inline-block px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 font-semibold text-xs shadow-sm'
                    }
                  >
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </span>
                )}
              </div>
              <div className="text-gray-600 mb-3 line-clamp-2 min-h-[40px]">{opp.description}</div>
              <div className="border-t pt-3 mt-2">
                <div className="flex flex-col gap-1 text-sm mb-3">
                  <div className="flex justify-between"><span className="text-gray-500">Faculty:</span><span className="truncate text-right">{
                    opp.faculty?.user?.name
                      ? opp.faculty.user.name
                      : opp.faculty?.user?.email
                        ? opp.faculty.user.email
                        : opp.facultyId
                  }</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">App Window:</span><span className="text-right">{formatDate(opp.applicationStartDate)} to {formatDate(opp.applicationEndDate)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Capacity:</span><span className="text-right">{opp.capacity}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Applicants:</span><span className="text-right">{opp.opportunityApplications?.length ?? 0}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Status:</span><span className="capitalize text-right">{opp.status.toLowerCase()}</span></div>
                </div>
                {!status && (
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="bg-gray-100 border border-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors select-none"
                        onClick={() => fileInputRefs.current[opp.id]?.current?.click()}
                      >
                        Upload Resume
                      </button>
                      <input
                        type="file"
                        accept="application/pdf"
                        ref={fileInputRefs.current[opp.id]}
                        onChange={e => handleResumeChange(opp.id, e)}
                        className="hidden"
                      />
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold shadow transition-colors duration-150 w-full sm:w-auto"
                        onClick={() => handleApply(opp.id)}
                        disabled={!!applyingId}
                      >
                        {applyingId === opp.id ? 'Applying...' : 'Apply'}
                      </button>
                    </div>
                    {resumeFiles[opp.id] && (
                      <div className="flex items-center gap-2 mt-1 p-2 bg-gray-50 rounded">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-xs text-gray-800 font-medium truncate">{resumeFiles[opp.id]?.name}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <h3 className="text-lg font-semibold mt-8 mb-2">My Applications</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 w-full">
        {(!opportunityApplications || opportunityApplications.length === 0) && <div className='col-span-full'>No applications yet.</div>}
        {Array.isArray(opportunityApplications) && opportunityApplications.map(app => (
          <div key={app.id} className="border p-5 rounded-xl shadow bg-white flex flex-col h-full">
            <div className="flex items-center justify-between mb-1">
              <div className="font-bold text-base">{app.opportunity?.title || 'Opportunity'}</div>
              <span className={
                app.status === 'ACCEPTED'
                  ? 'inline-block px-3 py-1 rounded-full bg-green-100 text-green-800 font-semibold text-xs shadow-sm'
                  : app.status === 'REJECTED'
                  ? 'inline-block px-3 py-1 rounded-full bg-red-100 text-red-800 font-semibold text-xs shadow-sm'
                  : 'inline-block px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 font-semibold text-xs shadow-sm'
              }>
                {app.status.charAt(0) + app.status.slice(1).toLowerCase()}
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-1">Applied At: {formatDate(app.appliedAt)}</div>
          </div>
        ))}
      </div>
    </div>
  );
} 