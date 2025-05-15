import { ForecastingData } from "@/api/types";
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
import { useAllForecastingsQuery } from "@/hooks/use-forecasting";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ForecastPage = () => {
  const { data, isLoading, isError, error } = useAllForecastingsQuery();
  const navigate = useNavigate();

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
                <TableHead>COMMODITY</TableHead>
                <TableHead>CONTRACT TYPE</TableHead>
                <TableHead>DELIVERY METHOD</TableHead>
                <TableHead>DELIVERY REGION</TableHead>
                <TableHead>DENSITY</TableHead>
                <TableHead>SHIPPING TERMS</TableHead>
                <TableHead>SULFUR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data!.map((item: ForecastingData) => (
                <TableRow key={item.Symbol} className="cursor-pointer" onClick={() => navigate(`/${item.Symbol}`)}>
                  <TableCell className="font-medium">{item.Symbol}</TableCell>
                  <TableCell>{item.Name}</TableCell>
                  <TableCell>{item.Commodity}</TableCell>
                  <TableCell>{item.Contract_Type}</TableCell>
                  <TableCell>{item.Delivery_Method}</TableCell>
                  <TableCell>{item.Delivery_Region}</TableCell>
                  <TableCell>{item.Density}</TableCell>
                  <TableCell>{item.Shipping_Terms}</TableCell>
                  <TableCell>{item.Sulfur}</TableCell>
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