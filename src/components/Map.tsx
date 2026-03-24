import React, { useEffect, useState, useRef } from 'react';
import { APIProvider, Map as GoogleMap, Marker, useMap } from '@vis.gl/react-google-maps';

function Polyline({ path, strokeColor, strokeWeight }: { path: { lat: number, lng: number }[], strokeColor: string, strokeWeight: number }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const polyline = new google.maps.Polyline({
      path,
      strokeColor,
      strokeWeight,
    });
    polyline.setMap(map);
    return () => polyline.setMap(null);
  }, [map, path, strokeColor, strokeWeight]);
  return null;
}

export interface MapProps {
  userLocation: [number, number] | null;
  destination: any;
  route: [number, number][] | null;
  routeSteps: any[] | null;
  routeInfo: any | null;
  driverLocation: [number, number] | null;
  centerTrigger: any;
  appMode: 'rider' | 'driver';
  nearbyDrivers: any[];
  isSharedView: boolean;
  activeDriverRide: any;
  heatmapData: any[];
}

export default function Map({ userLocation, destination, route, driverLocation, nearbyDrivers, heatmapData }: MapProps) {
  const defaultCenter = { lat: -1.295, lng: -47.926 };

  return (
    <div className="absolute inset-0">
      <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          defaultCenter={defaultCenter}
          defaultZoom={13}
          mapId="map"
        >
          {userLocation && (
            <Marker position={{ lat: userLocation[0], lng: userLocation[1] }} />
          )}
          {destination && (
            <Marker position={{ lat: destination.lat, lng: destination.lng }} />
          )}
          {driverLocation && (
            <Marker position={{ lat: driverLocation[0], lng: driverLocation[1] }} />
          )}
          
          {nearbyDrivers && nearbyDrivers
            .filter(d => !driverLocation || (d.lat !== driverLocation[0] && d.lng !== driverLocation[1]))
            .map(driver => (
              <Marker 
                key={driver.id} 
                position={{ lat: driver.lat, lng: driver.lng }}
              />
            ))}
          
          {route && (
            <Polyline 
              path={route.map(coord => ({ lat: coord[0], lng: coord[1] }))} 
              strokeColor="#4285F4" 
              strokeWeight={6} 
            />
          )}
        </GoogleMap>
      </APIProvider>
    </div>
  );
}
