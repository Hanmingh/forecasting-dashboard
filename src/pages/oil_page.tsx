import { useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import PredictionChart from "@/components/PredictionChart";
import { useForecast, useMultiForecast, UseForecastReq } from "@/hooks/use-forecasts";
import { useAccuracy } from "@/hooks/use-accuracy";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

  const cutoffDate = new Date(sample_dates[0]);
  cutoffDate.setDate(cutoffDate.getDate() + 1);
  const predictedDates = Array.from(
    new Set(allForecasts.map((f) => f.predicted_date))
  )
    .map((pd) => new Date(pd))
    .filter((dt) => dt.getTime() >= cutoffDate.getTime())
    .sort((a, b) => a.getTime() - b.getTime())
    .map((dt) => dt.toISOString().split("T")[0]);

  const matrix: (number | null)[][] = sample_dates.map((cd) =>
    predictedDates.map((pd) => {
      const hit = allForecasts.find(
        (f) => f.current_date === cd && f.predicted_date === pd
      );
      return hit ? hit.predicted_value : null;
    })
  );

  const fmt = (d: string) => d.substring(5);

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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Forecast on</TableHead>
            {predictedDates.map((pd) => (
              <TableHead key={pd} className="text-right">
                {fmt(pd)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sample_dates.map((cd, i) => (
            <TableRow key={cd}>
              <TableCell className="font-medium">{fmt(cd)}</TableCell>
              {matrix[i].map((val, j) => (
                <TableCell key={predictedDates[j]} className={`text-right ${i === 0 && val !== null ? 'text-[#ff7414]' : ''}`}>
                  {val !== null ? val.toFixed(2) : "-"}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default OilPage;