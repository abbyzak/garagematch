'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Car, DollarSign, MapPin, Settings, Plus, Edit, Building2, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface GarageProfile {
  id?: string;
  name: string;
  location: string;
  postalCode: string;
  phone: string;
  email: string;
  description: string;
  workingHours: {
    [key: string]: { open: string; close: string; isOpen: boolean };
  };
  services: { serviceId: string; serviceName: string; price: number }[];
  images: string[];
}

interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  clientUserId?: string;
  vehicle: string;
  service: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number;
}

export function GarageOwnerDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [garageProfile, setGarageProfile] = useState<GarageProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(!garageProfile);
  const [ownedGarages, setOwnedGarages] = useState<any[]>([]);
  const [selectedGarageId, setSelectedGarageId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);

  // Profile form state
  const [profileForm, setProfileForm] = useState<GarageProfile>({
    name: '',
    location: '',
    postalCode: '',
    phone: '',
    email: user?.email || '',
    description: '',
    workingHours: {
      monday: { open: '08:00', close: '17:00', isOpen: true },
      tuesday: { open: '08:00', close: '17:00', isOpen: true },
      wednesday: { open: '08:00', close: '17:00', isOpen: true },
      thursday: { open: '08:00', close: '17:00', isOpen: true },
      friday: { open: '08:00', close: '17:00', isOpen: true },
      saturday: { open: '09:00', close: '16:00', isOpen: true },
      sunday: { open: '10:00', close: '15:00', isOpen: false },
    },
    services: [],
    images: [],
  });

  const [newService, setNewService] = useState({ serviceId: undefined as string | undefined, serviceName: '', price: 0 });
  const [isAddingService, setIsAddingService] = useState(false);

  // Mock available services (in real app, fetch from admin-defined services)
  const availableServices = [
    { id: '1', name: 'Oil Change', category: 'Maintenance' },
    { id: '2', name: 'Brake Service', category: 'Repair' },
    { id: '3', name: 'Tire Service', category: 'Maintenance' },
    { id: '4', name: 'Battery Service', category: 'Repair' },
    { id: '5', name: 'Engine Diagnostic', category: 'Inspection' },
  ];

  // Load owned garages and prefill profile
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/garages?ownerId=${encodeURIComponent(user.id)}`);
        const json = await res.json();
        if (res.ok) {
          const items = Array.isArray(json.items) ? json.items : [];
          setOwnedGarages(items);
          if (items.length > 0) {
            setSelectedGarageId(items[0].id);
            const g = items[0];
            setGarageProfile({
              id: g.id,
              name: g.name || '',
              location: g.addressLine1 || g.city || '',
              postalCode: g.postalCode || '',
              phone: '',
              email: user.email,
              description: g.description || '',
              workingHours: profileForm.workingHours,
              services: profileForm.services,
              images: [],
            });
            setIsCreatingProfile(false);
          }
        }
      } catch (e) {
        console.error('load garages failed', e);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Load bookings for selected garage
  useEffect(() => {
    if (!selectedGarageId) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/bookings?garageId=${encodeURIComponent(selectedGarageId)}`);
        const json = await res.json();
        if (res.ok) {
          const mapped: Booking[] = (json.items || []).map((bk: any) => ({
            id: bk.id,
            clientName: bk.user?.name || bk.userId || 'Guest',
            clientEmail: bk.user?.email || '',
            clientUserId: bk.user?.id || bk.userId || '',
            vehicle: 'Vehicle',
            service: 'Service',
            date: new Date(bk.startTime).toISOString().split('T')[0],
            time: new Date(bk.startTime).toLocaleTimeString(),
            status: (bk.status || 'pending').toLowerCase(),
            price: bk.totalPrice ? Number(bk.totalPrice) : 0,
          }));
          setBookings(mapped);
        }
      } catch (e) {
        console.error('load bookings failed', e);
      }
    };
    load();
  }, [selectedGarageId]);

  // Load conversations for owner
  useEffect(() => {
    if (!user) return;
    const loadConvos = async () => {
      try {
        const res = await fetch(`/api/messages/conversations?userId=${encodeURIComponent(user.id)}`, { cache: 'no-store' });
        const json = await res.json();
        if (res.ok) setConversations(Array.isArray(json.items) ? json.items : []);
      } catch (e) {
        console.error('load conversations failed', e);
      }
    };
    loadConvos();
  }, [user]);

  const stats = [
    { 
      title: 'Today\'s Bookings', 
      value: bookings.filter(b => b.date === new Date().toISOString().split('T')[0]).length.toString(), 
      icon: Calendar, 
      change: 'Manage your appointments' 
    },
    { 
      title: 'Pending Requests', 
      value: bookings.filter(b => b.status === 'pending').length.toString(), 
      icon: Clock, 
      change: 'Awaiting your response' 
    },
    { 
      title: 'This Month\'s Revenue', 
      value: `€${bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.price, 0)}`, 
      icon: DollarSign, 
      change: 'From completed services' 
    },
    { 
      title: 'Total Services', 
      value: profileForm.services.length.toString(), 
      icon: Car, 
      change: 'Services you offer' 
    },
  ];

  const handleSaveProfile = async () => {
    if (!profileForm.name || !profileForm.location || !profileForm.postalCode) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!user) {
      toast.error('Please login');
      return;
    }
    try {
      const res = await fetch('/api/garages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: user.id,
          name: profileForm.name,
          description: profileForm.description,
          addressLine1: profileForm.location,
          city: '',
          postalCode: profileForm.postalCode,
          country: '',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || 'Failed to save garage');
        return;
      }
      const g = data.garage;
      setOwnedGarages((prev) => [g, ...prev]);
      setSelectedGarageId(g.id);
      setGarageProfile(profileForm);
      setIsEditingProfile(false);
      setIsCreatingProfile(false);
      toast.success('Garage profile saved successfully');
    } catch (e) {
      console.error('save profile failed', e);
      toast.error('Failed to save garage');
    }
  };

  const handleAddService = () => {
    if (!newService.serviceId || !newService.price) {
      toast.error('Please select a service and set a price');
      return;
    }

    if (profileForm.services.length >= 5) {
      toast.error('Maximum 5 services allowed');
      return;
    }

    const service = availableServices.find(s => s.id === newService.serviceId);
    if (!service) return;

    const updatedServices = [...profileForm.services, {
      serviceId: newService.serviceId,
      serviceName: service.name,
      price: newService.price,
    }];

    setProfileForm({ ...profileForm, services: updatedServices });
    setNewService({ serviceId: '', serviceName: '', price: 0 });
    setIsAddingService(false);
    toast.success('Service added successfully');
  };

  const handleRemoveService = (serviceId: string) => {
    const updatedServices = profileForm.services.filter(s => s.serviceId !== serviceId);
    setProfileForm({ ...profileForm, services: updatedServices });
    toast.success('Service removed');
  };

  const handleBookingAction = async (bookingId: string, action: 'accept' | 'decline') => {
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action === 'accept' ? 'CONFIRMED' : 'CANCELLED' }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || 'Failed to update booking');
        return;
      }
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: action === 'accept' ? 'confirmed' : 'cancelled' } : b));
      toast.success(`Booking ${action === 'accept' ? 'accepted' : 'declined'}`);
    } catch (e) {
      console.error('update booking failed', e);
      toast.error('Failed to update booking');
    }
  };

  if (isCreatingProfile || !garageProfile) {
    return (
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Your Garage Profile</h1>
            <p className="text-xl text-gray-600">Set up your garage information to start receiving bookings</p>
          </motion.div>

          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Garage Information</CardTitle>
              <CardDescription>
                Provide details about your garage to attract customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Garage Name *
                  </label>
                  <Input
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Your Garage Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code *
                  </label>
                  <Input
                    value={profileForm.postalCode}
                    onChange={(e) => setProfileForm({ ...profileForm, postalCode: e.target.value })}
                    placeholder="1234AB"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <Input
                  value={profileForm.location}
                  onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                  placeholder="Street Address, City"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <Input
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="+31 20 123 4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="garage@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Textarea
                  value={profileForm.description}
                  onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                  placeholder="Describe your garage, specialties, and what makes you unique..."
                  rows={4}
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Services & Pricing</h3>
                <div className="space-y-4">
                  {profileForm.services.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium">{service.serviceName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">€{service.price}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveService(service.serviceId)}
                          className="text-red-600"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}

                  {profileForm.services.length < 5 && (
                    <Dialog open={isAddingService} onOpenChange={setIsAddingService}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Service (Max 5)
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Service</DialogTitle>
                          <DialogDescription>
                            Select a service and set your price
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Service
                            </label>
                            <Select
                              value={newService.serviceId}
                              onValueChange={(value) => setNewService({ ...newService, serviceId: value })}
                              disabled={availableServices.filter(service => !profileForm.services.some(s => s.serviceId === service.id)).length === 0}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a service" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableServices.filter(service => !profileForm.services.some(s => s.serviceId === service.id)).length === 0 ? (
                                  <SelectItem value="__no_options" disabled>No services available</SelectItem>
                                ) : (
                                  availableServices
                                    .filter(service => !profileForm.services.some(s => s.serviceId === service.id))
                                    .map((service) => (
                                      <SelectItem key={service.id} value={service.id}>
                                        {service.name} ({service.category})
                                      </SelectItem>
                                    ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Price (€)
                            </label>
                            <Input
                              type="number"
                              value={newService.price || ''}
                              onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) || 0 })}
                              placeholder="0.00"
                            />
                          </div>
                          <div className="flex gap-3">
                            <Button onClick={handleAddService} className="bg-blue-600 hover:bg-blue-700">
                              Add Service
                            </Button>
                            <Button variant="outline" onClick={() => setIsAddingService(false)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-700">
                  Create Garage Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Garage Dashboard</h1>
          <p className="text-xl text-gray-600">Manage your garage bookings and services</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-blue-600">{stat.change}</p>
                  </div>
                  <stat.icon className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Management Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="bookings" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="profile">Garage Profile</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>

            <TabsContent value="bookings" className="space-y-6">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Booking Requests</CardTitle>
                  <CardDescription>
                    Manage incoming booking requests from clients
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <div className="text-center py-12 text-gray-600">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">No bookings yet</p>
                      <p className="text-sm">Booking requests will appear here when clients book your services</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookings.map((booking) => (
                        <div key={booking.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold">{booking.clientName}</h3>
                              <p className="text-gray-600">{booking.vehicle}</p>
                              <p className="text-sm text-gray-500">Service: {booking.service}</p>
                              <p className="text-sm text-gray-500">
                                📅 {booking.date} at {booking.time}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge 
                                variant={booking.status === 'confirmed' ? 'default' : 
                                        booking.status === 'pending' ? 'secondary' : 'outline'}
                              >
                                {booking.status}
                              </Badge>
                              <p className="font-semibold mt-1">€{booking.price}</p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            {booking.status === 'pending' && (
                              <>
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleBookingAction(booking.id, 'accept')}
                                >
                                  Accept
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleBookingAction(booking.id, 'decline')}
                                >
                                  Decline
                                </Button>
                              </>
                            )}
                            {booking.clientUserId && (
                              <Link
                                href={`/chat?peer=${encodeURIComponent(booking.clientUserId)}&title=${encodeURIComponent('Chat with Client')}`}
                                className="inline-flex items-center text-sm border rounded-md px-3 py-1"
                              >
                                <MessageSquare className="w-4 h-4 mr-1" /> Start Chat
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Recent Conversations</CardTitle>
                  <CardDescription>Chat with clients (includes guest requests)</CardDescription>
                </CardHeader>
                <CardContent>
                  {conversations.length === 0 ? (
                    <div className="text-center py-12 text-gray-600">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">No recent conversations</p>
                      <p className="text-sm">Messages will appear here when clients contact you</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {conversations.map((c: any) => (
                        <div key={c.peerId} className="p-3 border rounded-md flex justify-between items-center">
                          <div>
                            <div className="font-semibold">{c.peer?.name || c.peer?.email || c.peerId}</div>
                            <div className="text-sm text-gray-600 truncate max-w-[60ch]">{c.lastMessage?.body}</div>
                            {c.latestBooking && (
                              <div className="text-xs text-gray-500 mt-1">
                                {c.latestBooking.garageName ? (<span className="mr-2">Garage: {c.latestBooking.garageName}</span>) : null}
                                <span>Booking: {new Date(c.latestBooking.startTime).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                          <Link
                            href={`/chat?peer=${encodeURIComponent(c.peerId)}${c.latestBooking ? `&bookingId=${encodeURIComponent(c.latestBooking.id)}` : ''}&title=${encodeURIComponent('Chat with Client')}`}
                            className="inline-flex items-center text-sm border rounded-md px-3 py-1"
                          >
                            <MessageSquare className="w-4 h-4 mr-1" /> Open
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calendar">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Calendar Management</CardTitle>
                  <CardDescription>Set your availability and manage time slots</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-gray-600">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Calendar integration coming soon</p>
                    <p className="text-sm">You'll be able to set available time slots and manage your schedule</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Garage Profile</CardTitle>
                      <CardDescription>Your garage information and services</CardDescription>
                    </div>
                    <Button 
                      onClick={() => setIsEditingProfile(true)}
                      variant="outline"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Link href={`/chat?peer=${encodeURIComponent('client-1')}&title=${encodeURIComponent('Chat with Client')}`} className="ml-2 inline-flex items-center px-4 py-2 border rounded-md text-sm">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Open Chat
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-3">Basic Information</h3>
                        <div className="space-y-2 text-sm">
                          <p><span className="font-medium">Name:</span> {garageProfile.name}</p>
                          <p><span className="font-medium">Location:</span> {garageProfile.location}</p>
                          <p><span className="font-medium">Postal Code:</span> {garageProfile.postalCode}</p>
                          <p><span className="font-medium">Phone:</span> {garageProfile.phone}</p>
                          <p><span className="font-medium">Email:</span> {garageProfile.email}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-3">Services & Pricing</h3>
                        <div className="space-y-2 text-sm">
                          {garageProfile.services.map((service, index) => (
                            <div key={index} className="flex justify-between">
                              <span>{service.serviceName}</span>
                              <span className="font-medium">€{service.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {garageProfile.description && (
                      <div>
                        <h3 className="font-semibold mb-3">Description</h3>
                        <p className="text-gray-600">{garageProfile.description}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                  <CardDescription>Manage your account and garage settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-gray-600">
                    <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Settings panel coming soon</p>
                    <p className="text-sm">Advanced settings and preferences will be available here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}