'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Car, MapPin, Star, History, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Vehicle {
  id: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  fuelType: string;
}

interface Booking {
  id: string;
  garage: string;
  service: string;
  vehicle: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: string;
}

type FavoriteItem = {
  id: string;
  createdAt: string;
  garage: { id: string; name: string; city?: string; postalCode?: string; image?: string };
};

export function ClientDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favoriteGarages, setFavoriteGarages] = useState<FavoriteItem[]>([]);
  
  const stats = [
    { 
      title: 'Active Bookings', 
      value: bookings.filter(b => b.status === 'confirmed').length.toString(), 
      icon: Calendar, 
      change: bookings.length > 0 ? `Next: ${bookings[0]?.date}` : 'No upcoming bookings' 
    },
    { 
      title: 'Pending Requests', 
      value: bookings.filter(b => b.status === 'pending').length.toString(), 
      icon: Clock, 
      change: 'Awaiting garage confirmation' 
    },
    { 
      title: 'My Vehicles', 
      value: vehicles.length.toString(), 
      icon: Car, 
      change: 'Registered vehicles' 
    },
    { 
      title: 'Favorite Garages', 
      value: favoriteGarages.length.toString(), 
      icon: Star, 
      change: 'Saved for quick booking' 
    },
  ];

  const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  const bookingHistory = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  useEffect(() => {
    if (!user) return;
    const run = async () => {
      try {
        // Load bookings for the user
        const resB = await fetch(`/api/bookings?userId=${encodeURIComponent(user.id)}`);
        const jsonB = await resB.json();
        if (resB.ok) {
          const mapped: Booking[] = (jsonB.items || []).map((bk: any) => ({
            id: bk.id,
            garage: bk.garage?.name || bk.garageId,
            service: 'Service',
            vehicle: 'Vehicle',
            date: new Date(bk.startTime).toISOString().split('T')[0],
            time: new Date(bk.startTime).toLocaleTimeString(),
            status: (bk.status || 'pending').toLowerCase(),
            price: bk.totalPrice ? String(bk.totalPrice) : '€0.00',
          }));
          setBookings(mapped);
        }

        // Load favorites for the user
        const resF = await fetch(`/api/favorites?userId=${encodeURIComponent(user.id)}`);
        const jsonF = await resF.json();
        if (resF.ok) {
          const items: FavoriteItem[] = (jsonF.items || []).map((f: any) => ({
            id: f.id,
            createdAt: f.createdAt,
            garage: {
              id: f.garage?.id,
              name: f.garage?.name,
              city: f.garage?.city,
              postalCode: f.garage?.postalCode,
              image: f.garage?.image,
            },
          }));
          setFavoriteGarages(items);
        }
      } catch (e) {
        console.error('Client dashboard load failed', e);
        toast.error('Failed to load dashboard data');
      }
    };
    run();
  }, [user]);

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Dashboard</h1>
          <p className="text-xl text-gray-600">Track your bookings and manage your vehicles</p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-blue-600 hover:bg-blue-700 flex-1" asChild>
                  <a href="/">
                    <Car className="w-4 h-4 mr-2" />
                    Book New Service
                  </a>
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <a href="/">
                    <MapPin className="w-4 h-4 mr-2" />
                    Find Garages
                  </a>
                </Button>
                <Button variant="outline" className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vehicle
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <Link href={`/chat?peer=${encodeURIComponent('garage-1')}&title=${encodeURIComponent('Chat with Garage')}`}>Open Chat</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
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

        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="bookings" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="bookings">Active Bookings</TabsTrigger>
              <TabsTrigger value="history">Service History</TabsTrigger>
              <TabsTrigger value="vehicles">My Vehicles</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
            </TabsList>

            <TabsContent value="bookings" className="space-y-6">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Upcoming Appointments</CardTitle>
                  <CardDescription>
                    Your confirmed and pending service appointments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activeBookings.length === 0 ? (
                    <div className="text-center py-12 text-gray-600">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">No active bookings</p>
                      <p className="text-sm mb-4">Book your first service to get started</p>
                      <Button className="bg-blue-600 hover:bg-blue-700" asChild>
                        <a href="/">Book Your First Service</a>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeBookings.map((booking) => (
                        <div key={booking.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-lg">{booking.garage}</h3>
                              <p className="text-gray-600">{booking.service} - {booking.vehicle}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <span>📅 {booking.date}</span>
                                <span>⏰ {booking.time}</span>
                                <span>💰 {booking.price}</span>
                              </div>
                            </div>
                            <Badge 
                              variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                            >
                              {booking.status}
                            </Badge>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                            {booking.status === 'confirmed' && (
                              <Button size="sm" variant="outline">
                                Reschedule
                              </Button>
                            )}
                            <Button size="sm" variant="outline" className="text-red-600">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Service History</CardTitle>
                  <CardDescription>Your completed and cancelled service appointments</CardDescription>
                </CardHeader>
                <CardContent>
                  {bookingHistory.length === 0 ? (
                    <div className="text-center py-12 text-gray-600">
                      <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">No service history yet</p>
                      <p className="text-sm">Your completed services will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookingHistory.map((booking) => (
                        <div key={booking.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{booking.garage}</h3>
                              <p className="text-gray-600">{booking.service} - {booking.vehicle}</p>
                              <p className="text-sm text-gray-500">📅 {booking.date}</p>
                            </div>
                            <div className="text-right">
                              <Badge 
                                variant={booking.status === 'completed' ? 'outline' : 'secondary'}
                                className={booking.status === 'completed' ? 'text-green-600 border-green-600' : ''}
                              >
                                {booking.status}
                              </Badge>
                              <p className="font-semibold mt-1">{booking.price}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vehicles">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>My Vehicles</CardTitle>
                      <CardDescription>Manage your registered vehicles</CardDescription>
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Vehicle
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {vehicles.length === 0 ? (
                    <div className="text-center py-12 text-gray-600">
                      <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">No vehicles registered</p>
                      <p className="text-sm mb-4">Add your vehicles to make booking easier</p>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Vehicle
                      </Button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {vehicles.map((vehicle) => (
                        <div key={vehicle.id} className="border rounded-lg p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Car className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{vehicle.brand} {vehicle.model}</h3>
                              <p className="text-gray-600">License Plate: {vehicle.licensePlate}</p>
                              <p className="text-sm text-gray-500">
                                Year: {vehicle.year} • Fuel: {vehicle.fuelType}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Favorite Garages</CardTitle>
                  <CardDescription>Your saved garages for quick booking</CardDescription>
                </CardHeader>
                <CardContent>
                  {favoriteGarages.length === 0 ? (
                    <div className="text-center py-12 text-gray-600">
                      <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">No favorite garages yet</p>
                      <p className="text-sm mb-4">Save garages you like for quick access</p>
                      <Button className="bg-blue-600 hover:bg-blue-700" asChild>
                        <a href="/">Find Garages</a>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {favoriteGarages.map((fav) => (
                        <div key={fav.id} className="border rounded-lg p-4 flex items-center gap-4">
                          <div className="w-20 h-16 bg-gray-100 rounded overflow-hidden">
                            {fav.garage.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={fav.garage.image} alt={fav.garage.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{fav.garage.name}</p>
                            <p className="text-sm text-gray-600">{[fav.garage.city, fav.garage.postalCode].filter(Boolean).join(', ')}</p>
                          </div>
                          <Button variant="outline" asChild>
                            <Link href={`/garages/${fav.garage.id}`}>View</Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}