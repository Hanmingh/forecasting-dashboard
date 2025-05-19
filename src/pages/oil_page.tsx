import { useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import PredictionChart from "@/components/PredictionChart";
import { useForecast, useMultiForecast, UseForecastReq } from "@/hooks/use-forecasts";
import { useAccuracy } from "@/hooks/use-accuracy";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

const OilPage = () => {
  const { symbol } = useParams<{ symbol: string }>();

  const {
    data: latest5Days,
    isLoading: islatest5DaysLoading,
    isError: islatest5DaysError,
    error: latest5DaysError,
  } = useForecast({ product: symbol, days: 1, head: 5 });

  /*const dates : string[] = latest5Days.map(item => item.current_date);*/
  const sample_dates = ['2025-03-05', '2025-03-04', '2025-03-03', '2025-02-28', '2025-02-27']

  const forecastRequests: UseForecastReq[] = sample_dates.map((d) => ({
    product: symbol!,
    current_date: d,
  }))

  const forecastQueries = useMultiForecast(forecastRequests)

  const {
    data: accuracyData,
    isLoading: isAccuracyLoading,
    isError: isAccuracyError,
    error: accuracyError,
  } = useAccuracy({ product: symbol });
  
  const isLoading = islatest5DaysLoading || forecastQueries.some((q) => q.isLoading) || isAccuracyLoading;
  const isError = islatest5DaysError || forecastQueries.some((q) => q.isError) || isAccuracyError;
  const error = latest5DaysError || accuracyError || forecastQueries.find((q) => q.isError)?.error;

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

  const allForecasts = forecastQueries.flatMap((q) => q.data ?? []);

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">
        {symbol}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Price Prediction ($/MT)</CardTitle>
        </CardHeader>
        <CardContent>
          <PredictionChart dates={sample_dates} data={allForecasts} accuracy={accuracyData ?? []} />
        </CardContent>
      </Card>
    </div>
  );
};

export default OilPage;