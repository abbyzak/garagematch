'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, MapPin, Star, Clock, Euro, Phone, Mail } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navbar } from '@/components/Navbar';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface VehicleData {
  kenteken: string;
  merk: string;
  handelsbenaming: string;
  eerste_afgifte_datum_dt: string;
  brandstof_omschrijving: string;
  cilinderinhoud: number;
  massa_ledig_voertuig: number;
}

interface Garage {
  id: string;
  name: string;
  location: string;
  postalCode: string;
  rating: number;
  reviews: number;
  services: string[];
  prices: { [key: string]: number };
  image: string;
  phone: string;
  email: string;
  workingHours: string;
}

interface GarageSearchProps {
  vehicleData: VehicleData;
  onBack: () => void;
}

export function GarageSearch({ vehicleData, onBack }: GarageSearchProps) {
  const [postalCode, setPostalCode] = useState('');
  const [selectedService, setSelectedService] = useState<string | undefined>(undefined);
  const [garages, setGarages] = useState<Garage[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'compare'>('list');
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  const services = [
    { id: 'oil_change', name: t('service.oil_change') },
    { id: 'brake_service', name: t('service.brake_service') },
    { id: 'tire_service', name: t('service.tire_service') },
    { id: 'battery_service', name: t('service.battery_service') },
    { id: 'engine_diagnostic', name: t('service.engine_diagnostic') },
  ];

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (postalCode) params.set('postalCode', postalCode);
      if (selectedService) params.set('q', selectedService);
      const res = await fetch(`/api/garages?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        setGarages([]);
        setLoading(false);
        return;
      }
      const items = Array.isArray(json.items) ? json.items : [];
      // Map API items into local Garage shape (some fields are placeholders for now)
      const mapped: Garage[] = items.map((g: any) => ({
        id: g.id,
        name: g.name,
        location: g.city || '',
        postalCode: g.postalCode || '',
        rating: typeof g.rating === 'number' ? g.rating : 0,
        reviews: typeof g.reviews === 'number' ? g.reviews : 0,
        services: Array.isArray(g.services) ? g.services : [],
        prices: typeof g.prices === 'object' && g.prices ? g.prices : {},
        image: g.image || '',
        phone: g.phone || '',
        email: g.email || '',
        workingHours: g.workingHours || '',
      }));
      setGarages(mapped);
    } catch (e) {
      console.error('Garage search failed', e);
      setGarages([]);
    } finally {
      setLoading(false);
    }
  };

  const bookNow = async (garageId: string) => {
    if (!user) {
      toast.error('Please login to book');
      return;
    }
    try {
      // Simple booking: now to now+2h as placeholder
      const startTime = new Date();
      const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          garageId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || 'Failed to create booking');
        return;
      }
      toast.success('Booking created');
      router.push('/dashboard');
    } catch (e) {
      console.error('book now failed', e);
      toast.error('Failed to create booking');
    }
  };

  const toggleFavorite = async (garageId: string) => {
    if (!user) {
      toast.error('Please login to save favorites');
      return;
    }
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, garageId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || 'Failed to toggle favorite');
        return;
      }
      toast.success(data.toggled === 'added' ? 'Saved to favorites' : 'Removed from favorites');
    } catch (e) {
      console.error('toggle favorite failed', e);
      toast.error('Failed to toggle favorite');
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Vehicle Details
            </Button>
          </motion.div>

          {/* Vehicle Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {vehicleData.merk} {vehicleData.handelsbenaming}
                    </h2>
                    <p className="text-gray-600">License Plate: {vehicleData.kenteken}</p>
                  </div>
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    {new Date(vehicleData.eerste_afgifte_datum_dt).getFullYear()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Search Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postal Code
                    </label>
                    <Input
                      placeholder="Enter postal code"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service (Optional)
                    </label>
                    <Select value={selectedService} onValueChange={(val) => setSelectedService(val)} disabled={services.length === 0}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Services" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.length === 0 ? (
                          <SelectItem value="__no_options" disabled>No services available</SelectItem>
                        ) : (
                          services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
                      {t('common.search')}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setViewMode(viewMode === 'list' ? 'compare' : 'list')}
                    >
                      {viewMode === 'list' ? 'Compare' : 'List View'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">{t('common.loading')}</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {garages.length > 0 ? (
                garages.map((garage, index) => (
                  <motion.div
                    key={garage.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden">
                            <img
                              src={garage.image}
                              alt={garage.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">
                                  {garage.name}
                                </h3>
                                <div className="flex items-center text-gray-600 mb-2">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  {garage.location}
                                </div>
                                <div className="flex items-center mb-2">
                                  <Star className="w-4 h-4 text-yellow-400 mr-1" />
                                  <span className="font-semibold">{garage.rating}</span>
                                  <span className="text-gray-600 ml-1">({garage.reviews} reviews)</span>
                                </div>
                              </div>
                              
                              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => bookNow(garage.id)}>
                                Book Now
                              </Button>
                              <Button variant="outline" className="ml-2" onClick={() => toggleFavorite(garage.id)}>
                                Save
                              </Button>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Services & Prices</p>
                                <div className="space-y-1">
                                  {garage.services.map((serviceId) => {
                                    const service = services.find(s => s.id === serviceId);
                                    const price = garage.prices[serviceId];
                                    return (
                                      <div key={serviceId} className="flex justify-between text-sm">
                                        <span>{service?.name}</span>
                                        {price && <span className="font-semibold">€{price}</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Contact & Hours</p>
                                <div className="space-y-1 text-sm text-gray-600">
                                  <div className="flex items-center">
                                    <Phone className="w-3 h-3 mr-1" />
                                    {garage.phone}
                                  </div>
                                  <div className="flex items-center">
                                    <Mail className="w-3 h-3 mr-1" />
                                    {garage.email}
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {garage.workingHours}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                  <CardContent className="p-12 text-center">
                    <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-400" />
                    <p className="text-gray-600 text-lg mb-2">No garages found</p>
                    <p className="text-sm text-gray-500 mb-4">
                      {postalCode || selectedService 
                        ? "No garages match your search criteria. Try adjusting your filters."
                        : "No garages are registered in the system yet. Garage owners can register to appear in search results."
                      }
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button variant="outline" onClick={handleSearch}>
                        Search Again
                      </Button>
                      <Button variant="outline" onClick={() => { setPostalCode(''); setSelectedService(''); }}>
                        Clear Filters
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}