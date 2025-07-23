export interface Forecast {
  id: number;
  product: string;
  current_date: string;
  current_value: number;
  n_days_ahead: number;
  predicted_date: string;
  predicted_value: number;
  predicted_upper?: number | null;
  predicted_lower?: number | null;
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
  imo_number: string;
  vessel_name?: string | null;
  notes?: string | null;
}

export interface VesselCreate extends VesselBase {}

export interface VesselResponse extends VesselBase {
  id: number;
  created_at: string;
}

export interface OilIndicesResponse {
  id: number;
  symbol: string;
  date: string;
  close_price: number;
}