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
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setError('');
    setSuccess('');
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
        setResumeFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
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
              <div className="text-sm">Applicants: {opp.opportunityApplications?.length ?? 0}</div>
              <div className="text-sm">Status: {opp.status}</div>
              <div className="mt-2">
                {status ? (
                  <span
                    className={
                      status === 'ACCEPTED'
                        ? 'inline-block px-3 py-1 rounded bg-green-100 text-green-800 font-semibold'
                        : status === 'REJECTED'
                        ? 'inline-block px-3 py-1 rounded bg-red-100 text-red-800 font-semibold'
                        : 'inline-block px-3 py-1 rounded bg-yellow-100 text-yellow-800 font-semibold'
                    }
                  >
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </span>
                ) : (
                  <>
                    <input
                      type="file"
                      accept="application/pdf"
                      ref={fileInputRef}
                      onChange={handleResumeChange}
                      className="mb-2"
                    />
                    {resumeFile && <div className="text-xs text-green-700 mb-1">Selected: {resumeFile.name}</div>}
                    <button
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold shadow transition-colors duration-150"
                      onClick={() => handleApply(opp.id)}
                      disabled={!!applyingId}
                    >
                      {applyingId === opp.id ? 'Applying...' : 'Apply'}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <h3 className="text-lg font-semibold mt-8 mb-2">My Applications</h3>
      <div className="space-y-2">
        {(!opportunityApplications || opportunityApplications.length === 0) && <div>No applications yet.</div>}
        {Array.isArray(opportunityApplications) && opportunityApplications.map(app => (
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