import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { Calendar, Clock, Plus, Users, BookOpen, Building2, Trash2 } from 'lucide-react';

interface ScheduleItem {
  id: string;
  title: string;
  time: string; // "09:00"
  duration: number; // minutes
  type: 'meeting' | 'class' | 'office-hours' | 'other';
  description?: string;
}

interface DailyCalendarProps {
  role?: 'admin' | 'faculty' | 'student';
}

export function DailyCalendar({ role = 'admin' }: DailyCalendarProps) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    title: '',
    time: '',
    duration: 60,
    type: 'meeting' as const,
    description: ''
  });

  const storageKey = `cie-${role}-schedule`;

  // Generate all time slots for the day from 00:00 to 20:30
  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 20) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  };

  const timeSlots = getTimeSlots();

  // Load schedule from localStorage on component mount
  useEffect(() => {
    const savedSchedule = localStorage.getItem(storageKey) || sessionStorage.getItem(storageKey);
    if (savedSchedule) {
      try {
        setSchedule(JSON.parse(savedSchedule));
      } catch (error) {
        console.error('Error parsing saved schedule:', error);
      }
    }
  }, []);

  // Save schedule to localStorage whenever schedule changes
  useEffect(() => {
    if (schedule.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(schedule));
      sessionStorage.setItem(storageKey, JSON.stringify(schedule));
    }
  }, [schedule]);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const addAppointment = () => {
    if (newAppointment.title.trim()) {
      const appointment: ScheduleItem = {
        id: Date.now().toString(),
        title: newAppointment.title.trim(),
        time: newAppointment.time,
        duration: newAppointment.duration,
        type: newAppointment.type,
        description: newAppointment.description.trim()
      };
      setSchedule([...schedule, appointment]);
      setNewAppointment({
        title: '',
        time: '',
        duration: 60,
        type: 'meeting',
        description: ''
      });
      setIsAddDialogOpen(false);
    }
  };

  const deleteAppointment = (id: string) => {
    const updatedSchedule = schedule.filter(item => item.id !== id);
    setSchedule(updatedSchedule);
    
    // Update storage
    if (updatedSchedule.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(updatedSchedule));
      sessionStorage.setItem(storageKey, JSON.stringify(updatedSchedule));
    } else {
      // Clear storage if no schedule items left
      localStorage.removeItem(storageKey);
      sessionStorage.removeItem(storageKey);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'class': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'office-hours': return 'bg-green-100 text-green-800 border-green-200';
      case 'other': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return <Users className="h-3 w-3" />;
      case 'class': return <BookOpen className="h-3 w-3" />;
      case 'office-hours': return <Building2 className="h-3 w-3" />;
      case 'other': return <Calendar className="h-3 w-3" />;
      default: return <Calendar className="h-3 w-3" />;
    }
  };

  const getCurrentTimeString = () => {
    return currentTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getCurrentDateString = () => {
    return currentTime.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isCurrentTimeSlot = (timeSlot: string) => {
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const slotHour = parseInt(timeSlot.split(':')[0]);
    const slotMinute = parseInt(timeSlot.split(':')[1]);
    
    return currentHour === slotHour && Math.abs(currentMinute - slotMinute) <= 30;
  };

  const getAppointmentsForTimeSlot = (timeSlot: string) => {
    return schedule.filter(item => {
      const itemHour = parseInt(item.time.split(':')[0]);
      const itemMinute = parseInt(item.time.split(':')[1]);
      const slotHour = parseInt(timeSlot.split(':')[0]);
      const slotMinute = parseInt(timeSlot.split(':')[1]);
      
      return itemHour === slotHour && itemMinute === slotMinute;
    });
  };

  const isTimeInPast = (timeSlot: string) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const slotHour = parseInt(timeSlot.split(':')[0]);
    const slotMinute = parseInt(timeSlot.split(':')[1]);
    
    return (slotHour < currentHour) || (slotHour === currentHour && slotMinute < currentMinute);
  };

  const formatDuration = (minutes: number) => {
    if (minutes === 30) return '30m';
    if (minutes === 60) return '1h';
    if (minutes === 90) return '1.5h';
    return `${minutes}m`;
  };

  return (
    <Card className="dashboard-tab-card transform hover:scale-105 focus:scale-105 transition-transform duration-200">
      <CardHeader>
        <div className="flex flex-col gap-1">
          <CardTitle className="text-xl">Daily Schedule</CardTitle>
          <div className="flex items-center justify-between mt-2 w-full">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{getCurrentDateString()}</span>
              <span>•</span>
              <Clock className="h-4 w-4" />
              <span>{getCurrentTimeString()}</span>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="px-3">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Appointment</DialogTitle>
                  <DialogDescription>
                    Schedule a new appointment or meeting for today.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      placeholder="Meeting title..."
                      value={newAppointment.title}
                      onChange={(e) => setNewAppointment({...newAppointment, title: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Time</label>
                      <input
                        type="time"
                        value={newAppointment.time}
                        onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min={new Date().toTimeString().slice(0, 5)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Duration (minutes)</label>
                      <input
                        type="number"
                        min="15"
                        max="480"
                        step="15"
                        value={newAppointment.duration}
                        onChange={(e) => setNewAppointment({...newAppointment, duration: parseInt(e.target.value) || 60})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="60"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <select
                      value={newAppointment.type}
                      onChange={(e) => setNewAppointment({...newAppointment, type: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="meeting">Meeting</option>
                      <option value="class">Class</option>
                      <option value="office-hours">Office Hours</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description (optional)</label>
                    <Input
                      placeholder="Additional details..."
                      value={newAppointment.description}
                      onChange={(e) => setNewAppointment({...newAppointment, description: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addAppointment}>
                      Add Appointment
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {timeSlots.map((timeSlot) => {
            const appointments = getAppointmentsForTimeSlot(timeSlot);
            const isCurrent = isCurrentTimeSlot(timeSlot);
            
            return (
              <div
                key={timeSlot}
                className={`p-3 border rounded-lg transition-all ${
                  isCurrent 
                    ? 'bg-blue-50 dark:bg-dm-tab-purple border-blue-300' 
                    : 'bg-white dark:bg-dm-tab-purple border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex-shrink-0 text-sm font-medium ${
                    isCurrent ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {timeSlot}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    {appointments.length === 0 ? (
                      <div className="text-xs text-gray-400 italic">
                        {isCurrent ? 'Current time' : 'Available'}
                      </div>
                    ) : (
                      appointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="flex items-center justify-between p-3 bg-white dark:bg-dm-tab-purple border border-gray-200 rounded"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs ${getTypeColor(appointment.type)}`}>
                                {getTypeIcon(appointment.type)}
                                {appointment.type}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatDuration(appointment.duration)}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 mt-1">
                              {appointment.title}
                            </p>
                            {appointment.description && (
                              <p className="text-xs text-gray-600 mt-1">
                                {appointment.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => deleteAppointment(appointment.id)}
                            className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 