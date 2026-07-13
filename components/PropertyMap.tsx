'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface PropertyMapProps {
  latitude: number;
  longitude: number;
  title: string;
  location: string;
  onChange?: (lat: number, lng: number) => void;
}

export default function PropertyMap({ latitude, longitude, title, location, onChange }: PropertyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Reset default marker icons for Webpack/Turbopack compatibility
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const mapInstance = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView([latitude, longitude], 14);

    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapInstance);

    const markerInstance = L.marker([latitude, longitude], {
      draggable: !!onChange,
    }).addTo(mapInstance);

    mapRef.current = mapInstance;
    markerRef.current = markerInstance;

    if (onChange) {
      markerInstance.on('dragend', () => {
        const position = markerInstance.getLatLng();
        onChange(position.lat, position.lng);
      });

      mapInstance.on('click', (e) => {
        onChange(e.latlng.lat, e.latlng.lng);
      });
    }

    return () => {
      mapInstance.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChange]);

  // Update Map Position and Popup without recreating the map
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;

    const currentCenter = mapRef.current.getCenter();
    if (Math.abs(currentCenter.lat - latitude) > 0.0001 || Math.abs(currentCenter.lng - longitude) > 0.0001) {
      mapRef.current.setView([latitude, longitude], mapRef.current.getZoom());
    }

    markerRef.current.setLatLng([latitude, longitude]);

    markerRef.current
      .bindPopup(
        `<div class="p-1 font-sans text-xs">
          <strong class="block text-sm font-bold text-mosque dark:text-primary mb-1">${title || 'Property'}</strong>
          <span class="text-xs text-gray-500 dark:text-gray-300">${location || 'Selected Location'}</span>
        </div>`,
        { autoPan: true, autoPanPadding: L.point(15, 15), closeButton: false }
      )
      .openPopup();
  }, [latitude, longitude, title, location]);

  return (
    <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-mosque/10 dark:border-primary/10 bg-slate-100 dark:bg-background-dark">
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '250px' }} />
    </div>
  );
}
