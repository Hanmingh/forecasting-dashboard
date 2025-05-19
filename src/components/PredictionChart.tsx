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
  dates: string[];
  data: Forecast[];
  accuracy: Accuracy[];
}

const PredictionChart: React.FC<PredictionChartProps> = ({
  dates,
  data,
  accuracy,
}) => {
  const horizons = [1, 5, 10, 15, 20];
  const countMap: Record<number, number> = {
    1: 1,
    5: 4,
    10: 5,
    15: 5,
    20: 5,
  };

  const chartData = useMemo(() => {
    const pts = horizons.flatMap((h) => {
      const take = countMap[h];
      const datesForH = dates
        .slice(0, take)
        .reverse();

      return datesForH.map((cd) => {
        const f = data.find(
          (r) => r.current_date === cd && r.n_days_ahead === h
        );
        if (!f) return null;

        const acc = accuracy.find((a) => a.n_days_ahead === h);
        const mae = acc?.mae ?? 0;

        return {
          date: f.predicted_date,
          value: f.predicted_value, 
          min: f.predicted_value - mae / 2,
          diff: mae,
        };
      });
    })
    .filter((x): x is {date:string;value:number;min:number;diff:number;} => !!x)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return pts;
  }, [dates, data, accuracy]);
  const x0 = data.find((a) => a.current_date === dates[0])
  const actualPoint = [{date: dates[0], value: x0?.current_value??0, min: x0?.current_value??0, diff: 0}];
  const FinalData = [...actualPoint, ...chartData];

  // Calculate min and max values for Y-axis domain
  const yDomain = useMemo(() => {
    if (FinalData.length === 0) return [0, 100]; // Default range if no data
    
    let minValue = Infinity;
    let maxValue = -Infinity;
    
    FinalData.forEach(item => {
      // Lower bound is min
      minValue = Math.min(minValue, item.min);
      // Upper bound is min + diff
      maxValue = Math.max(maxValue, item.min + item.diff);
    });
    
    // Apply very slight padding to prevent clipping (1%)
    const range = maxValue - minValue;
    const padding = range * 0.01;
    
    return [minValue - padding, maxValue + padding];
  }, [FinalData]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={FinalData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorBand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7f8c8d" stopOpacity={0.4}/>
            <stop offset="100%" stopColor="#7f8c8d" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
        <YAxis 
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          domain={yDomain}
          allowDataOverflow={true} 
          scale="auto" 
          tickCount={5}
          tickFormatter={(value) => Math.round(value).toLocaleString()}
        />
        
        <Tooltip 
          formatter={(value: number) => value.toLocaleString(undefined, {maximumFractionDigits: 2})} 
          labelFormatter={(label) => new Date(label).toLocaleDateString()}
        />

        <Area dataKey="min" stackId="1" stroke="none" fill="transparent" />
        <Area dataKey="diff" name="deviation" stackId="1" stroke="none" fill="url(#colorBand)" />

        <Line dataKey="value" name="forecast" type="monotone" strokeWidth={2} stroke="#ff7414" dot={{ r: 3 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default PredictionChart;