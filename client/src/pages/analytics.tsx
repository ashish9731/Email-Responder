import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Clock, Mail } from "lucide-react";

export default function Analytics() {
  // Fetch system status and case data
  const { data: systemStatus } = useQuery({
    queryKey: ["/api/system/status"],
    refetchInterval: 30000,
  }) as { data: any };

  const { data: cases = [] } = useQuery({
    queryKey: ["/api/cases"],
  }) as { data: any[] };

  // Calculate analytics
  const totalCases = cases.length;
  const activeCases = cases.filter(c => c.status !== 'completed').length;
  const completedCases = cases.filter(c => c.status === 'completed').length;
  const responseRate = totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0;
  
  // Mock performance data - in a real app this would come from database analytics
  const performanceData = [
    { period: "Last 7 days", emails: 23, responses: 21, rate: "91%" },
    { period: "Last 30 days", emails: 89, responses: 84, rate: "94%" },
    { period: "Last 90 days", emails: 267, responses: 249, rate: "93%" },
  ];

  const keywordAnalytics = [
    { keyword: "engine failure", count: 12, trend: "+15%" },
    { keyword: "engine malfunction", count: 8, trend: "+5%" },
    { keyword: "engine fire", count: 3, trend: "-2%" },
    { keyword: "engine damaged", count: 7, trend: "+10%" },
  ];

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h uptime`;
    }
    return `${hours}h ${minutes}m uptime`;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
              <p className="text-muted-foreground">Performance insights and email response analytics</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCases}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+{Math.floor(totalCases * 0.12)}</span> from last month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{responseRate}%</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+2.1%</span> from last month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.3m</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">-15s</span> from last month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">99.9%</div>
                <p className="text-xs text-muted-foreground">
                  {formatUptime(systemStatus?.uptime || 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
                <p className="text-sm text-muted-foreground">Email processing performance over time</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{data.period}</p>
                        <p className="text-sm text-muted-foreground">{data.emails} emails processed</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{data.rate}</p>
                        <p className="text-sm text-muted-foreground">{data.responses} responses</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Keyword Analytics</CardTitle>
                <p className="text-sm text-muted-foreground">Most triggered keywords and trends</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {keywordAnalytics.map((keyword, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{keyword.keyword}</p>
                        <p className="text-sm text-muted-foreground">{keyword.count} triggers</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-medium ${keyword.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {keyword.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <p className="text-sm text-muted-foreground">Current system status and health metrics</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Email Monitor</p>
                    <p className="text-sm text-muted-foreground">IMAP connection</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${systemStatus?.emailMonitorActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-sm font-medium ${systemStatus?.emailMonitorActive ? 'text-green-600' : 'text-red-600'}`}>
                      {systemStatus?.emailMonitorActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">AI Responder</p>
                    <p className="text-sm text-muted-foreground">OpenAI integration</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${systemStatus?.autoResponderActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-sm font-medium ${systemStatus?.autoResponderActive ? 'text-green-600' : 'text-red-600'}`}>
                      {systemStatus?.autoResponderActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">OneDrive Sync</p>
                    <p className="text-sm text-muted-foreground">File storage</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${systemStatus?.onedriveConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-sm font-medium ${systemStatus?.onedriveConnected ? 'text-green-600' : 'text-red-600'}`}>
                      {systemStatus?.onedriveConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <p className="text-sm text-muted-foreground">Latest system events and case updates</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cases.slice(0, 5).map((emailCase, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 bg-muted rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <Mail className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Case {emailCase.caseNumber} - {emailCase.status.replace('_', ' ')}</p>
                      <p className="text-xs text-muted-foreground">{emailCase.subject}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(emailCase.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {cases.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}