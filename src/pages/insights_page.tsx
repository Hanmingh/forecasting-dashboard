import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart2, FileText } from "lucide-react";

const reports = [
  { id: 1, title: "May 2025 Report", type: "Performance" },
  { id: 2, title: "User Activity Analysis", type: "Engagement" },
  { id: 3, title: "Market Overview Q1", type: "Market Analysis" },
];

const InsightsPage = () => {
  return (
    <Card className="max-w-2xl mx-auto my-10 shadow-lg">
      <CardHeader>
        <CardTitle>Insights & Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {reports.map(report => (
            <Card key={report.id} className="flex items-center justify-between p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <BarChart2 className="text-primary" />
                <span>{report.title}</span>
              </div>
              <Button variant="outline" size="sm">
                <FileText className="mr-2 h-4 w-4" />View
              </Button>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default InsightsPage;
