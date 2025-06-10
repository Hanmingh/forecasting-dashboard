import React, { useState } from 'react';
import { Map, List, Ship, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedVesselId, setSelectedVesselId] = useState<number | null>(
    vessels.length > 0 ? vessels[0].id : null
  );

  const getEarliestRouteDate = () => {
    if (!selectedVesselId) return new Date();
    
    const vesselRoutes = routes.filter(route => route.vessel_id === selectedVesselId);
    if (vesselRoutes.length === 0) return new Date();
    
    const earliestDate = vesselRoutes.reduce((earliest, route) => {
      const routeDate = new Date(route.scheduled_departure);
      return routeDate < earliest ? routeDate : earliest;
    }, new Date(vesselRoutes[0].scheduled_departure));
    
    return earliestDate;
  };

  const getVesselName = (vesselId: number | null) => {
    if (!vesselId) return 'Unknown Vessel';
    const vessel = vessels.find(v => v.id === vesselId);
    return vessel?.vessel_name || `Vessel ${vesselId}`;
  };

  const getPortCode = (portId: number) => {
    const port = ports.find(p => p.id === portId);
    return port?.port_code || port?.port_name?.substring(0, 3).toUpperCase() || 'UNK';
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
    const days = [];
    const totalDays = 28; // 4 weeks total, but we'll display as 2 rows of 14 days each
    const startDate = getEarliestRouteDate();
    
    for (let i = -7; i <= totalDays - 8; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const today = new Date();
      days.push({
        day: date.getDate(),
        weekday: date.toLocaleDateString('en', { weekday: 'short' }).toUpperCase(),
        isToday: date.toDateString() === today.toDateString(),
        date: date
      });
    }
    
    // Organize into "Z" pattern: 2 weeks (14 days) per row
    const rows = [];
    for (let row = 0; row < 2; row++) {
      const rowDays = days.slice(row * 14, (row + 1) * 14);
      // Reverse every other row for "Z" pattern
      if (row % 2 === 1) {
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
                      
                      {/* Ship icon for today */}
                      {day.isToday && (
                        <div className="absolute top-1 right-1">
                          <Ship className="h-3 w-3 text-[#61adde]" />
                        </div>
                      )}
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
                    
                    return (
                      <div key={`event-${rowIndex}-${dayIndex}`} 
                           className="min-h-[60px] relative">
                        {dayEvents.map((event, eventIndex) => (
                          <div key={eventIndex} className="mb-1">
                            <div className={`w-full text-xs font-bold text-center p-1 rounded ${
                              event.type === 'departure' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {'⚓'} {event.port}
                            </div>
                            <div className="text-xs text-[#61adde] text-center">{event.time}</div>
                          </div>
                        ))}
                        
                        {/* Active route indicator line with arrows - only for active dates with no events */}
                        {shouldShowArrows && (
                          <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center">
                            <div className="flex items-center w-full">
                              {isReversedRow ? (
                                <>
                                  <div className="text-[#61adde] text-xs">←</div>
                                  <div className="flex-1 h-0.5 bg-[#61adde] mx-1"></div>
                                  <div className="text-[#61adde] text-xs">←</div>
                                </>
                              ) : (
                                <>
                                  <div className="text-[#61adde] text-xs">→</div>
                                  <div className="flex-1 h-0.5 bg-[#61adde] mx-1"></div>
                                  <div className="text-[#61adde] text-xs">→</div>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
            
            {/* Vessel Icon and Progress */}
            <div className="flex items-center justify-between mt-4 p-2 bg-muted/30 rounded">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-6 bg-[#61adde] rounded flex items-center justify-center">
                  <Ship className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium">Active Route</span>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-muted-foreground">+{Math.floor(Math.random() * 200)}h</span>
                <span className="font-bold text-[#61adde]">{(Math.random() * 20).toFixed(1)}kt</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default ShippingSchedule;