import React, { useEffect, useState } from 'react';
import { useRoute } from '../hooks/use-route';
import { useVessel } from '../hooks/use-vessel';
import { usePort } from '../hooks/use-port';
import RouteMap from '../components/route_map';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import type { RouteResponse, RouteCreate, VesselResponse, PortResponse } from '../hooks/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, RefreshCw } from 'lucide-react';

const RoutePage: React.FC = () => {
  // State management
  const [routes, setRoutes] = useState<RouteResponse[]>([]);
  const [vessels, setVessels] = useState<VesselResponse[]>([]);
  const [ports, setPorts] = useState<PortResponse[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteResponse | null>(null);
  const [selectedRouteForMap, setSelectedRouteForMap] = useState<number | undefined>(undefined);
  const [isRouteDialogOpen, setIsRouteDialogOpen] = useState(false);
  const [routeFormData, setRouteFormData] = useState<RouteCreate>({
    vessel_id: 0,
    departure_port_id: 0,
    arrival_port_id: 0,
    scheduled_departure: '',
    estimated_arrival: '',
  });

  // Hooks
  const {
    loading: routeLoading,
    error: routeError,
    fetchRoutes,
    addRoute,
    modifyRoute,
    removeRoute,
  } = useRoute();

  const {
    loading: vesselLoading,
    error: vesselError,
    fetchVessels,
  } = useVessel();

  const {
    loading: portLoading,
    error: portError,
    fetchPorts,
  } = usePort();

  // Fetch initial data
  useEffect(() => {
    loadRoutes();
    loadVessels();
    loadPorts();
  }, []);

  const loadRoutes = async () => {
    const routeData = await fetchRoutes();
    setRoutes(routeData);
  };

  const loadVessels = async () => {
    const vesselData = await fetchVessels();
    setVessels(vesselData);
  };

  const loadPorts = async () => {
    const portData = await fetchPorts();
    setPorts(portData);
  };

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRouteFormData(prev => ({
      ...prev,
      [name]: name.includes('_id') ? parseInt(value) : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setRouteFormData(prev => ({
      ...prev,
      [name]: name.includes('_id') ? parseInt(value) : value,
    }));
  };

  const handleDateChange = (name: string, date: Date | undefined) => {
    if (date) {
      // Preserve existing time if any, otherwise set to current time
      const existingDateTime = routeFormData[name as keyof RouteCreate] as string;
      let timeString = '09:00'; // default time
      
      if (existingDateTime) {
        const existingDate = new Date(existingDateTime);
        timeString = existingDate.toTimeString().slice(0, 5);
      }
      
      // Combine date with time
      const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${timeString}`;
      
      setRouteFormData(prev => ({
        ...prev,
        [name]: formatted,
      }));
    }
  };

  const handleTimeChange = (name: string, time: string) => {
    const existingDateTime = routeFormData[name as keyof RouteCreate] as string;
    if (existingDateTime) {
      const existingDate = new Date(existingDateTime);
      const formatted = `${existingDate.getFullYear()}-${String(existingDate.getMonth() + 1).padStart(2, '0')}-${String(existingDate.getDate()).padStart(2, '0')}T${time}`;
      
      setRouteFormData(prev => ({
        ...prev,
        [name]: formatted,
      }));
    }
  };

  const formatDateTimeForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getTimeFromDateTime = (dateString: string): string => {
    if (!dateString) return '09:00';
    return new Date(dateString).toTimeString().slice(0, 5);
  };

  const handleRouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRoute) {
      await modifyRoute(selectedRoute.id, routeFormData);
    } else {
      await addRoute(routeFormData);
    }
    setIsRouteDialogOpen(false);
    loadRoutes();
  };

  const handleEdit = (route: RouteResponse) => {
    setSelectedRoute(route);
    setRouteFormData({
      vessel_id: route.vessel_id,
      departure_port_id: route.departure_port_id,
      arrival_port_id: route.arrival_port_id,
      scheduled_departure: route.scheduled_departure,
      estimated_arrival: route.estimated_arrival,
      actual_departure: route.actual_departure || undefined,
      actual_arrival: route.actual_arrival || undefined,
      current_latitude: route.current_latitude || undefined,
      current_longitude: route.current_longitude || undefined,
    });
    setIsRouteDialogOpen(true);
  };

  const handleDelete = async (routeId: number) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      await removeRoute(routeId);
      loadRoutes();
    }
  };

  const handleCreateNewRoute = () => {
    setSelectedRoute(null);
    setRouteFormData({
      vessel_id: 0,
      departure_port_id: 0,
      arrival_port_id: 0,
      scheduled_departure: '',
      estimated_arrival: '',
    });
    setIsRouteDialogOpen(true);
  };

  if (routeLoading || vesselLoading || portLoading) {
    return <div>Loading...</div>;
  }

  if (routeError || vesselError || portError) {
    return <div>Error: {(routeError || vesselError || portError)?.message}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#61adde] to-[#4670bc] bg-clip-text text-transparent">Route Management</h1>
        </div>
        <Button
          onClick={() => {
            loadRoutes();
            loadVessels();
            loadPorts();
          }}
          className="bg-gradient-to-r from-[#61adde] to-[#4670bc]"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <div className="space-y-6">
        {/* Routes Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-[#61adde]">Routes</CardTitle>
              <CardDescription>Manage and monitor your shipping routes</CardDescription>
            </div>
            <Button
              onClick={handleCreateNewRoute}
              variant="ghost"
              size="sm"
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {routes.map(route => (
                <Card 
                  key={route.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedRouteForMap === route.id ? 'ring-2 ring-[#61adde]' : ''
                  }`}
                  onClick={() => setSelectedRouteForMap(selectedRouteForMap === route.id ? undefined : route.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold text-[#4670bc] truncate">
                          {vessels.find(v => v.id === route.vessel_id)?.vessel_name || `Vessel ${route.vessel_id}`}
                        </CardTitle>
                        <Badge 
                          variant={
                            route.current_latitude && route.current_longitude
                              ? 'default'
                              : new Date(route.scheduled_departure) > new Date()
                              ? 'secondary'
                              : 'outline'
                          }
                          className="text-xs"
                        >
                          {route.current_latitude && route.current_longitude
                            ? 'En Route'
                            : new Date(route.scheduled_departure) > new Date()
                            ? 'Scheduled'
                            : 'Departed'
                          }
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {ports.find(p => p.id === route.departure_port_id)?.port_name || `Port ${route.departure_port_id}`} → {ports.find(p => p.id === route.arrival_port_id)?.port_name || `Port ${route.arrival_port_id}`}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <div className="text-xs text-muted-foreground">
                      {new Date(route.scheduled_departure).toLocaleDateString()} → {new Date(route.estimated_arrival).toLocaleDateString()}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(route);
                        }}
                        size="sm"
                        className="flex-1 bg-[#61adde] hover:bg-[#4670bc] text-xs py-1"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(route.id);
                        }}
                        size="sm"
                        variant="destructive"
                        className="flex-1 text-xs py-1"
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Add New Route Card */}
              <Card 
                className="border-dashed cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={handleCreateNewRoute}
              >
                <CardContent className="flex items-center justify-center h-[100px]">
                  <div className="text-center">
                    <PlusCircle className="h-5 w-5 mx-auto mb-1 text-[#61adde]" />
                    <p className="text-muted-foreground text-xs">Add New Route</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Route Map Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#61adde]">Route Map</CardTitle>
            <CardDescription>Interactive map showing all routes and vessel positions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[500px]">
              <RouteMap
                routes={routes}
                vessels={vessels}
                ports={ports}
                selectedRouteId={selectedRouteForMap}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Route Dialog */}
      <Dialog open={isRouteDialogOpen} onOpenChange={setIsRouteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#61adde]">{selectedRoute ? 'Edit Route' : 'Create New Route'}</DialogTitle>
            <DialogDescription>
              {selectedRoute ? 'Modify the existing route details' : 'Enter the details for a new route'}
            </DialogDescription>
          </DialogHeader>
          <form id="routeForm" onSubmit={handleRouteSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Vessel</label>
              <Select
                value={routeFormData.vessel_id ? String(routeFormData.vessel_id) : ""}
                onValueChange={(value) => handleSelectChange('vessel_id', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Vessel" />
                </SelectTrigger>
                <SelectContent>
                  {vessels.map(vessel => (
                    <SelectItem key={vessel.id} value={String(vessel.id)}>
                      {vessel.vessel_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Departure Port</label>
              <Select
                value={routeFormData.departure_port_id ? String(routeFormData.departure_port_id) : ""}
                onValueChange={(value) => handleSelectChange('departure_port_id', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Departure Port" />
                </SelectTrigger>
                <SelectContent>
                  {ports.map(port => (
                    <SelectItem key={port.id} value={String(port.id)}>
                      {port.port_name} ({port.country})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Arrival Port</label>
              <Select
                value={routeFormData.arrival_port_id ? String(routeFormData.arrival_port_id) : ""}
                onValueChange={(value) => handleSelectChange('arrival_port_id', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Arrival Port" />
                </SelectTrigger>
                <SelectContent>
                  {ports.map(port => (
                    <SelectItem key={port.id} value={String(port.id)}>
                      {port.port_name} ({port.country})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Scheduled Departure</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {routeFormData.scheduled_departure ? 
                      formatDateTimeForDisplay(routeFormData.scheduled_departure) : 
                      "Select departure date & time"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3">
                    <Calendar
                      mode="single"
                      selected={routeFormData.scheduled_departure ? new Date(routeFormData.scheduled_departure) : undefined}
                      onSelect={(date) => handleDateChange('scheduled_departure', date)}
                      initialFocus
                    />
                    <div className="mt-3 pt-3 border-t">
                      <label className="block text-sm font-medium mb-1">Time</label>
                      <input
                        type="time"
                        value={getTimeFromDateTime(routeFormData.scheduled_departure)}
                        onChange={(e) => handleTimeChange('scheduled_departure', e.target.value)}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-[#61adde] focus:border-transparent"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Estimated Arrival</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {routeFormData.estimated_arrival ? 
                      formatDateTimeForDisplay(routeFormData.estimated_arrival) : 
                      "Select arrival date & time"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3">
                    <Calendar
                      mode="single"
                      selected={routeFormData.estimated_arrival ? new Date(routeFormData.estimated_arrival) : undefined}
                      onSelect={(date) => handleDateChange('estimated_arrival', date)}
                      initialFocus
                    />
                    <div className="mt-3 pt-3 border-t">
                      <label className="block text-sm font-medium mb-1">Time</label>
                      <input
                        type="time"
                        value={getTimeFromDateTime(routeFormData.estimated_arrival)}
                        onChange={(e) => handleTimeChange('estimated_arrival', e.target.value)}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-[#61adde] focus:border-transparent"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </form>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => setIsRouteDialogOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="routeForm"
              className="bg-gradient-to-r from-[#61adde] to-[#4670bc]"
            >
              {selectedRoute ? 'Update Route' : 'Create Route'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoutePage;
