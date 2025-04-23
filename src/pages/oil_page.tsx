import { useParams} from "react-router-dom";
import { useForecastingQuery } from "@/hooks/use-forecasting";
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react";

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
  console.log(data.Commodity);

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">
        {data.Name} ({data.Symbol})
      </h1>
      <p>当前日期：{data.Current_Date}</p>
      {/* 这里你可以展示 Predictions、API_Gravity、Grade、等等所有字段 */}
      <h2 className="text-xl mt-4">预测 (未来 5 天)</h2>
      {/* … 更多详情 */}
    </div>
  )
}

export default OilPage