import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { OilIndicesResponse } from '@/hooks/types';

interface OilIndicesChartProps {
  data: OilIndicesResponse[];
  title?: string;
  height?: number;
}

const OilIndicesChart: React.FC<OilIndicesChartProps> = ({
  data,
  title = "Oil Indices Historical Prices",
  height = 400,
}) => {
  const chartData = useMemo(() => {
    if (data.length === 0) return [];

    // Group data by date and create multi-series data
    const dataByDate = data.reduce((acc, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = { date };
      }
      acc[date][item.symbol] = item.close_price;
      return acc;
    }, {} as Record<string, any>);

    // Convert to array and sort by date
    const chartPoints = Object.values(dataByDate).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return chartPoints;
  }, [data]);

  // Get unique symbols for line colors
  const symbols = useMemo(() => {
    const uniqueSymbols = [...new Set(data.map(item => item.symbol))];
    return uniqueSymbols.sort();
  }, [data]);

  // Color scheme for different symbols
  const colors = {
    'XLE': '#2563eb', // blue
    'XES': '#dc2626', // red
    'IEO': '#16a34a', // green
  };

  // Tooltip descriptions for each symbol
  const symbolDescriptions = {
    'XLE': {
      name: 'Energy Select Sector SPDR Fund',
      description: 'Broad Energy Sector Index'
    },
    'XES': {
      name: 'SPDR S&P Oil & Gas Equipment & Services ETF',
      description: 'Oil & Gas Equipment Services Index'
    },
    'IEO': {
      name: 'iShares U.S. Oil & Gas Exploration & Production ETF',
      description: 'Oil & Gas Exploration & Production Index'
    }
  };

  // Calculate Y-axis domain
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100];
    
    let minValue = Infinity;
    let maxValue = -Infinity;
    
    chartData.forEach(item => {
      symbols.forEach(symbol => {
        if (item[symbol] !== undefined) {
          minValue = Math.min(minValue, item[symbol]);
          maxValue = Math.max(maxValue, item[symbol]);
        }
      });
    });
    
    const range = maxValue - minValue;
    const padding = range * 0.05; // 5% padding
    
    const finalMin = Math.max(0, minValue - padding);
    const finalMax = maxValue + padding;
    
    return [finalMin, finalMax];
  }, [chartData, symbols]);
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{new Date(label).toLocaleDateString()}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <p key={index} style={{ color: entry.color }}>
                <span className="font-medium">{entry.dataKey}: </span>
                ${entry.value?.toFixed(2)}
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const formatXAxisTick = (value: string) => {
    const date = new Date(value);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${year}`;
  };

  // Custom legend with tooltips
  const CustomLegend = () => (
    <div className="flex justify-center gap-4 mb-4">
      {symbols.map((symbol) => (
        <UITooltip key={symbol}>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-help">
              <div 
                className="w-3 h-0.5 rounded"
                style={{ backgroundColor: colors[symbol as keyof typeof colors] || '#6b7280' }}
              />
              <span className="text-sm font-medium">{symbol}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="text-center">
              <p className="font-medium">{symbolDescriptions[symbol as keyof typeof symbolDescriptions]?.name}</p>
              <p className="text-xs opacity-90 mt-1">
                {symbolDescriptions[symbol as keyof typeof symbolDescriptions]?.description}
              </p>
            </div>
          </TooltipContent>
        </UITooltip>
      ))}
    </div>
  );

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <span>No data available</span>
      </div>
    );
  }

  return (
    <div>
      {title && (
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
      )}
      <CustomLegend />
      <ResponsiveContainer width="100%" height={height - 40}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          
          <XAxis 
            dataKey="date" 
            stroke="#6b7280" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            tick={{ fontSize: 11 }}
            tickFormatter={formatXAxisTick}
          />
          
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={yDomain}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
          />
          
          <Tooltip content={<CustomTooltip />} />

          {/* Render a line for each symbol */}
          {symbols.map((symbol) => (
            <Line 
              key={symbol}
              dataKey={symbol} 
              name={symbol}
              type="monotone" 
              strokeWidth={2} 
              stroke={colors[symbol as keyof typeof colors] || '#6b7280'} 
              dot={false}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OilIndicesChart; 