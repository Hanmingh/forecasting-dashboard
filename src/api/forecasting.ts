import { API_CONFIG } from "./config";
import { ForecastingData } from "./types";

class ForecastingAPI{
    private createUrl(endpoint: string, params: Record<string, string|number>){
        const searchParams = new URLSearchParams({ ...params } as Record<string, string>);
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
        const url = this.createUrl(`${API_CONFIG.BASE_URL}forecasting`, {Symbol})
        return this.fetchData<ForecastingData>(url)
    }

    async getAllForecastings(): Promise<ForecastingData[]> {
        const url = `${API_CONFIG.BASE_URL}forecasting`;
        return this.fetchData<ForecastingData[]>(url);
    }
}

export const forecastingAPI = new ForecastingAPI();