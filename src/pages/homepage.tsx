import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLatestForecasts } from "@/hooks/use-forecasts";
import { useColorPreferences } from "@/hooks/use-color-preferences";
import { useState, useEffect, useMemo } from "react";
import { Star, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import type { Forecast } from "@/hooks/types";

interface FavoriteProduct {
  product: string;
  addedAt: string;
}

const Homepage = () => {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
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
    <div className="space-y-6 p-6">
      {/* Favorites Display */}
      {favorites.length === 0 ? (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-[#61adde]/5 to-[#99b6c4]/5">
          <CardContent className="text-center py-12">
            <Star className="h-16 w-16 text-[#99b6c4] mx-auto mb-6" />
            <p className="text-[#4670bc] text-lg font-semibold mb-4">No favorite products yet</p>
            <p className="text-sm text-[#99b6c4]">
              Add your favorite products from the Forecast or Oil pages to see their latest forecasts here
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-[#61adde]/5 to-[#99b6c4]/5">
          <CardHeader className="bg-gradient-to-r rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Star className="h-6 w-6 fill-white" />
              Favorites
            </CardTitle>
          </CardHeader>
          <CardContent className="pace-y-4">
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
                  <div key={favorite.product} className="rounded-lg p-4 shadow-md border border-[#99b6c4]/20 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm text-[#4670bc]">{favorite.product}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromFavorites(favorite.product)}
                        className="text-[#61adde] hover:text-red-500 hover:bg-red-50 p-1 rounded-full"
                      >
                        <Star className="h-4 w-4 fill-current" />
                      </Button>
                    </div>

                    {isForecastsLoading ? (
                      <p className="text-xs text-[#99b6c4]">Loading...</p>
                    ) : latestForecast ? (
                      <div className="space-y-2">
                        {/* Current and Forecast Values */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#99b6c4]">Current:</span>
                          <span className="font-bold text-sm text-[#4670bc]">
                            ${latestForecast.current_value.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#99b6c4]">
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
                            <div className="flex items-center justify-between border-t border-[#99b6c4]/20 pt-2">
                              <span className="text-xs text-[#99b6c4]">Change:</span>
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

                        {/* Compact Badges */}
                        <div className="flex gap-2 pt-2">
                          <Badge variant="secondary" className="text-xs py-1 px-2 bg-[#61adde]/10 text-[#4670bc] border-0">
                            {format(new Date(latestForecast.predicted_date), "MM/dd")}
                          </Badge>
                          <Badge variant="outline" className="text-xs py-1 px-2 border-[#99b6c4] text-[#4670bc]">
                            {latestForecast.n_days_ahead}d
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-[#99b6c4]">No data</p>
                    )}
                  </div>
                );
              })}
            </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
};

export default Homepage;