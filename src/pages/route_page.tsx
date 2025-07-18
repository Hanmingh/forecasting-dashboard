import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Ship, MapPin, Clock, Navigation, PlusCircle, Edit } from 'lucide-react';
import VesselFinderMap from '../components/VesselFinderMap';

interface VesselInfo {
  imo: string;
  name: string;
  type: string;
  flag: string;
  built: string;
  status: string;
}

const VesselTrackingPage: React.FC = () => {
  const [selectedIMO, setSelectedIMO] = useState<string>('');
  const [savedVessels, setSavedVessels] = useState<VesselInfo[]>([]);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingVessel, setEditingVessel] = useState<VesselInfo | null>(null);
  const [vesselForm, setVesselForm] = useState<VesselInfo>({
    imo: '',
    name: '',
    type: '',
    flag: '',
    built: '',
    status: 'Active'
  });
  const [mapCenter, setMapCenter] = useState({
    latitude: 25.0,
    longitude: 55.0,
    zoom: 3
  });



  // Maritime regions for quick navigation
  const regions = [
    { name: 'Singapore Strait', lat: 1.29, lon: 103.85, zoom: 10 },
    { name: 'Suez Canal', lat: 30.5, lon: 32.35, zoom: 8 },
    { name: 'English Channel', lat: 50.9, lon: 1.4, zoom: 7 },
    { name: 'Panama Canal', lat: 9.08, lon: -79.68, zoom: 9 },
    { name: 'Gibraltar Strait', lat: 36.0, lon: -5.4, zoom: 8 },
    { name: 'Global View', lat: 25.0, lon: 55.0, zoom: 3 },
  ];





  const handleAddVessel = () => {
    setShowAddForm(true);
    setEditingVessel(null);
    setVesselForm({
      imo: '',
      name: '',
      type: '',
      flag: '',
      built: '',
      status: 'Active'
    });
  };

  const handleEditVessel = (vessel: VesselInfo) => {
    setShowAddForm(true);
    setEditingVessel(vessel);
    setVesselForm(vessel);
  };

    const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (vesselForm.imo.trim()) {
      if (editingVessel) {
        // Update existing vessel
        setSavedVessels(prev => 
          prev.map(v => v.imo === editingVessel.imo ? vesselForm : v)
        );
      } else {
        // Add new vessel with IMO only, generate default info
        if (!savedVessels.some(v => v.imo === vesselForm.imo)) {
          const newVessel: VesselInfo = {
            imo: vesselForm.imo.trim(),
            name: vesselForm.name.trim() || `Vessel ${vesselForm.imo.trim()}`,
            type: vesselForm.type.trim() || 'Cargo Ship',
            flag: vesselForm.flag.trim() || 'Unknown',
            built: vesselForm.built.trim() || '2020',
            status: vesselForm.status || 'Active'
          };
          setSavedVessels(prev => [...prev, newVessel]);
        }
      }
      
      setShowAddForm(false);
      setEditingVessel(null);
      setVesselForm({
        imo: '',
        name: '',
        type: '',
        flag: '',
        built: '',
        status: 'Active'
      });
    }
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingVessel(null);
    setVesselForm({
      imo: '',
      name: '',
      type: '',
      flag: '',
      built: '',
      status: 'Active'
    });
  };

  const handleVesselSelect = (vessel: VesselInfo) => {
    setSelectedIMO(vessel.imo);
  };

  const handleRemoveVessel = (imoToRemove: string) => {
    setSavedVessels(prev => prev.filter(v => v.imo !== imoToRemove));
    if (selectedIMO === imoToRemove) {
      setSelectedIMO('');
    }
  };

  const handleRegionSelect = (region: typeof regions[0]) => {
    setMapCenter({
      latitude: region.lat,
      longitude: region.lon,
      zoom: region.zoom
    });
  };

  const clearSelection = () => {
    setSelectedIMO('');
  };



  return (
    <div className="space-y-6">
      {/* Vessels Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#61adde]">
            <Ship className="h-5 w-5" />
            My Vessels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Vessel */}
      <div className="flex justify-between items-center">
        <div>
              <h3 className="text-lg font-semibold text-[#4670bc]">Your Vessels</h3>
              <p className="text-sm text-gray-600">Add and manage your vessel tracking list</p>
        </div>
            <div className="flex gap-2">
        <Button
                onClick={handleAddVessel}
          className="bg-gradient-to-r from-[#61adde] to-[#4670bc]"
        >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Vessel
              </Button>
              <Button 
                onClick={clearSelection}
                variant="outline"
                disabled={!selectedIMO}
              >
                Clear Selection
        </Button>
            </div>
      </div>

                    {/* Add/Edit Vessel Form */}
          {showAddForm && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold text-[#4670bc] mb-4">
                {editingVessel ? 'Edit Vessel Information' : 'Add New Vessel'}
              </h3>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {editingVessel ? (
                  // Edit mode - show all fields
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vessel-imo">IMO Number</Label>
                      <Input
                        id="vessel-imo"
                        value={vesselForm.imo}
                        onChange={(e) => setVesselForm(prev => ({ ...prev, imo: e.target.value }))}
                        placeholder="9506291"
                        disabled
                      />
                    </div>
                    <div>
                      <Label htmlFor="vessel-name">Vessel Name</Label>
                      <Input
                        id="vessel-name"
                        value={vesselForm.name}
                        onChange={(e) => setVesselForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ever Given"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vessel-type">Type</Label>
                      <Input
                        id="vessel-type"
                        value={vesselForm.type}
                        onChange={(e) => setVesselForm(prev => ({ ...prev, type: e.target.value }))}
                        placeholder="Container Ship"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vessel-flag">Flag</Label>
                      <Input
                        id="vessel-flag"
                        value={vesselForm.flag}
                        onChange={(e) => setVesselForm(prev => ({ ...prev, flag: e.target.value }))}
                        placeholder="Panama"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vessel-built">Built Year</Label>
                      <Input
                        id="vessel-built"
                        value={vesselForm.built}
                        onChange={(e) => setVesselForm(prev => ({ ...prev, built: e.target.value }))}
                        placeholder="2018"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vessel-status">Status</Label>
                      <Input
                        id="vessel-status"
                        value={vesselForm.status}
                        onChange={(e) => setVesselForm(prev => ({ ...prev, status: e.target.value }))}
                        placeholder="Active"
                      />
                    </div>
                  </div>
                ) : (
                  // Add mode - only IMO field
                  <div className="max-w-md">
                    <div>
                      <Label htmlFor="vessel-imo">IMO Number</Label>
                      <Input
                        id="vessel-imo"
                        value={vesselForm.imo}
                        onChange={(e) => setVesselForm(prev => ({ ...prev, imo: e.target.value }))}
                        placeholder="Enter IMO number (e.g., 9506291)"
                        required
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Additional vessel information will be displayed after adding
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button 
                    type="submit"
                    className="bg-gradient-to-r from-[#61adde] to-[#4670bc]"
                    disabled={!vesselForm.imo.trim()}
                  >
                    {editingVessel ? 'Update Vessel' : 'Add Vessel'}
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={handleCancelForm}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Selected Vessel Info */}
          {selectedIMO && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Ship className="h-5 w-5 text-[#61adde]" />
                <span className="font-semibold text-[#4670bc]">
                  Tracking Vessel: IMO {selectedIMO}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Live position and track data will be displayed on the map below
              </div>
            </div>
          )}

          {/* Saved Vessels */}
          {savedVessels.length > 0 ? (
            <div className="mt-4">
              <Label className="text-sm font-medium mb-2 block">Your Vessels ({savedVessels.length}):</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {savedVessels.map((vessel) => (
                                    <div
                    key={vessel.imo}
                    className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedIMO === vessel.imo ? 'border-[#61adde] bg-blue-50 shadow-md' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleVesselSelect(vessel)}
                  >
                                        <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-[#4670bc] text-sm">{vessel.name}</div>
                          {selectedIMO === vessel.imo && (
                            <Badge className="bg-[#61adde] text-white text-xs px-2 py-0.5">
                              Tracking
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 mb-1">IMO: {vessel.imo}</div>
                        <div className="space-y-0.5">
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Type:</span> {vessel.type}
                          </div>
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Flag:</span> {vessel.flag}
                          </div>
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Built:</span> {vessel.built} | <span className="font-medium">Status:</span> {vessel.status}
                          </div>
                        </div>
                      </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                            handleEditVessel(vessel);
                        }}
                          variant="outline"
                        size="sm"
                          className="text-xs py-1 px-2"
                      >
                          <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                            handleRemoveVessel(vessel.imo);
                        }}
                          variant="outline"
                        size="sm"
                          className="text-xs py-1 px-2"
                      >
                          Remove
                      </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 text-center py-8">
              <Ship className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No vessels added yet</p>
              <p className="text-gray-400 text-xs">Click "Add Vessel" to start tracking your first vessel</p>
            </div>
          )}
          </CardContent>
        </Card>





      {/* Map */}
        <Card>
          <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#61adde]">
            <MapPin className="h-5 w-5" />
            Live Vessel Map
            {selectedIMO && (
              <Badge className="ml-2 bg-[#61adde]">
                Tracking IMO: {selectedIMO}
              </Badge>
            )}
          </CardTitle>
          </CardHeader>
          <CardContent>
          {/* Quick Navigation */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-gray-500" />
              <Label className="font-medium">Quick Navigation:</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              {regions.map((region) => (
                <Button
                  key={region.name}
                  variant="outline"
                  size="sm"
                  onClick={() => handleRegionSelect(region)}
                  className="text-xs"
                >
                  {region.name}
                </Button>
                  ))}
            </div>
            </div>

          <VesselFinderMap 
            width="100%" 
            height={600}
            latitude={mapCenter.latitude}
            longitude={mapCenter.longitude}
            zoom={mapCenter.zoom}
            names={false}
            showTrack={true}
            imo={selectedIMO || undefined}
          />
          <div className="mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Real-time AIS data</span>
            </div>
            <div>
                Current view: {mapCenter.latitude.toFixed(2)}, {mapCenter.longitude.toFixed(2)} (Zoom: {mapCenter.zoom})
                  </div>
            </div>
                    </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VesselTrackingPage;
