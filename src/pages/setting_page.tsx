import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ui/theme-provider";
import { useColorPreferences } from "@/hooks/use-color-preferences";
import { Moon, Sun, TrendingUp, TrendingDown } from "lucide-react";

const SettingPage = () => {
  const { theme, setTheme } = useTheme();
  const { updateColorScheme, isTraditional } = useColorPreferences();
  const isDark = theme === 'dark';

  return (
    <Card className="max-w-2xl mx-auto my-10 shadow-lg">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Setting */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isDark ? (
              <Moon className="h-5 w-5 text-blue-500" />
            ) : (
              <Sun className="h-5 w-5 text-yellow-500" />
            )}
            <Label htmlFor="theme-toggle">Dark Mode</Label>
          </div>
          <Switch 
            id="theme-toggle" 
            checked={isDark}
            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
          />
        </div>

        {/* Color Scheme Setting */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <TrendingUp className={`h-4 w-4 ${isTraditional() ? 'text-green-600' : 'text-red-600'}`} />
                <TrendingDown className={`h-4 w-4 ${isTraditional() ? 'text-red-600' : 'text-green-600'}`} />
              </div>
              <Label htmlFor="color-scheme-toggle">Traditional Colors (Green Up, Red Down)</Label>
            </div>
            <Switch 
              id="color-scheme-toggle" 
              checked={isTraditional()}
              onCheckedChange={(checked) => updateColorScheme(checked ? 'traditional' : 'inverted')}
            />
          </div>
          <div className="text-sm text-gray-600 pl-7">
            {isTraditional() ? (
              <span>Current: <span className="text-green-600 font-medium">Green = Rise</span>, <span className="text-red-600 font-medium">Red = Fall</span></span>
            ) : (
              <span>Current: <span className="text-red-600 font-medium">Red = Rise</span>, <span className="text-green-600 font-medium">Green = Fall</span></span>
            )}
          </div>
        </div>

        {/* Notifications Setting */}
        <div className="flex items-center justify-between">
          <Label htmlFor="notifications">Enable Notifications</Label>
          <Switch id="notifications" />
        </div>

        {/* Email Setting */}
        <div>
          <Label>Email Address</Label>
          <Input type="email" placeholder="user@example.com" />
        </div>

        {/* Password Setting */}
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
