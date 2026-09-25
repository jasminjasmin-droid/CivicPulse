import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Filter,
  MapPin,
  Layers,
  ArrowRight,
  Clock,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Navigation,
  Compass,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Complaint, IssueCategory } from '../types';

export const NearbyIssuesMapScreen: React.FC = () => {
  const { complaints, setSelectedComplaintId, setActiveTab, t } = useApp();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [isHeatmapMode, setIsHeatmapMode] = useState<boolean>(false);
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: 13.0418,
    lng: 80.2341,
  });

  // Filter complaints
  const filteredComplaints = complaints.filter((c) => {
    const matchesCat = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesStat =
      selectedStatus === 'All'
        ? true
        : selectedStatus === 'In Progress'
        ? c.status === 'In Progress' || c.status === 'Assigned'
        : selectedStatus === 'High Priority'
        ? c.priority === 'Critical' || c.priority === 'High'
        : ['Resolved', 'Closed'].includes(c.status);
    return matchesCat && matchesStat;
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center on Chennai / T. Nagar
    const map = L.map(mapContainerRef.current, {
      center: [userCoords.lat, userCoords.lng],
      zoom: 14,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // OpenStreetMap Voyager Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = layerGroup;
    mapInstanceRef.current = map;

    // Fix grey tile sizing issues
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    // Get live user geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([coords.lat, coords.lng], 14);
          }
        },
        () => {},
        { timeout: 4000 }
      );
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update User Live Location Marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (userMarkerRef.current) {
      mapInstanceRef.current.removeLayer(userMarkerRef.current);
    }

    // Live Beacon Icon with blue pulsing radar
    const userLiveIcon = L.divIcon({
      className: 'user-live-beacon',
      html: `
        <div style="position: relative; width: 24px; height: 24px;">
          <div style="
            position: absolute;
            inset: 0;
            border-radius: 9999px;
            background-color: rgba(21, 101, 192, 0.4);
            animation: beacon-pulse 2s infinite ease-out;
          "></div>
          <div style="
            position: absolute;
            top: 4px; left: 4px;
            width: 16px; height: 16px;
            border-radius: 9999px;
            background-color: #1565C0;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          "></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const userMarker = L.marker([userCoords.lat, userCoords.lng], { icon: userLiveIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup(`<strong>${t('liveLocation')}</strong>`);

    userMarkerRef.current = userMarker;
  }, [userCoords, t]);

  // Update Complaint Markers with 4 Distinct Colors
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    filteredComplaints.forEach((c) => {
      const isResolved = c.status === 'Resolved' || c.status === 'Closed';
      const isCriticalOrHigh = c.priority === 'Critical' || c.priority === 'High' || c.status === 'Escalated';
      const isInProgress = c.status === 'In Progress' || c.status === 'Assigned';

      // 4 Distinct marker colors as specified by user:
      // Red = High Priority / Critical
      // Orange = Medium
      // Green = Resolved
      // Blue = In Progress
      let pinColor = '#1565C0'; // Blue = In Progress
      if (isResolved) {
        pinColor = '#43A047'; // Green = Resolved
      } else if (isCriticalOrHigh) {
        pinColor = '#E53935'; // Red = High Priority
      } else if (c.priority === 'Medium') {
        pinColor = '#FB8C00'; // Orange = Medium
      }

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="
            background-color: ${pinColor};
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.2s ease;
          ">
            <div style="
              width: 10px;
              height: 10px;
              background-color: white;
              border-radius: 50%;
            "></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([c.location.lat, c.location.lng], { icon: customIcon });

      marker.on('click', () => {
        setActiveComplaint(c);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([c.location.lat, c.location.lng]);
        }
      });

      markersLayerRef.current?.addLayer(marker);
    });

    // Invalidate size to ensure proper layout
    mapInstanceRef.current.invalidateSize();
  }, [filteredComplaints]);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] sm:h-[750px] relative w-full overflow-hidden">
      {/* Top Filter & GIS Navigation Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 space-y-2">
        <div className="p-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-soft-lg border border-[#CFD8DC]/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black text-[#263238] dark:text-white">
            <MapPin className="w-4 h-4 text-[#1565C0]" />
            <span>{t('mapHeader')}</span>
            <span className="text-[10px] font-bold text-slate-400">
              ({filteredComplaints.length} markers)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.setView([userCoords.lat, userCoords.lng], 15);
                }
              }}
              title="Center on My Location"
              className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#1565C0] hover:bg-blue-100 transition shadow-xs"
            >
              <Navigation className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsHeatmapMode(!isHeatmapMode)}
              className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold transition shadow-xs ${
                isHeatmapMode
                  ? 'bg-[#FB8C00] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{isHeatmapMode ? 'Heatmap ON' : 'Heatmap'}</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            'All',
            'Road Damage',
            'Garbage',
            'Water Leakage',
            'Drainage',
            'Streetlight',
            'Power Failure',
            'Traffic Signal',
            'Fallen Tree',
          ].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-3 py-1 rounded-full font-bold shadow-soft-sm backdrop-blur-md transition active:scale-95 ${
                selectedCategory === cat
                  ? 'bg-[#1565C0] text-white'
                  : 'bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border border-[#CFD8DC]/80 dark:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} className="flex-1 w-full h-full relative" />

      {/* Map Pin Color Legend Badge */}
      <div className="absolute bottom-20 left-3 z-20 p-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-[#CFD8DC]/80 dark:border-slate-800 shadow-soft-md text-[11px] font-semibold space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#E53935] shadow-xs"></span>
          <span>Red = High Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#FB8C00] shadow-xs"></span>
          <span>Orange = Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#1565C0] shadow-xs"></span>
          <span>Blue = In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#43A047] shadow-xs"></span>
          <span>Green = Resolved</span>
        </div>
      </div>

      {/* Interactive Bottom Sheet Preview Card when marker clicked */}
      {activeComplaint && (
        <div className="absolute bottom-3 left-3 right-3 z-30 bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-soft-xl border border-[#CFD8DC]/80 dark:border-slate-800 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={activeComplaint.beforeImageUrl}
                alt="thumb"
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
              <div>
                <span className="text-xs font-mono font-bold text-[#1565C0] dark:text-blue-400">
                  {activeComplaint.id} • {activeComplaint.category}
                </span>
                <h4 className="font-extrabold text-xs text-[#263238] dark:text-white line-clamp-1 mt-0.5">
                  {activeComplaint.title}
                </h4>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{activeComplaint.location.address}</p>
              </div>
            </div>

            <button
              onClick={() => setActiveComplaint(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 p-1"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
              <Clock className="w-3.5 h-3.5 text-[#FB8C00]" />
              <span>Status: {activeComplaint.status}</span>
            </div>

            <button
              onClick={() => {
                setSelectedComplaintId(activeComplaint.id);
                setActiveTab('track');
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold text-xs shadow-soft-sm transition"
            >
              <span>Track Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
