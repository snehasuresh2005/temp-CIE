'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Calendar, Clock, MapPin, Users, Plus, Search, Building, CalendarIcon } from 'lucide-react';
import { LocationCalendar } from '@/components/location-calendar';
import { useAuth } from '@/components/auth-provider';

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
  const [currentView, setCurrentView] = useState<'calendar' | 'list'>('calendar');

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

  useEffect(() => {
    fetchLocations();
    fetchMyBookings();
  }, [searchTerm, locationTypeFilter]);

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
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
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
        fetchMyBookings();
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

  const checkAvailability = async (locationId: string, startTime: string, endTime: string) => {
    try {
      const response = await fetch(
        `/api/locations/availability?locationId=${locationId}&startTime=${startTime}&endTime=${endTime}`
      );
      const data = await response.json();
      return data.available;
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
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

  const filteredLocations = locations.filter(location => 
    location.is_available && 
    (!selectedLocation || location.id === selectedLocation)
  );

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Location Booking</h1>
          <p className="text-gray-600">Book locations for your classes and meetings</p>
        </div>
      </div>

      {/* Note about student calendars */}
      <div className="mb-2 text-sm text-blue-700 bg-blue-50 rounded px-3 py-2">
        Bookings will appear in student calendars.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Locations */}
        <Card className="col-span-2 p-0">
          <CardHeader>
            <CardTitle>Available Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-4">Loading locations...</div>
              ) : filteredLocations.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No available locations found</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredLocations.map((location) => (
                    <Card key={location.id} className="overflow-hidden">
                      {location.images && location.images.length > 0 && (
                        <div className="relative h-40 group">
                          <img
                            src={location.images[0]}
                            alt={location.name}
                            className="w-full h-40 object-cover"
                          />
                          {location.images.length > 1 && (
                            <div className="absolute inset-0 flex items-center justify-between px-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="pointer-events-auto bg-white/80 rounded-full">
                                <span className="px-2">◀</span>
                              </div>
                              <div className="pointer-events-auto bg-white/80 rounded-full">
                                <span className="px-2">▶</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{capitalizeWords(location.name)}</CardTitle>
                            <p className="text-sm text-gray-600">{location.room_number}</p>
                          </div>
                          <Badge className={getLocationTypeColor(location.location_type)}>
                            {location.location_type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 pt-0">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Building className="h-4 w-4" />
                          <span>{capitalizeWords(location.building)}, {getOrdinal(location.floor)}</span>
                          {location.wing && <span>- {location.wing}</span>}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          <span>Capacity: {location.capacity}</span>
                        </div>
                        {location.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{location.description}</p>
                        )}
                        <div className="flex justify-end pt-2">
                          <Button size="sm" variant="default" onClick={() => { setIsBookingDialogOpen(true); setBookingForm(f => ({ ...f, location_id: location.id })); }}>
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

        {/* My Bookings */}
        <Card className="col-span-1 p-0">
          <CardHeader>
            <CardTitle>My Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {myBookings.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No bookings found</div>
            ) : (
              <div className="space-y-3">
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
                        <Button size="sm" variant="outline" onClick={() => { setBookingToDelete(booking); setDeleteDialogOpen(true); }}>
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
      </div>

      {/* Booking Dialog and Delete Dialog remain unchanged */}
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
    </div>
  );
} 