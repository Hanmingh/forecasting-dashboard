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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      return { status: 'En Route', variant: 'default' as const };
    } else if (vesselRoutes.length > 0) {
      return { status: 'Scheduled', variant: 'secondary' as const };
    } else {
      return { status: 'Idle', variant: 'outline' as const };
    }
  };

  if (vesselLoading || routeLoading) {
    return <div>Loading...</div>;
  }

  if (vesselError || routeError) {
    return <div>Error: {(vesselError || routeError)?.message}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#61adde] to-[#4670bc] bg-clip-text text-transparent">
            Fleet Management
          </h1>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => {
              loadVessels();
              loadRoutes();
            }}
            variant="outline"
            className="bg-gradient-to-r from-[#99b6c4] to-[#61adde]"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleCreateNewVessel}
            className="bg-gradient-to-r from-[#61adde] to-[#4670bc]"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Vessel
          </Button>
        </div>
      </div>

      {/* Fleet Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[#4670bc] flex items-center gap-2">
              <Ship className="h-4 w-4" />
              Total Vessels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#61adde]">{vessels.length}</div>
            <p className="text-xs text-muted-foreground">Fleet size</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[#4670bc] flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              En Route
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#61adde]">
              {vessels.filter(v => getVesselStatus(v).status === 'En Route').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently sailing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[#4670bc]">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#61adde]">
              {vessels.filter(v => getVesselStatus(v).status === 'Scheduled').length}
            </div>
            <p className="text-xs text-muted-foreground">With planned routes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[#4670bc]">Idle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#61adde]">
              {vessels.filter(v => getVesselStatus(v).status === 'Idle').length}
            </div>
            <p className="text-xs text-muted-foreground">Available</p>
          </CardContent>
        </Card>
      </div>

      {/* Vessels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vessels.map(vessel => {
          const vesselRoutes = getVesselRoutes(vessel.id);
          const status = getVesselStatus(vessel);
          
          return (
            <Card key={vessel.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-[#61adde] to-[#4670bc] rounded-full">
                      <Anchor className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-[#4670bc]">{vessel.vessel_name}</CardTitle>
                      <CardDescription>{vessel.vessel_type}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={status.variant}>
                    {status.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Route Information */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#4670bc]">Routes</span>
                    <span className="text-sm text-muted-foreground">{vesselRoutes.length} active</span>
                  </div>
                  
                  {vesselRoutes.length > 0 ? (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {vesselRoutes.slice(0, 3).map(route => (
                        <div key={route.id} className="text-xs p-2 bg-muted rounded border-l-4 border-[#61adde]">
                          <div className="font-medium text-[#4670bc]">Route #{route.id}</div>
                          <div className="text-muted-foreground">
                            Departure: {new Date(route.scheduled_departure).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                      {vesselRoutes.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{vesselRoutes.length - 3} more routes
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground italic">No active routes</div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    onClick={() => handleEditVessel(vessel)}
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-[#99b6c4] to-[#61adde]"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDeleteVessel(vessel.id)}
                    size="sm"
                    variant="destructive"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Add New Vessel Card */}
        <Card 
          className="border-dashed cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={handleCreateNewVessel}
        >
          <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
            <div className="p-4 bg-muted rounded-full mb-4">
              <PlusCircle className="h-8 w-8 text-[#61adde]" />
            </div>
            <h3 className="font-semibold text-[#4670bc] mb-2">Add New Vessel</h3>
            <p className="text-sm text-muted-foreground">Expand your fleet</p>
          </CardContent>
        </Card>
      </div>

      {/* Vessel Dialog */}
      <Dialog open={isVesselDialogOpen} onOpenChange={setIsVesselDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#4670bc]">
              {selectedVessel ? 'Edit Vessel' : 'Add New Vessel'}
            </DialogTitle>
            <DialogDescription>
              {selectedVessel ? 'Modify the vessel details' : 'Enter the details for a new vessel'}
            </DialogDescription>
          </DialogHeader>
          <form id="vesselForm" onSubmit={handleVesselSubmit} className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium">Vessel Name</label>
              <input
                type="text"
                name="vessel_name"
                value={vesselFormData.vessel_name}
                onChange={(e) => setVesselFormData(prev => ({ ...prev, vessel_name: e.target.value }))}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#61adde] focus:border-transparent"
                placeholder="Enter vessel name"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Vessel Type</label>
              <select
                name="vessel_type"
                value={vesselFormData.vessel_type}
                onChange={(e) => setVesselFormData(prev => ({ ...prev, vessel_type: e.target.value }))}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#61adde] focus:border-transparent"
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
          <DialogFooter>
            <Button
              type="button"
              onClick={() => setIsVesselDialogOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="vesselForm"
              className="bg-gradient-to-r from-[#61adde] to-[#4670bc]"
            >
              {selectedVessel ? 'Update Vessel' : 'Create Vessel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VesselsPage; 