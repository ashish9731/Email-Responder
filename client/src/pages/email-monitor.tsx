import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import EmailMonitor from "@/components/EmailMonitor";
import SystemControls from "@/components/SystemControls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Clock, AlertTriangle } from "lucide-react";

export default function EmailMonitorPage() {
  // Fetch system status
  const { data: systemStatus } = useQuery({
    queryKey: ["/api/system/status"],
    refetchInterval: 30000, // Update every 30 seconds
  }) as { data: any };

  // Fetch recent cases
  const { data: cases = [] } = useQuery({
    queryKey: ["/api/cases"],
  }) as { data: any[] };

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
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Email Monitor</h1>
                <p className="text-muted-foreground">Real-time email processing and system monitoring</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${systemStatus?.emailMonitorActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className={`text-sm font-medium ${systemStatus?.emailMonitorActive ? 'text-green-600' : 'text-red-600'}`}>
                  {systemStatus?.emailMonitorActive ? 'Monitoring Active' : 'Monitoring Inactive'}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Email Check</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatLastCheck(systemStatus?.lastEmailCheck)}</div>
                <p className="text-xs text-muted-foreground">
                  IMAP connection status
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Emails Processed</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStatus?.emailsProcessed || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total processed emails
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Follow-ups</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStatus?.caseStats?.pendingFollowUps || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting 2-hour follow-up
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <EmailMonitor cases={cases} />
            </div>
            <SystemControls systemStatus={systemStatus} />
          </div>

          {/* Monitor Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Monitor Settings</CardTitle>
              <p className="text-sm text-muted-foreground">Configure email monitoring parameters</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Check Interval</p>
                    <p className="text-sm text-muted-foreground">How often to check for new emails</p>
                  </div>
                  <span className="text-sm font-medium">Real-time</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Follow-up Delay</p>
                    <p className="text-sm text-muted-foreground">Time before sending follow-up emails</p>
                  </div>
                  <span className="text-sm font-medium">2 hours</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Auto Response</p>
                    <p className="text-sm text-muted-foreground">Automatically respond to matching emails</p>
                  </div>
                  <span className={`text-sm font-medium ${systemStatus?.autoResponderActive ? 'text-green-600' : 'text-red-600'}`}>
                    {systemStatus?.autoResponderActive ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}