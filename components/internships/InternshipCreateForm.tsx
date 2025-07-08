"use client";
import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';

export default function InternshipCreateForm({ onSuccess }: { onSuccess?: () => void }) {
  const [faculties, setFaculties] = useState<{id: string, name: string}[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    skills: [''],
    facultyId: '',
    duration: '',
    slots: '',
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(false);
  // Track form validity
  const isFormValid =
    form.title.trim() &&
    form.description.trim() &&
    form.skills.every(s => s.trim()) &&
    form.facultyId &&
    form.duration.trim() &&
    form.startDate &&
    form.endDate &&
    form.slots &&
    Number.isInteger(Number(form.slots)) &&
    Number(form.slots) > 0;

  useEffect(() => {
    fetch('/api/users?role=FACULTY')
      .then(res => res.json())
      .then(data => {
        setFaculties(data.users || []);
        console.log('Loaded faculties:', data.users);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSkillChange = (idx: number, value: string) => {
    const newSkills = [...form.skills];
    newSkills[idx] = value;
    setForm({ ...form, skills: newSkills });
  };

  const addSkill = () => setForm({ ...form, skills: [...form.skills, ''] });
  const removeSkill = (idx: number) => setForm({ ...form, skills: form.skills.filter((_, i) => i !== idx) });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Check for userId in localStorage
    const userId = window.localStorage.getItem('userId');
    if (!userId) {
      toast({ title: 'User not logged in. Please login to continue.', variant: 'destructive' });
      return;
    }
    // Validate slots is a positive integer
    const slotsNum = Number(form.slots);
    if (!Number.isInteger(slotsNum) || slotsNum <= 0) {
      toast({ title: 'Slots must be a positive integer', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/internships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          ...form,
          skills: form.skills.filter(s => s.trim()),
          slots: slotsNum,
        }),
      });
      const data = await res.json();
      console.log('Internship create response:', res.status, data);
      setLoading(false);
      if (res.ok) {
        toast({ title: 'Internship created!' });
        setForm({ title: '', description: '', duration: '', skills: [''], facultyId: '', slots: '', startDate: '', endDate: '' });
        if (onSuccess) onSuccess();
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to create internship', variant: 'destructive' });
      }
    } catch (err) {
      setLoading(false);
      toast({ title: 'Error', description: (err instanceof Error ? err.message : String(err)) || 'Failed to create internship', variant: 'destructive' });
      console.error('Internship create error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input name="title" value={form.title} onChange={handleChange} required />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea name="description" value={form.description} onChange={handleChange} required />
      </div>
      <div>
        <Label>Skills</Label>
        {form.skills.map((skill, idx) => (
          <div key={idx} className="flex gap-2 mb-1">
            <Input value={skill} onChange={e => handleSkillChange(idx, e.target.value)} required />
            {form.skills.length > 1 && (
              <Button type="button" variant="outline" onClick={() => removeSkill(idx)}>-</Button>
            )}
            {idx === form.skills.length - 1 && (
              <Button type="button" variant="outline" onClick={addSkill}>+</Button>
            )}
          </div>
        ))}
      </div>
      <div>
        <Label>Faculty In Charge</Label>
        <Select value={form.facultyId} onValueChange={v => setForm({ ...form, facultyId: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select Faculty In Charge" />
          </SelectTrigger>
          <SelectContent>
            {faculties.map((f) => (
              <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Duration</Label>
        <Input name="duration" value={form.duration} onChange={handleChange} required />
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <Label>Start Date</Label>
          <Input name="startDate" type="date" value={form.startDate} onChange={handleChange} required />
        </div>
        <div className="flex-1">
          <Label>End Date</Label>
          <Input name="endDate" type="date" value={form.endDate} onChange={handleChange} required />
        </div>
      </div>
      <div>
        <Label>Slots</Label>
        <Input name="slots" type="number" value={form.slots} onChange={handleChange} min={1} required />
      </div>
      <Button type="submit" disabled={loading || !isFormValid}>{loading ? 'Creating...' : 'Create Internship'}</Button>
    </form>
  );
} 