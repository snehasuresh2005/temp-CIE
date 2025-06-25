'use client';

import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { format, isSameDay, parseISO, startOfDay, endOfDay } from 'date-fns';
import { CalendarIcon, Clock, MapPin, Users, Plus, Edit, Trash2 } from 'lucide-react';
import { useNavigation } from 'react-day-picker';

interface Location {
  id: string;
  name: string;
  building: string;
  floor: string;
  room_number: string;
  capacity: number;
  location_type: string;
}

interface LocationBooking {
  id: string;
  location_id: string;
  faculty_id: string;
  start_time: string;
  end_time: string;
  purpose: string;
  title: string;
  description?: string;
  location: Location;
  faculty: {
    user: {
      name: string;
      email: string;
    };
  };
}

interface LocationCalendarProps {
  userRole: 'admin' | 'faculty';
  userId?: string;
}

export function LocationCalendar({ userRole, userId }: LocationCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [locations, setLocations] = useState<Location[]>([]);
  const [bookings, setBookings] = useState<LocationBooking[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<LocationBooking | null>(null);
  const [loading, setLoading] = useState(false);

  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    location_id: '',
    start_time: '',
    end_time: '',
    purpose: '',
    title: '',
    description: '',
  });

  useEffect(() => {
    fetchLocations();
    fetchBookings();
  }, [selectedLocation, date]);

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations');
      const data = await response.json();
      setLocations(data.locations || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch locations',
        variant: 'destructive',
      });
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      let url = '/api/location-bookings?';
      
      if (selectedLocation !== 'all') {
        url += `locationId=${selectedLocation}&`;
      }
      
      if (userRole === 'faculty' && userId) {
        // For faculty, get their bookings
        const facultyResponse = await fetch(`/api/faculty?userId=${userId}`);
        const facultyData = await facultyResponse.json();
        if (facultyData.faculty) {
          url += `facultyId=${facultyData.faculty.id}&`;
        }
      }

      const response = await fetch(url);
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch bookings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => {
      const bookingDate = parseISO(booking.start_time);
      return isSameDay(bookingDate, date);
    });
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/location-bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || '',
        },
        body: JSON.stringify(bookingForm),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Booking created successfully',
        });
        setIsBookingDialogOpen(false);
        setBookingForm({
          location_id: '',
          start_time: '',
          end_time: '',
          purpose: '',
          title: '',
          description: '',
        });
        fetchBookings();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to create booking',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to create booking',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBooking) return;

    try {
      const response = await fetch(`/api/location-bookings/${selectedBooking.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || '',
        },
        body: JSON.stringify(bookingForm),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Booking updated successfully',
        });
        setIsEditDialogOpen(false);
        setSelectedBooking(null);
        fetchBookings();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to update booking',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to update booking',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;

    try {
      const response = await fetch(`/api/location-bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId || '',
        },
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Booking deleted successfully',
        });
        fetchBookings();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to delete booking',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete booking',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (booking: LocationBooking) => {
    setSelectedBooking(booking);
    setBookingForm({
      location_id: booking.location_id,
      start_time: format(parseISO(booking.start_time), "yyyy-MM-dd'T'HH:mm"),
      end_time: format(parseISO(booking.end_time), "yyyy-MM-dd'T'HH:mm"),
      purpose: booking.purpose,
      title: booking.title,
      description: booking.description || '',
    });
    setIsEditDialogOpen(true);
  };

  function CustomDayContent(props: { date: Date }) {
    const day = props.date;
    const dayBookings = getBookingsForDate(day);
    return (
      <div className="relative">
        <span>{format(day, 'd')}</span>
        {dayBookings.length > 0 && (
          <div className="absolute -top-1 -right-1">
            <Badge variant="secondary" className="h-4 w-4 p-0 text-xs">
              {dayBookings.length}
            </Badge>
          </div>
        )}
      </div>
    );
  }

  function CustomCaption(props: { displayMonth: Date }) {
    const { goToMonth, nextMonth, previousMonth } = useNavigation();
    return (
      <div className="flex items-center justify-between mb-2 px-2">
        <button
          className="rounded p-1 hover:bg-accent disabled:opacity-50"
          onClick={() => previousMonth && goToMonth(previousMonth)}
          disabled={!previousMonth}
        >
          <span className="sr-only">Previous month</span>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="font-semibold text-lg">{format(props.displayMonth, 'MMMM yyyy')}</span>
        <button
          className="rounded p-1 hover:bg-accent disabled:opacity-50"
          onClick={() => nextMonth && goToMonth(nextMonth)}
          disabled={!nextMonth}
        >
          <span className="sr-only">Next month</span>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name} - {location.building}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {userRole === 'faculty' && (
          <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Booking
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Booking</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateBooking} className="space-y-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Select
                    value={bookingForm.location_id}
                    onValueChange={(value) => setBookingForm({ ...bookingForm, location_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name} - {location.building}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={bookingForm.start_time}
                      onChange={(e) => setBookingForm({ ...bookingForm, start_time: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      type="datetime-local"
                      value={bookingForm.end_time}
                      onChange={(e) => setBookingForm({ ...bookingForm, end_time: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={bookingForm.title}
                    onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="purpose">Purpose</Label>
                  <Input
                    id="purpose"
                    value={bookingForm.purpose}
                    onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={bookingForm.description}
                    onChange={(e) => setBookingForm({ ...bookingForm, description: e.target.value })}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsBookingDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Booking</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                Location Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                className="rounded-md border"
                components={{
                  Caption: CustomCaption,
                  DayContent: CustomDayContent
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Bookings for {date ? format(date, 'MMMM d, yyyy') : 'Selected Date'}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : (
                <div className="space-y-3">
                  {getBookingsForDate(date || new Date()).map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{booking.title}</h4>
                          <p className="text-sm text-gray-600">{booking.purpose}</p>
                          <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>
                              {format(parseISO(booking.start_time), 'HH:mm')} - 
                              {format(parseISO(booking.end_time), 'HH:mm')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            <span>{booking.location.name}</span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                            <Users className="h-3 w-3" />
                            <span>{booking.faculty.user.name}</span>
                          </div>
                        </div>
                        
                        {userRole === 'faculty' && (
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(booking)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteBooking(booking.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {getBookingsForDate(date || new Date()).length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No bookings for this date
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Booking Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Booking</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateBooking} className="space-y-4">
            <div>
              <Label htmlFor="edit_location">Location</Label>
              <Select
                value={bookingForm.location_id}
                onValueChange={(value) => setBookingForm({ ...bookingForm, location_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name} - {location.building}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_start_time">Start Time</Label>
                <Input
                  id="edit_start_time"
                  type="datetime-local"
                  value={bookingForm.start_time}
                  onChange={(e) => setBookingForm({ ...bookingForm, start_time: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_end_time">End Time</Label>
                <Input
                  id="edit_end_time"
                  type="datetime-local"
                  value={bookingForm.end_time}
                  onChange={(e) => setBookingForm({ ...bookingForm, end_time: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit_title">Title</Label>
              <Input
                id="edit_title"
                value={bookingForm.title}
                onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit_purpose">Purpose</Label>
              <Input
                id="edit_purpose"
                value={bookingForm.purpose}
                onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={bookingForm.description}
                onChange={(e) => setBookingForm({ ...bookingForm, description: e.target.value })}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Booking</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 