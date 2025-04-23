import { forecastingAPI } from "@/api/forecasting";
import { ForecastingData } from "@/api/types";
import { useQuery } from "@tanstack/react-query";

export const FORECASTING_KEYS={
    forecasting:(symb:string)=>["forecasting",symb] as const,
    allForecastings: () => ["forecastings"] as const,
}

export function useForecastingQuery(symbol:string) {
    return useQuery({
        queryKey: FORECASTING_KEYS.forecasting(symbol ?? 'Invalid Symbol'),
        queryFn:()=>
            symbol?forecastingAPI.getCurrentForecasting(symbol):null,
        select: (res) => {
            if (Array.isArray(res)) {
              return res[0] || null;
            }
            return res;
        },
        enabled: !!symbol,
    })
}

export function useAllForecastingsQuery() {
    return useQuery<ForecastingData[], Error>({
      queryKey: FORECASTING_KEYS.allForecastings(),
      queryFn: () => forecastingAPI.getAllForecastings(),
    });
}