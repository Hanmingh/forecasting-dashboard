import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useForm, useWatch } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { addDays, format } from "date-fns"
import { CalendarIcon, Loader2, Target, Award } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import type { DateRange } from "react-day-picker"
import { useUniqueProducts, useProductDateRange, useForecast, useAccuracy } from "@/hooks/use-forecasts"
import { useEffect, useState, useMemo } from "react"
import HistoryChart from "@/components/HistoryChart"

interface FormValues {
  product: string
  dateRange: DateRange
  forecastDays: number
}

const HistoryPage = () => {
  const [appliedFilters, setAppliedFilters] = useState<FormValues | null>(null)
  
  const form = useForm<FormValues>({
    defaultValues: {
      product: "",
      dateRange: {
        from: new Date(2022, 0, 20),
        to: addDays(new Date(2022, 0, 20), 20),
      },
      forecastDays: 1, // Default to 1 day ahead
    },
  })

  // Watch all form values
  const formValues = useWatch({
    control: form.control
  }) as FormValues;

  // Watch the selected product to update date range
  const selectedProduct = formValues?.product || "";

  // Auto-apply filters when values change
  useEffect(() => {
    if (!formValues?.product || !formValues?.dateRange?.from || !formValues?.dateRange?.to) {
      return;
    }
    
    setAppliedFilters({
      product: formValues.product,
      dateRange: formValues.dateRange,
      forecastDays: formValues.forecastDays
    });
  }, [formValues]);

  // Fetch unique products
  const {
    data: products = [],
    isLoading: isProductsLoading,
  } = useUniqueProducts()

  // Fetch date range for selected product
  const {
    data: dateRange,
    isLoading: isDateRangeLoading,
  } = useProductDateRange(selectedProduct)

  // Update form date range when product date range is loaded
  useEffect(() => {
    if (dateRange && selectedProduct) {
      const earliestDate = new Date(dateRange.earliest_date)
      const latestDate = new Date(dateRange.latest_date)
      
      form.setValue("dateRange", {
        from: earliestDate,
        to: latestDate,
      })
    }
  }, [dateRange, selectedProduct, form])

  // Fetch filtered forecast data
  const {
    data: historyData = [],
    isLoading: isHistoryLoading,
  } = useForecast(
    appliedFilters ? {
      product: appliedFilters.product,
      n_days_ahead: appliedFilters.forecastDays,
      // Note: We'll filter by date range on the frontend for now
      // since the backend doesn't have date range filtering yet
    } : {},
    {
      enabled: !!appliedFilters, // Only fetch when filters are applied
    } as any
  )

  // Fetch accuracy data
  const {
    data: accuracyData = [],
    isLoading: isAccuracyLoading,
  } = useAccuracy(
    appliedFilters?.product,
    appliedFilters?.forecastDays,
    {
      enabled: !!appliedFilters, // Only fetch when filters are applied
    } as any
  )

  // Filter data by date range on frontend
  const filteredHistoryData = useMemo(() => {
    if (!appliedFilters || !historyData.length) return historyData;
    
    const { dateRange } = appliedFilters;
    if (!dateRange.from || !dateRange.to) return historyData;
    
    return historyData.filter(forecast => {
      const currentDate = new Date(forecast.current_date);
      return currentDate >= dateRange.from! && currentDate <= dateRange.to!;
    });
  }, [historyData, appliedFilters]);

  // Calculate performance metrics from filtered historical data
  const performanceMetrics = useMemo(() => {
    if (!filteredHistoryData.length) return null;
    
    const totalForecasts = filteredHistoryData.length;
    
    // Calculate exact matches using MAPE < 1% criteria
    const exactMatches = filteredHistoryData.filter(forecast => {
      const mape = Math.abs(forecast.predicted_value - forecast.current_value) / forecast.current_value * 100;
      return mape < 1;
    }).length;

    // For confidence interval coverage
    const withinConfidenceBand = filteredHistoryData.filter(forecast => {
      if (!forecast.predicted_lower || !forecast.predicted_upper) return false;
      return forecast.current_value >= forecast.predicted_lower && 
             forecast.current_value <= forecast.predicted_upper;
    }).length;

    const hasConfidenceIntervals = filteredHistoryData.some(f => 
      f.predicted_lower !== null && f.predicted_upper !== null
    );

    return {
      totalForecasts,
      exactMatches,
      exactMatchRate: (exactMatches / totalForecasts * 100),
      withinConfidenceBand: hasConfidenceIntervals ? withinConfidenceBand : null,
      confidenceCoverage: hasConfidenceIntervals ? (withinConfidenceBand / totalForecasts * 100) : null,
      hasConfidenceIntervals
    };
  }, [filteredHistoryData]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Filter Options</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4">
              <div className="flex flex-wrap gap-6 items-end">
                {/* product select field */}
                <FormField
                  control={form.control}
                  name="product"
                  render={({ field }) => (
                    <FormItem className="flex-1 min-w-[200px]">
                      <FormLabel>Product</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isProductsLoading}>
                          <SelectTrigger>
                            <SelectValue placeholder={isProductsLoading ? "Loading..." : "Select product"} />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product} value={product}>
                                {product}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* date range picker field */}
                <FormField
                  control={form.control}
                  name="dateRange"
                  render={({ field }) => (
                    <FormItem className="flex-1 min-w-[280px]">
                      <FormLabel>Time Range</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              disabled={!selectedProduct || isDateRangeLoading}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value.from && "text-muted-foreground"
                              )}
                            >
                              {isDateRangeLoading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Loading...
                                </>
                              ) : (
                                <>
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value.from ? (
                                    field.value.to ? (
                                      <>
                                        {format(field.value.from, "MMM dd, y")} - {format(field.value.to, "MMM dd, y")}
                                      </>
                                    ) : (
                                      format(field.value.from, "MMM dd, y")
                                    )
                                  ) : !selectedProduct ? (
                                    <span>Select product first</span>
                                  ) : (
                                    <span>Select date range</span>
                                  )}
                                </>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="range"
                              selected={field.value}
                              onSelect={field.onChange}
                              numberOfMonths={2}
                              disabled={!selectedProduct}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* forecast days slider */}
                <FormField
                  control={form.control}
                  name="forecastDays"
                  render={({ field }) => (
                    <FormItem className="flex-1 min-w-[250px]">
                      <FormLabel>Forecast Days ({field.value} days ahead)</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Slider
                            value={[field.value]}
                            onValueChange={(values) => field.onChange(values[0])}
                            max={60}
                            min={1}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>1 day</span>
                            <span>60 days</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Additional info row */}
              {dateRange && selectedProduct && (
                <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded mt-4">
                  Available data: {format(new Date(dateRange.earliest_date), "MMM dd, y")} - {format(new Date(dateRange.latest_date), "MMM dd, y")}
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* History Data Display */}
      {appliedFilters && (
        <Card>
          <CardHeader>
            <CardTitle>
              Forecast History for {appliedFilters.product}
            </CardTitle>
            <div className="text-sm text-gray-600">
              <p>
                <strong>Total Records:</strong> {filteredHistoryData.length} forecasts
              </p>
              {historyData.length > filteredHistoryData.length && (
                <p className="text-xs text-amber-600">
                  ({historyData.length - filteredHistoryData.length} records filtered out by date range)
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isHistoryLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading forecast history...</span>
              </div>
            ) : filteredHistoryData.length > 0 ? (
              <div className="space-y-6">
                {isAccuracyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading performance metrics...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* MAE */}
                    {accuracyData.length > 0 && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4 text-blue-600" />
                          <h4 className="font-semibold text-blue-900">MAE</h4>
                        </div>
                        <p className="text-2xl font-bold text-blue-700">
                          ${accuracyData[0]?.mae?.toFixed(2) || 'N/A'}
                        </p>
                        <p className="text-xs text-blue-600">Mean Absolute Error</p>
                      </div>
                    )}

                    {/* MAPE */}
                    {accuracyData.length > 0 && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4 text-green-600" />
                          <h4 className="font-semibold text-green-900">MAPE</h4>
                        </div>
                        <p className="text-2xl font-bold text-green-700">
                          {accuracyData[0]?.mape?.toFixed(2) || 'N/A'}%
                        </p>
                        <p className="text-xs text-green-600">Mean Absolute Percentage Error</p>
                      </div>
                    )}

                    {/* Exact Matches (MAPE < 1%) */}
                    {performanceMetrics && (
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4 text-purple-600" />
                          <h4 className="font-semibold text-purple-900">High Accuracy</h4>
                        </div>
                        <p className="text-2xl font-bold text-purple-700">
                          {performanceMetrics.exactMatches}/{performanceMetrics.totalForecasts}
                        </p>
                        <div className="space-y-1">
                          <p className="text-xs text-purple-600">
                            {performanceMetrics.exactMatchRate.toFixed(1)}% Accuracy
                          </p>
                          <p className="text-[10px] text-purple-500">
                            (Forecasts with MAPE under 1%)
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Confidence Band Coverage */}
                    {performanceMetrics && performanceMetrics.hasConfidenceIntervals && (
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4 text-orange-600" />
                          <h4 className="font-semibold text-orange-900">Coverage</h4>
                        </div>
                        <p className="text-2xl font-bold text-orange-700">
                          {performanceMetrics.withinConfidenceBand}/{performanceMetrics.totalForecasts}
                        </p>
                        <p className="text-xs text-orange-600">
                          {performanceMetrics.confidenceCoverage?.toFixed(1)}% within confidence band
                        </p>
                      </div>
                    )}

                    {/* No confidence intervals message */}
                    {performanceMetrics && !performanceMetrics.hasConfidenceIntervals && (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4 text-gray-600" />
                          <h4 className="font-semibold text-gray-900">Coverage</h4>
                        </div>
                        <p className="text-sm text-gray-700">N/A</p>
                        <p className="text-xs text-gray-600">No confidence intervals available</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* History Chart */}
                <div className="bg-white">
                  <HistoryChart 
                    data={filteredHistoryData}
                    title={`${appliedFilters.product} - ${appliedFilters.forecastDays} Days Ahead Forecast History`}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No forecast data found for the selected criteria.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default HistoryPage