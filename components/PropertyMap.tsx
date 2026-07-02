'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface PropertyMapProps {
  latitude: number;
  longitude: number;
  title: string;
  location: string;
}

export default function PropertyMap({ latitude, longitude, title, location }: PropertyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Reset default marker icons for Webpack/Turbopack compatibility
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([latitude, longitude], 14);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      L.marker([latitude, longitude])
        .addTo(mapRef.current)
        .bindPopup(`<strong>${title}</strong><br/>${location}`)
        .openPopup();
    } else {
      mapRef.current.setView([latitude, longitude], 14);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude, title, location]);

  return (
    <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-mosque/10 bg-slate-100">
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '250px' }} />
    </div>
  );
}
