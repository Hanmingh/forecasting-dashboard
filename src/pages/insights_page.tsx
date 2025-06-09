import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, BarChart3 } from "lucide-react";

const InsightsPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#61adde] to-[#4670bc] bg-clip-text text-transparent">
          Market Insights
        </h1>
        <p className="text-muted-foreground mt-2">Advanced analytics and market intelligence</p>
      </div>

      {/* Coming Soon Message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Advanced Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="space-y-4">
            <div className="text-muted-foreground">
              <TrendingUp className="h-16 w-16 mx-auto mb-4" />
            </div>
            <h3 className="text-xl font-semibold">Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Advanced market insights, trend analysis, and predictive analytics will be available here soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InsightsPage;
