import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import StatusCard from "@/components/StatusCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();

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
    queryKey: ["/api/email-cases"],
  }) as { data: any[] };

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
              data-testid="card-emails-processed"
            />
            <StatusCard
              title="Active Cases"
              value={systemStatus?.caseStats?.active?.toString() || "0"}
              icon="📁"
              data-testid="card-active-cases"
            />
            <StatusCard
              title="Response Rate"
              value={systemStatus?.caseStats?.responseRate || "0%"}
              icon="✅"
              data-testid="card-response-rate"
            />
            <StatusCard
              title="Keywords Configured"
              value={keywords.length.toString()}
              icon="🔑"
              data-testid="card-keywords-configured"
            />
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <Mail className="mr-2 h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
              <p className="text-sm text-muted-foreground">Latest email cases and system activity</p>
            </CardHeader>
            <CardContent>
              {cases.length > 0 ? (
                <div className="space-y-3">
                  {cases.slice(0, 5).map((caseItem: any) => (
                    <div key={caseItem.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{caseItem.subject}</p>
                        <p className="text-xs text-muted-foreground">{caseItem.status}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(caseItem.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
