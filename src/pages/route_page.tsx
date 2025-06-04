import React, { useEffect, useState } from 'react';
import { useRoute } from '../hooks/use-route';
import { useVessel } from '../hooks/use-vessel';
import { usePort } from '../hooks/use-port';
import RouteMap from '../components/route_map';
import type { RouteResponse, RouteCreate, VesselResponse, VesselCreate, PortResponse } from '../hooks/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { PlusCircle, Anchor, RefreshCw } from 'lucide-react';

const RoutePage: React.FC = () => {
  // State management
  const [routes, setRoutes] = useState<RouteResponse[]>([]);
  const [vessels, setVessels] = useState<VesselResponse[]>([]);
  const [ports, setPorts] = useState<PortResponse[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteResponse | null>(null);
  const [selectedVessel, setSelectedVessel] = useState<VesselResponse | null>(null);
  const [selectedRouteForMap, setSelectedRouteForMap] = useState<number | undefined>(undefined);
  const [isRouteDialogOpen, setIsRouteDialogOpen] = useState(false);
  const [isVesselDialogOpen, setIsVesselDialogOpen] = useState(false);
  const [routeFormData, setRouteFormData] = useState<RouteCreate>({
    vessel_id: 0,
    departure_port_id: 0,
    arrival_port_id: 0,
    scheduled_departure: '',
    estimated_arrival: '',
  });
  const [vesselFormData, setVesselFormData] = useState<VesselCreate>({
    vessel_name: '',
    vessel_type: '',
  });

  // Hooks
  const {
    loading: routeLoading,
    error: routeError,
    fetchRoutes,
    addRoute,
    modifyRoute,
    updateLocation,
    removeRoute,
  } = useRoute();

  const {
    loading: vesselLoading,
    error: vesselError,
    fetchVessels,
    addVessel,
    modifyVessel,
    removeVessel,
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

  const handleUpdateLocation = async (routeId: number, latitude: number, longitude: number) => {
    await updateLocation(routeId, { current_latitude: latitude, current_longitude: longitude });
    loadRoutes();
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

  const handleCreateNewVessel = () => {
    setSelectedVessel(null);
    setVesselFormData({
      vessel_name: '',
      vessel_type: '',
    });
    setIsVesselDialogOpen(true);
  };

  const handleVesselSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVessel) {
      await modifyVessel(selectedVessel.id, vesselFormData);
    } else {
      await addVessel(vesselFormData);
    }
    setIsVesselDialogOpen(false);
    loadVessels();
  };

  const handleEditVessel = (vessel: VesselResponse) => {
    setSelectedVessel(vessel);
    setVesselFormData({
      vessel_name: vessel.vessel_name,
      vessel_type: vessel.vessel_type,
    });
    setIsVesselDialogOpen(true);
  };

  const handleDeleteVessel = async (vesselId: number) => {
    if (window.confirm('Are you sure you want to delete this vessel?')) {
      await removeVessel(vesselId);
      loadVessels();
    }
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
          <h1 className="text-2xl font-bold">Route Management</h1>
          <p className="text-gray-600">Manage your fleet, routes, and track vessels</p>
        </div>
        <button
          onClick={() => {
            loadRoutes();
            loadVessels();
            loadPorts();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Statistics Section */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Vessels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vessels.length}</div>
              <p className="text-xs text-gray-500 mt-1">
                Active fleet size
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Routes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{routes.length}</div>
              <p className="text-xs text-gray-500 mt-1">
                Current shipping routes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Vessels En Route</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {routes.filter(r => r.current_latitude && r.current_longitude).length}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Currently tracking
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Unique Ports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set([
                  ...routes.map(r => r.departure_port_id),
                  ...routes.map(r => r.arrival_port_id)
                ]).size}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Ports in network
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Existing Vessels and Routes Cards */}
        <div className="grid grid-cols-2 gap-6">
          {/* Vessels Card */}
          <Card className="h-[30vh]">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Vessels</CardTitle>
                <CardDescription>Manage your vessel fleet</CardDescription>
              </div>
              <button
                onClick={handleCreateNewVessel}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <PlusCircle className="h-6 w-6" />
              </button>
            </CardHeader>
            <CardContent className="overflow-y-auto h-[calc(50vh-8rem)]">
              <div className="grid grid-cols-2 gap-4">
                {vessels.map(vessel => (
                  <Card key={vessel.id} className="shadow-sm">
                    <CardHeader className="p-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Anchor className="h-4 w-4" />
                          <CardTitle className="text-base truncate">
                            {vessel.vessel_name}
                          </CardTitle>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditVessel(vessel)}
                            className="p-1.5 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteVessel(vessel.id)}
                            className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="text-sm">Type: {vessel.vessel_type}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm text-gray-600">
                          Routes: {routes.filter(r => r.vessel_id === vessel.id).length}
                        </p>
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          routes.some(r => r.vessel_id === vessel.id && r.current_latitude && r.current_longitude)
                            ? 'bg-green-100 text-green-800'
                            : routes.some(r => r.vessel_id === vessel.id)
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {routes.some(r => r.vessel_id === vessel.id && r.current_latitude && r.current_longitude)
                            ? 'En Route'
                            : routes.some(r => r.vessel_id === vessel.id)
                            ? 'Scheduled'
                            : 'Idle'
                          }
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Empty Vessel Card */}
                <Card 
                  className="shadow-sm border-dashed cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={handleCreateNewVessel}
                >
                  <CardContent className="flex items-center justify-center h-[104px]">
                    <div className="text-center">
                      <PlusCircle className="h-8 w-8 mx-auto mb-1 text-gray-400" />
                      <p className="text-gray-500 text-sm">Add New Vessel</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Routes Card */}
          <Card className="h-[30vh]">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Routes</CardTitle>
                <CardDescription>Manage and monitor your routes</CardDescription>
              </div>
              <button
                onClick={handleCreateNewRoute}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <PlusCircle className="h-6 w-6" />
              </button>
            </CardHeader>
            <CardContent className="overflow-y-auto h-[calc(50vh-8rem)]">
              <div className="grid grid-cols-2 gap-4">
                {routes.map(route => (
                  <Card 
                    key={route.id} 
                    className={`shadow-sm cursor-pointer transition-all ${
                      selectedRouteForMap === route.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedRouteForMap(selectedRouteForMap === route.id ? undefined : route.id)}
                  >
                    <CardHeader className="p-3">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <CardTitle className="text-base truncate">
                            {vessels.find(v => v.id === route.vessel_id)?.vessel_name || `Route ${route.id}`}
                          </CardTitle>
                          <div className={`inline-flex px-2 py-1 rounded-full text-xs mt-1 ${
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
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(route);
                            }}
                            className="p-1.5 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(route.id);
                            }}
                            className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 space-y-1">
                      <p className="text-sm">From: {ports.find(p => p.id === route.departure_port_id)?.port_name || `Port ${route.departure_port_id}`}</p>
                      <p className="text-sm">To: {ports.find(p => p.id === route.arrival_port_id)?.port_name || `Port ${route.arrival_port_id}`}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                        <div>
                          <span className="text-gray-500">Departure:</span>
                          <br />
                          <span className="font-medium">{new Date(route.scheduled_departure).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Arrival:</span>
                          <br />
                          <span className="font-medium">{new Date(route.estimated_arrival).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {route.current_latitude && route.current_longitude && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">Update Current Location:</p>
                          <div className="flex gap-2 mt-1">
                            <input
                              type="number"
                              placeholder="Lat"
                              className="p-1 text-sm border rounded w-20"
                              id={`lat-${route.id}`}
                              step="any"
                            />
                            <input
                              type="number"
                              placeholder="Long"
                              className="p-1 text-sm border rounded w-20"
                              id={`lng-${route.id}`}
                              step="any"
                            />
                            <button
                              onClick={() => {
                                const lat = parseFloat((document.getElementById(`lat-${route.id}`) as HTMLInputElement).value);
                                const lng = parseFloat((document.getElementById(`lng-${route.id}`) as HTMLInputElement).value);
                                if (!isNaN(lat) && !isNaN(lng)) {
                                  handleUpdateLocation(route.id, lat, lng);
                                }
                              }}
                              className="p-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              Update
                            </button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                {/* Empty Route Card */}
                <Card 
                  className="shadow-sm border-dashed cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={handleCreateNewRoute}
                >
                  <CardContent className="flex items-center justify-center h-[104px]">
                    <div className="text-center">
                      <PlusCircle className="h-8 w-8 mx-auto mb-1 text-gray-400" />
                      <p className="text-gray-500 text-sm">Add New Route</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Route Map Section */}
        <div className="w-full h-[600px]">
          <RouteMap 
            routes={routes} 
            ports={ports} 
            selectedRouteId={selectedRouteForMap}
          />
        </div>

        {/* Route Summary Section */}
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Departures</CardTitle>
              <CardDescription>Next 7 days</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[300px] overflow-y-auto">
              {routes
                .filter(route => {
                  const departureDate = new Date(route.scheduled_departure);
                  const now = new Date();
                  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                  return departureDate >= now && departureDate <= sevenDaysFromNow;
                })
                .sort((a, b) => new Date(a.scheduled_departure).getTime() - new Date(b.scheduled_departure).getTime())
                .slice(0, 5)
                .map(route => {
                  const vessel = vessels.find(v => v.id === route.vessel_id);
                  const departurePort = ports.find(p => p.id === route.departure_port_id);
                  const arrivalPort = ports.find(p => p.id === route.arrival_port_id);
                  
                  return (
                    <div key={route.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <div className="font-medium">{vessel?.vessel_name}</div>
                        <div className="text-sm text-gray-500">
                          {departurePort?.port_name} → {arrivalPort?.port_name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {new Date(route.scheduled_departure).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(route.scheduled_departure).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  );
                })}
              {routes.filter(route => {
                const departureDate = new Date(route.scheduled_departure);
                const now = new Date();
                const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                return departureDate >= now && departureDate <= sevenDaysFromNow;
              }).length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No departures scheduled in the next 7 days
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Expected Arrivals</CardTitle>
              <CardDescription>Next 7 days</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[300px] overflow-y-auto">
              {routes
                .filter(route => {
                  const arrivalDate = new Date(route.estimated_arrival);
                  const now = new Date();
                  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                  return arrivalDate >= now && arrivalDate <= sevenDaysFromNow;
                })
                .sort((a, b) => new Date(a.estimated_arrival).getTime() - new Date(b.estimated_arrival).getTime())
                .slice(0, 5)
                .map(route => {
                  const vessel = vessels.find(v => v.id === route.vessel_id);
                  const departurePort = ports.find(p => p.id === route.departure_port_id);
                  const arrivalPort = ports.find(p => p.id === route.arrival_port_id);
                  
                  return (
                    <div key={route.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <div className="font-medium">{vessel?.vessel_name}</div>
                        <div className="text-sm text-gray-500">
                          {departurePort?.port_name} → {arrivalPort?.port_name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {new Date(route.estimated_arrival).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(route.estimated_arrival).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  );
                })}
              {routes.filter(route => {
                const arrivalDate = new Date(route.estimated_arrival);
                const now = new Date();
                const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                return arrivalDate >= now && arrivalDate <= sevenDaysFromNow;
              }).length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No arrivals expected in the next 7 days
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Route Dialog */}
      <Dialog open={isRouteDialogOpen} onOpenChange={setIsRouteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedRoute ? 'Edit Route' : 'Create New Route'}</DialogTitle>
            <DialogDescription>
              {selectedRoute ? 'Modify the existing route details' : 'Enter the details for a new route'}
            </DialogDescription>
          </DialogHeader>
          <form id="routeForm" onSubmit={handleRouteSubmit} className="space-y-4">
            <div>
              <label className="block mb-1">Vessel</label>
              <select
                name="vessel_id"
                value={routeFormData.vessel_id}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
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
              <label className="block mb-1">Departure Port</label>
              <select
                name="departure_port_id"
                value={routeFormData.departure_port_id}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
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
              <label className="block mb-1">Arrival Port</label>
              <select
                name="arrival_port_id"
                value={routeFormData.arrival_port_id}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
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
              <label className="block mb-1">Scheduled Departure</label>
              <input
                type="datetime-local"
                name="scheduled_departure"
                value={routeFormData.scheduled_departure}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-1">Estimated Arrival</label>
              <input
                type="datetime-local"
                name="estimated_arrival"
                value={routeFormData.estimated_arrival}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </form>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsRouteDialogOpen(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="routeForm"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {selectedRoute ? 'Update Route' : 'Create Route'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vessel Dialog */}
      <Dialog open={isVesselDialogOpen} onOpenChange={setIsVesselDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedVessel ? 'Edit Vessel' : 'Create New Vessel'}</DialogTitle>
            <DialogDescription>
              {selectedVessel ? 'Modify the existing vessel details' : 'Enter the details for a new vessel'}
            </DialogDescription>
          </DialogHeader>
          <form id="vesselForm" onSubmit={handleVesselSubmit} className="space-y-4">
            <div>
              <label className="block mb-1">Vessel Name</label>
              <input
                type="text"
                name="vessel_name"
                value={vesselFormData.vessel_name}
                onChange={(e) => setVesselFormData(prev => ({ ...prev, vessel_name: e.target.value }))}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-1">Vessel Type</label>
              <input
                type="text"
                name="vessel_type"
                value={vesselFormData.vessel_type}
                onChange={(e) => setVesselFormData(prev => ({ ...prev, vessel_type: e.target.value }))}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </form>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsVesselDialogOpen(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="vesselForm"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {selectedVessel ? 'Update Vessel' : 'Create Vessel'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoutePage;
