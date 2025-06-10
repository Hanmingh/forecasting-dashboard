import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RouteResponse, VesselResponse, PortResponse } from '../hooks/types';

// 修复 Leaflet 默认图标问题
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom icons for different markers
const createPortIcon = () => new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const createVesselIcon = () => new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#ff6b35" stroke="#ffffff" stroke-width="2"/>
      <path d="M8 18h16l-2-6h-6l-2-4h-2l-2 4H8l2 6z" fill="#ffffff"/>
      <circle cx="16" cy="16" r="2" fill="#ff6b35"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

interface RouteMapProps {
  routes: RouteResponse[];
  vessels: VesselResponse[];
  ports: PortResponse[];
  selectedRouteId?: number;
  className?: string;
}

const RouteMap: React.FC<RouteMapProps> = ({
  routes,
  vessels,
  ports,
  selectedRouteId,
  className
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([25, 100]);
  const [mapZoom, setMapZoom] = useState(3);

  // Calculate map bounds to fit all ports and routes
  useEffect(() => {
    if (ports.length > 0) {
      const latitudes = ports.map(port => port.latitude);
      const longitudes = ports.map(port => port.longitude);
      
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);
      
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      
      setMapCenter([centerLat, centerLng]);
    }
  }, [ports]);

  // Get vessel name by ID
  const getVesselName = (vesselId: number): string => {
    const vessel = vessels.find(v => v.id === vesselId);
    return vessel?.vessel_name || `Vessel ${vesselId}`;
  };

  // Get port name by ID
  const getPortName = (portId: number): string => {
    const port = ports.find(p => p.id === portId);
    return port?.port_name || `Port ${portId}`;
  };

  // Get port by ID
  const getPort = (portId: number): PortResponse | undefined => {
    return ports.find(p => p.id === portId);
  };

  // Calculate route status
  const getRouteStatus = (route: RouteResponse): string => {
    if (route.current_latitude && route.current_longitude) {
      return 'En Route';
    }
    if (route.actual_departure) {
      return 'Departed';
    }
    if (new Date(route.scheduled_departure) > new Date()) {
      return 'Scheduled';
    }
    return 'Pending';
  };

  // Get route color based on status and selection
  const getRouteColor = (route: RouteResponse): string => {
    if (selectedRouteId === route.id) {
      return '#ff6b35'; // Orange for selected route
    }
    
    const status = getRouteStatus(route);
    switch (status) {
      case 'En Route':
        return '#10b981'; // Green
      case 'Departed':
        return '#3b82f6'; // Blue
      case 'Scheduled':
        return '#8b5cf6'; // Purple
      default:
        return '#6b7280'; // Gray
    }
  };

  // Calculate vessel position along route based on ETD, ETA, and current time
  const calculateVesselPosition = (route: RouteResponse): [number, number] | null => {
    const departurePort = getPort(route.departure_port_id);
    const arrivalPort = getPort(route.arrival_port_id);
    
    if (!departurePort || !arrivalPort) return null;

    const now = new Date();
    const etd = new Date(route.actual_departure || route.scheduled_departure);
    const eta = new Date(route.estimated_arrival);

    // Debug logging
    console.log('Route', route.id, {
      now: now.toISOString(),
      etd: etd.toISOString(),
      eta: eta.toISOString(),
      hasCurrentPos: !!(route.current_latitude && route.current_longitude),
      actualArrival: route.actual_arrival
    });

    // If vessel has actual current position, use that
    if (route.current_latitude && route.current_longitude) {
      console.log('Using actual position for route', route.id);
      return [route.current_latitude, route.current_longitude];
    }

    // If vessel hasn't departed yet, don't show vessel
    if (now < etd) {
      console.log('Route', route.id, 'has not departed yet');
      return null;
    }

    // If vessel has already arrived, don't show vessel
    if (route.actual_arrival && now > new Date(route.actual_arrival)) {
      console.log('Route', route.id, 'has already arrived');
      return null;
    }

    // Calculate progress as percentage of journey completed
    const totalJourneyTime = eta.getTime() - etd.getTime();
    const elapsedTime = now.getTime() - etd.getTime();
    const progress = Math.min(Math.max(elapsedTime / totalJourneyTime, 0), 1);

    console.log('Route', route.id, 'progress:', progress);

    // Interpolate position between departure and arrival ports
    const lat = departurePort.latitude + (arrivalPort.latitude - departurePort.latitude) * progress;
    const lng = departurePort.longitude + (arrivalPort.longitude - departurePort.longitude) * progress;

    console.log('Calculated position for route', route.id, ':', [lat, lng]);
    return [lat, lng];
  };

  // Get vessels that are currently en route
  const getActiveVessels = (): Array<{ route: RouteResponse; position: [number, number] }> => {
    const activeVessels = routes
      .map(route => ({
        route,
        position: calculateVesselPosition(route)
      }))
      .filter((item): item is { route: RouteResponse; position: [number, number] } => 
        item.position !== null
      );
    
    console.log('Active vessels:', activeVessels.length, activeVessels);
    return activeVessels;
  };

  return (
    <div className={`h-full rounded-lg overflow-hidden shadow-md ${className || ''}`}>
      <style>{`
        .leaflet-container {
          background: #ffffff;
          z-index: 1 !important;
        }
        .leaflet-control-container {
          z-index: 2 !important;
        }
        .leaflet-popup-pane {
          z-index: 3 !important;
        }
      `}</style>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        worldCopyJump={false}
        maxBounds={[[-90, -180], [90, 180]]}
        maxBoundsViscosity={1.0}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          noWrap={true}
        />
        
        {/* Render all ports */}
        {ports.map((port) => (
          <Marker 
            key={`port-${port.id}`} 
            position={[port.latitude, port.longitude]}
            icon={createPortIcon()}
          >
            <Popup>
              <div className="space-y-1">
                <h3 className="font-bold text-[#4670bc]">{port.port_name}</h3>
                <p className="text-sm text-gray-600">{port.city}, {port.country}</p>
                <p className="text-xs text-gray-500">Code: {port.port_code}</p>
                <p className="text-xs text-gray-500">Type: {port.port_type}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Render route lines */}
        {routes.map((route) => {
          const departurePort = getPort(route.departure_port_id);
          const arrivalPort = getPort(route.arrival_port_id);
          
          if (!departurePort || !arrivalPort) return null;
          
          return (
            <Polyline
              key={`route-${route.id}`}
              positions={[
                [departurePort.latitude, departurePort.longitude],
                [arrivalPort.latitude, arrivalPort.longitude]
              ]}
              pathOptions={{
                color: getRouteColor(route),
                weight: selectedRouteId === route.id ? 4 : 3,
                opacity: selectedRouteId === route.id ? 1.0 : 0.7,
                dashArray: getRouteStatus(route) === 'Scheduled' ? '10, 5' : undefined
              }}
            />
          );
        })}
        
        {/* Render vessel positions calculated from ETD/ETA progress */}
        {getActiveVessels().map(({ route, position }) => {
          const now = new Date();
          const etd = new Date(route.actual_departure || route.scheduled_departure);
          const eta = new Date(route.estimated_arrival);
          const progress = Math.min(Math.max((now.getTime() - etd.getTime()) / (eta.getTime() - etd.getTime()), 0), 1);
          
          return (
            <Marker
              key={`vessel-${route.id}`}
              position={position}
              icon={createVesselIcon()}
            >
              <Popup>
                <div className="space-y-1">
                  <h3 className="font-bold text-[#4670bc]">{getVesselName(route.vessel_id)}</h3>
                  <p className="text-sm text-gray-600">
                    {getPortName(route.departure_port_id)} → {getPortName(route.arrival_port_id)}
                  </p>
                  <p className="text-xs text-gray-500">Status: {getRouteStatus(route)}</p>
                  <p className="text-xs text-gray-500">
                    Progress: {(progress * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">
                    Departed: {etd.toLocaleDateString()} {etd.toLocaleTimeString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    ETA: {eta.toLocaleDateString()} {eta.toLocaleTimeString()}
                  </p>
                  {route.current_latitude && route.current_longitude && (
                    <p className="text-xs text-blue-600 font-medium">
                      📍 Live Position
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default RouteMap;