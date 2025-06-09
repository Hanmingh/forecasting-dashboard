import {
  Table,
  TableBody,
  TableCaption,
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
import { Terminal, ChevronUp, ChevronDown, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useForecast, /*useLatestForecasts,*/ } from "@/hooks/use-forecasts";
import { useFavorites } from "@/hooks/use-favorites";
import { useColorPreferences } from "@/hooks/use-color-preferences";
import { useMemo, useState } from "react";
import type { Forecast } from "@/hooks/types";
import { Slider } from "@/components/ui/slider";

const formatPrice = (predicted: number | null): string => {
  if (predicted === null) return '-';
  return predicted.toFixed(2);
};

const formatPercentageChange = (current: number, predicted: number | null): number | null => {
  if (predicted === null) return null;
  return ((predicted - current) / current) * 100;
};

type SortKey = 'product' | 'currentValue' | 'forecastCount' |
  'price1' | 'price5' | 'price10' | 'price15' | 'price20' | 'price30' | 'price60' |
  'change1' | 'change5' | 'change10' | 'change15' | 'change20' | 'change30' | 'change60';

type SortDirection = 'asc' | 'desc';

interface RowData {
  product: string;
  currentValue: number;
  forecastCount: number;
  price1: number | null;
  price5: number | null;
  price10: number | null;
  price15: number | null;
  price20: number | null;
  price30: number | null;
  price60: number | null;
  change1: number | null;
  change5: number | null;
  change10: number | null;
  change15: number | null;
  change20: number | null;
  change30: number | null;
  change60: number | null;
}

const ForecastPage = () => {
  // Get latest forecasts for each product - optimized query
  //const { data: latestForecasts = [], isLoading, isError, error } = useLatestForecasts();

  const current_day = '2025-01-08'
  const { data: latestForecasts = [], isLoading, isError, error } = useForecast({current_date: current_day});
  // Just for demonstration, remove this when we have the latest forecasts query working

  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { getUpColor, getDownColor, getUpColorHex, getDownColorHex } = useColorPreferences();
  const [selectedDays, setSelectedDays] = useState(20);
  const [sortKey, setSortKey] = useState<SortKey>('product');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const SortableHeader = ({ label, sortKey: key }: { label: string; sortKey: SortKey }) => (
    <TableHead 
      className="cursor-pointer select-none hover:bg-gray-50" 
      onClick={() => handleSort(key)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortKey === key && (
          sortDirection === 'asc' ? 
            <ChevronUp className="h-3 w-3 text-blue-600" /> : 
            <ChevronDown className="h-3 w-3 text-blue-600" />
        )}
      </div>
    </TableHead>
  );



  const rows = useMemo(() => {
    const byProduct: Record<string, Forecast[]> = {}
    latestForecasts.forEach((f) => {
      if (!byProduct[f.product]) byProduct[f.product] = []
      byProduct[f.product].push(f)
    })
    const unsortedRows = Object.values(byProduct).map((group) => {
      const map = Object.fromEntries(
        group.map((f) => [f.n_days_ahead, f])
      ) as Record<number, Forecast>
      const currentValue = group[0].current_value;
      
      return {
        product: group[0].product,
        currentValue,
        forecastCount: group.length,
        price1: map[1]?.predicted_value || null,
        price5: map[5]?.predicted_value || null,
        price10: map[10]?.predicted_value || null,
        price15: map[15]?.predicted_value || null,
        price20: map[20]?.predicted_value || null,
        price30: map[30]?.predicted_value || null,
        price60: map[60]?.predicted_value || null,
        change1: formatPercentageChange(currentValue, map[1]?.predicted_value),
        change5: formatPercentageChange(currentValue, map[5]?.predicted_value),
        change10: formatPercentageChange(currentValue, map[10]?.predicted_value),
        change15: formatPercentageChange(currentValue, map[15]?.predicted_value),
        change20: formatPercentageChange(currentValue, map[20]?.predicted_value),
        change30: formatPercentageChange(currentValue, map[30]?.predicted_value),
        change60: formatPercentageChange(currentValue, map[60]?.predicted_value),
      } as RowData
    })

    // Sort the rows
    return unsortedRows.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];
      
      // Handle null values
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return sortDirection === 'asc' ? 1 : -1;
      if (bVal === null) return sortDirection === 'asc' ? -1 : 1;
      
      // String comparison for product and date
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const result = aVal.localeCompare(bVal);
        return sortDirection === 'asc' ? result : -result;
      }
      
      // Numeric comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        const result = aVal - bVal;
        return sortDirection === 'asc' ? result : -result;
      }
      
      return 0;
    });
  }, [latestForecasts, sortKey, sortDirection])

  // Calculate Forecast Distributions for visualizations
  const { returnDistribution, gainersLosers } = useMemo(() => {
    const returns: number[] = [];
    let gainers = 0;
    let losers = 0;
    let neutral = 0;

    rows.forEach(row => {
      // Calculate return for selected days
      const forecastData = latestForecasts.find((f: Forecast) => 
        f.product === row.product && f.n_days_ahead === selectedDays
      );
      
      if (forecastData?.predicted_value) {
        const returnPct = ((forecastData.predicted_value - row.currentValue) / row.currentValue) * 100;
        returns.push(returnPct);
        
        if (returnPct > 0.5) gainers++;
        else if (returnPct < -0.5) losers++;
        else neutral++;
      }
    });

    // Create histogram bins
    const bins = [-10, -5, -2, -1, -0.5, 0, 0.5, 1, 2, 5, 10];
    const histogram = bins.map((bin, index) => {
      const nextBin = bins[index + 1] || Infinity;
      const count = returns.filter(r => r >= bin && r < nextBin).length;
      return { bin, count, percentage: returns.length > 0 ? (count / returns.length) * 100 : 0 };
    });

    return {
      returnDistribution: histogram,
      gainersLosers: { gainers, losers, neutral, total: returns.length }
    };
  }, [rows, latestForecasts, selectedDays]);

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
    <div className="space-y-6">
      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - Controls and Stats */}
            <div className="space-y-4">
              {/* Slider for day selection */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold">Forecast Day:</span>
                  <span className="text-sm font-bold">{selectedDays} day</span>
                </div>
                <Slider
                  value={[selectedDays]}
                  onValueChange={(value) => setSelectedDays(value[0])}
                  min={1}
                  max={60}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1d</span>
                  <span>30d</span>
                  <span>60d</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded">
                  <div className="text-lg font-bold">{rows.length}</div>
                  <div className="text-xs">Products</div>
                </div>
                <div className="text-center p-3 rounded">
                  <div className="text-lg font-bold">{latestForecasts.length}</div>
                  <div className="text-xs">Forecasts</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Average Return:</span>
                    <span className={`font-medium ${
                      gainersLosers.total > 0 && rows.length > 0 ? 
                        (rows.reduce((sum, row) => {
                          const forecastData = latestForecasts.find(f => 
                            f.product === row.product && f.n_days_ahead === selectedDays
                          );
                          return sum + (forecastData?.predicted_value ? 
                            ((forecastData.predicted_value - row.currentValue) / row.currentValue) * 100 : 0);
                        }, 0) / rows.length >= 0 ? getUpColor() : getDownColor()) : ''
                    }`}>
                      {gainersLosers.total > 0 && rows.length > 0 ? 
                        `${(rows.reduce((sum, row) => {
                          const forecastData = latestForecasts.find(f => 
                            f.product === row.product && f.n_days_ahead === selectedDays
                          );
                          return sum + (forecastData?.predicted_value ? 
                            ((forecastData.predicted_value - row.currentValue) / row.currentValue) * 100 : 0);
                        }, 0) / rows.length).toFixed(2)}%` : '0.00%'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bullish Products:</span>
                    <span className={`${getUpColor()} font-medium`}>{gainersLosers.gainers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bearish Products:</span>
                    <span className={`${getDownColor()} font-medium`}>{gainersLosers.losers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Market Sentiment:</span>
                    <span className={`font-medium ${
                      gainersLosers.gainers > gainersLosers.losers ? getUpColor() : 
                      gainersLosers.losers > gainersLosers.gainers ? getDownColor() : 'text-muted-foreground'
                    }`}>
                      {gainersLosers.gainers > gainersLosers.losers ? 'Bullish' : 
                       gainersLosers.losers > gainersLosers.gainers ? 'Bearish' : 'Neutral'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Visualizations */}
            <div className="flex flex-col h-[300px] space-y-4">
              {/* Forecast Distribution Histogram */}
              <div className="h-[160px] flex flex-col">
                <span className="text-xs font-medium mb-5">Forecast Distribution</span>
                <div className="flex-1 flex items-end justify-center gap-1 min-h-0">
                  {returnDistribution.slice(0, 10).map((item, index) => (
                    <div key={index} className="flex flex-col items-center h-full justify-end">
                      <div 
                        className="w-3 rounded-t"
                        style={{ 
                          height: `${Math.min(Math.max(item.percentage * 4, 2), 75)}%`,
                          backgroundColor: item.bin >= 0 ? getUpColorHex() : getDownColorHex()
                        }}
                      />
                      <span className="text-xs mt-1 text-center w-8">
                        {item.bin >= 0 ? '+' : ''}{item.bin}%
                      </span>
                      <span className="text-xs text-muted-foreground w-8 text-center">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gainers vs Losers Line */}
              <div className="h-[100px] flex flex-col">
                <div className="flex-1 flex flex-col justify-center">
                  <div className="w-full bg-muted rounded-full h-2 flex overflow-hidden">
                    <div 
                      className="h-full" 
                      style={{ 
                        width: `${gainersLosers.total > 0 ? (gainersLosers.losers / gainersLosers.total) * 100 : 33.33}%`,
                        backgroundColor: getDownColorHex()
                      }}
                    />
                    <div 
                      className="bg-muted-foreground h-full" 
                      style={{ width: `${gainersLosers.total > 0 ? (gainersLosers.neutral / gainersLosers.total) * 100 : 33.33}%` }}
                    />
                    <div 
                      className="h-full" 
                      style={{ 
                        width: `${gainersLosers.total > 0 ? (gainersLosers.gainers / gainersLosers.total) * 100 : 33.33}%`,
                        backgroundColor: getUpColorHex()
                      }}
                    />
                  </div>
                  
                  {/* Labels positioned below the line */}
                  <div className="flex justify-between items-center mt-2 text-xs">
                    <div className="flex flex-col items-start">
                      <span className={`${getDownColor()} font-bold text-lg`}>{gainersLosers.losers}</span>
                      <span className={getDownColor()}>Bearish</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-muted-foreground font-bold text-lg">{gainersLosers.neutral}</span>
                      <span>Neutral</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`${getUpColor()} font-bold text-lg`}>{gainersLosers.gainers}</span>
                      <span className={getUpColor()}>Bullish</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Fuel Product Forecasts</CardTitle>
            <span className="text-sm text-muted-foreground">Updated at {current_day}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
              <TableCaption>Fuel Product Forecasts</TableCaption>
            <TableHeader>
              <TableRow>
                  <SortableHeader label="SYMBOL" sortKey="product" />
                  <SortableHeader label="PRICE" sortKey="currentValue" />
                  <SortableHeader label="1-D Pred" sortKey="price1" />
                  <SortableHeader label="1-D %Chg" sortKey="change1" />
                  <SortableHeader label="5-D Pred" sortKey="price5" />
                  <SortableHeader label="5-D %Chg" sortKey="change5" /> 
                  <SortableHeader label="10-D Pred" sortKey="price10" />
                  <SortableHeader label="10-D %Chg" sortKey="change10" />
                  <SortableHeader label="15-D Pred" sortKey="price15" />
                  <SortableHeader label="15-D %Chg" sortKey="change15" />
                  <SortableHeader label="20-D Pred" sortKey="price20" />
                  <SortableHeader label="20-D %Chg" sortKey="change20" />
                  <SortableHeader label="30-D Pred" sortKey="price30" />
                  <SortableHeader label="30-D %Chg" sortKey="change30" />
                  <SortableHeader label="60-D Pred" sortKey="price60" />
                  <SortableHeader label="60-D %Chg" sortKey="change60" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow
                  key={r.product}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/${r.product}`)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Star
                        className={`h-4 w-4 cursor-pointer ${
                          isFavorite(r.product) 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-muted-foreground hover:text-yellow-400'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(r.product);
                        }}
                      />
                      {r.product}
                    </div>
                  </TableCell>
                    <TableCell className="font-medium">${r.currentValue.toFixed(2)}</TableCell>
                    
                    {/* 1-DAY */}
                    <TableCell className={`text-right font-medium ${
                      r.price1 !== null ? (r.price1 >= r.currentValue ? getUpColor() : getDownColor()) : ''
                    }`}>
                      {r.price1 ? `$${formatPrice(r.price1)}` : '-'}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      r.change1 !== null ? (r.change1 >= 0 ? getUpColor() : getDownColor()) : ''
                    }`}>
                      {r.change1 !== null ? `${r.change1 >= 0 ? '+' : ''}${r.change1.toFixed(2)}%` : '-'}
                    </TableCell>
                    
                    {/* 5-DAY */}
                    <TableCell className={`text-right font-medium ${
                      r.price5 !== null ? (r.price5 >= r.currentValue ? getUpColor() : getDownColor()) : ''
                    }`}>
                      {r.price5 ? `$${formatPrice(r.price5)}` : '-'}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      r.change5 !== null ? (r.change5 >= 0 ? getUpColor() : getDownColor()) : ''
                    }`}>
                      {r.change5 !== null ? `${r.change5 >= 0 ? '+' : ''}${r.change5.toFixed(2)}%` : '-'}
                    </TableCell>
                    
                    {/* 10-DAY */}
                    <TableCell className={`text-right font-medium ${
                      r.price10 !== null ? (r.price10 >= r.currentValue ? getUpColor() : getDownColor()) : ''
                    }`}>
                      {r.price10 ? `$${formatPrice(r.price10)}` : '-'}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      r.change10 !== null ? (r.change10 >= 0 ? getUpColor() : getDownColor()) : ''
                    }`}>
                      {r.change10 !== null ? `${r.change10 >= 0 ? '+' : ''}${r.change10.toFixed(2)}%` : '-'}
                    </TableCell>
                    
                    {/* 15-DAY */}
                    <TableCell className={`text-right font-medium ${
                      r.price15 !== null ? (r.price15 >= r.currentValue ? getUpColor() : getDownColor()) : ''
                    }`}>
                      {r.price15 ? `$${formatPrice(r.price15)}` : '-'}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      r.change15 !== null ? (r.change15 >= 0 ? getUpColor() : getDownColor()) : ''
                    }`}>
                      {r.change15 !== null ? `${r.change15 >= 0 ? '+' : ''}${r.change15.toFixed(2)}%` : '-'}
                    </TableCell>
                    
                    {/* 20-DAY */}
                    <TableCell className={`text-right font-medium ${
                      r.price20 !== null ? (r.price20 >= r.currentValue ? getUpColor() : getDownColor()) : ''
                    }`}>
                      {r.price20 ? `$${formatPrice(r.price20)}` : '-'}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      r.change20 !== null ? (r.change20 >= 0 ? getUpColor() : getDownColor()) : ''
                    }`}>
                      {r.change20 !== null ? `${r.change20 >= 0 ? '+' : ''}${r.change20.toFixed(2)}%` : '-'}
                    </TableCell>
                    
                    {/* 30-DAY */}
                    <TableCell className={`text-right font-medium ${
                      r.price30 !== null ? (r.price30 >= r.currentValue ? getUpColor() : getDownColor()) : ''
                    }`}>
                      {r.price30 ? `$${formatPrice(r.price30)}` : '-'}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      r.change30 !== null ? (r.change30 >= 0 ? getUpColor() : getDownColor()) : ''
                    }`}>
                      {r.change30 !== null ? `${r.change30 >= 0 ? '+' : ''}${r.change30.toFixed(2)}%` : '-'}
                    </TableCell>
                    
                    {/* 60-DAY */}
                    <TableCell className={`text-right font-medium ${
                      r.price60 !== null ? (r.price60 >= r.currentValue ? getUpColor() : getDownColor()) : ''
                    }`}>
                      {r.price60 ? `$${formatPrice(r.price60)}` : '-'}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      r.change60 !== null ? (r.change60 >= 0 ? getUpColor() : getDownColor()) : ''
                    }`}>
                      {r.change60 !== null ? `${r.change60 >= 0 ? '+' : ''}${r.change60.toFixed(2)}%` : '-'}
                    </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForecastPage;