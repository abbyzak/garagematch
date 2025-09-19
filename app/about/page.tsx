'use client';

import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle>Our Mission</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 space-y-2">
                <p>Empower drivers with choice and clarity, while enabling garages to build trust and grow sustainably.</p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li>Verified, quality-first marketplace</li>
                  <li>Transparent pricing and communication</li>
                  <li>Inclusive experience for all drivers</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 space-y-2">
                <ol className="list-decimal pl-5 text-sm space-y-1">
                  <li>Search garages by service, location, or rating</li>
                  <li>Compare options and chat directly with owners</li>
                  <li>Book instantly — with or without registering</li>
                </ol>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur mt-8">
            <CardHeader>
              <CardTitle>Benefits</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4 text-gray-700 text-sm">
              <div>
                <h3 className="font-semibold mb-1">For Drivers</h3>
                <p>Find trusted garages, fair prices, and book fast. Keep all your messages and appointments in one place.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">For Garage Owners</h3>
                <p>Showcase services with photos, manage bookings, and chat with clients to convert more leads.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">For Everyone</h3>
                <p>A clean, accessible experience designed for clarity and speed.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


