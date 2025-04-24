import { ForecastingData } from "@/api/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { format, parseISO } from 'date-fns';

interface PredictionChart {
    data: ForecastingData
}

const Prediction = ({data}: PredictionChart) => {
    const chartData = data.Predictions.slice(0,45).map((item)=>({
        Date: format(parseISO(item.dt), "MM/dd"),
        Price: item.value,
    }))

    return (
        <Card className="flex-1">
            <CardHeader>
                <CardTitle>Prediction</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width={"100%"} height={"100%"}>
                        <LineChart data={chartData}>
                            <XAxis
                                dataKey="Date"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                domain={[
                                    (dataMin: number) => dataMin,
                                    (dataMax: number) => dataMax
                                ]}
                                tickFormatter={(value) => `${value} $/MT`}
                            />
                            <Tooltip
                                content={({ active, payload}) => {
                                    if(active && payload && payload.length){
                                        return(
                                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-[0.70rem] uppercase text-muted-foreground">Price</span>
                                                        <span className="font-bold">{payload[0].value} $/MT</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }
                                    return null;
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="Price"
                                stroke="#2563eb"
                                strokeWidth={2}
                                dot={true}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}

export default Prediction;