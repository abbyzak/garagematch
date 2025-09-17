'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Car, Calendar, Fuel, Gauge } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navbar } from '@/components/Navbar';
import { GarageSearch } from '@/components/GarageSearch';
import { motion } from 'framer-motion';

interface VehicleData {
  kenteken: string;
  merk: string;
  handelsbenaming: string;
  eerste_afgifte_datum_dt: string;
  brandstof_omschrijving: string;
  cilinderinhoud: number;
  massa_ledig_voertuig: number;
}

interface VehicleLookupProps {
  licensePlate: string;
  onBack: () => void;
}

export function VehicleLookup({ licensePlate, onBack }: VehicleLookupProps) {
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showGarageSearch, setShowGarageSearch] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    fetchVehicleData();
  }, [licensePlate]);

  const fetchVehicleData = async () => {
    try {
      setLoading(true);
      setError('');

      // Remove any non-alphanumeric characters and convert to uppercase
      const cleanPlate = licensePlate.replace(/[^A-Z0-9]/g, '');
      
      // Mock data for demo - in production, use actual RDW API
      // const response = await fetch(`https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=${cleanPlate}`);
      
      // Mock vehicle data for demo
      const mockVehicleData: VehicleData = {
        kenteken: cleanPlate,
        merk: 'TOYOTA',
        handelsbenaming: 'COROLLA',
        eerste_afgifte_datum_dt: '2020-03-15',
        brandstof_omschrijving: 'BENZINE',
        cilinderinhoud: 1600,
        massa_ledig_voertuig: 1200,
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setVehicleData(mockVehicleData);
    } catch (err) {
      setError('Vehicle not found or API error');
      console.error('Vehicle lookup error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (showGarageSearch && vehicleData) {
    return <GarageSearch vehicleData={vehicleData} onBack={() => setShowGarageSearch(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Button variant="ghost" onClick={onBack} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Search
            </Button>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t('vehicle.lookup')}
            </h1>
            <p className="text-xl text-gray-600">License Plate: {licensePlate}</p>
          </motion.div>

          {/* Vehicle Data Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">{t('vehicle.details')}</CardTitle>
                <CardDescription>
                  Vehicle information retrieved from RDW database
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-8">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('common.loading')}</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <div className="text-red-500 mb-4">❌</div>
                    <p className="text-red-600 font-semibold">{error}</p>
                    <Button 
                      onClick={fetchVehicleData} 
                      className="mt-4"
                      variant="outline"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : vehicleData ? (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                          <Car className="w-6 h-6 text-blue-600" />
                          <div>
                            <p className="text-sm text-gray-600">{t('vehicle.brand')}</p>
                            <p className="font-semibold text-lg">{vehicleData.merk}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                          <Gauge className="w-6 h-6 text-blue-600" />
                          <div>
                            <p className="text-sm text-gray-600">{t('vehicle.model')}</p>
                            <p className="font-semibold text-lg">{vehicleData.handelsbenaming}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                          <Calendar className="w-6 h-6 text-blue-600" />
                          <div>
                            <p className="text-sm text-gray-600">{t('vehicle.year')}</p>
                            <p className="font-semibold text-lg">
                              {new Date(vehicleData.eerste_afgifte_datum_dt).getFullYear()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                          <Fuel className="w-6 h-6 text-blue-600" />
                          <div>
                            <p className="text-sm text-gray-600">{t('vehicle.fuel')}</p>
                            <p className="font-semibold text-lg">{vehicleData.brandstof_omschrijving}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center pt-6">
                      <Button 
                        onClick={() => setShowGarageSearch(true)}
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {t('vehicle.continue')}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}