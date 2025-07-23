import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Ship, MapPin, PlusCircle, Edit } from 'lucide-react';
import VesselFinderMap from '../components/VesselFinderMap';
import { useVessel } from '@/hooks/use-vessel';
import type { VesselResponse, VesselCreate } from '@/hooks/types';

const VesselTrackingPage: React.FC = () => {
  const [selectedIMO, setSelectedIMO] = useState<string>('');
  const [savedVessels, setSavedVessels] = useState<VesselResponse[]>([]);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingVessel, setEditingVessel] = useState<VesselResponse | null>(null);
  const [vesselForm, setVesselForm] = useState<VesselCreate>({
    imo_number: '',
    vessel_name: '',
    notes: ''
  });
  
  // Vessel management hooks
  const { addVessel, fetchVessels, modifyVessel, removeVessel, loading } = useVessel();
  
  const [mapCenter, setMapCenter] = useState({
    latitude: 25.0,
    longitude: 55.0,
    zoom: 3
  });

  // Load vessels on component mount
  useEffect(() => {
    const loadVessels = async () => {
      try {
        const vessels = await fetchVessels();
        setSavedVessels(vessels || []);
      } catch (error) {
        console.error('Error loading vessels:', error);
      }
    };
    loadVessels();
  }, []);

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
      imo_number: '',
      vessel_name: '',
      notes: ''
    });
  };

  const handleEditVessel = (vessel: VesselResponse) => {
    setShowAddForm(true);
    setEditingVessel(vessel);
    setVesselForm({
      imo_number: vessel.imo_number,
      vessel_name: vessel.vessel_name || '',
      notes: vessel.notes || ''
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (vesselForm.imo_number.trim()) {
      try {
        if (editingVessel) {
          // Update existing vessel
          const updatedVessel = await modifyVessel(editingVessel.id, vesselForm);
          if (updatedVessel) {
            setSavedVessels(prev => 
              prev.map(v => v.id === editingVessel.id ? updatedVessel : v)
            );
          }
        } else {
          // Add new vessel
          const newVessel = await addVessel(vesselForm);
          if (newVessel) {
            setSavedVessels(prev => [...prev, newVessel]);
          }
        }
        
        setShowAddForm(false);
        setEditingVessel(null);
        setVesselForm({
          imo_number: '',
          vessel_name: '',
          notes: ''
        });
      } catch (error) {
        console.error('Error saving vessel:', error);
        // You could add a toast notification here
      }
    }
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingVessel(null);
    setVesselForm({
      imo_number: '',
      vessel_name: '',
      notes: ''
    });
  };

  const handleVesselSelect = (vessel: VesselResponse) => {
    setSelectedIMO(vessel.imo_number);
  };

  const handleRemoveVessel = async (vesselId: number) => {
    try {
      const success = await removeVessel(vesselId);
      if (success) {
        setSavedVessels(prev => prev.filter(v => v.id !== vesselId));
        // Clear selection if the removed vessel was selected
        const removedVessel = savedVessels.find(v => v.id === vesselId);
        if (removedVessel && selectedIMO === removedVessel.imo_number) {
          setSelectedIMO('');
        }
      }
    } catch (error) {
      console.error('Error removing vessel:', error);
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
                disabled={loading}
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
                        value={vesselForm.imo_number}
                        onChange={(e) => setVesselForm(prev => ({ ...prev, imo_number: e.target.value }))}
                        placeholder="9506291"
                        disabled
                      />
                    </div>
                    <div>
                      <Label htmlFor="vessel-name">Vessel Name</Label>
                      <Input
                        id="vessel-name"
                        value={vesselForm.vessel_name || ''}
                        onChange={(e) => setVesselForm(prev => ({ ...prev, vessel_name: e.target.value || null }))}
                        placeholder="Ever Given"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="vessel-notes">Notes</Label>
                      <Input
                        id="vessel-notes"
                        value={vesselForm.notes || ''}
                        onChange={(e) => setVesselForm(prev => ({ ...prev, notes: e.target.value || null }))}
                        placeholder="Additional notes about this vessel"
                      />
                    </div>
                  </div>
                ) : (
                  // Add mode - only IMO field initially
                  <div className="max-w-md">
                    <div>
                      <Label htmlFor="vessel-imo">IMO Number</Label>
                      <Input
                        id="vessel-imo"
                        value={vesselForm.imo_number}
                        onChange={(e) => setVesselForm(prev => ({ ...prev, imo_number: e.target.value }))}
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
                    disabled={!vesselForm.imo_number.trim() || loading}
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
                    key={vessel.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedIMO === vessel.imo_number ? 'border-[#61adde] bg-blue-50 shadow-md' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleVesselSelect(vessel)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-[#4670bc] text-sm">
                            {vessel.vessel_name || `Vessel ${vessel.imo_number}`}
                          </div>
                          {selectedIMO === vessel.imo_number && (
                            <Badge className="bg-[#61adde] text-white text-xs px-2 py-0.5">
                              Tracking
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 mb-1">IMO: {vessel.imo_number}</div>
                        {vessel.notes && (
                          <div className="text-xs text-gray-500 mt-1">{vessel.notes}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          Added: {new Date(vessel.created_at).toLocaleDateString()}
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
                            handleRemoveVessel(vessel.id);
                          }}
                          variant="outline"
                          size="sm"
                          className="text-xs py-1 px-2"
                          disabled={loading}
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
