import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Connection status indicator
export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (showOfflineAlert) {
    return (
      <Alert className="mb-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
        <WifiOff className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          You're currently offline. Some features may not work properly.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {isOnline ? (
        <Wifi className="h-4 w-4 text-green-500" />
      ) : (
        <WifiOff className="h-4 w-4 text-red-500" />
      )}
      <span>{isOnline ? 'Connected' : 'Offline'}</span>
    </div>
  );
}

// Success/Error notifications
export function NotificationSystem() {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
    timeout?: number;
  }>>([]);

  const addNotification = (notification: Omit<typeof notifications[0], 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);
    
    if (notification.timeout !== 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.timeout || 5000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <Alert
          key={notification.id}
          className={`w-80 ${
            notification.type === 'success' 
              ? 'border-green-500 bg-green-50 dark:bg-green-950'
              : notification.type === 'error'
              ? 'border-red-500 bg-red-50 dark:bg-red-950'
              : 'border-blue-500 bg-blue-50 dark:bg-blue-950'
          }`}
        >
          {notification.type === 'success' && (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          {notification.type === 'error' && (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription>{notification.message}</AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0"
            onClick={() => removeNotification(notification.id)}
          >
            ×
          </Button>
        </Alert>
      ))}
    </div>
  );
}

// Progressive loading states
export function ProgressiveLoader({ 
  stage, 
  total, 
  current 
}: { 
  stage: string; 
  total: number; 
  current: number; 
}) {
  const percentage = Math.round((current / total) * 100);

  return (
    <Card className="w-80 mx-auto">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="font-medium">Loading BAM AIChat</h3>
            <p className="text-sm text-muted-foreground mt-1">{stage}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{percentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-1 text-xs text-center">
            <div className={current >= 1 ? 'text-green-500' : 'text-muted-foreground'}>
              Connecting
            </div>
            <div className={current >= 2 ? 'text-green-500' : 'text-muted-foreground'}>
              Loading Data
            </div>
            <div className={current >= 3 ? 'text-green-500' : 'text-muted-foreground'}>
              Ready
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Responsive container for different screen sizes
export function ResponsiveContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
}

// Smart input with auto-resize
export function SmartTextInput({ 
  value, 
  onChange, 
  placeholder, 
  disabled,
  maxRows = 4 
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxRows?: number;
}) {
  const [rows, setRows] = useState(1);

  useEffect(() => {
    const lineCount = value.split('\n').length;
    setRows(Math.min(maxRows, Math.max(1, lineCount)));
  }, [value, maxRows]);

  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      className="w-full resize-none border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
      style={{ minHeight: '40px' }}
    />
  );
}

// Performance optimized virtual list for large datasets
export function VirtualList<T>({ 
  items, 
  renderItem, 
  itemHeight, 
  containerHeight 
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleItems = Math.ceil(containerHeight / itemHeight) + 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 1);
  const endIndex = Math.min(items.length, startIndex + visibleItems);
  
  const visibleItemsArray = items.slice(startIndex, endIndex);
  
  return (
    <div 
      className="overflow-auto"
      style={{ height: containerHeight }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItemsArray.map((item, index) => (
          <div
            key={startIndex + index}
            style={{
              position: 'absolute',
              top: (startIndex + index) * itemHeight,
              height: itemHeight,
              width: '100%',
            }}
          >
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Export notification system functions for global use
let globalNotificationSystem: {
  addNotification: (notification: any) => void;
} | null = null;

export const setGlobalNotificationSystem = (system: any) => {
  globalNotificationSystem = system;
};

export const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  if (globalNotificationSystem) {
    globalNotificationSystem.addNotification({ message, type });
  }
};