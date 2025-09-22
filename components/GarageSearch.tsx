'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Modal extracted to its own component
import BookingModal from '@/components/garage/BookingModal';
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
  lat?: number;
  lon?: number;
  distanceKm?: number;
}

interface GarageSearchProps {
  vehicleData: VehicleData;
  onBack: () => void;
  initialService?: string;
  initialPostalCode?: string;
  autoSearch?: boolean;
}

export function GarageSearch({ vehicleData, onBack, initialService, initialPostalCode, autoSearch }: GarageSearchProps) {
  const [postalCode, setPostalCode] = useState(initialPostalCode || '');
  const [selectedService, setSelectedService] = useState<string | undefined>(initialService);
  const [garages, setGarages] = useState<Garage[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'compare'>('list');
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  // Booking flow (works for guests and logged-in users)
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [modalStep, setModalStep] = useState<'choice' | 'register' | 'verify' | 'slot'>('choice');
  const [pendingGarageId, setPendingGarageId] = useState<string | null>(null);
  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  // Quick verify fields
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Slot selection
  const [slotStart, setSlotStart] = useState<Date | null>(null);
  const [slotEnd, setSlotEnd] = useState<Date | null>(null);
  // Temp user id after registration (before booking)
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const [userCoord, setUserCoord] = useState<{ lat: number; lon: number } | null>(null);

  const services = [
    { id: 'oil_change', name: t('service.oil_change') },
    { id: 'brake_service', name: t('service.brake_service') },
    { id: 'tire_service', name: t('service.tire_service') },
    { id: 'battery_service', name: t('service.battery_service') },
    { id: 'engine_diagnostic', name: t('service.engine_diagnostic') },
  ];

  const haversineKm = (a: {lat:number, lon:number}, b: {lat:number, lon:number}) => {
    const R = 6371; // km
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLon = (b.lon - a.lon) * Math.PI / 180;
    const la1 = a.lat * Math.PI / 180;
    const la2 = b.lat * Math.PI / 180;
    const sinDLat = Math.sin(dLat/2);
    const sinDLon = Math.sin(dLon/2);
    const h = sinDLat*sinDLat + Math.cos(la1)*Math.cos(la2)*sinDLon*sinDLon;
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
    return R * c;
  };

  const geocode = async (q: string) => {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
    if (!res.ok) return null;
    const j = await res.json();
    return j.result as { lat: number; lon: number; display_name: string } | null;
  };

  const handleSearch = async () => {
    if (!postalCode.trim()) {
      toast.error('Please enter a postal address/postal code');
      return;
    }
    setLoading(true);
    try {
      // 1) Geocode user postalCode (Netherlands)
      const userGeo = await geocode(`${postalCode}, Netherlands`);
      setUserCoord(userGeo ? { lat: userGeo.lat, lon: userGeo.lon } : null);

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
      let mapped: Garage[] = items.map((g: any) => ({
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
      // 2) Geocode garage addresses (top N for performance)
      const toGeocode = mapped.slice(0, 15); // limit
      const geoResults = await Promise.all(
        toGeocode.map(async (g) => {
          const q = [g.location, g.postalCode, 'Netherlands'].filter(Boolean).join(', ');
          const resG = await geocode(q);
          return resG ? { id: g.id, lat: resG.lat, lon: resG.lon } : { id: g.id, lat: undefined as any, lon: undefined as any };
        })
      );
      const geoMap = new Map(geoResults.map(r => [r.id, r]));
      mapped = mapped.map(g => {
        const k = geoMap.get(g.id);
        if (k && typeof k.lat === 'number' && typeof k.lon === 'number') {
          const lat = k.lat; const lon = k.lon;
          const distanceKm = userGeo ? haversineKm({ lat: userGeo.lat, lon: userGeo.lon }, { lat, lon }) : undefined;
          return { ...g, lat, lon, distanceKm };
        }
        return g;
      });

      // 3) Sort by real distance if available, then rating
      mapped.sort((a, b) => {
        const ad = a.distanceKm ?? Number.POSITIVE_INFINITY;
        const bd = b.distanceKm ?? Number.POSITIVE_INFINITY;
        if (ad !== bd) return ad - bd;
        return (b.rating || 0) - (a.rating || 0);
      });
      setGarages(mapped);
    } catch (e) {
      console.error('Garage search failed', e);
      setGarages([]);
    } finally {
      setLoading(false);
    }
  };

  async function submitRegister() {
    if (!pendingGarageId) return;
    if (!regName || !regEmail || !regPassword) {
      toast.error('Please fill name, email and password');
      return;
    }
    setSubmitting(true);
    try {
      // Register as client
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, password: regPassword, name: regName, role: 'client' }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || 'Registration failed');
        setSubmitting(false);
        return;
      }
      // Move to slot selection with temp user id
      setTempUserId(data.user.id);
      setModalStep('slot');
    } catch (e) {
      console.error('register failed', e);
      toast.error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitVerify() {
    if (!pendingGarageId) return;
    if (!contactEmail && !contactPhone) {
      toast.error('Provide email or phone');
      return;
    }
    if (otp !== '1234') {
      toast.error('Invalid OTP. Use 1234');
      return;
    }
    // proceed to slot selection for guests
    setModalStep('slot');
  }

  async function confirmSlotBooking() {
    if (!pendingGarageId) return;
    if (!slotStart || !slotEnd) {
      toast.error('Please select a time slot');
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        garageId: pendingGarageId,
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
      };
      if (user?.id) {
        payload.userId = user.id;
      } else if (tempUserId) {
        payload.userId = tempUserId;
      } else {
        payload.contactEmail = contactEmail || undefined;
        payload.contactPhone = contactPhone || undefined;
        payload.otp = otp;
      }
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || 'Failed to create booking');
        setSubmitting(false);
        return;
      }
      toast.success('Booking created');
      setShowBookingModal(false);
      setPendingGarageId(null);
      setTempUserId(null);
      setSlotStart(null);
      setSlotEnd(null);
      router.push('/dashboard');
    } catch (e) {
      console.error('confirm slot booking failed', e);
      toast.error('Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  }

  const bookNow = async (garageId: string) => {
    // Open slot selection (or choice for guests)
    setPendingGarageId(garageId);
    if (!user) {
      setModalStep('choice');
    } else {
      setModalStep('slot');
    }
    setShowBookingModal(true);
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
    if (autoSearch && postalCode) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSearch]);

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
                  {!initialService ? (
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
                  ) : (
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Service</label>
                      <div className="h-10 px-3 flex items-center rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-700">
                        {services.find(s => s.id === initialService)?.name || 'Selected'}
                      </div>
                    </div>
                  )}
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

          {/* Map preview */}
          {userCoord && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-8"
            >
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-800">Area map (Netherlands)</h3>
                    <span className="text-xs text-gray-500">Centered on {postalCode}</span>
                  </div>
                  {(() => {
                    const markers: string[] = []
                    const limited = garages.filter(g => typeof g.lat === 'number' && typeof g.lon === 'number').slice(0, 10)
                    for (const g of limited) {
                      markers.push(`${g.lat},${g.lon},lightblue1`)
                    }
                    const url = new URL('https://staticmap.openstreetmap.de/staticmap.php')
                    url.searchParams.set('center', `${userCoord.lat},${userCoord.lon}`)
                    url.searchParams.set('zoom', '11')
                    url.searchParams.set('size', '640x320')
                    if (markers.length) url.searchParams.set('markers', markers.join('|'))
                    const mapUrl = url.toString()
                    return (
                      <img
                        src={mapUrl}
                        alt={`Map around ${postalCode}`}
                        className="w-full h-64 object-cover rounded-md border"
                      />
                    )
                  })()}
                </CardContent>
              </Card>
            </motion.div>
          )}

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

      <BookingModal
        open={showBookingModal}
        onOpenChange={setShowBookingModal}
        step={modalStep}
        setStep={setModalStep}
        regName={regName}
        setRegName={setRegName}
        regEmail={regEmail}
        setRegEmail={setRegEmail}
        regPassword={regPassword}
        setRegPassword={setRegPassword}
        contactEmail={contactEmail}
        setContactEmail={setContactEmail}
        contactPhone={contactPhone}
        setContactPhone={setContactPhone}
        otp={otp}
        setOtp={setOtp}
        onRegister={submitRegister}
        onVerify={submitVerify}
        slotStart={slotStart}
        setSlotStart={setSlotStart}
        slotEnd={slotEnd}
        setSlotEnd={setSlotEnd}
        onConfirmSlot={confirmSlotBooking}
        submitting={submitting}
      />
    </div>
  );
}

export default GarageSearch;
