"use client";
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FacultyInternshipDashboard from './FacultyInternshipDashboard';

export default function FacultyInternshipModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>My Internship Projects</DialogTitle>
        </DialogHeader>
        <FacultyInternshipDashboard />
      </DialogContent>
    </Dialog>
  );
} 