"use client";
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

function getUserId() {
  return window.localStorage.getItem('userId') || '';
}

const StudentInternshipDashboard = () => {
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', degree: '', resume: null });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInternships();
  }, []);

  const fetchInternships = async () => {
    setLoading(true);
    const res = await fetch('/api/internships/available');
    const data = await res.json();
    setInternships(data.internships || []);
    setLoading(false);
  };

  const openApply = (internship: any) => {
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
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': getUserId() },
      body: JSON.stringify({
        internshipId: selected.id,
        resumeUrl,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      toast({ title: 'Application submitted!' });
      closeModal();
    } else {
      const err = await res.json();
      toast({ title: 'Error', description: err.error || 'Failed to apply', variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
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
            <Button onClick={() => openApply(internship)}>Apply</Button>
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
              <Button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Application'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentInternshipDashboard; 