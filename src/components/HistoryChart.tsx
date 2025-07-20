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
  Legend,
} from 'recharts';
import { Forecast } from '@/hooks/types';

interface HistoryChartProps {
  data: Forecast[];
  title?: string;
}

const HistoryChart: React.FC<HistoryChartProps> = ({
  data,
}) => {
  const chartData = useMemo(() => {
    if (data.length === 0) return [];

    // Group forecasts by current_date (when the forecast was made)
    const forecastsByCurrentDate = data.reduce((acc, forecast) => {
      const currentDate = forecast.current_date;
      if (!acc[currentDate]) {
        acc[currentDate] = [];
      }
      acc[currentDate].push(forecast);
      return acc;
    }, {} as Record<string, Forecast[]>);

    // For each current_date, create chart points showing the forecast vs actual
    const chartPoints: any[] = [];

    Object.keys(forecastsByCurrentDate).forEach(currentDate => {
      const forecasts = forecastsByCurrentDate[currentDate];
      
      forecasts.forEach(forecast => {
        // For historical data, we can compare predicted_value vs current_value
        // The current_value represents the actual value that was observed
        const forecastDate = forecast.predicted_date;
        const predictedValue = forecast.predicted_value;
        const actualValue = forecast.current_value; // This is the actual observed value
        
        // Calculate confidence bounds
        let lowerBound = predictedValue;
        let upperBound = predictedValue;
        
        if (forecast.predicted_upper !== null && forecast.predicted_upper !== undefined &&
            forecast.predicted_lower !== null && forecast.predicted_lower !== undefined) {
          lowerBound = forecast.predicted_lower;
          upperBound = forecast.predicted_upper;
        }

        chartPoints.push({
          forecastDate: forecastDate,
          currentDate: currentDate,
          predicted: predictedValue,
          actual: actualValue,
          lowerBound,
          upperBound,
          confidenceWidth: upperBound - lowerBound,
          error: Math.abs(predictedValue - actualValue),
          errorPercent: actualValue !== 0 ? Math.abs((predictedValue - actualValue) / actualValue) * 100 : 0,
          daysAhead: forecast.n_days_ahead,
          // For display purposes, use predicted_date as main date
          date: forecastDate,
        });
      });
    });

    // Sort by forecast date
    chartPoints.sort((a, b) => new Date(a.forecastDate).getTime() - new Date(b.forecastDate).getTime());

    return chartPoints;
  }, [data]);

  // Calculate Y-axis domain
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100];
    
    let minValue = Infinity;
    let maxValue = -Infinity;
    
    chartData.forEach(item => {
      minValue = Math.min(minValue, item.actual, item.lowerBound);
      maxValue = Math.max(maxValue, item.actual, item.upperBound);
    });
    
    const range = maxValue - minValue;
    const padding = range * 0.05; // 5% padding
    
    const finalMin = Math.max(0, minValue - padding);
    const finalMax = maxValue + padding;
    
    return [finalMin, finalMax];
  }, [chartData]);
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const accuracy = ((1 - data.errorPercent / 100) * 100).toFixed(1);
      
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{new Date(label).toLocaleDateString()}</p>
          <div className="space-y-1">
            <p className="text-green-600">
              <span className="font-medium">Predicted: </span>
              ${data.predicted.toFixed(2)}
            </p>
            <p className="text-amber-600">
              <span className="font-medium">Actual: </span>
              ${data.actual.toFixed(2)}
            </p>
            <p className="text-gray-600 text-sm">
              Error: ${data.error.toFixed(2)} ({data.errorPercent.toFixed(1)}%)
            </p>
            <p className="text-gray-600 text-sm">
              Accuracy: {accuracy}%
            </p>
            <p className="text-gray-500 text-sm">
              Forecasted on: {new Date(data.currentDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={500}>
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="historyConfidenceBand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2}/>
              <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.1}/>
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.2}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          
          <XAxis 
            dataKey="date" 
            stroke="#6b7280" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => {
              const date = new Date(value);
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              return `${month}/${year}`;
            }}
          />
          
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            allowDataOverflow={true} 
            scale="auto" 
            domain={yDomain}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
          />
          
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {/* Confidence band area */}
          <Area 
            dataKey="lowerBound" 
            stackId="confidence"
            stroke="none" 
            fill="transparent" 
            name="Confidence Band"
          />
          <Area 
            dataKey="confidenceWidth" 
            stackId="confidence"
            stroke="none" 
            fill="url(#historyConfidenceBand)"
            name="Confidence Band"
          />

          {/* Predicted values line */}
          <Line 
            dataKey="predicted" 
            name="Predicted" 
            type="monotone" 
            strokeWidth={2} 
            stroke="#10b981" 
            dot={false}
          />

          {/* Actual values line */}
          <Line 
            dataKey="actual" 
            name="Actual" 
            type="monotone" 
            strokeWidth={3} 
            stroke="#f59e0b" 
            strokeDasharray="5 5"
            dot={false}
            activeDot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HistoryChart; 