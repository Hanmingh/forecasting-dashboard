import { useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, TrendingUp, TrendingDown, Calendar, Target, Star } from "lucide-react";
import PredictionChart from "@/components/PredictionChart";
import { useForecast } from "@/hooks/use-forecasts";
import { useAccuracy } from "@/hooks/use-accuracy";
import { useFavorites } from "@/hooks/use-favorites";
import { useColorPreferences } from "@/hooks/use-color-preferences";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

const OilPage = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { getUpColor, getDownColor } = useColorPreferences();

  const current_day = '2025-01-08'
  // Get latest forecasts for this product - optimized query
  const {
    data: allForecasts = [],
    isLoading: isForecastLoading,
    isError: isForecastError,
    error: forecastError,
  } = useForecast({ product: symbol, current_date: current_day });

  const {
    data: accuracyData = [],
    isLoading: isAccuracyLoading,
    isError: isAccuracyError,
    error: accuracyError,
  } = useAccuracy({ product: symbol });

  // Process data to get statistics (data is already filtered for latest date)
  const { latestForecasts, currentValue, latestDate, forecastStats } = useMemo(() => {
    if (allForecasts.length === 0) {
      return { latestForecasts: [], currentValue: 0, latestDate: '', forecastStats: { total: 0, avgChange: 0, maxDays: 0 } };
    }

    // Data is already filtered for the specific date, just sort by n_days_ahead
    const latestForecasts = [...allForecasts].sort((a, b) => a.n_days_ahead - b.n_days_ahead);

    const currentValue = latestForecasts[0]?.current_value || 0;
    const latestDate = latestForecasts[0]?.current_date || '';
    
    // Calculate statistics
    const totalForecasts = latestForecasts.length;
    const maxDays = Math.max(...latestForecasts.map(f => f.n_days_ahead));
    const avgChange = latestForecasts.length > 0 
      ? latestForecasts.reduce((sum, f) => sum + ((f.predicted_value - currentValue) / currentValue) * 100, 0) / latestForecasts.length
      : 0;

    return {
      latestForecasts,
      currentValue,
      latestDate,
      forecastStats: { total: totalForecasts, avgChange, maxDays }
    };
  }, [allForecasts]);

  const isLoading = isForecastLoading || isAccuracyLoading;
  const isError = isForecastError || isAccuracyError;
  const error = forecastError || accuracyError;

  if (isLoading) {
    return <Skeleton className="w-[100px] h-[20px] rounded-full" />;
  }

  if (isError) {
    return (
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>
          Error: {error?.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (latestForecasts.length === 0) {
    return (
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>No Data</AlertTitle>
        <AlertDescription>
          No forecast data available for {symbol}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{symbol}</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFavorite(symbol || '')}
              className={`p-2 ${
                isFavorite(symbol || '') 
                  ? 'text-yellow-400' 
                  : 'text-muted-foreground hover:text-yellow-400'
              }`}
            >
              <Star className={`h-6 w-6 ${isFavorite(symbol || '') ? 'fill-current' : ''}`} />
            </Button>
          </div>
          <p className="text-muted-foreground">
            Commodity Price Forecasts
            <span className="ml-2 text-sm">Updated at {current_day}</span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">${currentValue.toFixed(2)}</div>
          <div className="text-sm text-muted-foreground">Current Price ($/MT)</div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Last Update
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{latestDate}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Price Next Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-lg font-bold ${
              (latestForecasts.find(f => f.n_days_ahead === 1)?.predicted_value || currentValue) >= currentValue 
                ? getUpColor() : getDownColor()
            }`}>
              ${(latestForecasts.find(f => f.n_days_ahead === 1)?.predicted_value || currentValue).toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              {((((latestForecasts.find(f => f.n_days_ahead === 1)?.predicted_value || currentValue) - currentValue) / currentValue) * 100).toFixed(2)}% change
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-lg font-bold flex items-center gap-1 ${
              forecastStats.avgChange >= 0 ? getUpColor() : getDownColor()
            }`}>
              {forecastStats.avgChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {forecastStats.avgChange >= 0 ? '+' : ''}{forecastStats.avgChange.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              60-Day Outlook
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-lg font-bold ${
              (latestForecasts.find(f => f.n_days_ahead === 60)?.predicted_value || currentValue) >= currentValue 
                ? getUpColor() : getDownColor()
            }`}>
              ${(latestForecasts.find(f => f.n_days_ahead === 60)?.predicted_value || currentValue).toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              {((((latestForecasts.find(f => f.n_days_ahead === 60)?.predicted_value || currentValue) - currentValue) / currentValue) * 100).toFixed(2)}% change
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>60-Day Price Forecast</CardTitle>
          <CardDescription>
            Predicted prices with confidence intervals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PredictionChart 
            data={latestForecasts} 
            accuracy={accuracyData}
            currentValue={currentValue}
            currentDate={latestDate}
          />
        </CardContent>
      </Card>

      {/* Forecasts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Forecasts</CardTitle>
          <CardDescription>All forecast horizons for {symbol}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background border-r">Metric</TableHead>
                  {latestForecasts.map((forecast) => (
                    <TableHead key={forecast.n_days_ahead} className="text-center min-w-[120px]">
                      {forecast.n_days_ahead}-Day
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Date Row */}
                <TableRow>
                  <TableCell className="sticky left-0 bg-background border-r font-medium">
                    Target Date
                  </TableCell>
                  {latestForecasts.map((forecast) => (
                    <TableCell key={forecast.n_days_ahead} className="text-center">
                      {new Date(forecast.predicted_date).toLocaleDateString()}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Predicted Price Row */}
                <TableRow>
                  <TableCell className="sticky left-0 bg-background border-r font-medium">
                    Predicted Price
                  </TableCell>
                  {latestForecasts.map((forecast) => {
                    const changePercent = ((forecast.predicted_value - currentValue) / currentValue) * 100;
                    return (
                      <TableCell key={forecast.n_days_ahead} className="text-center">
                        <div className={`font-medium ${
                          forecast.predicted_value >= currentValue ? getUpColor() : getDownColor()
                        }`}>
                          ${forecast.predicted_value.toFixed(2)}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>

                {/* Change Percentage Row */}
                <TableRow>
                  <TableCell className="sticky left-0 bg-background border-r font-medium">
                    Change (%)
                  </TableCell>
                  {latestForecasts.map((forecast) => {
                    const changePercent = ((forecast.predicted_value - currentValue) / currentValue) * 100;
                    return (
                      <TableCell key={forecast.n_days_ahead} className="text-center">
                        <div className={`font-medium ${
                          changePercent >= 0 ? getUpColor() : getDownColor()
                        }`}>
                          {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>

                {/* Upper Bound Row */}
                <TableRow>
                  <TableCell className="sticky left-0 bg-background border-r font-medium">
                    Upper Bound
                  </TableCell>
                  {latestForecasts.map((forecast) => (
                    <TableCell key={forecast.n_days_ahead} className="text-center text-muted-foreground">
                      {forecast.predicted_upper ? `$${forecast.predicted_upper.toFixed(2)}` : '-'}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Lower Bound Row */}
                <TableRow>
                  <TableCell className="sticky left-0 bg-background border-r font-medium">
                    Lower Bound
                  </TableCell>
                  {latestForecasts.map((forecast) => (
                    <TableCell key={forecast.n_days_ahead} className="text-center text-muted-foreground">
                      {forecast.predicted_lower ? `$${forecast.predicted_lower.toFixed(2)}` : '-'}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OilPage;