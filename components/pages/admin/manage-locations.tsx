"use client"

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
import { Plus, Edit, Trash2, Upload, Search, Building, Users, MapPin, X } from 'lucide-react';
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
  created_date: string;
  bookings: any[];
}

interface LocationFormData {
  name: string;
  building: string;
  floor: string;
  wing: string;
  room_number: string;
  location_type: string;
  capacity: number;
  description: string;
  images: string[];
}

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

export function ManageLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationTypeFilter, setLocationTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);

  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    building: '',
    floor: '',
    wing: '',
    room_number: '',
    location_type: '',
    capacity: 0,
    description: '',
    images: [],
  });

  useEffect(() => {
    fetchLocations();
  }, [currentPage, searchTerm, locationTypeFilter]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      let url = `/api/locations?page=${currentPage}&limit=10`;
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      if (locationTypeFilter) {
        url += `&type=${locationTypeFilter}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      setLocations(data.locations || []);
      setTotalPages(data.pagination?.totalPages || 1);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingLocation 
        ? `/api/locations/${editingLocation.id}`
        : '/api/locations';
      
      const method = editingLocation ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'cmc98i24d0000rb1ov4xn2w2n', // Correct admin user ID
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: editingLocation ? 'Location updated successfully' : 'Location created successfully',
        });
        setIsDialogOpen(false);
        resetForm();
        fetchLocations();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to save location',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving location:', error);
      toast({
        title: 'Error',
        description: 'Failed to save location',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!locationToDelete) return;
    try {
      const response = await fetch(`/api/locations/${locationToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': 'cmc98i24d0000rb1ov4xn2w2n', // Correct admin user ID
        },
      });
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Location deleted successfully',
        });
        fetchLocations();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to delete location',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete location',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setLocationToDelete(null);
    }
  };

  const handleImageUpload = async (files: FileList) => {
    if (!files.length) return;

    try {
      setUploadingImages(true);
      const formData = new FormData();
      
      Array.from(files).forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch('/api/locations/upload', {
        method: 'POST',
        headers: {
          'x-user-id': 'cmc98i24d0000rb1ov4xn2w2n', // Correct admin user ID
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...data.images],
        }));
        toast({
          title: 'Success',
          description: 'Images uploaded successfully',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to upload images',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload images',
        variant: 'destructive',
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const openEditDialog = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      building: location.building,
      floor: location.floor,
      wing: location.wing || '',
      room_number: location.room_number,
      location_type: location.location_type,
      capacity: location.capacity,
      description: location.description || '',
      images: location.images,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingLocation(null);
    setFormData({
      name: '',
      building: '',
      floor: '',
      wing: '',
      room_number: '',
      location_type: '',
      capacity: 0,
      description: '',
      images: [],
    });
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Locations</h1>
          <p className="text-gray-600">Create and manage all locations in the institution</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingLocation ? 'Edit Location' : 'Add New Location'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter location name (e.g., Computer Lab 101)"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="room_number">Room Number</Label>
                  <Input
                    id="room_number"
                    placeholder="Enter room number (e.g., 101, A-201)"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="building">Building</Label>
                  <Input
                    id="building"
                    placeholder="Enter building name (e.g., Main Building, Science Block)"
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="floor">Floor</Label>
                  <Input
                    id="floor"
                    placeholder="Enter floor number (e.g., 1, 2, Ground)"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="wing">Wing (Optional)</Label>
                  <Input
                    id="wing"
                    placeholder="Enter wing name (e.g., North, South, East)"
                    value={formData.wing}
                    onChange={(e) => setFormData({ ...formData, wing: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="location_type">Location Type</Label>
                  <Select
                    value={formData.location_type}
                    onValueChange={(value) => setFormData({ ...formData, location_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location type" />
                    </SelectTrigger>
                    <SelectContent>
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
              </div>

              <div>
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  placeholder="Enter maximum capacity (e.g., 30, 100)"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div>
                <Label>Images</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                      disabled={uploadingImages}
                    />
                    {uploadingImages && <span className="text-sm text-gray-500">Uploading...</span>}
                  </div>
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative group cursor-pointer">
                          <img
                            src={image}
                            alt={`Location ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                            onClick={() => setPreviewImage(image)}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-6 w-6 p-0"
                            onClick={() => removeImage(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {previewImage && (
                    <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
                      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-transparent shadow-none border-none">
                        <div className="relative w-full h-full flex items-center justify-center bg-black/80 rounded-lg">
                          <img 
                            src={previewImage} 
                            alt="Preview" 
                            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl" 
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white"
                            onClick={() => setPreviewImage(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter location description (e.g., Computer lab with 30 workstations, projector, and whiteboard)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={!formData.name || !formData.room_number || !formData.building || !formData.floor || !formData.location_type || formData.capacity <= 0}
                >
                  {editingLocation ? 'Update Location' : 'Create Location'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
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

      {loading ? (
        <div className="text-center py-8">Loading locations...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location) => (
            <Card key={location.id} className="overflow-hidden">
              {location.images.length > 0 && (
                <div className="relative h-48 group">
                  <Carousel className="w-full h-full">
                    <CarouselContent>
                      {location.images.map((image, index) => (
                        <CarouselItem key={index}>
                          <img
                            src={image}
                            alt={`${location.name} ${index + 1}`}
                            className="w-full h-48 object-cover"
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
              
              <CardHeader>
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
              
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Building className="h-4 w-4" />
                  <span>{capitalizeWords(location.building)}, {getOrdinal(location.floor)}</span>
                  {location.wing && <span>- {location.wing}</span>}
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>Capacity: {location.capacity}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{location.bookings?.length || 0} upcoming bookings</span>
                </div>
                
                {location.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{location.description}</p>
                )}
                
                <div className="flex items-center justify-between pt-2">
                  <Badge variant={location.is_available ? "default" : "secondary"}>
                    {location.is_available ? 'Available' : 'Unavailable'}
                  </Badge>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(location)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setLocationToDelete(location); setDeleteDialogOpen(true); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Location</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to delete <b>{locationToDelete ? capitalizeWords(locationToDelete.name) : ''}</b>? This action cannot be undone.</div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setLocationToDelete(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
