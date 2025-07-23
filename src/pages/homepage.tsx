import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMultiForecast } from "@/hooks/use-forecasts";
import { useColorPreferences } from "@/hooks/use-color-preferences";
import { useVessel } from "@/hooks/use-vessel";
import { useState, useEffect, useMemo } from "react";
import { Star, TrendingUp, TrendingDown } from "lucide-react";
import type { Forecast, VesselResponse } from "@/hooks/types";
import ShippingSchedule from "@/components/ShippingSchedule";

interface FavoriteProduct {
  product: string;
  addedAt: string;
}

const Homepage = () => {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [vessels, setVessels] = useState<VesselResponse[]>([]);
  const { getUpColor, getDownColor } = useColorPreferences();

  // Define forecast horizons
  const FORECAST_HORIZONS = [1, 5, 30, 60];

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('forecast-favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    }
  }, []);

  // Create forecast requests for all favorite products and horizons
  const forecastRequests = useMemo(() => {
    return favorites.flatMap(favorite => 
      FORECAST_HORIZONS.map(horizon => ({
        product: favorite.product,
        n_days_ahead: horizon,
        head: 1 // Get only the latest forecast for each horizon
      }))
    );
  }, [favorites]);

  // Fetch forecasts for all favorite products and horizons
  const forecastResults = useMultiForecast(forecastRequests);

  // Process forecast data into a structured format
  const favoriteForecasts = useMemo(() => {
    const forecastsByProduct: Record<string, Record<number, Forecast | null>> = {};
    
    favorites.forEach(favorite => {
      forecastsByProduct[favorite.product] = {};
      FORECAST_HORIZONS.forEach(horizon => {
        forecastsByProduct[favorite.product][horizon] = null;
      });
    });

    forecastResults.forEach((result, index) => {
      if (result.data && result.data.length > 0) {
        const request = forecastRequests[index];
        const forecast = result.data[0]; // Get the first (latest) forecast
        if (forecastsByProduct[request.product!]) {
          forecastsByProduct[request.product!][request.n_days_ahead!] = forecast;
        }
      }
    });

    return forecastsByProduct;
  }, [forecastResults, favorites, forecastRequests]);

  // Check if forecasts are loading
  const isForecastsLoading = forecastResults.some(result => result.isLoading);

  // Fetch vessels data
  const { fetchVessels } = useVessel();

  useEffect(() => {
    const loadVesselsData = async () => {
      try {
        const vesselsData = await fetchVessels();
        setVessels(vesselsData || []);
      } catch (error) {
        console.error('Error loading vessels data:', error);
      }
    };

    loadVesselsData();
  }, []);

  const removeFromFavorites = (product: string) => {
    const updatedFavorites = favorites.filter(f => f.product !== product);
    setFavorites(updatedFavorites);
    localStorage.setItem('forecast-favorites', JSON.stringify(updatedFavorites));
  };

  const getPredictionTrend = (currentValue: number, predictedValue: number) => {
    const change = predictedValue - currentValue;
    const changePercent = (change / currentValue) * 100;
    return {
      change,
      changePercent,
      isPositive: change > 0,
    };
  };

  const getCurrentValue = (productForecasts: Record<number, Forecast | null>) => {
    // Get current value from any available forecast (they should all have the same current value)
    for (const horizon of FORECAST_HORIZONS) {
      if (productForecasts[horizon]) {
        return productForecasts[horizon]!.current_value;
      }
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Favorites Display */}
      {favorites.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Star className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <p className="text-[#4670bc] text-lg font-semibold mb-4">No favorite products yet</p>
            <p className="text-sm text-muted-foreground">
              Add your favorite products from the Forecast or Oil pages to see their latest forecasts here
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg">
              <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
              Favorites
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Favorite Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favorites.map(favorite => {
                const productForecasts = favoriteForecasts[favorite.product] || {};
                const currentValue = getCurrentValue(productForecasts);

                return (
                  <Card key={favorite.product} className="hover:shadow-md transition-shadow">
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm text-[#4670bc]">{favorite.product}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromFavorites(favorite.product)}
                          className="text-yellow-400 hover:text-red-500"
                        >
                          <Star className="h-4 w-4 fill-current" />
                        </Button>
                      </div>
                      {isForecastsLoading ? (
                        <p className="text-xs text-muted-foreground">Loading...</p>
                      ) : currentValue !== null ? (
                        <>
                          {/* Current Value */}
                          <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-xs text-muted-foreground">Current:</span>
                            <span className="font-bold text-sm text-[#4670bc]">
                              ${currentValue.toFixed(2)}
                            </span>
                          </div>

                          {/* Forecast Horizons */}
                          <div className="space-y-2">
                            {FORECAST_HORIZONS.map(horizon => {
                              const forecast = productForecasts[horizon];
                              if (!forecast) {
                                return (
                                  <div key={horizon} className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">{horizon}d:</span>
                                    <span className="text-xs text-muted-foreground">No data</span>
                                  </div>
                                );
                              }

                              const trend = getPredictionTrend(currentValue, forecast.predicted_value);
                              
                                                             return (
                                 <div key={horizon} className="flex items-center justify-between">
                                   <span className="text-xs text-muted-foreground">{horizon}D-Forecast:</span>
                                   <div className="flex items-center gap-2">
                                     <span className={`font-semibold text-xs ${trend.isPositive ? getUpColor() : getDownColor()}`}>
                                       ${forecast.predicted_value.toFixed(2)}
                                     </span>
                                     <div className="flex items-center gap-1">
                                       {trend.isPositive ? (
                                         <TrendingUp className={`h-3 w-3 ${getUpColor().replace('text-', 'text-')}`} />
                                       ) : (
                                         <TrendingDown className={`h-3 w-3 ${getDownColor().replace('text-', 'text-')}`} />
                                       )}
                                       <span className={`text-xs ${trend.isPositive ? getUpColor() : getDownColor()}`}>
                                         {trend.changePercent.toFixed(1)}%
                                       </span>
                                     </div>
                                   </div>
                                 </div>
                               );
                            })}
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">No data available</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Fleet Section */}
      <ShippingSchedule
        routes={[]}
        vessels={vessels}
        ports={[]}
        title="My Fleet"
        subtitle={`${vessels.length} vessels in your fleet`}
        showControls={true}
        compact={false}
      />
    </div>
  );
};

export default Homepage;