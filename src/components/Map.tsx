import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, MapPin, Clock, ArrowRight, CornerDownRight, CornerDownLeft, ArrowUp, ArrowUpRight } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { calculateBearing, getInstruction } from '../lib/navigationUtils';

// Ícones customizados estilo Google Maps
const userIcon = L.divIcon({
  className: 'user-location-icon',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const driverUserIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3082/3082383.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
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
  routeInfo?: { distance: number, duration: number } | null;
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
const NavigationOverlay = ({ userLocation, destination, route, routeSteps, routeInfo }: { 
  userLocation: [number, number] | null, 
  destination?: {lat: number, lng: number, name?: string} | null, 
  route?: [number, number][] | null, 
  routeSteps?: any[] | null,
  routeInfo?: { distance: number, duration: number } | null
}) => {
  const [lastInstruction, setLastInstruction] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Encontrar o passo mais próximo baseado na localização do usuário
  useEffect(() => {
    if (!userLocation || !routeSteps || routeSteps.length === 0) return;

    let closestIndex = 0;
    let minDistance = Infinity;

    routeSteps.forEach((step, index) => {
      const [lng, lat] = step.maneuver.location;
      const dist = getDistance(userLocation[0], userLocation[1], lat, lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = index;
      }
    });

    setCurrentStepIndex(closestIndex);
  }, [userLocation, routeSteps]);

  if (!userLocation || !destination || !route || route.length < 2 || !routeSteps || routeSteps.length === 0) return null;

  const currentStep = routeSteps[currentStepIndex];
  const nextStep = routeSteps[currentStepIndex + 1];
  
  const isArrival = currentStep?.maneuver?.type === 'arrive';
  const instruction = isArrival ? "Você chegou!" : (currentStep ? currentStep.maneuver.instruction : "Siga em frente");
  const distanceToManeuver = currentStep ? (currentStep.distance >= 1000 ? `${(currentStep.distance / 1000).toFixed(1)} km` : `${Math.round(currentStep.distance)} m`) : "";
  const street = isArrival ? destination?.name : (currentStep?.name || "");

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

  const getIcon = (instr: string) => {
    const text = instr.toLowerCase();
    if (text.includes("direita")) return <CornerDownRight className="w-9 h-9" />;
    if (text.includes("esquerda")) return <CornerDownLeft className="w-9 h-9" />;
    if (text.includes("rotatória")) return <Navigation className="w-9 h-9 rotate-45" />;
    return <ArrowUp className="w-9 h-9" />;
  };

  // Calcular tempo e distância restante
  const remainingDistance = routeInfo ? (routeInfo.distance / 1000).toFixed(1) : "0";
  const remainingTime = routeInfo ? Math.round(routeInfo.duration / 60) : 0;

  return (
    <motion.div 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute top-4 left-4 right-4 z-[2000] pointer-events-none"
    >
      <div className="bg-[#1c1c1e]/95 backdrop-blur-xl rounded-3xl p-5 shadow-2xl border border-white/10 flex items-center gap-5 pointer-events-auto overflow-hidden relative">
        <div className="absolute bottom-0 left-0 h-1 bg-blue-500/20 w-full" />
        
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
          <div className="text-white">
            {getIcon(instruction)}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">Próxima manobra</p>
            <p className="text-lg font-black text-white tabular-nums">{distanceToManeuver}</p>
          </div>
          <h2 className="text-xl font-bold text-white leading-tight truncate">
            {instruction}
          </h2>
          {street && (
            <p className="text-sm font-medium text-gray-400 truncate mt-0.5">
              {street}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-2 mx-2">
        {nextStep && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 bg-[#2c2c2e]/90 backdrop-blur-md rounded-2xl p-3 border border-white/5 flex items-center gap-3 shadow-lg pointer-events-auto"
          >
            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center shrink-0">
              <ArrowUpRight className="text-gray-300 w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Depois</p>
              <p className="text-sm font-semibold text-gray-200 truncate">{nextStep.maneuver.instruction}</p>
            </div>
          </motion.div>
        )}

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#2c2c2e]/90 backdrop-blur-md rounded-2xl p-3 border border-white/5 flex flex-col items-center justify-center shadow-lg pointer-events-auto min-w-[80px]"
        >
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Chegada</p>
          <p className="text-sm font-black text-white">{remainingTime} min</p>
          <p className="text-[10px] text-gray-400">{remainingDistance} km</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

function MapUpdater({ userLocation, destination, route, driverLocation, centerTrigger, isFollowing, setIsFollowing }: { 
  userLocation: [number, number] | null, 
  destination?: {lat: number, lng: number, name?: string} | null, 
  route?: [number, number][] | null, 
  driverLocation?: [number, number] | null,
  centerTrigger: number,
  isFollowing: boolean,
  setIsFollowing: (val: boolean) => void
}) {
  const map = useMap();
  const [lastTrigger, setLastTrigger] = React.useState(0);

  // Centralizar no usuário se estiver seguindo
  useEffect(() => {
    if (userLocation && isFollowing) {
      map.setView(userLocation, map.getZoom());
    }
  }, [userLocation, isFollowing, map]);

  // Centralizar forçadamente pelo trigger
  useEffect(() => {
    if (centerTrigger > lastTrigger && userLocation) {
      map.setView(userLocation, 17);
      setLastTrigger(centerTrigger);
      setIsFollowing(true);
    }
  }, [centerTrigger, lastTrigger, userLocation, map, setIsFollowing]);

  // Ajustar limites quando a rota ou destino muda
  useEffect(() => {
    if (!map) return;
    
    const bounds: [number, number][] = [];
    if (userLocation) bounds.push(userLocation);
    if (destination) bounds.push([destination.lat, destination.lng]);
    if (driverLocation) bounds.push(driverLocation);
    
    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 16 });
      setIsFollowing(false);
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 15);
    }
  }, [destination, route, map, setIsFollowing]);

  // Detectar arraste manual para parar de seguir
  useEffect(() => {
    const onDrag = () => {
      setIsFollowing(false);
    };
    map.on('dragstart', onDrag);
    return () => {
      map.off('dragstart', onDrag);
    };
  }, [map, setIsFollowing]);

  return null;
}

export default function Map({ userLocation, destination, route, routeSteps, routeInfo, driverLocation, centerTrigger, appMode, nearbyDrivers, isSharedView, heatmapData }: MapProps) {
  const defaultCenter: [number, number] = [-1.295, -47.926];
  const [mapType, setMapType] = React.useState<'roadmap' | 'satellite'>('roadmap');
  const [showTraffic, setShowTraffic] = React.useState(false);
  const [isFollowing, setIsFollowing] = React.useState(true);

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

      {/* Botão de Centralizar */}
      <div className="absolute right-4 bottom-32 z-[1000] flex flex-col gap-2">
        <button 
          onClick={() => {
            setIsFollowing(true);
            Haptics.impact({ style: ImpactStyle.Light });
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${
            isFollowing 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          <Navigation className={`w-6 h-6 ${isFollowing ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Navegação Própria - Apenas para Motorista */}
      {appMode === 'driver' && !isSharedView && routeSteps && routeSteps.length > 0 && (
        <NavigationOverlay 
          userLocation={userLocation} 
          destination={destination} 
          route={route} 
          routeSteps={routeSteps}
          routeInfo={routeInfo}
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
        
        {userLocation && <Marker position={userLocation} icon={appMode === 'driver' ? driverUserIcon : userIcon} />}
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
          userLocation={userLocation} 
          destination={destination} 
          route={route} 
          driverLocation={driverLocation} 
          centerTrigger={centerTrigger}
          isFollowing={isFollowing}
          setIsFollowing={setIsFollowing}
        />
      </MapContainer>
    </div>
  );
}
