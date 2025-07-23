import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getForecast, getUniqueProducts } from '@/api';
import type { Forecast } from '@/hooks/types';

const BunkerPage = () => {
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [fuelProducts, setFuelProducts] = useState<string[]>([]);
  const [forecastData, setForecastData] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const currentDate = '2025-01-08';

  // Load available fuel products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const products = await getUniqueProducts();
        setFuelProducts(products);
        if (products.length > 0) {
          setSelectedProduct(products[0]);
        }
      } catch (err) {
        setError('Failed to load fuel products');
        console.error('Error loading products:', err);
      }
    };
    loadProducts();
  }, []);

  // Load forecast data when product changes
  useEffect(() => {
    if (!selectedProduct) return;
    
    const loadForecastData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get forecast data for the next 60 days starting from 2025-01-08
        const allData: Forecast[] = [];
        
        // Fetch data for each day ahead (1 to 60 days from current date)
        for (let daysAhead = 1; daysAhead <= 60; daysAhead++) {
          try {
            const data = await getForecast(
              selectedProduct, 
              daysAhead, // n_days_ahead
              currentDate // current_date (2025-01-08)
            );
            allData.push(...data);
          } catch (err) {
            console.warn(`Failed to fetch data for ${daysAhead} days ahead:`, err);
          }
        }
        
        setForecastData(allData);
      } catch (err) {
        setError('Failed to load forecast data');
        console.error('Error loading forecast:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadForecastData();
  }, [selectedProduct, currentDate]);

  // Process forecast data for table display
  const processDataForTable = () => {
    if (!forecastData.length) return { scheduleData: [], pricingData: [], dateColumns: [] };

    // Create date columns based on available forecast dates (follow forecast data)
    const availableForecastDates = [...new Set(forecastData.map(f => f.predicted_date))].sort();
    const dateColumns = availableForecastDates.slice(0, 30).map(dateString => {
      const date = new Date(dateString);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weekday = weekdays[date.getDay()];
      return {
        date: `${month}-${day}`,
        weekday: weekday,
        fullDate: dateString
      };
    });

    // Group forecast data by n_days_ahead
    const groupedByDays = forecastData.reduce((acc, forecast) => {
      if (!acc[forecast.n_days_ahead]) {
        acc[forecast.n_days_ahead] = [];
      }
      acc[forecast.n_days_ahead].push(forecast);
      return acc;
    }, {} as Record<number, Forecast[]>);

    // Create continuous date range for rows (every day from current date)
    const maxDaysAhead = Math.max(...forecastData.map(f => f.n_days_ahead));
    const maxEntries = Math.min(20, maxDaysAhead); // Show up to 20 entries
    
    // Helper function to check if a date is a weekend
    const isWeekend = (date: Date) => {
      const day = date.getDay();
      return day === 0 || day === 6; // Sunday = 0, Saturday = 6
    };



    // Generate continuous schedule data
    const scheduleData = Array.from({ length: maxEntries }, (_, index) => {
      const dayNumber = index + 1; // Days ahead starting from 1
      
      // Calculate ETA date (continuous sequence, including weekends)
      // ETA starts from current date + 13: 1-21, 1-22, 1-23, 1-24, 1-25...
      const etaDate = new Date(currentDate);
      etaDate.setDate(etaDate.getDate() + 12 + dayNumber); // 13, 14, 15, 16...
      const etaDateString = etaDate.toISOString().split('T')[0];
      
      // Calculate DON date (starts from 1-09, skip weekends)
      // DON sequence: 1-09, 1-10, 1-13, 1-14, 1-15, 1-16, 1-17...
      let donDate = new Date(currentDate);
      donDate.setDate(donDate.getDate() + 1); // Start from 1-09 (current date + 1)
      
      // Add working days based on index (skip weekends)
      let workingDaysAdded = 0;
      while (workingDaysAdded < index) {
        donDate.setDate(donDate.getDate() + 1);
        if (!isWeekend(donDate)) {
          workingDaysAdded++;
        }
      }
      const donDateString = donDate.toISOString().split('T')[0];
      
      return {
        eta: etaDateString,
        don: donDateString,
        status: 'Pending', // Will be updated later
        entry: `Entry ${dayNumber}`,
        daysAhead: dayNumber
      };
    });

    // Create a price lookup for each forecast date (each column has the same price for all rows)
    const forecastPrices = dateColumns.reduce((acc, column) => {
      const forecastDateString = column.fullDate;
      const forecastsForDate = forecastData.filter(f => f.predicted_date === forecastDateString);
      if (forecastsForDate.length > 0) {
        // Use the average price if multiple forecasts exist for the same date
        const avgPrice = forecastsForDate.reduce((sum, f) => sum + f.predicted_value, 0) / forecastsForDate.length;
        acc[forecastDateString] = avgPrice;
      }
      return acc;
    }, {} as Record<string, number>);

    // Create pricing data for continuous date range
    const pricingData = scheduleData.map(scheduleItem => {
      const donDateString = scheduleItem.don;
      
      // Create price data for each forecast date column
      const prices = dateColumns.map(column => {
        const forecastDateString = column.fullDate;
        // Check if this forecast date is within the procurement window (5 days starting from DON)
        const donDate = new Date(donDateString);
        const forecastDate = new Date(forecastDateString);
        const daysDifference = Math.floor(
          (forecastDate.getTime() - donDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        // Only show prices if within procurement window (DON + 7 days)
        if (daysDifference >= 0 && daysDifference <= 7) {
          return forecastPrices[forecastDateString] || null;
        }
        
        return null; // Outside procurement window - will be rendered as gray
      });
      
      return {
        eta: scheduleItem.eta,
        don: donDateString,
        entry: scheduleItem.entry,
        prices,
        daysAhead: scheduleItem.daysAhead
      };
    });

    // Now update schedule data status based on DON window prices
    const donWindowPrices = pricingData
      .flatMap(row => row.prices)
      .filter(p => p !== null) as number[];
    
    const avgDonPrice = donWindowPrices.length > 0 
      ? donWindowPrices.reduce((sum, p) => sum + p, 0) / donWindowPrices.length 
      : 0;
    
    // Find the globally optimal DON window(s)
    const donWindowAnalysis = pricingData.map((row, index) => {
      const rowPrices = row.prices.filter(p => p !== null) as number[];
      const minRowPrice = rowPrices.length > 0 ? Math.min(...rowPrices) : Infinity;
      const avgRowPrice = rowPrices.length > 0 
        ? rowPrices.reduce((sum, p) => sum + p, 0) / rowPrices.length 
        : Infinity;
      
      return {
        index,
        minPrice: minRowPrice,
        avgPrice: avgRowPrice,
        hasPrices: rowPrices.length > 0
      };
    }).filter(analysis => analysis.hasPrices);
    
    // Find the absolute best DON window (lowest minimum price)
    const globalMinPrice = Math.min(...donWindowAnalysis.map(a => a.minPrice));
    
    // Only mark the DON window(s) with the globally optimal price as "Nominate"
    // Allow a small tolerance (within 1% of the global minimum)
    const tolerance = globalMinPrice * 0.01;
    const optimalThreshold = globalMinPrice + tolerance;
    
    const updatedScheduleData = scheduleData.map((item, index) => {
      if (index < pricingData.length) {
        const analysis = donWindowAnalysis.find(a => a.index === index);
        
        if (analysis && analysis.minPrice <= optimalThreshold) {
          return {
            ...item,
            status: 'Nominate'
          };
        }
      }
      return { ...item, status: 'Waiting' };
    });

    return { scheduleData: updatedScheduleData, pricingData, dateColumns };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Nominate':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Waiting':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Algorithm to determine optimal bunker procurement strategy with color coding
  const getBunkerStrategy = (price: number | null, rowPrices: (number | null)[], colIndex: number, allPricingData: any[]) => {
    // Gray: Outside procurement window (null price)
    if (price === null) {
      return { strategy: 'nan', bgColor: 'bg-gray-100', textColor: 'text-gray-400' };
    }
    
    // Find the minimum price in this row's procurement window
    const validRowPrices = rowPrices.filter(p => p !== null) as number[];
    if (validRowPrices.length === 0) {
      return { strategy: 'wait', bgColor: 'bg-white', textColor: 'text-gray-900' };
    }
    
    const rowMinPrice = Math.min(...validRowPrices);
    
    // Color logic: only the lowest price in each row gets green
    if (price === rowMinPrice) {
      // Green: Best price in this row's procurement window
      return { 
        strategy: 'nominate', 
        bgColor: 'bg-green-100 border-green-200', 
        textColor: 'text-green-800 font-semibold' 
      };
    } else {
      // Red: Within procurement window but not the best price for this row
      return { 
        strategy: 'waiting', 
        bgColor: 'bg-red-100 border-red-200', 
        textColor: 'text-red-800 font-semibold' 
      };
    }
  };

  const { scheduleData, pricingData, dateColumns } = processDataForTable();

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Control Panel Skeleton */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-64" />
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-16" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Dashboard Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Summary Table Skeleton */}
          <div className="xl:col-span-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-12 w-full" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-y-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50 z-10">
                      <tr className="bg-gray-50">
                        <th className="text-left p-3">
                          <Skeleton className="h-4 w-8" />
                        </th>
                        <th className="text-left p-3">
                          <Skeleton className="h-4 w-8" />
                        </th>
                        <th className="text-left p-3">
                          <Skeleton className="h-4 w-12" />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 15 }).map((_, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-3">
                            <Skeleton className="h-4 w-20" />
                          </td>
                          <td className="p-3">
                            <Skeleton className="h-4 w-20" />
                          </td>
                          <td className="p-3">
                            <Skeleton className="h-5 w-16 rounded-full" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-gray-50 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <div className="mt-3 p-2 bg-blue-50 rounded space-y-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details Table Skeleton */}
          <div className="xl:col-span-8">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-36" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-2 sticky left-0 bg-gray-50 z-20 min-w-24 border-r">
                          <Skeleton className="h-4 w-8" />
                        </th>
                        <th className="text-left p-2 sticky left-24 bg-gray-50 z-20 min-w-24 border-r">
                          <Skeleton className="h-4 w-8" />
                        </th>
                        {Array.from({ length: 16 }).map((_, i) => (
                          <th key={i} className="text-center p-2 min-w-16">
                            <Skeleton className="h-3 w-6 mx-auto mb-1" />
                            <Skeleton className="h-3 w-8 mx-auto" />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 8 }).map((_, rowIndex) => (
                        <tr key={rowIndex} className="border-b">
                          <td className="p-2 sticky left-0 bg-white z-20 border-r min-w-24">
                            <Skeleton className="h-4 w-20" />
                          </td>
                          <td className="p-2 sticky left-24 bg-white z-20 border-r min-w-24">
                            <Skeleton className="h-4 w-20" />
                          </td>
                          {Array.from({ length: 16 }).map((_, colIndex) => (
                            <td key={colIndex} className="text-center p-2 min-w-16">
                              <Skeleton className="h-4 w-12 mx-auto" />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-red-600">
              <div className="text-lg">{error}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#4670bc]">Bunker Procurement Optimization</h1>
              <Badge variant="outline" className="text-sm bg-[#4670bc] text-white border-[#4670bc]">
                {currentDate}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 font-medium">Fuel Products:</span>
              {fuelProducts.map((product) => (
                <Badge 
                  key={product} 
                  variant={selectedProduct === product ? "default" : "outline"} 
                  className={`text-xs cursor-pointer transition-colors ${
                    selectedProduct === product 
                      ? 'bg-[#4670bc] hover:bg-[#4670bc]/90 text-white' 
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedProduct(product)}
                >
                  {product}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Bunker Summary Table */}
        <div className="xl:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#4670bc] text-lg flex items-center gap-2">
                Procurement Recommendation
                <Badge className="bg-[#61adde] text-white">
                  {selectedProduct}
                </Badge>
              </CardTitle>
              <div className="text-center bg-[#4670bc] text-white py-2 rounded font-bold text-lg">
                Current Date: {currentDate}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-y-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 z-10">
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 font-semibold text-[#4670bc]">ETA</th>
                      <th className="text-left p-3 font-semibold text-[#4670bc]">DON</th>
                      <th className="text-left p-3 font-semibold text-[#4670bc]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleData.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3">{item.eta}</td>
                        <td className="p-3">{item.don}</td>
                        <td className="p-3">
                          <Badge className={`${getStatusColor(item.status)} text-xs px-2 py-1`}>
                            {item.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Status Legend */}
              <div className="p-4 bg-gray-50 text-xs">
                <div className="text-[#4670bc] font-semibold mb-2">Bunker Strategy Legend:</div>
                <div className="space-y-1">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-100 border-green-200 border mr-2 rounded"></div>
                    <span className="font-medium text-green-700 mr-2">Nominate:</span>
                    <span>Optimal pricing - recommended procurement date</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-100 border-red-200 border mr-2 rounded"></div>
                    <span className="font-medium text-red-700 mr-2">Waiting:</span>
                    <span>High price or rising trend - postpone procurement decision</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bunker Details Table */}
        <div className="xl:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#4670bc] text-lg flex items-center gap-2">
                Strategy Details
                <Badge className="bg-[#61adde] text-white">
                  {selectedProduct}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-2 font-semibold text-[#4670bc] sticky left-0 bg-gray-50 z-20 min-w-24 border-r">ETA</th>
                      <th className="text-left p-2 font-semibold text-[#4670bc] sticky left-24 bg-gray-50 z-20 min-w-24 border-r">DON</th>
                      {dateColumns.map((column) => (
                        <th key={column.fullDate} className="text-center p-2 font-semibold text-[#4670bc] min-w-16">
                          <div>{column.date}</div>
                          <div className="text-xs text-gray-500">{column.weekday}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pricingData.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b hover:bg-gray-50">
                        <td className="p-2 sticky left-0 bg-white z-20 border-r min-w-24 shadow-sm">{row.eta}</td>
                        <td className="p-2 sticky left-24 bg-white z-20 border-r min-w-24 shadow-sm">{row.don}</td>
                        {row.prices.map((price, priceIndex) => {
                          const strategy = getBunkerStrategy(price, row.prices, priceIndex, pricingData);
                          return (
                            <td 
                              key={priceIndex} 
                              className={`text-center p-2 min-w-16 border ${strategy.bgColor} ${strategy.textColor}`}
                            >
                              {price ? price.toFixed(2) : 'nan'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BunkerPage;