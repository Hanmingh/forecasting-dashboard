import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useForecast, formatPrediction } from "@/hooks/use-forecasts";
import { TODAY } from '../components/constants';
import { useMemo } from "react";
import type { Forecast } from "@/hooks/types";

const ForecastPage = () => {
  const { data: forecasts = [], isLoading, isError, error } = useForecast({ current_date: TODAY });
  const navigate = useNavigate();

  const rows = useMemo(() => {
    const byProduct: Record<string, Forecast[]> = {}
    forecasts.forEach((f) => {
      if (!byProduct[f.product]) byProduct[f.product] = []
      byProduct[f.product].push(f)
    })
    return Object.values(byProduct).map((group) => {
      const map = Object.fromEntries(
        group.map((f) => [f.n_days_ahead, f])
      ) as Record<number, Forecast>
      return {
        product:        group[0].product,
        currentValue:   group[0].current_value,
        ahead1: formatPrediction(map[1]?.predicted_value),
        ahead5: formatPrediction(map[5]?.predicted_value),
        ahead10: formatPrediction(map[10]?.predicted_value),
        ahead15: formatPrediction(map[15]?.predicted_value),
        ahead20: formatPrediction(map[20]?.predicted_value),
      }
    })
  }, [forecasts])

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
  if (rows.length === 0) {
    return <div>Empty Data</div>;
  }

  return (
    <div className="space-y-4">
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Fuel Product Lists</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SYMBOL</TableHead>
                <TableHead>NAME</TableHead>
                <TableHead>TODAY'S PRICE</TableHead>
                <TableHead>1-DAY PREDICTION</TableHead>
                <TableHead>5-DAY PREDICTION</TableHead>
                <TableHead>10-DAY PREDICTION</TableHead>
                <TableHead>15-DAY PREDICTION</TableHead>
                <TableHead>20-DAY PREDICTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow
                  key={r.product}
                  className="cursor-pointer"
                  onClick={() => navigate(`/${r.product}`)}
                >
                  <TableCell className="font-medium">{r.product}</TableCell>
                  <TableCell>{r.product}</TableCell>
                  <TableCell>{r.currentValue}</TableCell>
                  <TableCell>{r.ahead1}</TableCell>
                  <TableCell>{r.ahead5}</TableCell>
                  <TableCell>{r.ahead10}</TableCell>
                  <TableCell>{r.ahead15}</TableCell>
                  <TableCell>{r.ahead20}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default ForecastPage