import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import ServerConfig from "@/components/ServerConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Plus, Mail } from "lucide-react";

export default function Configuration() {
  const { toast } = useToast();
  const [newKeyword, setNewKeyword] = useState("");
  const [manualCreds, setManualCreds] = useState({
    clientId: "",
    clientSecret: "",
    tenantId: ""
  });

  // Fetch keywords
  const { data: keywords = [] } = useQuery({
    queryKey: ["/api/keywords"],
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

  // Save manual Microsoft credentials mutation
  const saveManualCredsMutation = useMutation({
    mutationFn: async (creds: typeof manualCreds) => {
      const response = await apiRequest("POST", "/api/microsoft/manual", creds);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system/status"] });
      toast({ title: "Microsoft credentials saved successfully" });
      setManualCreds({ clientId: "", clientSecret: "", tenantId: "" });
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

  const handleSaveManualCreds = () => {
    if (manualCreds.clientId && manualCreds.clientSecret && manualCreds.tenantId) {
      saveManualCredsMutation.mutate(manualCreds);
    } else {
      toast({ title: "Please fill in all credential fields", variant: "destructive" });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Configuration</h1>
              <p className="text-muted-foreground">Configure your email server settings and integrations</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Server Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ServerConfig />
            
            {/* Microsoft Connections */}
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
                </div>


              </CardContent>
            </Card>
          </div>

          {/* Keywords Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <Settings className="mr-2 h-5 w-5 text-primary" />
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