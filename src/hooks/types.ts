export interface Forecast {
  id: number;
  product: string;
  current_date: string;
  current_value: number;
  n_days_ahead: number;
  predicted_date: string;
  predicted_value: number;
  residual_std?: number | null;
  residual_mean_abs?: number | null;
  model_version?: string | null;
}

export interface Accuracy {
  id: number;
  product: string;
  n_days_ahead: number;
  rmse:number;
  mae:number;
  mape:number;
  model_version?: string | null;
}

export interface VesselBase {
  vessel_name: string;
  vessel_type: string;
}

export interface VesselCreate extends VesselBase {}

export interface VesselResponse extends VesselBase {
  id: number;
}

// Types for Routes
export interface RouteBase {
  vessel_id: number;
  departure_port_id: number;
  arrival_port_id: number;
  scheduled_departure: string; // ISO datetime string
  actual_departure?: string | null;
  estimated_arrival: string; // ISO datetime string
  actual_arrival?: string | null;
  current_latitude?: number | null;
  current_longitude?: number | null;
}

export interface RouteCreate extends RouteBase {}

export interface RouteResponse extends RouteBase {
  id: number;
}

export interface PortResponse {
  id: number;
  port_code: string;
  port_name: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  port_type: string;
  is_active: boolean;
}