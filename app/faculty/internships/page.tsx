"use client";
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Application {
  id: string;
  status: string;
  resumeUrl: string;
  student: Student;
}

interface Internship {
  id: string;
  title: string;
  description: string;
  duration: string;
  skills: string[];
  slots?: number;
  facultyId: string;
  isAccepted: boolean;
}

function getUserId() {
  return window.localStorage.getItem('userId') || '';
}

export default function FacultyInternshipsPage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(false);
  const [applicants, setApplicants] = useState<{ [key: string]: Application[] }>({});

  useEffect(() => {
    fetchInternships();
  }, []);

  const fetchInternships = async () => {
    setLoading(true);
    const res = await fetch('/api/internships/available', {
      headers: { 'x-user-id': getUserId() }
    });
    const data = await res.json();
    const userId = getUserId();
    // Only show internships where facultyId = current user
    setInternships((data.internships || []).filter((i: Internship) => i.facultyId === userId));
    setLoading(false);
  };

  const acceptProject = async (id: string) => {
    setLoading(true);
    const res = await fetch(`/api/internships/${id}/accept`, {
      method: 'POST',
      headers: { 'x-user-id': getUserId() },
    });
    setLoading(false);
    if (res.ok) {
      toast({ title: 'Project accepted!' });
      fetchInternships();
    } else {
      const err = await res.json();
      toast({ title: 'Error', description: err.error || 'Failed to accept', variant: 'destructive' });
    }
  };

  const fetchApplicants = async (internshipId: string) => {
    const res = await fetch(`/api/internships/${internshipId}/applicants`, {
      headers: { 'x-user-id': getUserId() },
    });
    const data = await res.json();
    setApplicants(prev => ({ ...prev, [internshipId]: data.applications || [] }));
  };

  const updateStatus = async (applicationId: string, status: string, internshipId: string) => {
    const res = await fetch(`/api/applications/${applicationId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': getUserId() },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast({ title: `Application ${status.toLowerCase()}` });
      fetchApplicants(internshipId);
    } else {
      const err = await res.json();
      toast({ title: 'Error', description: err.error || 'Failed to update', variant: 'destructive' });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Internship Projects</h1>
          <p className="text-muted-foreground">
            Manage your assigned internship projects and review student applications.
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading internships...</p>
          </div>
        </div>
      )}

      {!loading && internships.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <svg
                  className="h-6 w-6 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">No internships assigned yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't been assigned any internship projects yet. Check back later or contact the administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && internships.length > 0 && (
        <div className="grid gap-6">
          {internships.map((internship) => (
            <Card key={internship.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{internship.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {internship.description}
                    </CardDescription>
                  </div>
                  {!internship.isAccepted && (
                    <Button onClick={() => acceptProject(internship.id)}>
                      Accept Project
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Duration:</span> {internship.duration}
                  </div>
                  <div>
                    <span className="font-medium">Skills:</span> {internship.skills.join(', ')}
                  </div>
                  {internship.slots && (
                    <div>
                      <span className="font-medium">Available Slots:</span> {internship.slots}
                    </div>
                  )}
                </div>
                
                {internship.isAccepted && (
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">Student Applications</h4>
                      <Button variant="outline" onClick={() => fetchApplicants(internship.id)}>
                        View Applicants
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {(applicants[internship.id] || []).length === 0 && (
                        <div className="text-center py-4 text-muted-foreground">
                          No applicants yet.
                        </div>
                      )}
                      
                      {(applicants[internship.id] || []).map(app => (
                        <Card key={app.id} className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-2">
                              <div className="font-medium">{app.student.name}</div>
                              <div className="text-sm text-muted-foreground">{app.student.email}</div>
                              <div className="text-sm">
                                Status: <span className="font-mono px-2 py-1 bg-muted rounded">{app.status}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                asChild
                              >
                                <a
                                  href={app.resumeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  View Resume
                                </a>
                              </Button>
                              {app.status === 'PENDING' && (
                                <>
                                  <Button size="sm" onClick={() => updateStatus(app.id, 'ACCEPTED', internship.id)}>
                                    Accept
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => updateStatus(app.id, 'REJECTED', internship.id)}>
                                    Reject
                                  </Button>
                                </>
                              )}
                              {app.status === 'ACCEPTED' && (
                                <span className="text-green-600 font-semibold px-3 py-1 bg-green-50 rounded">
                                  Accepted
                                </span>
                              )}
                              {app.status === 'REJECTED' && (
                                <span className="text-red-600 font-semibold px-3 py-1 bg-red-50 rounded">
                                  Rejected
                                </span>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
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