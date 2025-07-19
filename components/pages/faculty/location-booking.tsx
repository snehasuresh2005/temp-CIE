'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Calendar, Clock, MapPin, Users, Plus, Search, Building, CalendarIcon, Loader2, Filter, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { LocationCalendar } from '@/components/location-calendar';
import { useAuth } from '@/components/auth-provider';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

interface Location {
  id: string;
  name: string;
  building: string;
  floor: string;
  wing?: string;
  room_number: string;
  location_type: string;
  images: string[];
  capacity: number;
  description?: string;
  is_available: boolean;
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

export function LocationBooking() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [myBookings, setMyBookings] = useState<LocationBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationTypeFilter, setLocationTypeFilter] = useState('all');
  const [currentView, setCurrentView] = useState<'rooms' | 'bookings'>('rooms');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<'checking' | 'available' | 'unavailable' | null>(null);

  const [bookingForm, setBookingForm] = useState({
    location_id: '',
    start_time: '',
    end_time: '',
    purpose: '',
    title: '',
    description: '',
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<LocationBooking | null>(null);

  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [calendarLocation, setCalendarLocation] = useState<Location | null>(null);

  const [infoDialogOpen, setInfoDialogOpen] = useState<string | null>(null);
  const [infoImageIndex, setInfoImageIndex] = useState(0);

  useEffect(() => {
    fetchLocations();
    fetchMyBookings();
  }, [searchTerm, locationTypeFilter]);

  // Check availability when booking form changes
  useEffect(() => {
    if (bookingForm.location_id && bookingForm.start_time && bookingForm.end_time) {
      checkAvailability();
    } else {
      setAvailabilityStatus(null);
    }
  }, [bookingForm.location_id, bookingForm.start_time, bookingForm.end_time]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      let url = '/api/locations?limit=100';
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      if (locationTypeFilter && locationTypeFilter !== 'all') {
        url += `&type=${locationTypeFilter}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setLocations(data.locations || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch locations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBookings = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/location-bookings?facultyId=current`, {
        headers: {
          'x-user-id': user.id,
        },
      });
      const data = await response.json();
      setMyBookings(data.bookings || []);
    } catch (error) {
      console.error('Error fetching my bookings:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch your bookings',
        variant: 'destructive',
      });
    }
  };

  const checkAvailability = async () => {
    if (!bookingForm.location_id || !bookingForm.start_time || !bookingForm.end_time) {
      setAvailabilityStatus(null);
      return;
    }

    setAvailabilityStatus('checking');
    try {
      const response = await fetch(
        `/api/location-bookings?locationId=${bookingForm.location_id}&startDate=${bookingForm.start_time}&endDate=${bookingForm.end_time}`
      );
      const data = await response.json();
      
      // If there are existing bookings, it's unavailable
      const isAvailable = data.bookings.length === 0;
      setAvailabilityStatus(isAvailable ? 'available' : 'unavailable');
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailabilityStatus('unavailable');
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate form
    if (!bookingForm.location_id || !bookingForm.start_time || !bookingForm.end_time || !bookingForm.purpose || !bookingForm.title) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Check if end time is after start time
    const startDate = new Date(bookingForm.start_time);
    const endDate = new Date(bookingForm.end_time);
    if (startDate >= endDate) {
      toast({
        title: 'Error',
        description: 'End time must be after start time',
        variant: 'destructive',
      });
      return;
    }

    // Check if booking is in the future
    if (startDate < new Date()) {
      toast({
        title: 'Error',
        description: 'Cannot book locations in the past',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/location-bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify(bookingForm),
      });

      if (response.ok) {
        const booking = await response.json();
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
        setAvailabilityStatus(null);
        fetchMyBookings();
        fetchLocations(); // Refresh locations to update availability
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBooking = async () => {
    if (!bookingToDelete || !user) return;
    try {
      const response = await fetch(`/api/location-bookings/${bookingToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id,
        },
      });
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Booking deleted successfully',
        });
        fetchMyBookings();
        fetchLocations(); // Refresh locations to update availability
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
    } finally {
      setDeleteDialogOpen(false);
      setBookingToDelete(null);
    }
  };

  const handleLocationSelect = (locationId: string) => {
    setBookingForm(prev => ({ ...prev, location_id: locationId }));
    setIsBookingDialogOpen(true);
  };

  const getLocationTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'LECTURE_HALL': 'bg-blue-100 text-blue-800',
      'LAB': 'bg-green-100 text-green-800',
      'AUDITORIUM': 'bg-purple-100 text-purple-800',
      'SEMINAR_HALL': 'bg-orange-100 text-orange-800',
      'CABIN': 'bg-gray-100 text-gray-800',
      'CLASSROOM': 'bg-indigo-100 text-indigo-800',
      'OFFICE': 'bg-red-100 text-red-800',
      'WAREHOUSE': 'bg-yellow-100 text-yellow-800',
      'OTHER': 'bg-slate-100 text-slate-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const filteredLocations = locations.filter(location => location.is_available);

  // Utility to get ordinal suffix for a number
  function getOrdinal(n: string | number) {
    const num = typeof n === 'string' ? parseInt(n) : n;
    if (isNaN(num)) return n;
    const s = ["th", "st", "nd", "rd"], v = num % 100;
    return num + (s[(v - 20) % 10] || s[v] || s[0]) + ' Floor';
  }

  // Utility to capitalize each word
  function capitalizeWords(str: string) {
    return str.replace(/\b\w/g, c => c.toUpperCase());
  }

  const getAvailabilityStatusDisplay = () => {
    switch (availabilityStatus) {
      case 'checking':
        return (
          <div className="flex items-center space-x-2 text-sm text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Checking availability...</span>
          </div>
        );
      case 'available':
        return (
          <div className="flex items-center space-x-2 text-sm text-green-600">
            <span>✓ Available for booking</span>
          </div>
        );
      case 'unavailable':
        return (
          <div className="flex items-center space-x-2 text-sm text-red-600">
            <span>✗ Not available for this time slot</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Room Booking</h1>
        </div>
      </div>

      {/* Search, Filter, and My Bookings */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Search with icon inside */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <Search className="h-4 w-4" />
            </span>
            <Input
              className="pl-10"
              placeholder="Search rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* Filter icon */}
          <span className="text-gray-500">
            <Filter className="h-5 w-5" />
          </span>
          {/* Filter select */}
          <Select value={locationTypeFilter} onValueChange={setLocationTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="CABIN">Cabin</SelectItem>
              <SelectItem value="LECTURE_HALL">Lecture Hall</SelectItem>
              <SelectItem value="AUDITORIUM">Auditorium</SelectItem>
              <SelectItem value="SEMINAR_HALL">Seminar Hall</SelectItem>
              <SelectItem value="LAB">Lab</SelectItem>
              <SelectItem value="CLASSROOM">Classroom</SelectItem>
              <SelectItem value="OFFICE">Office</SelectItem>
              <SelectItem value="WAREHOUSE">Warehouse</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Toggle buttons for Available Rooms and My Bookings */}
        <div className="flex space-x-2">
          <Button
            variant={currentView === 'rooms' ? 'default' : 'outline'}
            onClick={() => setCurrentView('rooms')}
          >
            <Building className="h-4 w-4 mr-2" />
            Available Rooms
          </Button>
          <Button
            variant={currentView === 'bookings' ? 'default' : 'outline'}
            onClick={() => setCurrentView('bookings')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            My Bookings ({myBookings.length})
          </Button>
        </div>
      </div>

      {/* Dynamic Content Based on Current View */}
      {currentView === 'rooms' ? (
        /* Available Rooms View */
        <Card className="p-0">
          <CardHeader>
            <CardTitle>Available Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-4">Loading rooms...</div>
              ) : filteredLocations.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No available rooms found</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLocations.map((location) => (
                    <Card key={location.id} className="flex flex-col h-full hover:shadow-md transition-shadow duration-200">
                      <CardHeader className="p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="flex items-center space-x-2 text-sm">
                              <Building className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{capitalizeWords(location.name)}</span>
                            </CardTitle>
                            <CardDescription className="text-xs">{location.location_type.replace('_', ' ')}</CardDescription>
                          </div>
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <Badge className="bg-green-100 text-green-800 text-xs px-1 py-0.5">
                              Available
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-gray-400 hover:text-gray-600"
                              onClick={() => setInfoDialogOpen(location.id)}
                            >
                              <Info className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="flex-grow flex flex-col p-3 pt-0">
                        <div className="space-y-3 flex-grow">
                          {/* Image Display */}
                          {location.images && location.images.length > 0 && (
                            <div className="relative w-full h-48">
                              <Carousel className="w-full h-full">
                                <CarouselContent>
                                  {location.images.map((image, index) => (
                                    <CarouselItem key={index} className="flex items-center justify-center h-48">
                                      <img
                                        src={image}
                                        alt={`${location.name} ${index + 1}`}
                                        className="w-full h-full object-contain rounded-md bg-gray-50"
                                        onError={(e) => {
                                          e.currentTarget.src = "/placeholder.jpg"
                                        }}
                                      />
                                    </CarouselItem>
                                  ))}
                                </CarouselContent>
                                {location.images.length > 1 && (
                                  <div className="absolute inset-0 flex items-center justify-between px-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="pointer-events-auto bg-white/80 rounded-full">
                                      <CarouselPrevious className="left-2 top-1/2 -translate-y-1/2" />
                                    </div>
                                    <div className="pointer-events-auto bg-white/80 rounded-full">
                                      <CarouselNext className="right-2 top-1/2 -translate-y-1/2" />
                                    </div>
                                  </div>
                                )}
                              </Carousel>
                            </div>
                          )}
                          
                          <div className="space-y-1">
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                              <div><span className="font-medium">Room:</span> {location.room_number}</div>
                              <div><span className="font-medium">Capacity:</span> {location.capacity}</div>
                            </div>
                            
                            <div className="text-xs text-gray-500">
                              <span className="font-medium">Building:</span> {capitalizeWords(location.building)}, {getOrdinal(location.floor)}
                              {location.wing && <span> - {location.wing}</span>}
                            </div>
                          </div>
                          
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex space-x-2 pt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCalendarLocation(location);
                              setCalendarDialogOpen(true);
                            }}
                            className="flex-1"
                          >
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            Calendar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="default" 
                            onClick={() => handleLocationSelect(location.id)}
                            className="flex-1"
                          >
                            Book Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* My Bookings View */
        <Card className="p-0">
          <CardHeader>
            <CardTitle>My Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {myBookings.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No bookings found</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myBookings.map((booking) => (
                  <Card key={booking.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{booking.title}</CardTitle>
                          <p className="text-xs text-gray-600">{booking.location?.room_number}</p>
                        </div>
                        <Badge className={getLocationTypeColor(booking.location?.location_type)}>
                          {booking.location?.location_type?.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1 pt-0">
                      <div className="flex items-center space-x-2 text-xs text-gray-600">
                        <Building className="h-3 w-3" />
                        <span>{capitalizeWords(booking.location?.building)}, {getOrdinal(booking.location?.floor)}</span>
                        {booking.location?.wing && <span>- {booking.location.wing}</span>}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-600">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(booking.start_time).toLocaleString()} - {new Date(booking.end_time).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-600">
                        <Users className="h-3 w-3" />
                        <span>Capacity: {booking.location?.capacity}</span>
                      </div>
                      {booking.purpose && (
                        <p className="text-xs text-gray-600">Purpose: {booking.purpose}</p>
                      )}
                      <div className="flex justify-end pt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => { setBookingToDelete(booking); setDeleteDialogOpen(true); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
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
                  {filteredLocations.map((location) => (
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

            {/* Availability Status */}
            {getAvailabilityStatusDisplay()}
            
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={bookingForm.title}
                onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                placeholder="Enter booking title"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="purpose">Purpose</Label>
              <Input
                id="purpose"
                value={bookingForm.purpose}
                onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                placeholder="Enter booking purpose"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={bookingForm.description}
                onChange={(e) => setBookingForm({ ...bookingForm, description: e.target.value })}
                placeholder="Enter additional details (optional)"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsBookingDialogOpen(false);
                  setBookingForm({
                    location_id: '',
                    start_time: '',
                    end_time: '',
                    purpose: '',
                    title: '',
                    description: '',
                  });
                  setAvailabilityStatus(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || availabilityStatus === 'unavailable'}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Booking'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Booking</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to delete the booking <b>{bookingToDelete ? bookingToDelete.title : ''}</b>? This action cannot be undone.</div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setBookingToDelete(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteBooking}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Calendar Dialog */}
      <Dialog open={calendarDialogOpen} onOpenChange={setCalendarDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              📅 Booking Calendar for {calendarLocation?.name}
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-1">
              {calendarLocation?.building}, {calendarLocation?.room_number} • Capacity: {calendarLocation?.capacity}
            </p>
          </DialogHeader>
          {calendarLocation && (
            <div className="mt-4">
              <LocationCalendar
                userRole="FACULTY"
                userId={user?.id}
                locationId={calendarLocation.id}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Info Dialog */}
      <Dialog open={infoDialogOpen !== null} onOpenChange={(open) => {
        if (!open) {
          setInfoDialogOpen(null);
          setInfoImageIndex(0);
        }
      }}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Room Details</DialogTitle>
          </DialogHeader>
          {infoDialogOpen && (() => {
            const location = locations.find(loc => loc.id === infoDialogOpen);
            if (!location) return null;
            
            return (
              <div className="flex flex-col md:flex-row gap-8">
                {/* Left: Details */}
                <div className="flex-1 min-w-0">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Building className="h-5 w-5 text-gray-500" />
                        {capitalizeWords(location.name)}
                      </h3>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">Available</span>
                    </div>
                    <div className="flex flex-row items-end justify-center pl-8">
                      <div>
                        <h4 className="font-medium text-sm">Room Number</h4>
                        <p className="text-lg font-semibold text-gray-900 text-center">{location.room_number}</p>
                      </div>
                      <div className="ml-16 text-center">
                        <h4 className="font-medium text-sm">Capacity</h4>
                        <p className="text-lg font-semibold text-green-600 text-center">{location.capacity}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Location & Type</h4>
                      <p className="text-sm text-gray-700">
                        {capitalizeWords(location.building)}, {getOrdinal(location.floor)}
                        {location.wing && <span> - {location.wing}</span>} • {location.location_type.replace('_', ' ')}
                      </p>
                    </div>
                    {location.description && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Description</h4>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{location.description}</p>
                      </div>
                    )}
                  </div>
                </div>
                {/* Right: Image Preview */}
                <div className="flex-1 flex flex-col items-center justify-center min-w-0">
                  <div className="relative w-full max-w-xs aspect-square bg-gray-50 rounded-lg border flex items-center justify-center overflow-hidden">
                    {location.images && location.images.length > 0 ? (
                      <>
                        <img
                          src={location.images[infoImageIndex]}
                          alt={`${location.name} ${infoImageIndex + 1}`}
                          className="object-contain w-full h-full"
                          onError={e => { e.currentTarget.src = '/placeholder.jpg'; }}
                        />
                        {location.images.length > 1 && (
                          <>
                            {/* Left arrow */}
                            {infoImageIndex > 0 && (
                              <button
                                className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center border z-10"
                                onClick={() => setInfoImageIndex(prev => prev - 1)}
                                type="button"
                                aria-label="Previous Image"
                              >
                                <ChevronLeft className="h-6 w-6" />
                              </button>
                            )}
                            {/* Right arrow */}
                            {infoImageIndex < location.images.length - 1 && (
                              <button
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center border z-10"
                                onClick={() => setInfoImageIndex(prev => prev + 1)}
                                type="button"
                                aria-label="Next Image"
                              >
                                <ChevronRight className="h-6 w-6" />
                              </button>
                            )}
                            {/* Image indicators */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1 z-10">
                              {location.images.map((_, index) => (
                                <div 
                                  key={index}
                                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                                    index === infoImageIndex ? 'bg-white' : 'bg-white/50'
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400">No Image</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
} 