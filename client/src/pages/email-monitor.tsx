import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import EmailMonitor from "@/components/EmailMonitor";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RefreshCw } from "lucide-react";

export default function EmailMonitorPage() {
  const { data: systemStatus } = useQuery({
    queryKey: ["/api/system/status"],
  }) as { data: any };

  const { data: cases = [] } = useQuery({
    queryKey: ["/api/email-cases"],
  }) as { data: any[] };

  const startMonitor = async () => {
    try {
      await apiRequest("POST", "/api/email-monitor/start");
    } catch (error) {
      console.error("Failed to start monitor:", error);
    }
  };

  const stopMonitor = async () => {
    try {
      await apiRequest("POST", "/api/email-monitor/stop");
    } catch (error) {
      console.error("Failed to stop monitor:", error);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Email Monitor</h1>
              <p className="text-muted-foreground">Monitor and control email processing</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${systemStatus?.emailMonitorActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className={`text-sm font-medium ${systemStatus?.emailMonitorActive ? 'text-green-600' : 'text-red-600'}`}>
                  {systemStatus?.emailMonitorActive ? 'System Active' : 'System Inactive'}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Control Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <RefreshCw className="mr-2 h-5 w-5 text-primary" />
                System Controls
              </CardTitle>
              <p className="text-sm text-muted-foreground">Manage email monitoring system</p>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Button 
                  onClick={startMonitor}
                  disabled={systemStatus?.emailMonitorActive}
                  className="flex items-center space-x-2"
                >
                  <Play className="h-4 w-4" />
                  <span>Start Monitor</span>
                </Button>
                <Button 
                  onClick={stopMonitor}
                  disabled={!systemStatus?.emailMonitorActive}
                  variant="destructive"
                  className="flex items-center space-x-2"
                >
                  <Pause className="h-4 w-4" />
                  <span>Stop Monitor</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Email Monitor */}
          <EmailMonitor cases={cases} />
        </div>
      </main>
    </div>
  );
}