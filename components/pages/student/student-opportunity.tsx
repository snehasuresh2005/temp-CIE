import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/components/auth-provider';

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
  applications?: { length: number }[];
}

interface Application {
  id: string;
  opportunityId: string;
  status: string;
  appliedAt: string;
  opportunity?: { title?: string };
}

export default function StudentOpportunity() {
  const { user, isLoading } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/opportunities')
      .then(res => res.json())
      .then((data: Opportunity[]) => setOpportunities(data.filter(o => o.status === 'OPEN')));
    if (user && user.role === 'STUDENT') {
      fetch('/api/opportunities/my-applications')
        .then(res => res.json())
        .then((data: Application[] | any) => setApplications(Array.isArray(data) ? data : []));
    }
  }, [user]);

  const getApplicationStatus = (oppId: string) => {
    const app = Array.isArray(applications) ? applications.find((a) => a.opportunityId === oppId) : undefined;
    return app ? app.status : null;
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setResumeFile(file);
    } else {
      setResumeFile(null);
      setError('Please select a PDF file.');
    }
  };

  const handleApply = async (oppId: string) => {
    setApplyingId(oppId);
    setError('');
    setSuccess('');
    try {
      if (!resumeFile) {
        setError('Please upload your resume (PDF) before applying.');
        setApplyingId(null);
        return;
      }
      // Submit application with resume as form-data
      const formData = new FormData();
      formData.append('resume', resumeFile);
      const res = await fetch(`/api/opportunities/${oppId}/apply`, {
        method: 'POST',
        body: formData,
        headers: {
          // 'Content-Type' will be set automatically by the browser for FormData
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply');
      setSuccess('Application submitted!');
      setResumeFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // Refresh applications
      fetch('/api/opportunities/my-applications')
        .then(res => res.json())
        .then((data: Application[] | any) => setApplications(Array.isArray(data) ? data : []));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setApplyingId(null);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!user || user.role !== 'STUDENT') return <div>You must be logged in as a student to view opportunities.</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Student Opportunities</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <div className="space-y-4">
        {opportunities.length === 0 && <div>No open opportunities found.</div>}
        {opportunities.map((opp) => {
          const status = getApplicationStatus(opp.id);
          return (
            <div key={opp.id} className="border p-4 rounded">
              <div className="font-bold text-lg">{opp.title} <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">{opp.type}</span></div>
              <div className="text-gray-600 mb-2">{opp.description}</div>
              <div className="text-sm">
                Faculty: {opp.faculty?.user?.name
                  ? `${opp.faculty.user.name} (${opp.faculty.user.email})`
                  : opp.facultyId}
              </div>
              <div className="text-sm">Application Window: {opp.applicationStartDate?.slice(0,10)} to {opp.applicationEndDate?.slice(0,10)}</div>
              <div className="text-sm">Capacity: {opp.capacity}</div>
              <div className="text-sm">Applicants: {opp.applications?.length ?? 0}</div>
              <div className="text-sm">Status: {opp.status}</div>
              {status ? (
                <div className="mt-2 text-blue-600">Application Status: {status}</div>
              ) : (
                <div className="mt-2">
                  <input
                    type="file"
                    accept="application/pdf"
                    ref={fileInputRef}
                    onChange={handleResumeChange}
                    className="mb-2"
                  />
                  {resumeFile && <div className="text-xs text-green-700 mb-1">Selected: {resumeFile.name}</div>}
                  <button
                    className="btn btn-primary"
                    onClick={() => handleApply(opp.id)}
                    disabled={!!applyingId || status === 'PENDING'}
                  >
                    {applyingId === opp.id ? 'Applying...' : 'Apply'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <h3 className="text-lg font-semibold mt-8 mb-2">My Applications</h3>
      <div className="space-y-2">
        {(!applications || applications.length === 0) && <div>No applications yet.</div>}
        {Array.isArray(applications) && applications.map(app => (
          <div key={app.id} className="border p-2 rounded">
            <div className="font-bold">{app.opportunity?.title || 'Opportunity'}</div>
            <div>Status: {app.status}</div>
            <div>Applied At: {app.appliedAt?.slice(0,10)}</div>
          </div>
        ))}
      </div>
    </div>
  );
} 