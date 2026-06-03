'use client';
import { useEffect, useRef } from 'react';

interface Merchant {
  id: number;
  name: string;
  category: string;
  lat: number;
  lng: number;
  distance: string;
  hours: string;
  verified: boolean;
  type: string;
  rating: number;
}

interface Props {
  merchants: Merchant[];
  isNight: boolean;
  onSelect: (m: Merchant) => void;
}

export default function MerchantMapLeaflet({ merchants, isNight, onSelect }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;

    // Import Leaflet dynamically
    import('leaflet').then(L => {
      // Fix default icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Initialize map
      const map = L.map(mapRef.current!, {
        center: [37.7749, -122.4194],
        zoom: 14,
        zoomControl: false,
      });

      // OpenStreetMap tiles
      const tileUrl = isNight
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      const attribution = isNight
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

      L.tileLayer(tileUrl, { attribution, maxZoom: 19 }).addTo(map);

      // Add zoom control bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Custom amber teepee marker icon
      function createMerchantIcon(verified: boolean) {
        const svg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
            <circle cx="18" cy="16" r="16" fill="${verified ? '#EF9F27' : '#BA7517'}" stroke="white" stroke-width="2"/>
            <path d="M18 6L8 26h6l1-3h6l1 3h6L18 6z" fill="white" opacity="0.9"/>
            <rect x="15.5" y="20" width="5" height="8" rx="1.5" fill="rgba(65,36,2,0.3)"/>
            ${verified ? `<circle cx="28" cy="6" r="8" fill="#1D9E75" stroke="white" stroke-width="1.5"/>
            <path d="M24 6.5L27 9.5L32 4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` : ''}
            <polygon points="18,40 15,32 21,32" fill="${verified ? '#EF9F27' : '#BA7517'}"/>
          </svg>`;
        return L.divIcon({
          html: svg,
          iconSize: [36, 44],
          iconAnchor: [18, 44],
          popupAnchor: [0, -44],
          className: '',
        });
      }

      // Add markers
      merchants.filter(m => m.type === 'physical').forEach(merchant => {
        const marker = L.marker([merchant.lat, merchant.lng], {
          icon: createMerchantIcon(merchant.verified),
        });

        marker.bindTooltip(merchant.name, {
          permanent: false,
          direction: 'top',
          className: 'merchant-tooltip',
        });

        marker.on('click', () => {
          onSelect(merchant);
        });

        marker.addTo(map);
        markersRef.current.push(marker);
      });

      leafletRef.current = map;
    });

    // Inject Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
        markersRef.current = [];
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when merchants filter changes
  useEffect(() => {
    if (!leafletRef.current) return;
    import('leaflet').then(L => {
      // Remove existing markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      function createMerchantIcon(verified: boolean) {
        const svg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
            <circle cx="18" cy="16" r="16" fill="${verified ? '#EF9F27' : '#BA7517'}" stroke="white" stroke-width="2"/>
            <path d="M18 6L8 26h6l1-3h6l1 3h6L18 6z" fill="white" opacity="0.9"/>
            <rect x="15.5" y="20" width="5" height="8" rx="1.5" fill="rgba(65,36,2,0.3)"/>
            ${verified ? `<circle cx="28" cy="6" r="8" fill="#1D9E75" stroke="white" stroke-width="1.5"/>
            <path d="M24 6.5L27 9.5L32 4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` : ''}
            <polygon points="18,40 15,32 21,32" fill="${verified ? '#EF9F27' : '#BA7517'}"/>
          </svg>`;
        return L.divIcon({ html: svg, iconSize: [36, 44], iconAnchor: [18, 44], popupAnchor: [0, -44], className: '' });
      }

      merchants.filter(m => m.type === 'physical').forEach(merchant => {
        const marker = L.marker([merchant.lat, merchant.lng], {
          icon: createMerchantIcon(merchant.verified),
        });
        marker.bindTooltip(merchant.name, { permanent: false, direction: 'top', className: 'merchant-tooltip' });
        marker.on('click', () => onSelect(merchant));
        marker.addTo(leafletRef.current);
        markersRef.current.push(marker);
      });
    });
  }, [merchants, onSelect]);

  return (
    <>
      <style>{`
        .merchant-tooltip {
          background: #412402 !important;
          color: white !important;
          border: none !important;
          border-radius: 6px !important;
          font-weight: 700 !important;
          font-size: 12px !important;
          padding: 4px 8px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
        }
        .merchant-tooltip::before {
          border-top-color: #412402 !important;
        }
        .leaflet-control-zoom a {
          background: #412402 !important;
          color: #EF9F27 !important;
          border-color: #3A2000 !important;
        }
      `}</style>
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: 400,
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
        }}
      />
    </>
  );
}
