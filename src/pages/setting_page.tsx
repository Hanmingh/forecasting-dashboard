import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SettingPage = () => {
  return (
    <Card className="max-w-2xl mx-auto my-10 shadow-lg">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="notifications">Enable Notifications</Label>
          <Switch id="notifications" />
        </div>
        <div>
          <Label>Email Address</Label>
          <Input type="email" placeholder="user@example.com" />
        </div>
        <div>
          <Label>Change Password</Label>
          <Input type="password" placeholder="New Password" />
        </div>
        <Button variant="default">Save Changes</Button>
      </CardContent>
    </Card>
  );
};

export default SettingPage;
