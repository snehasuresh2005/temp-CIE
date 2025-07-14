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
import { Calendar as CalendarIcon, Clock, MapPin, Users, Plus, Edit, Trash2, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
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
  userRole: 'ADMIN' | 'FACULTY';
  userId?: string;
  locationId?: string;
  onSlotSelect?: (start: string, end: string) => void;
}

export function LocationCalendar({ userRole, userId, locationId, onSlotSelect }: LocationCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [locations, setLocations] = useState<Location[]>([]);
  const [bookings, setBookings] = useState<LocationBooking[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>(locationId || 'all');
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

  // Add state for month navigation
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  useEffect(() => {
    if (locationId) {
      setSelectedLocation(locationId);
    }
    fetchLocations();
    fetchBookings();
  }, [selectedLocation, date, locationId]);

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
      
      if (userRole === 'FACULTY' && userId) {
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
      if (locationId && booking.location_id !== locationId) return false;
      const bookingDate = new Date(booking.start_time);
      return (
        bookingDate.getFullYear() === date.getFullYear() &&
        bookingDate.getMonth() === date.getMonth() &&
        bookingDate.getDate() === date.getDate()
      );
    });
  };

  // Update handleDateSelect to update calendarMonth
  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      setCalendarMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  };

  // Navigation handlers
  const goToPrevMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const goToNextMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
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

  // CustomCaption: just the month/year label, no navigation
  function CustomCaption(props: { displayMonth: Date }) {
    return (
      <div className="flex items-center justify-center px-4 py-2">
        <h2 className="text-lg font-semibold text-gray-800">
          {format(props.displayMonth, 'MMMM yyyy')}
        </h2>
      </div>
    );
  }

  // CustomDayContent: highlight only today, no blue, use gray bg and bold
  function CustomDayContent(props: { date: Date }) {
    const day = props.date;
    const dayBookings = getBookingsForDate(day);
    const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span className={`${isToday ? 'font-bold bg-gray-200 rounded-full px-2 py-1 text-gray-900' : ''}`}>
          {format(day, 'd')}
        </span>
        {dayBookings.length > 0 && (
          <div className="absolute -top-0.5 -right-0.5">
            <Badge 
              variant="secondary" 
              className="h-4 w-4 p-0 text-xs bg-gray-100 text-gray-700 border-gray-200 rounded-full flex items-center justify-center"
            >
              {dayBookings.length > 9 ? '9+' : dayBookings.length}
            </Badge>
          </div>
        )}
      </div>
    );
  }

  const selectedLocationData = locations.find(loc => loc.id === selectedLocation);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className="text-gray-600 text-bold text-xl space-x-4">
                {locationId ? `Manage bookings for ${selectedLocationData?.name}` : 'View and manage location bookings across facilities'}
              </p>
            </div>
            
            {userRole === 'FACULTY' && (
              <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
                    <Plus className="h-4 w-4 mr-2" />
                    New Booking
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-gray-900">Create New Booking</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateBooking} className="space-y-4">
                    <div>
                      <Label htmlFor="location" className="text-sm font-medium text-gray-700">Location</Label>
                      <Select
                        value={bookingForm.location_id}
                        onValueChange={(value) => setBookingForm({ ...bookingForm, location_id: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              <div className="flex items-center space-x-2">
                                <Building2 className="h-4 w-4 text-gray-500" />
                                <span>{location.name} - {location.building}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start_time" className="text-sm font-medium text-gray-700">Start Time</Label>
                        <Input
                          id="start_time"
                          type="datetime-local"
                          className="mt-1"
                          value={bookingForm.start_time}
                          onChange={(e) => setBookingForm({ ...bookingForm, start_time: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="end_time" className="text-sm font-medium text-gray-700">End Time</Label>
                        <Input
                          id="end_time"
                          type="datetime-local"
                          className="mt-1"
                          value={bookingForm.end_time}
                          onChange={(e) => setBookingForm({ ...bookingForm, end_time: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="title" className="text-sm font-medium text-gray-700">Title</Label>
                      <Input
                        id="title"
                        className="mt-1"
                        value={bookingForm.title}
                        onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                        placeholder="Enter booking title"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="purpose" className="text-sm font-medium text-gray-700">Purpose</Label>
                      <Input
                        id="purpose"
                        className="mt-1"
                        value={bookingForm.purpose}
                        onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                        placeholder="Enter booking purpose"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                      <Textarea
                        id="description"
                        className="mt-1"
                        value={bookingForm.description}
                        onChange={(e) => setBookingForm({ ...bookingForm, description: e.target.value })}
                        placeholder="Additional details (optional)"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsBookingDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                        Create Booking
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Location Filter */}
          {!locationId && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center space-x-4">
                <Label className="text-sm font-medium text-gray-700">Filter by Location:</Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <span>All Locations</span>
                      </div>
                    </SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-gray-500" />
                          <span>{location.name} - {location.building}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Calendar Section */}
          <div className="xl:col-span-2">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-white rounded-t-lg flex flex-col gap-2">
                <div className="flex items-center justify-between w-full">
                  <button onClick={goToPrevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50" aria-label="Previous month">
                    <ChevronLeft className="h-5 w-5 text-gray-600" />
                  </button>
                  <span className="text-lg font-semibold text-gray-800">
                    {format(calendarMonth, 'MMMM yyyy')}
                  </span>
                  <button onClick={goToNextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50" aria-label="Next month">
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  className="w-full"
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4 w-full",
                    caption: "flex justify-center pt-1 items-center",
                    caption_label: "text-sm font-medium",
                    nav: "hidden", // hide navigation inside calendar
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] bg-gray-50 text-center py-2",
                    row: "flex w-full mt-2",
                    cell: "text-center text-sm relative p-0 focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent",
                    day: "h-12 w-12 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-lg transition-colors",
                    day_selected: "bg-gray-800 text-white hover:bg-gray-900 focus:bg-gray-800",
                    day_today: "bg-gray-200 text-gray-900 font-bold",
                    day_outside: "text-muted-foreground opacity-50",
                    day_disabled: "text-muted-foreground opacity-50",
                    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                    day_hidden: "invisible",
                  }}
                  components={{
                    Caption: CustomCaption,
                    DayContent: CustomDayContent
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Bookings Panel */}
          <div>
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="text-lg flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  {date ? format(date, 'MMMM d, yyyy') : 'Select a Date'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {getBookingsForDate(date || new Date()).map((booking) => (
                      <div key={booking.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">{booking.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{booking.purpose}</p>
                            
                            <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {format(parseISO(booking.start_time), 'HH:mm')} - 
                                  {format(parseISO(booking.end_time), 'HH:mm')}
                                </span>
                              </div>
                            </div>
                            
                            {!locationId && (
                              <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{booking.location.name}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-1 mt-1 text-xs text-gray-500">
                              <Users className="h-3 w-3" />
                              <span className="truncate">{booking.faculty.user.name}</span>
                            </div>
                          </div>
                          
                          {userRole === 'FACULTY' && (
                            <div className="flex space-x-1 ml-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-blue-100"
                                onClick={() => openEditDialog(booking)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
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
                      <div className="text-center py-12">
                        <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No bookings for this date</p>
                        <p className="text-sm text-gray-400 mt-1">Select a different date to view bookings</p>
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
              <DialogTitle className="text-xl font-semibold text-gray-900">Edit Booking</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateBooking} className="space-y-4">
              <div>
                <Label htmlFor="edit_location" className="text-sm font-medium text-gray-700">Location</Label>
                <Select
                  value={bookingForm.location_id}
                  onValueChange={(value) => setBookingForm({ ...bookingForm, location_id: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-gray-500" />
                          <span>{location.name} - {location.building}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_start_time" className="text-sm font-medium text-gray-700">Start Time</Label>
                  <Input
                    id="edit_start_time"
                    type="datetime-local"
                    className="mt-1"
                    value={bookingForm.start_time}
                    onChange={(e) => setBookingForm({ ...bookingForm, start_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_end_time" className="text-sm font-medium text-gray-700">End Time</Label>
                  <Input
                    id="edit_end_time"
                    type="datetime-local"
                    className="mt-1"
                    value={bookingForm.end_time}
                    onChange={(e) => setBookingForm({ ...bookingForm, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit_title" className="text-sm font-medium text-gray-700">Title</Label>
                <Input
                  id="edit_title"
                  className="mt-1"
                  value={bookingForm.title}
                  onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit_purpose" className="text-sm font-medium text-gray-700">Purpose</Label>
                <Input
                  id="edit_purpose"
                  className="mt-1"
                  value={bookingForm.purpose}
                  onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit_description" className="text-sm font-medium text-gray-700">Description</Label>
                <Textarea
                  id="edit_description"
                  className="mt-1"
                  value={bookingForm.description}
                  onChange={(e) => setBookingForm({ ...bookingForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  Update Booking
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}