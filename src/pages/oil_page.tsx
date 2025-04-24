import { useParams} from "react-router-dom";
import { useForecastingQuery } from "@/hooks/use-forecasting";
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react";
import Prediction from "@/components/prediction";

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
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">
        {data.Name} ({data.Symbol})
      </h1>
      
      <Prediction data={data} />
    </div>
  )
}

export default OilPage