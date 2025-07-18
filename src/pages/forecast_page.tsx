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
import { useOilIndices } from "@/hooks/use-oil-indices";
import { useMemo, useState } from "react";
import type { Forecast } from "@/hooks/types";

import OilIndicesChart from "@/components/OilIndicesChart";

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

  // Fetch oil indices data for the last 6 months
  const sixMonthsAgo = new Date(current_day);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const {
    data: oilIndicesData = [],
    isLoading: isOilIndicesLoading,
    isError: isOilIndicesError,
    error: oilIndicesError,
  } = useOilIndices({
    start_date: sixMonthsAgo.toISOString().split('T')[0],
    end_date: current_day,
    limit: 500
  });

  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { getUpColor, getDownColor, getUpColorHex, getDownColorHex } = useColorPreferences();

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

  // Calculate Forecast Average Changes Time Series for visualization
  const forecastTimeSeries = useMemo(() => {
    if (!latestForecasts || latestForecasts.length === 0) return [];

    // Group forecasts by predicted_date and calculate average changes
    const dataByDate: Record<string, { changes: number[], products: string[] }> = {};
    
    latestForecasts.forEach(forecast => {
      const changePercent = ((forecast.predicted_value - forecast.current_value) / forecast.current_value) * 100;
      
      if (!dataByDate[forecast.predicted_date]) {
        dataByDate[forecast.predicted_date] = { changes: [], products: [] };
      }
      dataByDate[forecast.predicted_date].changes.push(changePercent);
      dataByDate[forecast.predicted_date].products.push(forecast.product);
    });

    // Sort dates and create time series data
    const sortedDates = Object.keys(dataByDate).sort();
    const timeSeriesData: { date: string, avgChange: number, productCount: number }[] = [];
    
    sortedDates.forEach(date => {
      const data = dataByDate[date];
      if (data.changes.length > 0) {
        const avgChange = data.changes.reduce((sum, change) => sum + change, 0) / data.changes.length;
        timeSeriesData.push({
          date,
          avgChange,
          productCount: data.products.length
        });
      }
    });

    return timeSeriesData;
  }, [latestForecasts]);

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
          <div className="flex items-center gap-4">
            <CardTitle>Summary</CardTitle>
            <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-blue-800">Latest Update:</span>
                <span className="text-sm font-bold text-blue-900">{current_day}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Controls and Stats */}
            <div className="space-y-4">
              


              {/* Forecast Average Change Time Series */}
              <div className="h-[280px] flex flex-col">
                <span className="text-xs font-medium mb-3">Forecast Average Change (%)</span>
                {forecastTimeSeries.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <span className="text-xs">No forecast data available</span>
                  </div>
                ) : (
                  <div className="flex-1 flex min-h-0">
                    {/* Y-axis */}
                    <div className="w-12 flex flex-col justify-between text-right pr-1">
                      {(() => {
                        const changes = forecastTimeSeries.map(d => d.avgChange);
                        const maxChange = Math.max(...changes);
                        const minChange = Math.min(...changes);
                        const range = Math.max(Math.abs(maxChange), Math.abs(minChange));
                        const yAxisLabels = [];
                        const steps = 4;
                        for (let i = 0; i <= steps; i++) {
                          const value = range - (2 * range * i) / steps;
                          yAxisLabels.push(
                            <span key={i} className="text-xs text-muted-foreground" style={{ fontSize: '9px' }}>
                              {value >= 0 ? '+' : ''}{value.toFixed(1)}%
                            </span>
                          );
                        }
                        return yAxisLabels;
                      })()}
                    </div>
                    
                    {/* Chart area with grid */}
                    <div className="flex-1 relative">
                      {/* Grid lines */}
                      <div className="absolute inset-0">
                        {(() => {
                          const gridLines = [];
                          const steps = 4;
                          for (let i = 0; i <= steps; i++) {
                            gridLines.push(
                              <div
                                key={i}
                                className="absolute w-full border-t border-gray-200"
                                style={{ top: `${(i / steps) * 100}%` }}
                              />
                            );
                          }
                          return gridLines;
                        })()}
                        {/* Zero line */}
                        <div 
                          className="absolute w-full border-t border-gray-400"
                          style={{ top: '50%' }}
                        />
                      </div>
                      
                      {/* Time series line */}
                      <div className="absolute inset-0">
                        <svg className="w-full h-full">
                          <polyline
                            fill="none"
                            stroke="rgb(59, 130, 246)"
                            strokeWidth="1.5"
                            points={forecastTimeSeries.map((item, index) => {
                              const changes = forecastTimeSeries.map(d => d.avgChange);
                              const maxChange = Math.max(...changes);
                              const minChange = Math.min(...changes);
                              const range = Math.max(Math.abs(maxChange), Math.abs(minChange));
                              
                              const x = (index / (forecastTimeSeries.length - 1)) * 100;
                              const normalizedY = range > 0 ? ((range - item.avgChange) / (2 * range)) * 100 : 50;
                              const y = Math.max(0, Math.min(100, normalizedY));
                              
                              return `${x}%,${y}%`;
                            }).join(' ')}
                          />
                          {/* Data points */}
                          {forecastTimeSeries.map((item, index) => {
                            const changes = forecastTimeSeries.map(d => d.avgChange);
                            const maxChange = Math.max(...changes);
                            const minChange = Math.min(...changes);
                            const range = Math.max(Math.abs(maxChange), Math.abs(minChange));
                            
                            const x = (index / (forecastTimeSeries.length - 1)) * 100;
                            const normalizedY = range > 0 ? ((range - item.avgChange) / (2 * range)) * 100 : 50;
                            const y = Math.max(0, Math.min(100, normalizedY));
                            
                            return (
                              <circle
                                key={index}
                                cx={`${x}%`}
                                cy={`${y}%`}
                                r="2"
                                fill={item.avgChange >= 0 ? getUpColorHex() : getDownColorHex()}
                                stroke="white"
                                strokeWidth="1"
                              />
                            );
                          })}
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* X-axis labels - Show dates */}
                {forecastTimeSeries.length > 0 && (
                  <div className="flex ml-12 mt-1">
                    {forecastTimeSeries.map((item, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <span className="text-xs text-center" style={{ fontSize: '8px' }}>
                          {index % Math.max(1, Math.floor(forecastTimeSeries.length / 5)) === 0 ? 
                            new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 
                            ''
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Visualizations */}
            <div className="flex flex-col space-y-4">
              {/* Oil Indices Chart */}
              <div className="flex flex-col">
                <span className="text-xs font-medium mb-3">Oil Indices</span>
                {isOilIndicesLoading ? (
                  <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                    <span className="text-xs">Loading...</span>
                  </div>
                ) : isOilIndicesError ? (
                  <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <span className="text-xs">Error loading oil indices data</span>
                      <br />
                      <span className="text-xs text-red-500">{oilIndicesError?.message}</span>
                    </div>
                  </div>
                ) : oilIndicesData.length === 0 ? (
                  <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <span className="text-xs">No oil indices data available</span>
                      <br />
                      <span className="text-xs">Date range: {sixMonthsAgo.toISOString().split('T')[0]} to {current_day}</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <OilIndicesChart 
                      data={oilIndicesData}
                      title=""
                      height={280}
                    />
                  </div>
                )}
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
                  <SortableHeader label="1-Day forecast" sortKey="price1" />
                  <SortableHeader label="1-Day %Chg" sortKey="change1" />
                  <SortableHeader label="5-Day forecast" sortKey="price5" />
                  <SortableHeader label="5-Day %Chg" sortKey="change5" /> 
                  <SortableHeader label="10-Day forecast" sortKey="price10" />
                  <SortableHeader label="10-Day %Chg" sortKey="change10" />
                  <SortableHeader label="15-Day forecast" sortKey="price15" />
                  <SortableHeader label="15-Day %Chg" sortKey="change15" />
                  <SortableHeader label="20-Day forecast" sortKey="price20" />
                  <SortableHeader label="20-Day %Chg" sortKey="change20" />
                  <SortableHeader label="30-Day forecast" sortKey="price30" />
                  <SortableHeader label="30-Day %Chg" sortKey="change30" />
                  <SortableHeader label="60-Day forecast" sortKey="price60" />
                  <SortableHeader label="60-Day %Chg" sortKey="change60" />
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