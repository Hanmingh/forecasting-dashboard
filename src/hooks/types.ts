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