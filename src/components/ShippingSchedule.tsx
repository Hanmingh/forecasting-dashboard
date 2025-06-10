import React, { useState, useEffect } from 'react';
import { Map, List, Ship, ChevronDown, ArrowRight, ArrowLeft, CornerDownLeft, CornerDownRight, CornerRightDown, CornerLeftDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactCountryFlag from "react-country-flag";
import { getCountryCode } from '@/utils/countryCodeMapping';
import type { RouteResponse, VesselResponse, PortResponse } from '@/hooks/types';

interface ShippingScheduleProps {
  routes: RouteResponse[];
  vessels: VesselResponse[];
  ports: PortResponse[];
  title?: string;
  subtitle?: string;
  showControls?: boolean;
  compact?: boolean;
  onRouteClick?: (route: RouteResponse) => void;
}

interface ScheduleEvent {
  type: 'departure' | 'arrival' | 'transit';
  date: Date;
  port: string;
  time: string;
  vessel: string;
  status: 'completed' | 'current' | 'scheduled';
}

const ShippingSchedule: React.FC<ShippingScheduleProps> = ({
  routes,
  vessels,
  ports,
  title = "PACIFIC NORTH 1 - PN1",
  subtitle = "G458 TEU / 42 Days Round Trip",
  showControls = true,
  compact = false
}) => {
  const [selectedVesselId, setSelectedVesselId] = useState<number | null>(
    vessels.length > 0 ? vessels[0].id : null
  );

  // Set the first vessel as default when vessels data is loaded
  useEffect(() => {
    if (vessels.length > 0 && selectedVesselId === null) {
      setSelectedVesselId(vessels[0].id);
    }
  }, [vessels, selectedVesselId]);

  const getVesselName = (vesselId: number | null) => {
    if (!vesselId) return 'Unknown Vessel';
    const vessel = vessels.find(v => v.id === vesselId);
    return vessel?.vessel_name || `Vessel ${vesselId}`;
  };

  const getPortCode = (portId: number) => {
    const port = ports.find(p => p.id === portId);
    return port?.port_code || port?.port_name?.substring(0, 3).toUpperCase() || 'UNK';
  };

  const getPortInfo = (portId: number) => {
    const port = ports.find(p => p.id === portId);
    const countryName = port?.country || 'United States';
    return {
      code: port?.port_code || port?.port_name?.substring(0, 3).toUpperCase() || 'UNK',
      country: getCountryCode(countryName),
      countryName: countryName,
      name: port?.port_name || 'Unknown Port'
    };
  };

  const generateScheduleEvents = (): ScheduleEvent[] => {
    // Show all routes for the selected vessel only (both departed and scheduled)
    const vesselRoutes = routes.filter(route => route.vessel_id === selectedVesselId);
    const events: ScheduleEvent[] = [];
    const now = new Date();

    vesselRoutes.forEach(route => {
      // Departure event
      events.push({
        type: 'departure',
        date: new Date(route.scheduled_departure),
        port: getPortCode(route.departure_port_id),
        time: new Date(route.scheduled_departure).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false }),
        vessel: getVesselName(route.vessel_id),
        status: new Date(route.scheduled_departure) < now ? 'completed' : 'scheduled'
      });

      // Arrival event
      events.push({
        type: 'arrival',
        date: new Date(route.estimated_arrival),
        port: getPortCode(route.arrival_port_id),
        time: new Date(route.estimated_arrival).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false }),
        vessel: getVesselName(route.vessel_id),
        status: route.actual_arrival ? 'completed' : 
                new Date(route.estimated_arrival) < now ? 'current' : 'scheduled'
      });
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const hasActiveRoute = (date: Date) => {
    const vesselRoutes = routes.filter(route => route.vessel_id === selectedVesselId);
    return vesselRoutes.some(route => {
      const departureDate = new Date(route.scheduled_departure);
      const arrivalDate = new Date(route.estimated_arrival);
      
      // Check if this date falls within any route period or has specific events
      return departureDate.toDateString() === date.toDateString() ||
             arrivalDate.toDateString() === date.toDateString() ||
             (date >= departureDate && date <= arrivalDate);
    });
  };

  const generateWeekDays = () => {
    if (!selectedVesselId) return [];
    
    const vesselRoutes = routes.filter(route => route.vessel_id === selectedVesselId);
    if (vesselRoutes.length === 0) return [];
    
    // Find earliest departure and latest arrival dates
    let earliestDate = new Date(vesselRoutes[0].scheduled_departure);
    let latestDate = new Date(vesselRoutes[0].estimated_arrival);
    
    vesselRoutes.forEach(route => {
      const departureDate = new Date(route.scheduled_departure);
      const arrivalDate = new Date(route.estimated_arrival);
      
      if (departureDate < earliestDate) earliestDate = departureDate;
      if (arrivalDate > latestDate) latestDate = arrivalDate;
    });
    
    // Add buffer days (7 days before earliest, 7 days after latest)
    const startDate = new Date(earliestDate);
    startDate.setDate(startDate.getDate() - 7);
    
    const endDate = new Date(latestDate);
    endDate.setDate(endDate.getDate() + 7);
    
    // Generate all days in the range
    const days = [];
    const currentDate = new Date(startDate);
    const today = new Date();
    
    while (currentDate <= endDate) {
      days.push({
        day: currentDate.getDate(),
        weekday: currentDate.toLocaleDateString('en', { weekday: 'short' }).toUpperCase(),
        isToday: currentDate.toDateString() === today.toDateString(),
        date: new Date(currentDate)
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Organize into rows of 14 days each
    const rows = [];
    const daysPerRow = 14;
    for (let i = 0; i < days.length; i += daysPerRow) {
      const rowDays = days.slice(i, i + daysPerRow);
      const rowIndex = Math.floor(i / daysPerRow);
      
      // Reverse every other row for "Z" pattern
      if (rowIndex % 2 === 1) {
        rowDays.reverse();
      }
      rows.push(rowDays);
    }
    
    return rows;
  };

  if (compact && routes.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-6">
          <Ship className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No shipping routes available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full min-h-[600px]">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CardTitle className="text-xl text-[#61adde]">{title}</CardTitle>
            <div className="text-sm text-muted-foreground">{subtitle}</div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Vessel Selector */}
            <div className="relative">
              <select 
                value={selectedVesselId || ''} 
                onChange={(e) => setSelectedVesselId(Number(e.target.value))}
                className="bg-background text-foreground border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-[#61adde] appearance-none pr-8"
              >
                {vessels.map(vessel => (
                  <option key={vessel.id} value={vessel.id}>
                    {vessel.vessel_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>

            {/* Status Info */}
            <div className="text-center">
              <div className="text-xs text-muted-foreground">
                {new Date().toLocaleString('en', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short',
                  year: '2-digit'
                })} UTC
              </div>
              <div className="w-64 bg-muted rounded-full h-3 mt-1">
                <div className="bg-[#61adde] h-3 rounded-full" style={{ width: '67%' }}></div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-muted-foreground">On Time Status</div>
              <div className="text-lg font-bold text-[#61adde]">
                67% <span className="text-xs">(2/3 vessels)</span>
              </div>
            </div>
            
            {showControls && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button className="p-2 bg-muted rounded hover:bg-muted/80">
                    <List size={16} />
                  </button>
                  <button className="p-2 bg-muted rounded hover:bg-muted/80">
                    <Map size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Week Days Header Card */}
        <Card>
          <CardContent className="p-4">
            {/* Grid Layout for Dates and Events */}
            <div className="grid grid-cols-14 gap-2">
              {generateWeekDays().map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  {/* Date Row */}
                  {row.map((day, dayIndex) => (
                    <div key={`date-${rowIndex}-${dayIndex}`} 
                         className={`text-center p-2 text-sm rounded border-b border-[#61adde]/20 relative ${day.isToday ? 'bg-[#61adde]/10 text-[#4670bc]' : 'text-muted-foreground'}`}>
                      <div className="font-bold">{day.day}</div>
                      <div className="text-xs">{day.weekday}</div>
                    </div>
                  ))}
                  
                  {/* Event Row for this week */}
                  {row.map((day, dayIndex) => {
                    const scheduleEvents = generateScheduleEvents();
                    const dayEvents = scheduleEvents.filter(event => 
                      event.date.toDateString() === day.date.toDateString()
                    );
                    const hasRoute = hasActiveRoute(day.date);
                    const isReversedRow = rowIndex % 2 === 1;
                    const shouldShowArrows = hasRoute && dayEvents.length === 0 && !day.isToday;
                    const isPastDate = day.date < new Date(new Date().setHours(0, 0, 0, 0));
                    
                    // Check if this is a connecting point between rows
                    const isRightmost = dayIndex === row.length - 1;
                    const isLeftmost = dayIndex === 0;
                    const allRows = generateWeekDays();
                    const nextRow = allRows[rowIndex + 1];
                    const prevRow = allRows[rowIndex - 1];
                    
                    let cornerArrowType = null;
                    
                    if (hasRoute && dayEvents.length === 0 && !day.isToday) {
                      // Check for corner arrows based on position and connections
                      if (isReversedRow) {
                        if (isRightmost && prevRow) {
                          // Rightest date in reversed row, check upside date
                          const upsideDay = prevRow[prevRow.length - 1]; // Rightest of previous row
                          if (hasActiveRoute(upsideDay.date)) {
                            cornerArrowType = 'CornerDownLeft';
                          }
                        } else if (isLeftmost && nextRow) {
                          // Leftest date in reversed row, check downside date  
                          const downsideDay = nextRow[0]; // Leftest of next row
                          if (hasActiveRoute(downsideDay.date)) {
                            cornerArrowType = 'CornerLeftDown';
                          }
                        }
                      } else {
                        if (isLeftmost && prevRow) {
                          // Leftest date in normal row, check upside date
                          const upsideDay = prevRow[0]; // Leftest of previous row
                          if (hasActiveRoute(upsideDay.date)) {
                            cornerArrowType = 'CornerDownRight';
                          }
                        } else if (isRightmost && nextRow) {
                          // Rightest date in normal row, check downside date
                          const downsideDay = nextRow[nextRow.length - 1]; // Rightest of next row
                          if (hasActiveRoute(downsideDay.date)) {
                            cornerArrowType = 'CornerRightDown';
                          }
                        }
                      }
                    }
                    
                    return (
                      <div key={`event-${rowIndex}-${dayIndex}`} 
                           className="min-h-[60px] relative">
                        {/* Ship icon for today */}
                        {day.isToday && (
                          <Ship className="absolute h-full w-full text-[#61adde]" />
                        )}
                        
                        {dayEvents.map((event, eventIndex) => {
                          // Get port information for the event
                          const vesselRoutes = routes.filter(route => route.vessel_id === selectedVesselId);
                          const eventRoute = vesselRoutes.find(route => {
                            const departureDate = new Date(route.scheduled_departure).toDateString();
                            const arrivalDate = new Date(route.estimated_arrival).toDateString();
                            const eventDate = event.date.toDateString();
                            
                            return (event.type === 'departure' && departureDate === eventDate) ||
                                   (event.type === 'arrival' && arrivalDate === eventDate);
                          });
                          
                          const portId = event.type === 'departure' 
                            ? eventRoute?.departure_port_id 
                            : eventRoute?.arrival_port_id;
                          
                          const portInfo = getPortInfo(portId || 0);
                          
                          return (
                            <div key={eventIndex} className="mb-1">
                              <div className={`w-full text-xs font-bold text-center p-1 rounded flex items-center justify-center gap-1 ${
                                event.type === 'departure' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                <ReactCountryFlag 
                                  countryCode={portInfo.country} 
                                  svg 
                                  style={{
                                    width: '14px',
                                    height: '10px',
                                  }}
                                />
                                {event.port}
                              </div>
                              <div className="text-xs text-[#61adde] text-center">{event.time}</div>
                            </div>
                          );
                        })}
                        
                        {/* Active route indicator with appropriate arrow */}
                        {(shouldShowArrows || cornerArrowType) && (
                          <div className={`absolute inset-0 ${isPastDate ? 'opacity-30' : ''}`}>
                            {cornerArrowType ? (
                              // Corner arrows with connecting lines
                              <>
                                {cornerArrowType === 'CornerDownLeft' && (
                                  <>
                                    {/* Half vertical line on top */}
                                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-1/2 bg-[#61adde]"></div>
                                    {/* Half horizontal line on left */}
                                    <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-1/2 h-0.5 bg-[#61adde]"></div>
                                    {/* Corner arrow */}
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                      <CornerDownLeft className="text-[#61adde] w-6 h-6 bg-background rounded-full p-1"/>
                                    </div>
                                  </>
                                )}
                                {cornerArrowType === 'CornerDownRight' && (
                                  <>
                                    {/* Half vertical line on top */}
                                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-1/2 bg-[#61adde]"></div>
                                    {/* Half horizontal line on right */}
                                    <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-1/2 h-0.5 bg-[#61adde]"></div>
                                    {/* Corner arrow */}
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                      <CornerDownRight className="text-[#61adde] w-6 h-6 bg-background rounded-full p-1"/>
                                    </div>
                                  </>
                                )}
                                {cornerArrowType === 'CornerRightDown' && (
                                  <>
                                    {/* Half horizontal line on left */}
                                    <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-1/2 h-0.5 bg-[#61adde]"></div>
                                    {/* Half vertical line on bottom */}
                                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0.5 h-1/2 bg-[#61adde]"></div>
                                    {/* Corner arrow */}
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                      <CornerRightDown className="text-[#61adde] w-6 h-6 bg-background rounded-full p-1"/>
                                    </div>
                                  </>
                                )}
                                {cornerArrowType === 'CornerLeftDown' && (
                                  <>
                                    {/* Half horizontal line on right */}
                                    <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-1/2 h-0.5 bg-[#61adde]"></div>
                                    {/* Half vertical line on bottom */}
                                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0.5 h-1/2 bg-[#61adde]"></div>
                                    {/* Corner arrow */}
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                      <CornerLeftDown className="text-[#61adde] w-6 h-6 bg-background rounded-full p-1"/>
                                    </div>
                                  </>
                                )}
                              </>
                            ) : (
                              // Straight line with arrow
                              <>
                                {/* Full horizontal line */}
                                <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 h-0.5 bg-[#61adde]"></div>
                                {/* Overlapping arrow in center */}
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                  {isReversedRow ? (
                                    <ArrowLeft className="text-[#61adde] w-6 h-6 bg-background rounded-full p-1"/>
                                  ) : (
                                    <ArrowRight className="text-[#61adde] w-6 h-6 bg-background rounded-full p-1"/>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default ShippingSchedule;