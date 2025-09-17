'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { GarageOwnerDashboard } from '@/components/dashboard/GarageOwnerDashboard';
import { ClientDashboard } from '@/components/dashboard/ClientDashboard';
import { Navbar } from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getDashboardComponent = () => {
    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'garage_owner':
        return <GarageOwnerDashboard />;
      case 'client':
        return <ClientDashboard />;
      default:
        return <div>Invalid user role</div>;
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      {getDashboardComponent()}
    </div>
  );
}