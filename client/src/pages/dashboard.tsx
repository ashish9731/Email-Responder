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
import { Plus, Filter } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const [newKeyword, setNewKeyword] = useState("");

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

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      addKeywordMutation.mutate(newKeyword.trim());
    }
  };

  const handleRemoveKeyword = (id: string) => {
    removeKeywordMutation.mutate(id);
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
                  Microsoft Graph API
                </CardTitle>
                <p className="text-sm text-muted-foreground">Configure OneDrive integration</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="app-id">Application ID</Label>
                    <Input 
                      id="app-id"
                      placeholder="Enter Application ID" 
                      data-testid="input-app-id"
                    />
                  </div>
                  <div>
                    <Label htmlFor="client-secret">Client Secret</Label>
                    <Input 
                      id="client-secret"
                      type="password" 
                      placeholder="Enter Client Secret"
                      data-testid="input-client-secret"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tenant-id">Tenant ID</Label>
                    <Input 
                      id="tenant-id"
                      placeholder="Enter Tenant ID"
                      data-testid="input-tenant-id"
                    />
                  </div>
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${systemStatus?.onedriveConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className={`text-sm font-medium ${systemStatus?.onedriveConnected ? 'text-green-600' : 'text-red-600'}`}>
                          {systemStatus?.onedriveConnected ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                      <Button variant="secondary" size="sm" data-testid="button-refresh-token">
                        🔄 Refresh
                      </Button>
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
