import { API_CONFIG } from "./config";
import { ForecastingData } from "./types";

class ForecastingAPI{
    private createUrl(endpoint: string, params: Record<string, string|number>){
        const searchParams = new URLSearchParams({
            "Current_Date":"2025-04-21",
            ...params,
          });
          return `${endpoint}?${searchParams.toString()}`;
    }

    private async fetchData<T>(url: string): Promise<T> {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Forecasting API Error: ${response.statusText}`);
        }

        return response.json();
    }

    async getCurrentForecasting(Symbol: string): Promise<ForecastingData> {
        const url = this.createUrl(`${API_CONFIG.BASE_URL}/forecasting`, {
            Symbol:Symbol,
            Current_Date:API_CONFIG.DEFAULTS_PARAMS.Current_Date,
        })
        return this.fetchData<ForecastingData>(url)
    }
}

export const forecastingAPI = new ForecastingAPI();