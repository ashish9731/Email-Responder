import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import StatusCard from "@/components/StatusCard";
import EmailMonitor from "@/components/EmailMonitor";
import ServerConfig from "@/components/ServerConfig";
import SystemControls from "@/components/SystemControls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Filter, Mail } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const [newKeyword, setNewKeyword] = useState("");
  const [manualCreds, setManualCreds] = useState({
    clientId: "",
    clientSecret: "",
    tenantId: ""
  });

  // Fetch system status
  const { data: systemStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["/api/system/status"],
    refetchInterval: 30000, // Update every 30 seconds
  }) as { data: any; isLoading: boolean };

  // Fetch keywords
  const { data: keywords = [] } = useQuery({
    queryKey: ["/api/keywords"],
  }) as { data: any[] };

  // Fetch recent cases
  const { data: cases = [] } = useQuery({
    queryKey: ["/api/cases"],
  }) as { data: any[] };

  // Fetch Microsoft connection status
  const { data: microsoftStatus } = useQuery({
    queryKey: ["/api/microsoft/status"],
    refetchInterval: 30000, // Update every 30 seconds
  }) as { data: any };

  // Add keyword mutation
  const addKeywordMutation = useMutation({
    mutationFn: async (keyword: string) => {
      const response = await apiRequest("POST", "/api/keywords", { keyword });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keywords"] });
      setNewKeyword("");
      toast({ title: "Keyword added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add keyword", variant: "destructive" });
    },
  });

  // Remove keyword mutation
  const removeKeywordMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/keywords/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keywords"] });
      toast({ title: "Keyword removed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to remove keyword", variant: "destructive" });
    },
  });

  // Save manual Microsoft credentials mutation
  const saveManualCredsMutation = useMutation({
    mutationFn: async (creds: typeof manualCreds) => {
      const response = await apiRequest("POST", "/api/microsoft/manual", creds);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/microsoft/status"] });
      toast({ title: "Microsoft credentials saved successfully" });
      setManualCreds({ clientId: "", clientSecret: "", tenantId: "" });
    },
    onError: (error: any) => {
      console.error("Failed to save Microsoft credentials:", error);
      toast({ 
        title: "Failed to save Microsoft credentials", 
        description: error?.message || "Please check your credentials and try again",
        variant: "destructive" 
      });
    },
  });

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      addKeywordMutation.mutate(newKeyword.trim());
    }
  };

  const handleRemoveKeyword = (id: string) => {
    removeKeywordMutation.mutate(id);
  };

  const handleSaveManualCreds = () => {
    if (manualCreds.clientId && manualCreds.clientSecret && manualCreds.tenantId) {
      saveManualCredsMutation.mutate(manualCreds);
    } else {
      toast({ title: "Please fill in all credential fields", variant: "destructive" });
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m uptime`;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Email Responder Dashboard</h1>
              <p className="text-muted-foreground">Monitor and manage your automated email responses</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${systemStatus?.emailMonitorActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className={`text-sm font-medium ${systemStatus?.emailMonitorActive ? 'text-green-600' : 'text-red-600'}`}>
                  {systemStatus?.emailMonitorActive ? 'System Active' : 'System Inactive'}
                </span>
              </div>
              {systemStatus?.uptime && (
                <div className="text-sm text-muted-foreground">
                  <span className="mr-1">🕐</span>
                  {formatUptime(systemStatus.uptime)}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatusCard
              title="Emails Processed"
              value={systemStatus?.emailsProcessed?.toString() || "0"}
              icon="📧"
              trend="+12%"
              trendLabel="from last week"
              data-testid="card-emails-processed"
            />
            <StatusCard
              title="Active Cases"
              value={systemStatus?.caseStats?.active?.toString() || "0"}
              icon="📁"
              trend={`${systemStatus?.caseStats?.pendingFollowUps || 0} pending`}
              trendLabel="follow-ups"
              data-testid="card-active-cases"
            />
            <StatusCard
              title="Response Rate"
              value={systemStatus?.caseStats?.responseRate || "0%"}
              icon="✅"
              trend="Excellent"
              trendLabel="performance"
              data-testid="card-response-rate"
            />
            <StatusCard
              title="OneDrive Storage"
              value={systemStatus?.storageUsed || "0GB"}
              icon="☁️"
              trend="of 15GB used"
              trendLabel=""
              data-testid="card-storage-used"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ServerConfig />
            
            {/* Microsoft Graph API Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-foreground">
                  <span className="mr-2">🔗</span>
                  Microsoft Connections
                </CardTitle>
                <p className="text-sm text-muted-foreground">Choose automatic or manual setup</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Automatic Connection Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-foreground">🚀 One-Click Setup</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      Recommended
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button 
                      className="w-full"
                      onClick={() => window.open('/integration/outlook', '_blank')}
                      data-testid="button-connect-outlook-auto"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Connect Outlook
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open('/integration/onedrive', '_blank')}
                      data-testid="button-connect-onedrive-auto"
                    >
                      ☁️ Connect OneDrive
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Secure OAuth2 authentication handled automatically by Replit
                  </p>
                </div>

                <div className="flex items-center">
                  <div className="flex-1 border-t border-border"></div>
                  <span className="px-3 text-xs text-muted-foreground">OR</span>
                  <div className="flex-1 border-t border-border"></div>
                </div>

                {/* Manual Connection Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-foreground">⚙️ Manual Setup</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label htmlFor="app-id">Application ID</Label>
                      <Input 
                        id="app-id"
                        value={manualCreds.clientId}
                        onChange={(e) => setManualCreds({ ...manualCreds, clientId: e.target.value })}
                        placeholder="Enter Application ID" 
                        data-testid="input-app-id"
                      />
                    </div>
                    <div>
                      <Label htmlFor="client-secret">Client Secret</Label>
                      <Input 
                        id="client-secret"
                        type="password"
                        value={manualCreds.clientSecret}
                        onChange={(e) => setManualCreds({ ...manualCreds, clientSecret: e.target.value })}
                        placeholder="Enter Client Secret"
                        data-testid="input-client-secret"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tenant-id">Tenant ID</Label>
                      <Input 
                        id="tenant-id"
                        value={manualCreds.tenantId}
                        onChange={(e) => setManualCreds({ ...manualCreds, tenantId: e.target.value })}
                        placeholder="Enter Tenant ID"
                        data-testid="input-tenant-id"
                      />
                    </div>
                    <Button 
                      variant="secondary" 
                      className="w-full"
                      onClick={handleSaveManualCreds}
                      disabled={saveManualCredsMutation.isPending}
                      data-testid="button-save-manual-creds"
                    >
                      💾 {saveManualCredsMutation.isPending ? "Saving..." : "Save Manual Credentials"}
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-foreground">Outlook</p>
                        <p className="text-xs text-muted-foreground">Email sending</p>
                        {microsoftStatus?.outlook?.type && microsoftStatus.outlook.type !== 'none' && (
                          <p className="text-xs text-blue-600 dark:text-blue-400">via {microsoftStatus.outlook.type}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${microsoftStatus?.outlook?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className={`text-xs font-medium ${microsoftStatus?.outlook?.connected ? 'text-green-600' : 'text-red-600'}`}>
                          {microsoftStatus?.outlook?.connected ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-foreground">OneDrive</p>
                        <p className="text-xs text-muted-foreground">File storage</p>
                        {microsoftStatus?.onedrive?.type && microsoftStatus.onedrive.type !== 'none' && (
                          <p className="text-xs text-blue-600 dark:text-blue-400">via {microsoftStatus.onedrive.type}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${microsoftStatus?.onedrive?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className={`text-xs font-medium ${microsoftStatus?.onedrive?.connected ? 'text-green-600' : 'text-red-600'}`}>
                          {microsoftStatus?.onedrive?.connected ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <EmailMonitor cases={cases.slice(0, 5)} />
            </div>
            <SystemControls systemStatus={systemStatus} />
          </div>

          {/* Keywords Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <Filter className="mr-2 h-5 w-5 text-primary" />
                Engine Keywords Configuration
              </CardTitle>
              <p className="text-sm text-muted-foreground">Configure trigger keywords for automatic email responses</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Active Keywords</Label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((keyword: any) => (
                        <Badge 
                          key={keyword.id} 
                          variant="secondary" 
                          className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          onClick={() => handleRemoveKeyword(keyword.id)}
                          data-testid={`badge-keyword-${keyword.id}`}
                        >
                          {keyword.keyword} ✕
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="new-keyword" className="text-sm font-medium mb-3 block">Add New Keyword</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="new-keyword"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="Enter new keyword..."
                      onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                      data-testid="input-new-keyword"
                    />
                    <Button 
                      onClick={handleAddKeyword}
                      disabled={!newKeyword.trim() || addKeywordMutation.isPending}
                      data-testid="button-add-keyword"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Keywords are case-insensitive and will trigger automatic responses
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
