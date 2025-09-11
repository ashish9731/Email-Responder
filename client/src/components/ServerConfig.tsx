import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Server, Plug } from "lucide-react";

export default function ServerConfig() {
  const { toast } = useToast();
  const [config, setConfig] = useState({
    imapServer: "outlook.office365.com",
    imapPort: 993,
    smtpServer: "smtp.office365.com", 
    smtpPort: 587,
    popServer: "outlook.office365.com",
    popPort: 995,
    email: "",
    password: "",
    isActive: false
  });

  // Fetch existing configuration
  const { data: configData } = useQuery({
    queryKey: ["/api/configuration"],
  });

  // Update config when data changes
  if (configData && configData !== config) {
    setConfig(configData as any);
  }

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (configData: typeof config) => {
      const response = await apiRequest("POST", "/api/configuration", configData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/configuration"] });
      toast({ title: "Configuration saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save configuration", variant: "destructive" });
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/test-connection", {
        imapServer: config.imapServer,
        imapPort: config.imapPort,
        email: config.email,
        password: config.password
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: data.success ? "Connection successful" : "Connection failed",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });
    },
    onError: () => {
      toast({ title: "Connection test failed", variant: "destructive" });
    },
  });

  const handleSaveConfig = () => {
    saveConfigMutation.mutate(config);
  };

  const handleTestConnection = () => {
    testConnectionMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-foreground">
          <Server className="mr-2 h-5 w-5 text-primary" />
          Server Configuration
        </CardTitle>
        <p className="text-sm text-muted-foreground">Configure your email server settings</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="imap-server">IMAP Server</Label>
            <Input
              id="imap-server"
              value={config.imapServer}
              onChange={(e) => setConfig({ ...config, imapServer: e.target.value })}
              data-testid="input-imap-server"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="imap-port">IMAP Port</Label>
              <Input
                id="imap-port"
                type="number"
                value={config.imapPort}
                onChange={(e) => setConfig({ ...config, imapPort: parseInt(e.target.value) })}
                data-testid="input-imap-port"
              />
            </div>
            <div>
              <Label htmlFor="security">Security</Label>
              <Select defaultValue="ssl">
                <SelectTrigger data-testid="select-security">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ssl">SSL/TLS</SelectItem>
                  <SelectItem value="starttls">STARTTLS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="smtp-server">SMTP Server</Label>
            <Input
              id="smtp-server"
              value={config.smtpServer}
              onChange={(e) => setConfig({ ...config, smtpServer: e.target.value })}
              data-testid="input-smtp-server"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="smtp-port">SMTP Port</Label>
              <Input
                id="smtp-port"
                type="number"
                value={config.smtpPort}
                onChange={(e) => setConfig({ ...config, smtpPort: parseInt(e.target.value) })}
                data-testid="input-smtp-port"
              />
            </div>
            <div>
              <Label htmlFor="pop-port">POP3 Port</Label>
              <Input
                id="pop-port"
                type="number"
                value={config.popPort}
                onChange={(e) => setConfig({ ...config, popPort: parseInt(e.target.value) })}
                data-testid="input-pop-port"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={config.email}
              onChange={(e) => setConfig({ ...config, email: e.target.value })}
              placeholder="your-email@domain.com"
              data-testid="input-email"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={config.password}
              onChange={(e) => setConfig({ ...config, password: e.target.value })}
              placeholder="Your email password"
              data-testid="input-password"
            />
          </div>
        </div>
        <div className="pt-4 border-t border-border space-y-2">
          <Button 
            onClick={handleTestConnection}
            disabled={testConnectionMutation.isPending}
            variant="outline"
            className="w-full"
            data-testid="button-test-connection"
          >
            <Plug className="mr-2 h-4 w-4" />
            {testConnectionMutation.isPending ? "Testing..." : "Test Connection"}
          </Button>
          <Button 
            onClick={handleSaveConfig}
            disabled={saveConfigMutation.isPending}
            className="w-full"
            data-testid="button-save-config"
          >
            {saveConfigMutation.isPending ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
