'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Clock, CheckCircle, Car, Wrench, Shield } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { VehicleLookup } from '@/components/VehicleLookup';
import { motion } from 'framer-motion';

export default function Home() {
  const [licensePlate, setLicensePlate] = useState('');
  const [showVehicleLookup, setShowVehicleLookup] = useState(false);
  const { t } = useLanguage();
  const { user } = useAuth();

  const handlePlateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (licensePlate.trim()) {
      setShowVehicleLookup(true);
    }
  };

  if (showVehicleLookup) {
    return <VehicleLookup licensePlate={licensePlate} onBack={() => setShowVehicleLookup(false)} />;
  }

  const features = [
    {
      icon: Shield,
      title: 'Verified Garages',
      description: 'All garages are verified and approved by our team',
    },
    {
      icon: Clock,
      title: 'Real-time Booking',
      description: 'Book appointments instantly with available time slots',
    },
    {
      icon: Star,
      title: 'Quality Service',
      description: 'Highly rated garages with excellent customer reviews',
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              {t('home.title')}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              {t('home.subtitle')}
            </p>
          </motion.div>

          {/* License Plate Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl mx-auto mb-16"
          >
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
              <CardContent className="p-8">
                <form onSubmit={handlePlateSubmit} className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder={t('home.plate_placeholder')}
                      value={licensePlate}
                      onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                      className="h-14 text-lg border-2 focus:border-blue-600"
                      maxLength={8}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    size="lg"
                    className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Car className="w-5 h-5 mr-2" />
                    {t('home.cta')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur">
                <CardContent className="p-8 text-center">
                  <feature.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-blue-600">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-4 gap-8 text-center text-white"
          >
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Verified Garages</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">10k+</div>
              <div className="text-blue-100">Happy Customers</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50k+</div>
              <div className="text-blue-100">Bookings Completed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4.9</div>
              <div className="text-blue-100">Average Rating</div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}