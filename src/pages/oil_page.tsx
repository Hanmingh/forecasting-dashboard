import { useParams} from "react-router-dom";
import { useForecastingQuery } from "@/hooks/use-forecasting";
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react";
import Prediction from "@/components/prediction";
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import Layout from "@/components/layout";

const OilPage = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const { data, isLoading, isError, error } = useForecastingQuery(symbol || "");

  if (isLoading) return <Skeleton className="w-[100px] h-[20px] rounded-full" />;
  if (isError)   return (
    <Alert>
      <Terminal className="h-4 w-4" />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        Error: {error.message}
      </AlertDescription>
    </Alert>
  );
  if (!data) return <div>Commodity Unfound!</div>;

  return (
    <Layout>
      <div className="grid gap-6">
        <h1 className="text-2xl font-bold">
          {data.Name} ({data.Symbol})
        </h1>
        <Card>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {Object.entries(data)
                .filter(([key]) => key !== "Predictions" && key !== "Current_Date")
                .map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium">{key}</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
          </CardContent>
        </Card>
        <Prediction data={data} />
      </div>
    </Layout>
  )
}

export default OilPage