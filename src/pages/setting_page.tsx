import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useColorPreferences } from '@/hooks/use-color-preferences';
import { useTheme } from '@/components/ui/theme-provider';
import { Monitor, Moon, Sun, TrendingUp, TrendingDown } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { getUpColor, getDownColor, updateColorScheme, isTraditional } = useColorPreferences();
  const { theme, setTheme } = useTheme();

  const getThemeIcon = (themeValue: string) => {
    switch (themeValue) {
      case 'light': return <Sun className="h-4 w-4" />;
      case 'dark': return <Moon className="h-4 w-4" />;
      case 'system': return <Monitor className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#61adde] to-[#4670bc] bg-clip-text text-transparent">
          Settings
        </h1>
      </div>

      {/* Combined Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Customize your dashboard appearance and behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Color Scheme Setting */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm font-medium">Color Scheme</div>
              <div className="text-xs text-muted-foreground flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span className={`font-medium ${getUpColor()}`}>
                    {isTraditional() ? 'Green Up' : 'Red Up'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  <span className={`font-medium ${getDownColor()}`}>
                    {isTraditional() ? 'Red Down' : 'Green Down'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Traditional</span>
              <Switch
                checked={!isTraditional()}
                onCheckedChange={(checked) => updateColorScheme(checked ? 'inverted' : 'traditional')}
              />
              <span className="text-xs text-muted-foreground">Inverted</span>
            </div>
          </div>

          {/* Theme Setting */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm font-medium">Theme</div>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                {getThemeIcon(theme)}
                <span className="capitalize">{theme}</span>
              </div>
            </div>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Light
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Dark
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    System
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
