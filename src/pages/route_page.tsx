import React, { useEffect, useState } from 'react';
import { useRoute } from '../hooks/use-route';
import { useVessel } from '../hooks/use-vessel';
import { usePort } from '../hooks/use-port';
import RouteMap from '../components/route_map';
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
    <div className="p-4">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#61adde] to-[#4670bc] bg-clip-text text-transparent">Route Management</h1>
          <p className="text-[#99b6c4]">Plan, monitor and manage shipping routes</p>
        </div>
        <button
          onClick={() => {
            loadRoutes();
            loadVessels();
            loadPorts();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#61adde] to-[#4670bc] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Routes Section */}
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-[#61adde]">Routes</CardTitle>
              <CardDescription>Manage and monitor your shipping routes</CardDescription>
            </div>
            <button
              onClick={handleCreateNewRoute}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <PlusCircle className="h-6 w-6 text-[#61adde]" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {routes.map(route => (
                <Card 
                  key={route.id} 
                  className={`shadow-sm cursor-pointer transition-all hover:shadow-md ${
                    selectedRouteForMap === route.id ? 'ring-2 ring-[#61adde] bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedRouteForMap(selectedRouteForMap === route.id ? undefined : route.id)}
                >
                  <CardHeader className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">
                          {vessels.find(v => v.id === route.vessel_id)?.vessel_name || `Vessel ${route.vessel_id}`}
                        </CardTitle>
                        <div className={`inline-flex px-2 py-1 rounded-full text-xs mt-2 ${
                          route.current_latitude && route.current_longitude
                            ? 'bg-green-100 text-green-800'
                            : new Date(route.scheduled_departure) > new Date()
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {route.current_latitude && route.current_longitude
                            ? 'En Route'
                            : new Date(route.scheduled_departure) > new Date()
                            ? 'Scheduled'
                            : 'Departed'
                          }
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-2">
                    <div className="text-sm">
                      <strong>From:</strong> {ports.find(p => p.id === route.departure_port_id)?.port_name || `Port ${route.departure_port_id}`}
                    </div>
                    <div className="text-sm">
                      <strong>To:</strong> {ports.find(p => p.id === route.arrival_port_id)?.port_name || `Port ${route.arrival_port_id}`}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                      <div>
                        <span className="text-gray-500">Departure:</span>
                        <div className="font-medium">{new Date(route.scheduled_departure).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Arrival:</span>
                        <div className="font-medium">{new Date(route.estimated_arrival).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(route);
                        }}
                        className="flex-1 px-3 py-1.5 bg-[#61adde] text-white text-xs rounded hover:bg-[#4670bc] transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(route.id);
                        }}
                        className="flex-1 px-3 py-1.5 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Add New Route Card */}
              <Card 
                className="shadow-sm border-dashed cursor-pointer hover:bg-gray-50 transition-colors border-[#99b6c4]"
                onClick={handleCreateNewRoute}
              >
                <CardContent className="flex items-center justify-center h-[200px]">
                  <div className="text-center">
                    <PlusCircle className="h-8 w-8 mx-auto mb-2 text-[#61adde]" />
                    <p className="text-[#99b6c4] text-sm">Add New Route</p>
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
                ports={ports} 
                selectedRouteId={selectedRouteForMap}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Route Dialog */}
      <Dialog open={isRouteDialogOpen} onOpenChange={setIsRouteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-[#61adde]">{selectedRoute ? 'Edit Route' : 'Create New Route'}</DialogTitle>
            <DialogDescription>
              {selectedRoute ? 'Modify the existing route details' : 'Enter the details for a new route'}
            </DialogDescription>
          </DialogHeader>
          <form id="routeForm" onSubmit={handleRouteSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Vessel</label>
              <select
                name="vessel_id"
                value={routeFormData.vessel_id}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:border-[#61adde] focus:ring-1 focus:ring-[#61adde]"
                required
              >
                <option value="">Select Vessel</option>
                {vessels.map(vessel => (
                  <option key={vessel.id} value={vessel.id}>
                    {vessel.vessel_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Departure Port</label>
              <select
                name="departure_port_id"
                value={routeFormData.departure_port_id}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:border-[#61adde] focus:ring-1 focus:ring-[#61adde]"
                required
              >
                <option value="">Select Departure Port</option>
                {ports.map(port => (
                  <option key={port.id} value={port.id}>
                    {port.port_name} ({port.country})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Arrival Port</label>
              <select
                name="arrival_port_id"
                value={routeFormData.arrival_port_id}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:border-[#61adde] focus:ring-1 focus:ring-[#61adde]"
                required
              >
                <option value="">Select Arrival Port</option>
                {ports.map(port => (
                  <option key={port.id} value={port.id}>
                    {port.port_name} ({port.country})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Scheduled Departure</label>
              <input
                type="datetime-local"
                name="scheduled_departure"
                value={routeFormData.scheduled_departure}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:border-[#61adde] focus:ring-1 focus:ring-[#61adde]"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Estimated Arrival</label>
              <input
                type="datetime-local"
                name="estimated_arrival"
                value={routeFormData.estimated_arrival}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:border-[#61adde] focus:ring-1 focus:ring-[#61adde]"
                required
              />
            </div>
          </form>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsRouteDialogOpen(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="routeForm"
              className="px-4 py-2 bg-gradient-to-r from-[#61adde] to-[#4670bc] text-white rounded hover:opacity-90 transition-opacity"
            >
              {selectedRoute ? 'Update Route' : 'Create Route'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoutePage;
