"use client";
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import InternshipCreateForm from './InternshipCreateForm';

export default function AdminInternshipModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Internship Project</DialogTitle>
        </DialogHeader>
        <InternshipCreateForm />
      </DialogContent>
    </Dialog>
  );
} 