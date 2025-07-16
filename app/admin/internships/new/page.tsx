"use client";
import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';

export default function InternshipCreatePage() {
  const [mentors, setMentors] = useState<{id: string, name: string, email: string}[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    duration: '',
    skills: [''],
    mentorId: '',
    slots: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch faculty (mentors)
    fetch('/api/users?role=FACULTY')
      .then(res => res.json())
      .then(data => setMentors(data.users || []));
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
    setLoading(true);
    const res = await fetch('/api/internships', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': window.localStorage.getItem('userId') || '',
      },
      body: JSON.stringify({
        ...form,
        skills: form.skills.filter(s => s.trim()),
        slots: form.slots ? Number(form.slots) : undefined,
      }),
    });
    setLoading(false);
    if (res.ok) {
      toast({ title: 'Internship created!' });
      setForm({ title: '', description: '', duration: '', skills: [''], mentorId: '', slots: '' });
    } else {
      const err = await res.json();
      toast({ title: 'Error', description: err.error || 'Failed to create internship', variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Create Internship Project</h2>
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
          <Label>Duration</Label>
          <Input name="duration" value={form.duration} onChange={handleChange} required />
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
          <Label>Mentor</Label>
          <Select value={form.mentorId} onValueChange={v => setForm({ ...form, mentorId: v })}>
            <SelectTrigger>
              {form.mentorId
                ? mentors.find(m => m.id === form.mentorId)?.name || "Select Mentor"
                : "Select Mentor"}
            </SelectTrigger>
            <SelectContent>
              {mentors.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name} ({m.email})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Slots (optional)</Label>
          <Input name="slots" type="number" value={form.slots} onChange={handleChange} min={1} />
        </div>
        <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Internship'}</Button>
      </form>
    </div>
  );
} 