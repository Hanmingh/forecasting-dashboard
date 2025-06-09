import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useColorPreferences } from '@/hooks/use-color-preferences';

const SettingsPage: React.FC = () => {
  const { getUpColor, getDownColor, updateColorScheme, isTraditional } = useColorPreferences();

  const colorSchemes = [
    { name: 'Traditional (Green Up, Red Down)', scheme: 'traditional' as const },
    { name: 'Inverted (Red Up, Green Down)', scheme: 'inverted' as const },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#61adde] to-[#4670bc] bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">Customize your forecasting dashboard experience</p>
      </div>

      {/* Color Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Color Preferences</CardTitle>
          <CardDescription>
            Choose your preferred color scheme for positive and negative price changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm font-medium mb-3">Current Colors:</div>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm">Positive:</span>
                <span className={`font-bold ${getUpColor()}`}>+2.50% ↗</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Negative:</span>
                <span className={`font-bold ${getDownColor()}`}>-1.80% ↘</span>
              </div>
            </div>
            
            <div className="space-y-3">
              {colorSchemes.map((option, index) => (
                <Button
                  key={index}
                  variant={isTraditional() === (option.scheme === 'traditional') ? "default" : "outline"}
                  onClick={() => updateColorScheme(option.scheme)}
                  className="justify-start h-auto p-4 w-full"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm">{option.name}</span>
                    <div className="flex gap-2">
                      {option.scheme === 'traditional' ? (
                        <>
                          <span className="text-green-600 font-bold">+2.5%</span>
                          <span>/</span>
                          <span className="text-red-600 font-bold">-2.5%</span>
                        </>
                      ) : (
                        <>
                          <span className="text-red-600 font-bold">+2.5%</span>
                          <span>/</span>
                          <span className="text-green-600 font-bold">-2.5%</span>
                        </>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
