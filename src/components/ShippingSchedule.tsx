import React from 'react';
import { Ship } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { VesselResponse } from '@/hooks/types';

interface ShippingScheduleProps {
  routes?: any[]; // Keep for backward compatibility
  vessels: VesselResponse[];
  ports?: any[]; // Keep for backward compatibility
  title?: string;
  subtitle?: string;
  showControls?: boolean;
  compact?: boolean;
}

const ShippingSchedule: React.FC<ShippingScheduleProps> = ({
  vessels,
  title = "My Fleet",
  subtitle,
  showControls = true,
  compact = false
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#61adde]">
          <Ship className="h-5 w-5" />
          {title}
        </CardTitle>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </CardHeader>
      <CardContent>
        {vessels.length === 0 ? (
          <div className="text-center py-8">
            <Ship className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No vessels in your fleet</p>
            <p className="text-gray-400 text-xs">Add vessels from the Routes page to track them here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vessels.map((vessel) => (
              <div
                key={vessel.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Ship className="h-4 w-4 text-[#61adde]" />
                  <div>
                    <div className="font-medium text-sm">
                      {vessel.vessel_name || `Vessel ${vessel.imo_number}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      IMO: {vessel.imo_number}
                    </div>
                    {vessel.notes && (
                      <div className="text-xs text-gray-400 mt-1">
                        {vessel.notes}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Added {new Date(vessel.created_at).toLocaleDateString()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShippingSchedule;