'use client';

import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { MapSkeleton } from '@/components/ui/skeleton';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapWidgetProps {
  height?: number | string;
  className?: string;
  interactive?: boolean;
  showCourier?: boolean;
  showRoute?: boolean;
  showPickupMarker?: boolean;
  pickupCoords?: { lat: number; lng: number } | null;
}

const DEFAULT_STYLE = 'https://demotiles.maplibre.org/style.json';

export function MapWidget({
  height = 180,
  className,
  interactive = true,
  showCourier = true,
  showRoute = true,
  showPickupMarker = false,
  pickupCoords = null,
}: MapWidgetProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let map: any = null;
    let mounted = true;

    async function initMap() {
      try {
        const maplibregl = await import('maplibre-gl');
        if (!mounted) return;
        if (!mapContainer.current) return;

        map = new maplibregl.Map({
          container: mapContainer.current,
          style: process.env.NEXT_PUBLIC_MAP_STYLE || DEFAULT_STYLE,
          center: [30.0619, -1.9441],
          zoom: 13,
          interactive,
        });

        map.on('load', () => {
          if (!mounted) return;
          setLoading(false);

          const center = pickupCoords ? [pickupCoords.lng, pickupCoords.lat] : [30.0619, -1.9441];
          map.flyTo({ center, zoom: 14 });

          if (showPickupMarker && pickupCoords) {
            const pickupDot = document.createElement('div');
            pickupDot.className = 'w-5 h-5 bg-success rounded-full border-[3px] border-white';
            new maplibregl.Marker({ element: pickupDot })
              .setLngLat([pickupCoords.lng, pickupCoords.lat])
              .addTo(map);
          }

          if (showCourier) {
            const el = document.createElement('div');
            el.className = 'w-11 h-11 bg-red-600 rounded-full border-[3px] border-white flex items-center justify-center animate-pulse-breathe';
            el.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M5 17h14l-1-7H6L5 17z"/><circle cx="8" cy="20" r="1.5"/><circle cx="16" cy="20" r="1.5"/></svg>';

            new maplibregl.Marker({ element: el })
              .setLngLat([30.0619, -1.9441])
              .addTo(map);

            const pickupEl = document.createElement('div');
            pickupEl.className = 'w-4 h-4 bg-gray-950 rounded-full border-[3px] border-white';

            new maplibregl.Marker({ element: pickupEl })
              .setLngLat([30.0580, -1.9470])
              .addTo(map);

            const dropoffEl = document.createElement('div');
            dropoffEl.className = 'w-4 h-4 bg-red-600 rounded-full border-[3px] border-white';

            new maplibregl.Marker({ element: dropoffEl })
              .setLngLat([30.0680, -1.9400])
              .addTo(map);
          }

          if (showRoute) {
            map.addSource('route', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [30.0580, -1.9470],
                    [30.0619, -1.9441],
                    [30.0680, -1.9400],
                  ],
                },
              },
            });

            map.addLayer({
              id: 'route',
              type: 'line',
              source: 'route',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: { 'line-color': '#892020', 'line-width': 4, 'line-opacity': 0.85 },
            });
          }
        });
      } catch {
        setLoading(false);
      }
    }

    initMap();

    return () => {
      mounted = false;
      if (map) map.remove();
    };
  }, [interactive, showCourier, showRoute, showPickupMarker, pickupCoords?.lat, pickupCoords?.lng]);

  return (
    <div className={cn('relative rounded-lg overflow-hidden', className)} style={{ height }}>
      {loading && <MapSkeleton className="absolute inset-0" />}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
