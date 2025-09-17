'use client';

import { Navbar } from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About Garagematch</h1>
          <p className="text-gray-600 mb-8">Connecting drivers with trusted garages for a smoother service experience.</p>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardContent className="p-6 space-y-4 text-gray-700 leading-relaxed">
              <p>
                Garagematch makes it easy to find, compare, and book services with verified garages. Our mission is to provide transparency,
                convenience, and quality for drivers while helping garage owners grow their business.
              </p>
              <p>
                We focus on a simple, user-friendly experience, secure communication, and fair pricing. Whether you need routine maintenance or
                a diagnostic check, Garagematch brings reliable options to your fingertips.
              </p>
              <p>
                Built with modern web technologies, our platform prioritizes speed, accessibility, and a clean design that reflects our brand.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


