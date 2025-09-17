'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Building2, Wrench, TrendingUp, CheckCircle, X, Eye, Plus, Edit, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  estimatedDuration: number; // in minutes
}

interface PendingGarage {
  id: string;
  name: string;
  owner: string;
  email: string;
  location: string;
  postalCode: string;
  services: string[];
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

type AdminUser = { id: string; email: string; name: string; role: string };
type AdminGarage = { id: string; name: string; city?: string | null; postalCode?: string | null };

export function AdminDashboard() {
  const { t } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [pendingGarages, setPendingGarages] = useState<PendingGarage[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [garages, setGarages] = useState<AdminGarage[]>([]);
  const [isAddingService, setIsAddingService] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  // Service form state
  const [serviceName, setServiceName] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');

  const stats = [
    { title: 'Total Users', value: users.length.toString(), icon: Users, change: 'Registered users' },
    { title: 'Active Garages', value: garages.length.toString(), icon: Building2, change: 'Registered garages' },
    { title: 'Total Services', value: services.length.toString(), icon: Wrench, change: 'Admin-defined services' },
    { title: 'Platform Revenue', value: '€0', icon: TrendingUp, change: 'Demo metric' },
  ];

  useEffect(() => {
    const load = async () => {
      try {
        const [resUsers, resGarages] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/garages'),
        ]);
        if (resUsers.ok) {
          const ju = await resUsers.json();
          setUsers(Array.isArray(ju.items) ? ju.items : []);
        }
        if (resGarages.ok) {
          const jg = await resGarages.json();
          setGarages(Array.isArray(jg.items) ? jg.items : []);
        }
      } catch (e) {
        console.error('Admin load failed', e);
      }
    };
    load();
  }, []);

  const handleAddService = () => {
    if (!serviceName || !serviceCategory || !serviceDuration) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newService: Service = {
      id: Date.now().toString(),
      name: serviceName,
      category: serviceCategory,
      description: serviceDescription,
      estimatedDuration: parseInt(serviceDuration),
    };

    setServices([...services, newService]);
    setServiceName('');
    setServiceCategory('');
    setServiceDescription('');
    setServiceDuration('');
    setIsAddingService(false);
    toast.success('Service added successfully');
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setServiceName(service.name);
    setServiceCategory(service.category);
    setServiceDescription(service.description);
    setServiceDuration(service.estimatedDuration.toString());
  };

  const handleUpdateService = () => {
    if (!editingService || !serviceName || !serviceCategory || !serviceDuration) {
      toast.error('Please fill in all required fields');
      return;
    }

    const updatedServices = services.map(service =>
      service.id === editingService.id
        ? {
            ...service,
            name: serviceName,
            category: serviceCategory,
            description: serviceDescription,
            estimatedDuration: parseInt(serviceDuration),
          }
        : service
    );

    setServices(updatedServices);
    setEditingService(null);
    setServiceName('');
    setServiceCategory('');
    setServiceDescription('');
    setServiceDuration('');
    toast.success('Service updated successfully');
  };

  const handleDeleteService = (serviceId: string) => {
    setServices(services.filter(service => service.id !== serviceId));
    toast.success('Service deleted successfully');
  };

  const handleGarageAction = (garageId: string, action: 'approve' | 'reject') => {
    setPendingGarages(prev => 
      prev.map(garage => 
        garage.id === garageId 
          ? { ...garage, status: action === 'approve' ? 'approved' : 'rejected' }
          : garage
      )
    );
    
    toast.success(`Garage ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
  };

  const resetServiceForm = () => {
    setServiceName('');
    setServiceCategory('');
    setServiceDescription('');
    setServiceDuration('');
    setIsAddingService(false);
    setEditingService(null);
  };

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-xl text-gray-600">Manage users, garages, and platform operations</p>
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
          <Tabs defaultValue="services" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="services">Service Management</TabsTrigger>
              <TabsTrigger value="garages">Garage Approvals</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="space-y-6">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Predefined Services</CardTitle>
                      <CardDescription>
                        Manage the services that garages can offer to clients
                      </CardDescription>
                    </div>
                    <Dialog open={isAddingService || !!editingService} onOpenChange={(open) => !open && resetServiceForm()}>
                      <DialogTrigger asChild>
                        <Button onClick={() => setIsAddingService(true)} className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Service
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {editingService ? 'Edit Service' : 'Add New Service'}
                          </DialogTitle>
                          <DialogDescription>
                            {editingService ? 'Update the service details' : 'Create a new service that garages can offer'}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Service Name *
                            </label>
                            <Input
                              value={serviceName}
                              onChange={(e) => setServiceName(e.target.value)}
                              placeholder="e.g., Oil Change"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Category *
                            </label>
                            <Input
                              value={serviceCategory}
                              onChange={(e) => setServiceCategory(e.target.value)}
                              placeholder="e.g., Maintenance, Repair, Inspection"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Description
                            </label>
                            <Input
                              value={serviceDescription}
                              onChange={(e) => setServiceDescription(e.target.value)}
                              placeholder="Brief description of the service"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Estimated Duration (minutes) *
                            </label>
                            <Input
                              type="number"
                              value={serviceDuration}
                              onChange={(e) => setServiceDuration(e.target.value)}
                              placeholder="e.g., 60"
                            />
                          </div>
                          <div className="flex gap-3">
                            <Button 
                              onClick={editingService ? handleUpdateService : handleAddService}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {editingService ? 'Update Service' : 'Add Service'}
                            </Button>
                            <Button variant="outline" onClick={resetServiceForm}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {services.length === 0 ? (
                    <div className="text-center py-12 text-gray-600">
                      <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">No services defined yet</p>
                      <p className="text-sm">Add services that garages can offer to their clients</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {services.map((service) => (
                        <div key={service.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg">{service.name}</h3>
                              <Badge variant="secondary" className="mb-2">{service.category}</Badge>
                              {service.description && (
                                <p className="text-gray-600 text-sm mb-2">{service.description}</p>
                              )}
                              <p className="text-sm text-gray-500">
                                Estimated duration: {service.estimatedDuration} minutes
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditService(service)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteService(service.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="garages" className="space-y-6">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Garages</CardTitle>
                  <CardDescription>All registered garages</CardDescription>
                </CardHeader>
                <CardContent>
                  {garages.length === 0 ? (
                    <div className="text-center py-12 text-gray-600">
                      <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">No garages yet</p>
                      <p className="text-sm">Registered garages will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {garages.map((g) => (
                        <div key={g.id} className="border rounded-lg p-4 flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{g.name}</h3>
                            <p className="text-gray-600 text-sm">{[g.city, g.postalCode].filter(Boolean).join(', ')}</p>
                          </div>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-2" />
                            {t('common.view')}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage registered users and their accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  {users.length === 0 ? (
                    <div className="text-center py-12 text-gray-600">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">No users registered yet</p>
                      <p className="text-sm">User accounts will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {users.map((u) => (
                        <div key={u.id} className="border rounded-lg p-4 flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{u.name}</p>
                            <p className="text-sm text-gray-600">{u.email} • {u.role}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline"><Eye className="w-4 h-4" /></Button>
                            <Button size="sm" variant="outline"><Edit className="w-4 h-4" /></Button>
                            <Button size="sm" variant="outline" className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Platform Analytics</CardTitle>
                  <CardDescription>View platform performance and statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-gray-600">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Analytics will appear here</p>
                    <p className="text-sm">Data will be available once the platform has activity</p>
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