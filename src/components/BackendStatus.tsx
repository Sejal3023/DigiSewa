import { useBackendHealth } from '@/hooks/useBackendHealth';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Server, Wifi, WifiOff } from 'lucide-react';

export const BackendStatus = () => {
  const { isOnline, lastChecked } = useBackendHealth();

  if (isOnline === null) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="flex items-center space-x-2 p-3">
          <Server className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-500">Checking backend...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm font-medium">Backend</span>
        </div>
        <Badge variant={isOnline ? "default" : "destructive"}>
          {isOnline ? "Online" : "Offline"}
        </Badge>
      </CardContent>
      {lastChecked && (
        <CardContent className="pt-0 pb-2">
          <p className="text-xs text-gray-500">
            Last checked: {lastChecked.toLocaleTimeString()}
          </p>
        </CardContent>
      )}
    </Card>
  );
};
