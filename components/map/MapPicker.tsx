'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { MapPin, Crosshair, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { reverseGeocode } from '@/lib/ors';
import 'maplibre-gl/dist/maplibre-gl.css';

const DEFAULT_STYLE = 'https://demotiles.maplibre.org/style.json';
const KIGALI_CENTER: [number, number] = [30.0619, -1.9441];

interface MapPickerProps {
  initialCoords?: { lat: number; lng: number } | null;
  onConfirm: (data: { lat: number; lng: number; address: string }) => void;
  onClose: () => void;
}

export function MapPicker({ initialCoords, onConfirm, onClose }: MapPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [selected, setSelected] = useState<{ lat: number; lng: number } | null>(initialCoords || null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);

  const placeMarker = useCallback(async (lat: number, lng: number) => {
    setSelected({ lat, lng });
    setAddress('Loading…');

    try {
      const result = await reverseGeocode(lat, lng);
      const features = result?.features;
      if (features?.length) {
        setAddress(features[0].properties.label || features[0].properties.name || '');
      } else {
        setAddress('');
      }
    } catch {
      setAddress('');
    }

    const maplibregl = await import('maplibre-gl');

    if (markerRef.current) {
      markerRef.current.remove();
    }

    const el = document.createElement('div');
    el.className = 'w-8 h-8 bg-red-600 rounded-full border-[3px] border-white flex items-center justify-center shadow-lg';
    el.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8z"/></svg>';

    markerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat([lng, lat])
      .addTo(mapRef.current);
  }, []);

  useEffect(() => {
    let mounted = true;
    let mapInstance: any = null;

    async function initMap() {
      try {
        const maplibregl = await import('maplibre-gl');
        if (!mounted || !mapContainer.current) return;

        mapInstance = new maplibregl.Map({
          container: mapContainer.current,
          style: process.env.NEXT_PUBLIC_MAP_STYLE || DEFAULT_STYLE,
          center: KIGALI_CENTER,
          zoom: 13,
        });

        mapInstance.on('load', () => {
          if (!mounted) return;
          setLoading(false);

          if (initialCoords) {
            mapInstance.flyTo({ center: [initialCoords.lng, initialCoords.lat], zoom: 15 });
            placeMarker(initialCoords.lat, initialCoords.lng);
          }
        });

        mapInstance.on('click', (e: any) => {
          const { lat, lng } = e.lngLat;
          if (mounted) {
            placeMarker(lat, lng);
          }
        });

        mapRef.current = mapInstance;
      } catch {
        if (mounted) setLoading(false);
      }
    }

    initMap();

    return () => {
      mounted = false;
      if (mapInstance) mapInstance.remove();
    };
  }, [initialCoords, placeMarker]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        mapRef.current?.flyTo({ center: [lng, lat], zoom: 15 });
        placeMarker(lat, lng);
      },
      () => {},
      { enableHighAccuracy: true },
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white">
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 flex-shrink-0">
        <button onClick={onClose} className="p-1 text-gray-600">
          <X size={24} />
        </button>
        <h2 className="font-display text-base font-semibold text-gray-950">Pick location</h2>
        <div className="w-8" />
      </div>

      <div className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 bg-gray-150 z-10 flex items-center justify-center">
            <div className="relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%] w-full h-full" />
          </div>
        )}
        <div ref={mapContainer} className="w-full h-full" />

        <button
          onClick={handleUseCurrentLocation}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Crosshair size={20} />
        </button>

        {selected && (
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-200 rounded-t-2xl p-4 pb-6">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={16} className="text-red-600 flex-shrink-0" />
              <span className="font-body text-xs text-gray-500">
                {selected.lat.toFixed(6)}, {selected.lng.toFixed(6)}
              </span>
            </div>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter the address or location name..."
              className="w-full h-11 px-3 bg-gray-100 rounded-lg font-body text-sm text-gray-950 placeholder:text-gray-400 outline-none mb-3"
              autoFocus
            />
            <Button fullWidth size="lg" onClick={() => onConfirm({ ...selected, address })}>
              Confirm location
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
