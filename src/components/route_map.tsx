import { VectorMap } from "@react-jvectormap/core";
import { worldMill } from "@react-jvectormap/world";
import React from "react";
import { colorScale, countries } from "./Countries";
import type { RouteResponse, PortResponse } from "../hooks/types";

interface RouteMapProps {
  routes: RouteResponse[];
  ports: PortResponse[];
  selectedRouteId?: number;
}

function RouteMap({ routes, ports, selectedRouteId }: RouteMapProps) {
  // Create markers for ports used in routes
  const routeMarkers: Array<{ name: string; latLng: [number, number]; style?: any }> = [];

  routes.forEach((route, index) => {
    const departurePort = ports.find(p => p.id === route.departure_port_id);
    const arrivalPort = ports.find(p => p.id === route.arrival_port_id);
    
    if (departurePort && arrivalPort) {
      // Add departure port marker if not already added
      const depExists = routeMarkers.find(m => m.name === departurePort.port_name);
      if (!depExists) {
        routeMarkers.push({
          name: departurePort.port_name,
          latLng: [departurePort.latitude, departurePort.longitude],
          style: {
            initial: {
              fill: "#2ecc71",
              stroke: "#27ae60",
              "stroke-width": 2,
              r: 6
            }
          }
        });
      }
      
      // Add arrival port marker if not already added
      const arrExists = routeMarkers.find(m => m.name === arrivalPort.port_name);
      if (!arrExists) {
        routeMarkers.push({
          name: arrivalPort.port_name,
          latLng: [arrivalPort.latitude, arrivalPort.longitude],
          style: {
            initial: {
              fill: "#e74c3c",
              stroke: "#c0392b",
              "stroke-width": 2,
              r: 6
            }
          }
        });
      }

      // Add vessel current position if available
      if (route.current_latitude && route.current_longitude) {
        routeMarkers.push({
          name: `Vessel ${route.id}`,
          latLng: [route.current_latitude, route.current_longitude],
          style: {
            initial: {
              fill: selectedRouteId === route.id ? "#ff0000" : "#3498db",
              stroke: "#2c3e50",
              "stroke-width": 3,
              r: 8
            }
          }
        });
      }
    }
  });

  // Use only the route markers
  const allMarkers = routeMarkers;

  return (
    <div style={{ width: "100%", height: "600px", position: "relative" }}>
      <VectorMap
        map={worldMill}
        style={{
          width: "100%",
          height: "100%",
        }}
        backgroundColor="#f8f9fa"
        markers={allMarkers}
        markerStyle={{
          initial: {
            fill: "#3498db",
            stroke: "#2c3e50",
          },
          hover: {
            fill: "#e74c3c",
            cursor: "pointer",
          },
        }}
        series={{
          regions: [
            {
              scale: colorScale,
              values: countries,
              attribute: "fill",
            },
          ],
        }}
        onRegionTipShow={function reginalTip(event: any, label: any, code: string) {
          return label.html(`
            <div style="background-color: black; border-radius: 6px; min-height: 50px; width: 125px; color: white; padding: 10px">
              <p>
                <b>${label.html()}</b>
              </p>
              <p>
                ${countries[code as keyof typeof countries] || 'N/A'}
              </p>
            </div>
          `);
        }}
        onMarkerTipShow={function markerTip(event: any, label: any, code: string) {
          const port = ports.find(p => p.port_name === code);
          const vessel = routes.find(r => `Vessel ${r.id}` === code);
          
          let content = `<b>${label.html()}</b>`;
          
          if (port) {
            content += `<br/>Type: ${port.port_type}<br/>Country: ${port.country}`;
            
            // Show routes using this port
            const routesUsingPort = routes.filter(r => 
              r.departure_port_id === port.id || r.arrival_port_id === port.id
            );
            if (routesUsingPort.length > 0) {
              content += `<br/>Active Routes: ${routesUsingPort.length}`;
            }
          } else if (vessel) {
            const departurePort = ports.find(p => p.id === vessel.departure_port_id);
            const arrivalPort = ports.find(p => p.id === vessel.arrival_port_id);
            content += `<br/>Route: ${departurePort?.port_name} → ${arrivalPort?.port_name}`;
            content += `<br/>Departure: ${new Date(vessel.scheduled_departure).toLocaleDateString()}`;
            content += `<br/>ETA: ${new Date(vessel.estimated_arrival).toLocaleDateString()}`;
          }
          
          return label.html(`
            <div style="background-color: white; border-radius: 6px; min-height: 50px; width: 180px; color: black; padding: 10px; border: 1px solid #ccc;">
              <p style="color: black; margin: 0;">
                ${content}
              </p>
            </div>
          `);
        }}
        regionStyle={{
          initial: {
            fill: "#ecf0f1",
            stroke: "#bdc3c7",
          },
          hover: {
            fill: "#3498db",
            cursor: "pointer",
          },
        }}
      />
      
      {/* Map Legend */}
      <div style={{ 
        position: "absolute", 
        top: "10px", 
        right: "10px", 
        backgroundColor: "rgba(255, 255, 255, 0.9)", 
        padding: "10px", 
        borderRadius: "6px",
        fontSize: "12px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <div style={{ fontWeight: "bold", marginBottom: "8px" }}>Legend</div>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
          <div style={{ width: "12px", height: "12px", backgroundColor: "#2ecc71", borderRadius: "50%", marginRight: "6px" }}></div>
          Departure Ports
        </div>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
          <div style={{ width: "12px", height: "12px", backgroundColor: "#e74c3c", borderRadius: "50%", marginRight: "6px" }}></div>
          Arrival Ports
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: "12px", height: "12px", backgroundColor: "#3498db", borderRadius: "50%", marginRight: "6px" }}></div>
          Vessels
        </div>
      </div>
    </div>
  );
}

export default RouteMap;