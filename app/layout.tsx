import './globals.css';
import type { Metadata } from 'next';
import Image from 'next/image';
import heroBg from '@/theme_logos/garage3d.jpg';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Garagematch - Professional Garage Booking Platform',
  description: 'Connect with trusted garages for all your vehicle maintenance needs',
};

export const viewport = {
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Leaflet CSS for OpenStreetMap tiles and controls */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className={inter.className}>
        <div className="fixed inset-0 -z-10">
          <Image src={heroBg} alt="Background" fill className="object-cover opacity-30" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        </div>
        <LanguageProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}