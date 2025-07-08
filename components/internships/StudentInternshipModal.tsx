"use client";
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import StudentInternshipDashboard from './StudentInternshipDashboard';

export default function StudentInternshipModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Available Internships</DialogTitle>
        </DialogHeader>
        <StudentInternshipDashboard />
      </DialogContent>
    </Dialog>
  );
} 