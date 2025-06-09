import React, { useEffect, useState } from 'react';
import { useVessel } from '../hooks/use-vessel';
import { useRoute } from '../hooks/use-route';
import type { VesselResponse, VesselCreate, RouteResponse } from '../hooks/types';
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
import { PlusCircle, Anchor, RefreshCw, Ship, MapPin } from 'lucide-react';

const VesselsPage: React.FC = () => {
  // State management
  const [vessels, setVessels] = useState<VesselResponse[]>([]);
  const [routes, setRoutes] = useState<RouteResponse[]>([]);
  const [selectedVessel, setSelectedVessel] = useState<VesselResponse | null>(null);
  const [isVesselDialogOpen, setIsVesselDialogOpen] = useState(false);
  const [vesselFormData, setVesselFormData] = useState<VesselCreate>({
    vessel_name: '',
    vessel_type: '',
  });

  // Hooks
  const {
    loading: vesselLoading,
    error: vesselError,
    fetchVessels,
    addVessel,
    modifyVessel,
    removeVessel,
  } = useVessel();

  const {
    loading: routeLoading,
    error: routeError,
    fetchRoutes,
  } = useRoute();

  // Fetch initial data
  useEffect(() => {
    loadVessels();
    loadRoutes();
  }, []);

  const loadVessels = async () => {
    const vesselData = await fetchVessels();
    setVessels(vesselData);
  };

  const loadRoutes = async () => {
    const routeData = await fetchRoutes();
    setRoutes(routeData);
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
    if (window.confirm('Are you sure you want to delete this vessel? This will also affect any routes using this vessel.')) {
      await removeVessel(vesselId);
      loadVessels();
      loadRoutes(); // Refresh routes as they might be affected
    }
  };

  const getVesselRoutes = (vesselId: number) => {
    return routes.filter(r => r.vessel_id === vesselId);
  };

  const getVesselStatus = (vessel: VesselResponse) => {
    const vesselRoutes = getVesselRoutes(vessel.id);
    const activeRoute = vesselRoutes.find(r => r.current_latitude && r.current_longitude);
    
    if (activeRoute) {
      return { status: 'En Route', color: 'bg-green-100 text-green-800' };
    } else if (vesselRoutes.length > 0) {
      return { status: 'Scheduled', color: 'bg-blue-100 text-blue-800' };
    } else {
      return { status: 'Idle', color: 'bg-gray-100 text-gray-800' };
    }
  };

  if (vesselLoading || routeLoading) {
    return <div>Loading...</div>;
  }

  if (vesselError || routeError) {
    return <div>Error: {(vesselError || routeError)?.message}</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#61adde] to-[#4670bc] bg-clip-text text-transparent">
            Fleet Management
          </h1>
          <p className="text-[#99b6c4] mt-2">Manage your vessel fleet and monitor operations</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              loadVessels();
              loadRoutes();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#99b6c4] to-[#61adde] text-white rounded-lg hover:opacity-90 transition-opacity shadow-md"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={handleCreateNewVessel}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#61adde] to-[#4670bc] text-white rounded-lg hover:opacity-90 transition-opacity shadow-md"
          >
            <PlusCircle className="h-4 w-4" />
            Add Vessel
          </button>
        </div>
      </div>

      {/* Fleet Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-[#61adde]/5 to-[#99b6c4]/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#4670bc] flex items-center gap-2">
              <Ship className="h-4 w-4" />
              Total Vessels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#61adde]">{vessels.length}</div>
            <p className="text-xs text-[#99b6c4] mt-1">Fleet size</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-[#61adde]/5 to-[#99b6c4]/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#4670bc] flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              En Route
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#61adde]">
              {vessels.filter(v => getVesselStatus(v).status === 'En Route').length}
            </div>
            <p className="text-xs text-[#99b6c4] mt-1">Currently sailing</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-[#61adde]/5 to-[#99b6c4]/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#4670bc]">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#61adde]">
              {vessels.filter(v => getVesselStatus(v).status === 'Scheduled').length}
            </div>
            <p className="text-xs text-[#99b6c4] mt-1">With planned routes</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-[#61adde]/5 to-[#99b6c4]/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#4670bc]">Idle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#61adde]">
              {vessels.filter(v => getVesselStatus(v).status === 'Idle').length}
            </div>
            <p className="text-xs text-[#99b6c4] mt-1">Available</p>
          </CardContent>
        </Card>
      </div>

      {/* Vessels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vessels.map(vessel => {
          const vesselRoutes = getVesselRoutes(vessel.id);
          const status = getVesselStatus(vessel);
          
          return (
            <Card key={vessel.id} className="border-0 shadow-xl bg-white hover:shadow-2xl transition-shadow">
              <CardHeader className="pb-4 bg-gradient-to-r from-[#61adde]/10 to-[#99b6c4]/10 rounded-t-lg">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-[#61adde] to-[#4670bc] rounded-full">
                      <Anchor className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-[#4670bc]">{vessel.vessel_name}</CardTitle>
                      <CardDescription className="text-[#99b6c4]">{vessel.vessel_type}</CardDescription>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    {status.status}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-4 space-y-4">
                {/* Route Information */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#4670bc]">Routes</span>
                    <span className="text-sm text-[#99b6c4]">{vesselRoutes.length} active</span>
                  </div>
                  
                  {vesselRoutes.length > 0 ? (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {vesselRoutes.slice(0, 3).map(route => (
                        <div key={route.id} className="text-xs p-2 bg-[#61adde]/5 rounded border-l-2 border-[#61adde]">
                          <div className="font-medium text-[#4670bc]">Route #{route.id}</div>
                          <div className="text-[#99b6c4]">
                            Departure: {new Date(route.scheduled_departure).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                      {vesselRoutes.length > 3 && (
                        <div className="text-xs text-[#99b6c4] text-center">
                          +{vesselRoutes.length - 3} more routes
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-[#99b6c4] italic">No active routes</div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-[#99b6c4]/20">
                  <button
                    onClick={() => handleEditVessel(vessel)}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-[#99b6c4] to-[#61adde] text-white text-sm rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteVessel(vessel.id)}
                    className="px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Add New Vessel Card */}
        <Card 
          className="border-2 border-dashed border-[#99b6c4]/40 cursor-pointer hover:border-[#61adde] hover:bg-[#61adde]/5 transition-all"
          onClick={handleCreateNewVessel}
        >
          <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
            <div className="p-4 bg-gradient-to-r from-[#61adde]/10 to-[#99b6c4]/10 rounded-full mb-4">
              <PlusCircle className="h-8 w-8 text-[#61adde]" />
            </div>
            <h3 className="font-semibold text-[#4670bc] mb-2">Add New Vessel</h3>
            <p className="text-sm text-[#99b6c4]">Expand your fleet</p>
          </CardContent>
        </Card>
      </div>

      {/* Vessel Dialog */}
      <Dialog open={isVesselDialogOpen} onOpenChange={setIsVesselDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-[#4670bc]">
              {selectedVessel ? 'Edit Vessel' : 'Add New Vessel'}
            </DialogTitle>
            <DialogDescription className="text-[#99b6c4]">
              {selectedVessel ? 'Modify the vessel details' : 'Enter the details for a new vessel'}
            </DialogDescription>
          </DialogHeader>
          <form id="vesselForm" onSubmit={handleVesselSubmit} className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-[#4670bc]">Vessel Name</label>
              <input
                type="text"
                name="vessel_name"
                value={vesselFormData.vessel_name}
                onChange={(e) => setVesselFormData(prev => ({ ...prev, vessel_name: e.target.value }))}
                className="w-full p-3 border border-[#99b6c4]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61adde] focus:border-transparent"
                placeholder="Enter vessel name"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-[#4670bc]">Vessel Type</label>
              <select
                name="vessel_type"
                value={vesselFormData.vessel_type}
                onChange={(e) => setVesselFormData(prev => ({ ...prev, vessel_type: e.target.value }))}
                className="w-full p-3 border border-[#99b6c4]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#61adde] focus:border-transparent"
                required
              >
                <option value="">Select vessel type</option>
                <option value="Tanker">Tanker</option>
                <option value="Container Ship">Container Ship</option>
                <option value="Bulk Carrier">Bulk Carrier</option>
                <option value="General Cargo">General Cargo</option>
                <option value="Ferry">Ferry</option>
                <option value="Cruise Ship">Cruise Ship</option>
                <option value="Research Vessel">Research Vessel</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </form>
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setIsVesselDialogOpen(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="vesselForm"
              className="px-4 py-2 bg-gradient-to-r from-[#61adde] to-[#4670bc] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              {selectedVessel ? 'Update Vessel' : 'Create Vessel'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VesselsPage; 