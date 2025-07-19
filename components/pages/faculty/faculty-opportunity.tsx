import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Faculty Opportunity Management</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-4">
          {opportunities.length === 0 && <div>No assigned opportunities found.</div>}
          {opportunities.map(opp => (
            <Card key={opp.id} className="border p-4 rounded">
              <CardContent>
                <div className="font-bold text-lg">{opp.title} <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">{opp.type}</span></div>
                <div className="text-gray-600 mb-2">{opp.description}</div>
                <div className="text-sm">Application Window: {opp.applicationStartDate?.slice(0,10)} to {opp.applicationEndDate?.slice(0,10)}</div>
                <div className="text-sm">Capacity: {opp.capacity}</div>
                <div className="text-sm">Status: {opp.status}</div>
                <Button className="mt-2" variant="default" onClick={() => handleViewApplicants(opp.id)}>
                  View Applicants
                </Button>
                <Button className="mt-2 ml-2" variant="secondary" onClick={() => handleBulkDownloadResumes(opp.id)}>
                  Bulk Download Resumes
                </Button>
                {selectedOppId === opp.id && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Applicants</h4>
                    {appError && <div className="text-red-600 mb-2">{appError}</div>}
                    {appLoading ? (
                      <div>Loading applicants...</div>
                    ) : (
                      <div className="space-y-2">
                        {(!Array.isArray(applications) || applications.length === 0) && <div>No applicants yet.</div>}
                        {/* Old applicant rendering code commented out */}
                        {/*
                        {Array.isArray(applications) && applications.map(app => (
                          <Card key={app.id} className="p-2">
                            <CardContent>
                              <div className="font-medium">{app.student?.name || 'Unknown'} ({app.student?.email || app.studentId})</div>
                              <div>Status: {app.status}</div>
                              <div>Applied At: {app.appliedAt?.slice(0,10)}</div>
                              {app.student?.resume_id && (
                                <div className="mt-1">
                                  <a
                                    href={`/${app.student.resume_path || 'Resume'}/${app.student.resume_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 underline"
                                  >
                                    View Resume
                                  </a>
                                </div>
                              )}
                              <div className="flex gap-2 mt-2">
                                <Button size="sm" variant="default" onClick={() => handleStatusChange(app.id, 'ACCEPTED')} disabled={app.status === 'ACCEPTED'}>
                                  Accept
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleStatusChange(app.id, 'REJECTED')} disabled={app.status === 'REJECTED'}>
                                  Reject
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        */}

                        {/* New applicant rendering code */}
                        {Array.isArray(applications) && applications.map(app => (
                          <Card key={app.id} className="p-2">
                            <CardContent>
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                <div>
                                  <div className="font-medium">{app.student?.user?.name || 'Unknown'} ({app.student?.user?.email || app.studentId})</div>
                                  <div className="text-sm text-gray-600">Status: {app.status}</div>
                                  <div className="text-sm text-gray-600">Applied At: {app.appliedAt?.slice(0,10)}</div>
                                </div>
                                <div className="flex gap-2 items-center">
                                  {app.resumePath ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      asChild
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
                                  <Button size="sm" variant="default" onClick={() => handleStatusChange(app.id, 'ACCEPTED')} disabled={app.status === 'ACCEPTED'}>
                                    Accept
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleStatusChange(app.id, 'REJECTED')} disabled={app.status === 'REJECTED'}>
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 