import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Inbox } from "lucide-react";

const InboxPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#61adde] to-[#4670bc] bg-clip-text text-transparent">
          Inbox
        </h1>
        <p className="text-muted-foreground mt-2">Notifications and messages</p>
      </div>

      {/* Empty Inbox */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="space-y-4">
            <Inbox className="h-16 w-16 mx-auto text-muted-foreground" />
            <h3 className="text-xl font-semibold">No messages</h3>
            <p className="text-muted-foreground">
              Your inbox is empty. New notifications and messages will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InboxPage;
