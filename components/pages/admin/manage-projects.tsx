import React, { useState, useEffect } from "react";

export function ManageProjects() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    studentsRequired: 1,
    mentor: "",
    startDate: "",
    endDate: "",
    department: "",
    description: ""
  });
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Updated faculty/mentor list from your seeded data
  const mentors = [
    { id: "cieoffice@pes.edu", name: "Madhukar N" },
    { id: "sathya.prasad@pes.edu", name: "Sathya Prasad" },
    { id: "tarunrama@pes.edu", name: "Tarun R" },
  ];
  const departments = [
    { id: "cse", name: "Computer Science" },
    { id: "it", name: "Information Technology" },
    { id: "ece", name: "Electronics" },
  ];

  // Fetch projects from API
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Call API to create project
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowModal(false);
    setForm({ title: "", studentsRequired: 1, mentor: "", startDate: "", endDate: "", department: "", description: "" });
    fetchProjects();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Projects</h1>
      <div className="mb-4">
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => setShowModal(true)}>
          Add New Project
        </button>
      </div>
      <div>
        {loading ? (
          <p>Loading projects...</p>
        ) : projects.length === 0 ? (
          <p>No projects yet.</p>
        ) : (
          <table className="min-w-full border mt-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2">Title</th>
                <th className="border px-4 py-2">Mentor</th>
                <th className="border px-4 py-2">Department</th>
                <th className="border px-4 py-2">Students Required</th>
                <th className="border px-4 py-2">Start Date</th>
                <th className="border px-4 py-2">End Date</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td className="border px-4 py-2">{p.name}</td>
                  <td className="border px-4 py-2">{mentors.find(m => m.id === p.mentor)?.name || p.mentor}</td>
                  <td className="border px-4 py-2">{departments.find(d => d.id === p.department)?.name || p.department}</td>
                  <td className="border px-4 py-2">{p.studentsRequired}</td>
                  <td className="border px-4 py-2">{p.startDate ? new Date(p.startDate).toLocaleDateString() : ""}</td>
                  <td className="border px-4 py-2">{p.endDate ? new Date(p.endDate).toLocaleDateString() : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">Add New Project</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Project Title</label>
                <input name="title" value={form.title} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block font-medium mb-1">Number of Students Required</label>
                <input name="studentsRequired" type="number" min={1} value={form.studentsRequired} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block font-medium mb-1">Mentor</label>
                <select name="mentor" value={form.mentor} onChange={handleChange} required className="w-full border rounded px-3 py-2">
                  <option value="">Select Mentor</option>
                  {mentors.map(m => <option key={m.id} value={m.id}>{m.name} ({m.id})</option>)}
                </select>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block font-medium mb-1">Start Date</label>
                  <input name="startDate" type="date" value={form.startDate} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
                </div>
                <div className="flex-1">
                  <label className="block font-medium mb-1">End Date</label>
                  <input name="endDate" type="date" value={form.endDate} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1">Department</label>
                <select name="department" value={form.department} onChange={handleChange} required className="w-full border rounded px-3 py-2">
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Project Description (optional)</label>
                <textarea name="description" value={form.description} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="px-4 py-2 rounded border" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 