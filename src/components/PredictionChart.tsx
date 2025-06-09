import React, { useMemo } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Forecast, Accuracy } from '@/hooks/types';

interface PredictionChartProps {
  data: Forecast[];
  accuracy: Accuracy[];
  currentValue: number;
  currentDate: string;
}

const PredictionChart: React.FC<PredictionChartProps> = ({
  data,
  accuracy,
  currentValue,
  currentDate,
}) => {
  const chartData = useMemo(() => {
    if (data.length === 0) return [];

    // Sort forecasts by n_days_ahead
    const sortedForecasts = [...data].sort((a, b) => a.n_days_ahead - b.n_days_ahead);

    // Create chart data points
    const forecastPoints = sortedForecasts.map((forecast) => {
      // Use predicted_upper and predicted_lower from bootstrap confidence intervals
      let lowerBound = forecast.predicted_value;
      let upperBound = forecast.predicted_value;
      
      if (forecast.predicted_upper !== null && forecast.predicted_upper !== undefined &&
          forecast.predicted_lower !== null && forecast.predicted_lower !== undefined) {
        lowerBound = forecast.predicted_lower;
        upperBound = forecast.predicted_upper;
      } else {
        // Fallback to accuracy MAE if confidence intervals not available
        const acc = accuracy.find((a) => a.n_days_ahead === forecast.n_days_ahead);
        const confidenceValue = acc?.mae || 0;
        lowerBound = forecast.predicted_value - confidenceValue;
        upperBound = forecast.predicted_value + confidenceValue;
      }

      return {
        date: forecast.predicted_date,
        value: forecast.predicted_value,
        lowerBound,
        upperBound,
        confidenceWidth: upperBound - lowerBound, // Total width of confidence band
        min: lowerBound, // For area chart
        daysAhead: forecast.n_days_ahead,
      };
    });

    // Add current value as the starting point
    const currentPoint = {
      date: currentDate,
      value: currentValue,
      lowerBound: currentValue,
      upperBound: currentValue,
      confidenceWidth: 0,
      min: currentValue,
      daysAhead: 0,
    };

    // Combine and sort by date
    const allPoints = [currentPoint, ...forecastPoints];
    allPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return allPoints;
  }, [data, accuracy, currentValue, currentDate]);

  // Calculate Y-axis domain with confidence bands
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100];
    
    let minValue = Infinity;
    let maxValue = -Infinity;
    
    // Find the absolute minimum and maximum values across all confidence bands
    chartData.forEach(item => {
      minValue = Math.min(minValue, item.lowerBound);
      maxValue = Math.max(maxValue, item.upperBound);
    });
    
    // Add minimal padding (1.5% of the range) for visual breathing room
    const range = maxValue - minValue;
    const padding = range * 0.015; // 1.5% padding instead of 5%
    
    // Ensure we don't go below 0 if it doesn't make sense for prices
    const finalMin = Math.max(0, minValue - padding);
    const finalMax = maxValue + padding;
    
    return [finalMin, finalMax];
  }, [chartData]);
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{new Date(label).toLocaleDateString()}</p>
          <p className="text-blue-600">
            <span className="font-medium">Forecast: </span>
            ${data.value.toFixed(2)}
          </p>
          {data.daysAhead > 0 && (
            <>
              <p className="text-gray-600 text-sm">
                {data.daysAhead} days ahead
              </p>
              <p className="text-gray-500 text-sm">
                Range: ${data.lowerBound.toFixed(2)} - ${data.upperBound.toFixed(2)}
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <defs>
          <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3}/>
            <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.1}/>
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3}/>
          </linearGradient>
        </defs>
        
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        
        <XAxis 
          dataKey="date" 
          stroke="#6b7280" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false}
          interval="preserveStartEnd"
          tick={{ fontSize: 11 }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }}
        />
        
        <YAxis 
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          domain={yDomain}
          allowDataOverflow={true} 
          scale="auto" 
          tickCount={5}
          tickFormatter={(value) => `$${value.toFixed(0)}`}
        />
        
        <Tooltip content={<CustomTooltip />} />

        {/* Confidence band area (95% bootstrap confidence intervals) */}
        <Area 
          dataKey="lowerBound" 
          stackId="confidence"
          stroke="none" 
          fill="transparent" 
        />
        <Area 
          dataKey="confidenceWidth" 
          stackId="confidence"
          stroke="none" 
          fill="url(#confidenceBand)"
          name="Confidence Band"
        />

        {/* Main forecast line */}
        <Line 
          dataKey="value" 
          name="Forecast" 
          type="monotone" 
          strokeWidth={3} 
          stroke="#f59e0b" 
          dot={{ 
            r: 4, 
            fill: '#f59e0b', 
            strokeWidth: 2, 
            stroke: '#ffffff' 
          }}
          activeDot={{ 
            r: 6, 
            fill: '#f59e0b', 
            strokeWidth: 2, 
            stroke: '#ffffff' 
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default PredictionChart;