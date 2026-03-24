import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, MapPin, Clock, ArrowRight, CornerDownRight, CornerDownLeft, ArrowUp } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { calculateBearing, getInstruction } from '../lib/navigationUtils';

// Ícones customizados estilo Google Maps
const userIcon = L.divIcon({
  className: 'user-location-icon',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const destinationIcon = L.icon({
  iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const driverIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3001/3001764.png', // Ícone de carro
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const assignedDriverIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3001/3001764.png', // Same icon but maybe we can style it differently or use a different URL
  iconSize: [40, 40], // Larger for assigned driver
  iconAnchor: [20, 20],
  className: 'assigned-driver-marker'
});

interface MapProps {
  userLocation: [number, number] | null;
  destination?: {lat: number, lng: number} | null;
  route?: [number, number][] | null;
  routeSteps?: any[] | null;
  driverLocation?: [number, number] | null;
  centerTrigger?: number;
  appMode?: 'rider' | 'driver';
  activeDriverRide?: any;
  nearbyDrivers?: any[];
  isSharedView?: boolean;
  heatmapData?: {lat: number, lng: number}[];
}

// Cálculo simples de distância em km (Haversine)
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};


// ... (getDistance function remains)

// Componente de Overlay de Navegação
const NavigationOverlay = ({ userLocation, destination, route, routeSteps }: { userLocation: [number, number] | null, destination?: {lat: number, lng: number, name?: string} | null, route?: [number, number][] | null, routeSteps?: any[] | null }) => {
  const [lastInstruction, setLastInstruction] = useState<string | null>(null);

  // Encontrar o passo atual baseado na distância
  const getNextStep = () => {
    if (!userLocation || !routeSteps || routeSteps.length === 0) return null;
    
    let closestStep = null;
    let minDistance = Infinity;

    routeSteps.forEach((step) => {
      const [lng, lat] = step.maneuver.location;
      const dist = getDistance(userLocation[0], userLocation[1], lat, lng);
      if (dist < 0.05) return; 
      if (dist < minDistance) {
        minDistance = dist;
        closestStep = { ...step, distance: dist };
      }
    });

    return closestStep;
  };

  const currentStep = getNextStep();
  const instruction = currentStep ? currentStep.maneuver.instruction : "Siga em frente";
  const distanceToManeuver = currentStep ? currentStep.distance : 0;
  
  // Progress bar logic (simplified: 0 to 1)
  const progress = Math.min(Math.max(1 - (distanceToManeuver / 0.5), 0), 1); // Assume 500m maneuver

  useEffect(() => {
    if (instruction !== lastInstruction) {
      setLastInstruction(instruction);
      if (Capacitor.isNativePlatform()) {
        Haptics.impact({ style: ImpactStyle.Medium });
      }
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(instruction);
        utterance.lang = 'pt-BR';
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [instruction, lastInstruction]);

  if (!userLocation || !destination || !route || route.length < 2) return null;

  const getIcon = (instr: string) => {
    const text = instr.toLowerCase();
    if (text.includes("direita")) return <CornerDownRight className="w-8 h-8" />;
    if (text.includes("esquerda")) return <CornerDownLeft className="w-8 h-8" />;
    if (text.includes("rotatória")) return <Navigation className="w-8 h-8 rotate-45" />;
    return <ArrowUp className="w-8 h-8" />;
  };

  const distance = getDistance(userLocation[0], userLocation[1], destination.lat, destination.lng);
  const estimatedTime = Math.round(distance * 2);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="absolute top-4 left-4 right-4 z-[1000] bg-white/80 backdrop-blur-2xl rounded-[2rem] p-5 shadow-lg border border-white/50 flex flex-col gap-3"
      >
        <div className="flex items-center gap-4">
          <div className="bg-blue-500 p-4 rounded-2xl text-white shadow-md">
            {getIcon(instruction)}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Próxima manobra</p>
            <p className="font-semibold text-gray-900 text-xl leading-tight">{instruction}</p>
            <p className="text-blue-600 font-semibold text-lg">
              {distanceToManeuver > 0.1 
                ? `${(distanceToManeuver * 1000).toFixed(0)} metros` 
                : "Agora"}
            </p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-gray-200/50 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between border-t border-gray-200/50 pt-3 mt-1">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <p className="font-medium text-gray-600 text-sm truncate max-w-[120px]">{destination.name || "Destino"}</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-200/50 px-3 py-1 rounded-full">
            <Clock className="w-4 h-4 text-gray-500" />
            <p className="font-semibold text-gray-900 text-sm">{estimatedTime} min</p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

function MapUpdater({ center, destination, route, driverLocation, centerTrigger }: any) {
  const map = useMap();

  // Manual recenter
  useEffect(() => {
    const handleCenter = () => {
      // If there's a driver, center on driver
      if (driverLocation) {
        map.setView(driverLocation, 17);
      } else if (center) {
        map.setView(center, 17);
      }
    };
    window.addEventListener('center-map', handleCenter);
    return () => window.removeEventListener('center-map', handleCenter);
  }, [center, driverLocation, map]);

  // Initial fit bounds when route or destination is set
  useEffect(() => {
    if (!map) return;
    const bounds: [number, number][] = [];
    if (center) bounds.push(center);
    if (destination) bounds.push([destination.lat, destination.lng]);
    if (driverLocation) bounds.push(driverLocation);
    
    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 15);
    }
  }, [destination, route, map]); // Only trigger on destination/route changes, not every driver move

  return null;
}

export default function Map({ userLocation, destination, route, routeSteps, driverLocation, centerTrigger, appMode, nearbyDrivers, isSharedView, heatmapData }: MapProps) {
  const defaultCenter: [number, number] = [-1.295, -47.926];
  const [mapType, setMapType] = React.useState<'roadmap' | 'satellite'>('roadmap');
  const [showTraffic, setShowTraffic] = React.useState(false);

  return (
    <div className="absolute inset-0 z-0 bg-gray-100">
      {/* Shared View Banner */}
      {isSharedView && (
        <div className="absolute top-0 left-0 right-0 z-[1000] bg-blue-600 text-white text-center py-2 text-sm font-bold shadow-md">
          Visualizando corrida compartilhada
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute top-16 right-4 z-[1000] flex flex-col gap-2">
        {/* Map Type Toggle */}
        <button
          onClick={() => setMapType(mapType === 'roadmap' ? 'satellite' : 'roadmap')}
          className="bg-[var(--system-secondary-background)] p-1.5 rounded-xl shadow-lg hover:opacity-90 transition-all border border-[var(--system-separator)] flex items-center gap-2 group"
        >
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-[var(--system-separator)] shrink-0">
            <img 
              src={mapType === 'roadmap' ? "https://mt1.google.com/vt/lyrs=s&x=1&y=1&z=1" : "https://mt1.google.com/vt/lyrs=m&x=1&y=1&z=1"} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
              alt="Toggle Map Type"
            />
          </div>
          <div className="pr-2 text-left">
            <p className="text-[10px] uppercase tracking-wider text-[var(--system-secondary-label)] font-bold leading-none mb-1">Visual</p>
            <p className="text-xs font-black text-[var(--system-label)] leading-none">
              {mapType === 'roadmap' ? 'Satélite' : 'Mapa'}
            </p>
          </div>
        </button>

        {/* Traffic Toggle */}
        <button
          onClick={() => setShowTraffic(!showTraffic)}
          className={`bg-[var(--system-secondary-background)] p-3 rounded-xl shadow-lg hover:opacity-90 transition-all border border-[var(--system-separator)] flex items-center gap-2 ${showTraffic ? 'ring-2 ring-[var(--system-blue)]' : ''}`}
        >
          <span className={`text-xs font-black ${showTraffic ? 'text-[var(--system-blue)]' : 'text-[var(--system-label)]'}`}>Tráfego</span>
        </button>
      </div>

      {/* Navegação Própria - Apenas para Motorista */}
      {appMode === 'driver' && (
        <NavigationOverlay 
          userLocation={userLocation} 
          destination={destination} 
          route={route} 
          routeSteps={routeSteps}
        />
      )}

      <button 
        className="locate-btn"
        onClick={() => {
          if (userLocation) {
            window.dispatchEvent(new CustomEvent('center-map'));
          }
        }}
      >
        <Navigation className="w-6 h-6" />
      </button>

      <MapContainer
        center={userLocation || defaultCenter}
        zoom={15}
        className="h-full w-full hacker-map"
      >
        <TileLayer
          url={mapType === 'roadmap' ? "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" : "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"}
          attribution='&copy; Google Maps'
        />
        
        {/* Heatmap Layer */}
        {heatmapData && heatmapData.map((point, i) => (
          <Circle
            key={i}
            center={[point.lat, point.lng]}
            radius={150}
            pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.3, weight: 0 }}
          />
        ))}

        {showTraffic && (
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=m@221097413,traffic&x={x}&y={y}&z={z}"
            attribution='&copy; Google Maps Traffic'
            opacity={0.6}
          />
        )}
        
        {userLocation && <Marker position={userLocation} icon={userIcon} />}
        {destination && <Marker position={[destination.lat, destination.lng]} icon={destinationIcon} />}
        {driverLocation && <Marker position={driverLocation} icon={assignedDriverIcon} />}
        
        {/* Nearby Drivers */}
        {nearbyDrivers && nearbyDrivers
          .filter(d => !driverLocation || (d.lat !== driverLocation[0] && d.lng !== driverLocation[1]))
          .map(driver => (
            <Marker 
              key={driver.id} 
              position={[driver.lat, driver.lng]} 
              icon={driverIcon}
            />
          ))}
        
        {route && (
          <>
            <Polyline positions={route} color="white" weight={10} opacity={0.5} lineCap="round" />
            <Polyline positions={route} color="#4285F4" weight={6} opacity={0.8} lineCap="round" />
            <Polyline positions={route} color="#1A73E8" weight={4} opacity={1} lineCap="round" />
          </>
        )}
        
        <MapUpdater 
          center={userLocation} 
          destination={destination} 
          route={route} 
          driverLocation={driverLocation} 
          centerTrigger={centerTrigger}
        />
      </MapContainer>
    </div>
  );
}
