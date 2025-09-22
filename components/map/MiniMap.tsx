"use client";

import React, { useEffect, useRef } from 'react';

type LatLon = { lat: number; lon: number };

type MiniMapProps = {
  center: LatLon;
  garages: Array<{ id: string; name: string; lat?: number; lon?: number; distanceKm?: number }>;
  zoom?: number;
};

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

export default function MiniMap({ center, garages, zoom = 11 }: MiniMapProps) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    const ensureLeaflet = () =>
      new Promise<void>((resolve, reject) => {
        if (typeof window === 'undefined') return resolve();
        if ((window as any).L) return resolve();
        if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = LEAFLET_CSS;
          document.head.appendChild(link);
        }
        if (!document.querySelector(`script[src="${LEAFLET_JS}"]`)) {
          const s = document.createElement('script');
          s.src = LEAFLET_JS;
          s.async = true;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('Leaflet JS failed'));
          document.body.appendChild(s);
        } else resolve();
      });

    ensureLeaflet().then(() => {
      const L = (window as any).L;
      if (!mapEl.current) return;
      if (!mapRef.current) {
        mapRef.current = L.map(mapEl.current, { center: [center.lat, center.lon], zoom, zoomControl: false });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(mapRef.current);
      } else {
        mapRef.current.setView([center.lat, center.lon], zoom);
      }

      // Clear existing markers layer (simple approach: recreate layer group each time)
      const layer = L.layerGroup();
      // User marker
      const userIcon = L.divIcon({ className: 'user-pin', html: '<div style="background:#2563eb;width:10px;height:10px;border-radius:50%;border:2px solid white;box-shadow:0 0 0 2px #2563eb"></div>', iconSize: [10, 10] });
      L.marker([center.lat, center.lon], { icon: userIcon }).addTo(layer).bindPopup('You');
      // Garage markers
      const gIcon = L.divIcon({ className: 'garage-pin', html: '<div style="background:#22c55e;width:10px;height:10px;border-radius:50%;border:2px solid white;box-shadow:0 0 0 2px #22c55e"></div>', iconSize: [10, 10] });
      garages.filter(g => typeof g.lat === 'number' && typeof g.lon === 'number').slice(0, 20).forEach(g => {
        const label = `${g.name}${g.distanceKm != null ? ` (${g.distanceKm.toFixed(1)} km)` : ''}`;
        L.marker([g.lat as number, g.lon as number], { icon: gIcon }).addTo(layer).bindPopup(label);
      });
      layer.addTo(mapRef.current);
    }).catch(() => {});
  }, [center.lat, center.lon, zoom, garages.map(g => g.id).join(',')]);

  return <div ref={mapEl} style={{ width: '100%', height: '100%' }} />;
}
