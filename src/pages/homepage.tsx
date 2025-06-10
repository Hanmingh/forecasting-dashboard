import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLatestForecasts } from "@/hooks/use-forecasts";
import { useColorPreferences } from "@/hooks/use-color-preferences";
import { useRoute } from "@/hooks/use-route";
import { useVessel } from "@/hooks/use-vessel";
import { usePort } from "@/hooks/use-port";
import { useState, useEffect, useMemo } from "react";
import { Star, TrendingUp, TrendingDown } from "lucide-react";
import type { Forecast, RouteResponse, VesselResponse, PortResponse } from "@/hooks/types";
import ShippingSchedule from "@/components/ShippingSchedule";

interface FavoriteProduct {
  product: string;
  addedAt: string;
}

const Homepage = () => {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [routes, setRoutes] = useState<RouteResponse[]>([]);
  const [vessels, setVessels] = useState<VesselResponse[]>([]);
  const [ports, setPorts] = useState<PortResponse[]>([]);
  const { getUpColor, getDownColor } = useColorPreferences();

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

  // Fetch latest forecasts
  const { data: latestForecasts = [], isLoading: isForecastsLoading } = useLatestForecasts();

  // Fetch routes, vessels, and ports data
  const { fetchRoutes } = useRoute();
  const { fetchVessels } = useVessel();
  const { fetchPorts } = usePort();

  useEffect(() => {
    const loadShippingData = async () => {
      try {
        const [routesData, vesselsData, portsData] = await Promise.all([
          fetchRoutes(),
          fetchVessels(),
          fetchPorts()
        ]);
        setRoutes(routesData || []);
        setVessels(vesselsData || []);
        setPorts(portsData || []);
      } catch (error) {
        console.error('Error loading shipping data:', error);
      }
    };

    loadShippingData();
  }, []);

  // Get latest forecasts for favorited products
  const favoriteForecasts = useMemo(() => {
    const favoriteProductNames = favorites.map(f => f.product);
    return latestForecasts.filter(forecast => 
      favoriteProductNames.includes(forecast.product)
    );
  }, [latestForecasts, favorites]);

  // Group forecasts by product for display
  const forecastsByProduct = useMemo(() => {
    return favoriteForecasts.reduce((acc, forecast) => {
      if (!acc[forecast.product]) {
        acc[forecast.product] = [];
      }
      acc[forecast.product].push(forecast);
      return acc;
    }, {} as Record<string, Forecast[]>);
  }, [favoriteForecasts]);

  const removeFromFavorites = (product: string) => {
    const updatedFavorites = favorites.filter(f => f.product !== product);
    setFavorites(updatedFavorites);
    localStorage.setItem('forecast-favorites', JSON.stringify(updatedFavorites));
  };

  const getPredictionTrend = (forecast: Forecast) => {
    const change = forecast.predicted_value - forecast.current_value;
    const changePercent = (change / forecast.current_value) * 100;
    return {
      change,
      changePercent,
      isPositive: change > 0,
    };
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
                const productForecasts = forecastsByProduct[favorite.product] || [];
                const latestForecast = productForecasts.length > 0 
                  ? productForecasts.reduce((latest, current) => 
                      new Date(current.current_date) > new Date(latest.current_date) ? current : latest
                    )
                  : null;

                return (
                  <Card key={favorite.product} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm text-[#4670bc]">{favorite.product}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromFavorites(favorite.product)}
                          className="text-yellow-400 hover:text-red-500 p-1"
                        >
                          <Star className="h-4 w-4 fill-current" />
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-2">
                      {isForecastsLoading ? (
                        <p className="text-xs text-muted-foreground">Loading...</p>
                      ) : latestForecast ? (
                        <>
                          {/* Current and Forecast Values */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Current:</span>
                            <span className="font-bold text-sm text-[#4670bc]">
                              ${latestForecast.current_value.toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {latestForecast.n_days_ahead}d:
                            </span>
                            <span className="font-bold text-sm text-[#61adde]">
                              ${latestForecast.predicted_value.toFixed(2)}
                            </span>
                          </div>

                          {/* Trend Indicator */}
                          {(() => {
                            const trend = getPredictionTrend(latestForecast);
                            return (
                              <div className="flex items-center justify-between border-t pt-2">
                                <span className="text-xs text-muted-foreground">Change:</span>
                                <div className="flex items-center gap-1">
                                  {trend.isPositive ? (
                                    <TrendingUp className={`h-3 w-3 ${getUpColor().replace('text-', 'text-')}`} />
                                  ) : (
                                    <TrendingDown className={`h-3 w-3 ${getDownColor().replace('text-', 'text-')}`} />
                                  )}
                                  <span className={`text-xs font-semibold ${trend.isPositive ? getUpColor() : getDownColor()}`}>
                                    {trend.isPositive ? '+' : ''}${trend.change.toFixed(1)} 
                                    ({trend.changePercent.toFixed(1)}%)
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">No data</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shipping Schedule Section */}
      <ShippingSchedule
        routes={routes}
        vessels={vessels}
        ports={ports}
        title="Shipping Schedule"
        subtitle={`${routes.length} routes in system`}
        showControls={true}
        compact={false}
      />
    </div>
  );
};

export default Homepage;