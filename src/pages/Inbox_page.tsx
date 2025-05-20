import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const notifications = [
  { id: 1, title: "New Insight Available", description: "Your monthly performance report is ready.", date: "May 19", read: false },
  { id: 2, title: "Update", description: "System maintenance scheduled for tomorrow.", date: "May 18", read: true },
  { id: 3, title: "New Message", description: "You have received a new message from Admin.", date: "May 17", read: true },
];

const InboxPage = () => {
  return (
    <ScrollArea className="h-72">
      {notifications.map((notif) => (
        <div key={notif.id} className="border-b last:border-none p-4 flex justify-between items-center">
          <div>
            <h3 className={`font-semibold ${notif.read ? 'text-gray-500' : 'text-black'}`}>{notif.title}</h3>
            <p className="text-sm text-muted-foreground">{notif.description}</p>
            </div>
            <Badge variant={notif.read ? "secondary" : "default"}>{notif.date}</Badge>
        </div>
      ))}
    </ScrollArea>
  );
};

export default InboxPage;
