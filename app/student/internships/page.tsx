"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface Internship {
  id: string;
  title: string;
  description: string;
  duration: string;
  skills: string[];
  isAccepted: boolean;
  mentor?: { name?: string };
}

function getUserId() {
  return window.localStorage.getItem('userId') || '';
}

export default function StudentInternshipsPage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Internship | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', degree: '', resume: null });
  const [submitting, setSubmitting] = useState(false);
  const [applied, setApplied] = useState<string[]>([]);
  const [appliedMap, setAppliedMap] = useState<{ [internshipId: string]: string }>({});

  useEffect(() => {
    fetchInternships();
    fetchAppliedInternships();
  }, []);

  const fetchInternships = async () => {
    setLoading(true);
    const res = await fetch('/api/internships/available', {
      headers: { 'x-user-id': getUserId() }
    });
    const data = await res.json();
    // Only show internships that have been accepted
    setInternships((data.internships || []).filter((i: Internship) => i.isAccepted));
    setLoading(false);
  };

  const fetchAppliedInternships = async () => {
    const res = await fetch('/api/applications', {
      headers: { 'x-user-id': getUserId() }
    });
    if (res.ok) {
      const data = await res.json();
      setApplied(data.applications.map((a: { internshipId: string }) => a.internshipId));
      // Build a map of internshipId -> status
      const map: { [internshipId: string]: string } = {};
      data.applications.forEach((a: { internshipId: string, status: string }) => {
        map[a.internshipId] = a.status;
      });
      setAppliedMap(map);
    }
  };

  const openApply = (internship: Internship) => {
    setSelected(internship);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelected(null);
    setForm({ name: '', email: '', phone: '', degree: '', resume: null });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    setForm(f => ({ ...f, [name]: files ? files[0] : value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    // Upload resume
    let resumeUrl = '';
    if (form.resume) {
      const fd = new FormData();
      fd.append('file', form.resume);
      const uploadRes = await fetch('/api/upload-resume', { method: 'POST', body: fd });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        resumeUrl = uploadData.url;
      } else {
        toast({ title: 'Resume upload failed', variant: 'destructive' });
        setSubmitting(false);
        return;
      }
    }
    // Submit application
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': getUserId() },
      body: JSON.stringify({
        internshipId: selected?.id,
        resumeUrl,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      toast({ title: 'Application successfully submitted!' });
      setApplied(prev => selected?.id ? [...prev, selected.id] : prev);
      closeModal();
    } else {
      const err = await res.json();
      toast({ title: 'Error', description: err.error || 'Failed to apply', variant: 'destructive' });
    }
  };

  // Only allow students (role check could be improved with user context)
  // For now, just render the page

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Available Internships</h2>
      {loading && <div>Loading...</div>}
      {!loading && internships.length === 0 && <div>No internships available.</div>}
      <div className="space-y-6">
        {internships.map((internship) => (
          <Card key={internship.id} className="p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold">{internship.title}</h3>
              <div className="text-sm text-gray-600">{internship.description}</div>
              <div className="text-sm">Duration: {internship.duration}</div>
              <div className="text-sm">Skills: {internship.skills.join(', ')}</div>
              <div className="text-sm">Mentor: {internship.mentor?.name || 'N/A'}</div>
            </div>
            {appliedMap[internship.id] ? (
              <Badge
                className={
                  appliedMap[internship.id] === 'ACCEPTED'
                    ? 'bg-green-100 text-green-800'
                    : appliedMap[internship.id] === 'REJECTED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }
              >
                {appliedMap[internship.id] === 'PENDING'
                  ? 'Pending'
                  : appliedMap[internship.id] === 'ACCEPTED'
                  ? 'Accepted'
                  : appliedMap[internship.id] === 'REJECTED'
                  ? 'Rejected'
                  : appliedMap[internship.id]}
              </Badge>
            ) : (
              <Button onClick={() => openApply(internship)} disabled={applied.includes(internship.id)}>Apply</Button>
            )}
          </Card>
        ))}
      </div>
      <Dialog open={showModal} onOpenChange={closeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for {selected?.title}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div>
              <Label>Email</Label>
              <Input name="email" value={form.email} onChange={handleChange} required />
            </div>
            <div>
              <Label>Phone</Label>
              <Input name="phone" value={form.phone} onChange={handleChange} required />
            </div>
            <div>
              <Label>Degree</Label>
              <Input name="degree" value={form.degree} onChange={handleChange} required />
            </div>
            <div>
              <Label>Resume (PDF)</Label>
              <Input name="resume" type="file" accept="application/pdf" onChange={handleChange} required />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting || (!!selected && applied.includes(selected.id))}>
                {submitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 