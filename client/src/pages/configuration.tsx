import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Plus, Mail, CheckCircle } from "lucide-react";

export default function Configuration() {
  const { toast } = useToast();
  const [newKeyword, setNewKeyword] = useState("");
  const [microsoftCreds, setMicrosoftCreds] = useState({
    clientId: "",
    clientSecret: "",
    tenantId: ""
  });

  // Fetch keywords
  const { data: keywords = [] } = useQuery({
    queryKey: ["/api/keywords"],
  }) as { data: any[] };

  // Fetch system status
  const { data: systemStatus } = useQuery({
    queryKey: ["/api/system/status"],
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

  // Save Microsoft credentials mutation
  const saveMicrosoftCredsMutation = useMutation({
    mutationFn: async (creds: typeof microsoftCreds) => {
      const response = await apiRequest("POST", "/api/microsoft/setup", creds);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system/status"] });
      toast({ title: "Microsoft credentials saved successfully" });
      // Redirect to Outlook auth
      window.location.href = '/api/auth/outlook';
    },
    onError: () => {
      toast({ title: "Failed to save Microsoft credentials", variant: "destructive" });
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

  const handleSaveMicrosoftCreds = () => {
    if (microsoftCreds.clientId && microsoftCreds.clientSecret && microsoftCreds.tenantId) {
      saveMicrosoftCredsMutation.mutate(microsoftCreds);
    } else {
      toast({ title: "Please fill in all credential fields", variant: "destructive" });
    }
  };

  const isConnected = systemStatus?.outlookConnected && systemStatus?.onedriveConnected;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Configuration</h1>
              <p className="text-muted-foreground">Set up your Microsoft 365 integration</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Microsoft Setup - Single Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <Mail className="mr-2 h-5 w-5 text-primary" />
                Microsoft 365 Setup
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter your Microsoft 365 app credentials to connect Outlook and OneDrive
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {isConnected ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Connected to Microsoft 365</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="clientId">Client ID</Label>
                      <Input
                        id="clientId"
                        value={microsoftCreds.clientId}
                        onChange={(e) => setMicrosoftCreds({...microsoftCreds, clientId: e.target.value})}
                        placeholder="Enter your Client ID"
                        data-testid="input-client-id"
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientSecret">Client Secret</Label>
                      <Input
                        id="clientSecret"
                        type="password"
                        value={microsoftCreds.clientSecret}
                        onChange={(e) => setMicrosoftCreds({...microsoftCreds, clientSecret: e.target.value})}
                        placeholder="Enter your Client Secret"
                        data-testid="input-client-secret"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tenantId">Tenant ID</Label>
                      <Input
                        id="tenantId"
                        value={microsoftCreds.tenantId}
                        onChange={(e) => setMicrosoftCreds({...microsoftCreds, tenantId: e.target.value})}
                        placeholder="Enter your Tenant ID"
                        data-testid="input-tenant-id"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleSaveMicrosoftCreds}
                    disabled={!microsoftCreds.clientId || !microsoftCreds.clientSecret || !microsoftCreds.tenantId}
                    className="w-full md:w-auto"
                    data-testid="button-connect-microsoft"
                  >
                    Connect Microsoft 365
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Keywords Configuration - Simplified */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <Settings className="mr-2 h-5 w-5 text-primary" />
                Response Keywords
              </CardTitle>
              <p className="text-sm text-muted-foreground">Configure keywords that trigger automatic email responses</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Active Keywords</Label>
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
                <div>
                  <Label htmlFor="new-keyword" className="text-sm font-medium mb-3 block">Add New Keyword</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="new-keyword"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="Enter keyword..."
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
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}