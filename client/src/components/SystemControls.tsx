import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Power, RotateCcw, Clock } from "lucide-react";

interface SystemControlsProps {
  systemStatus: any;
}

export default function SystemControls({ systemStatus }: SystemControlsProps) {
  const { toast } = useToast();

  // Start system mutation
  const startSystemMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/system/start");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system/status"] });
      toast({ title: "System started successfully" });
    },
    onError: () => {
      toast({ title: "Failed to start system", variant: "destructive" });
    },
  });

  // Stop system mutation
  const stopSystemMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/system/stop");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system/status"] });
      toast({ title: "System stopped successfully" });
    },
    onError: () => {
      toast({ title: "Failed to stop system", variant: "destructive" });
    },
  });

  // Setup OneDrive mutation
  const setupOneDriveMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/onedrive/setup");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system/status"] });
      toast({ title: "OneDrive setup completed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to setup OneDrive", variant: "destructive" });
    },
  });

  const formatLastCheck = (dateString: string | null) => {
    if (!dateString) return "Never";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return `${diffSecs}s ago`;
    
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

  return (
    <div className="space-y-6">
      {/* System Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <Power className="mr-2 h-5 w-5 text-primary" />
            System Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium text-foreground">Email Monitor</p>
              <p className="text-sm text-muted-foreground">IMAP connection active</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${systemStatus?.emailMonitorActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-sm font-medium ${systemStatus?.emailMonitorActive ? 'text-green-600' : 'text-red-600'}`}>
                {systemStatus?.emailMonitorActive ? 'Running' : 'Stopped'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium text-foreground">Auto Responder</p>
              <p className="text-sm text-muted-foreground">AI response generation</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${systemStatus?.autoResponderActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-sm font-medium ${systemStatus?.autoResponderActive ? 'text-green-600' : 'text-red-600'}`}>
                {systemStatus?.autoResponderActive ? 'Running' : 'Stopped'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium text-foreground">OneDrive Sync</p>
              <p className="text-sm text-muted-foreground">File attachments</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${systemStatus?.onedriveConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-sm font-medium ${systemStatus?.onedriveConnected ? 'text-green-600' : 'text-red-600'}`}>
                {systemStatus?.onedriveConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          <div className="pt-4 border-t border-border space-y-2">
            {systemStatus?.emailMonitorActive ? (
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => stopSystemMutation.mutate()}
                disabled={stopSystemMutation.isPending}
                data-testid="button-stop-system"
              >
                <Power className="mr-2 h-4 w-4" />
                {stopSystemMutation.isPending ? "Stopping..." : "Stop System"}
              </Button>
            ) : (
              <Button 
                className="w-full"
                onClick={() => startSystemMutation.mutate()}
                disabled={startSystemMutation.isPending}
                data-testid="button-start-system"
              >
                <Power className="mr-2 h-4 w-4" />
                {startSystemMutation.isPending ? "Starting..." : "Start System"}
              </Button>
            )}
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={() => setupOneDriveMutation.mutate()}
              disabled={setupOneDriveMutation.isPending}
              data-testid="button-setup-onedrive"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {setupOneDriveMutation.isPending ? "Setting up..." : "Setup OneDrive"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <Clock className="mr-2 h-5 w-5 text-primary" />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Last Check</span>
            <span className="text-sm font-medium text-foreground">
              {formatLastCheck(systemStatus?.lastEmailCheck)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Follow-ups Sent</span>
            <span className="text-sm font-medium text-foreground">
              {systemStatus?.caseStats?.pendingFollowUps || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Cases</span>
            <span className="text-sm font-medium text-foreground">
              {systemStatus?.caseStats?.total || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Completed Cases</span>
            <span className="text-sm font-medium text-foreground">
              {systemStatus?.caseStats?.completed || 0}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
