import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  Settings, 
  Mail, 
  FolderOpen, 
  Cloud, 
  Activity,
  LogOut
} from "lucide-react";

export default function Sidebar() {
  const { toast } = useToast();
  const [location] = useLocation();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/system/stop");
    },
    onSuccess: () => {
      toast({ title: "System stopped successfully" });
    },
    onError: () => {
      toast({ title: "Failed to stop system", variant: "destructive" });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Mail className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Auto Responder</h1>
            <p className="text-xs text-muted-foreground">Outlook Engine Bot</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        <Link 
          to="/" 
          className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
            location === "/" 
              ? "bg-secondary text-secondary-foreground" 
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          }`}
          data-testid="nav-dashboard"
        >
          <BarChart3 className="w-5 h-5 mr-3" />
          Dashboard
        </Link>
        <Link 
          to="/configuration" 
          className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
            location === "/configuration" 
              ? "bg-secondary text-secondary-foreground" 
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          }`}
          data-testid="nav-configuration"
        >
          <Settings className="w-5 h-5 mr-3" />
          Configuration
        </Link>
        <Link 
          to="/email-monitor" 
          className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
            location === "/email-monitor" 
              ? "bg-secondary text-secondary-foreground" 
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          }`}
          data-testid="nav-email-monitor"
        >
          <Activity className="w-5 h-5 mr-3" />
          Email Monitor
        </Link>
        <Link 
          to="/case-management" 
          className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
            location === "/case-management" 
              ? "bg-secondary text-secondary-foreground" 
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          }`}
          data-testid="nav-case-management"
        >
          <FolderOpen className="w-5 h-5 mr-3" />
          Case Management
        </Link>
        <Link 
          to="/onedrive-files" 
          className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
            location === "/onedrive-files" 
              ? "bg-secondary text-secondary-foreground" 
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          }`}
          data-testid="nav-onedrive-files"
        >
          <Cloud className="w-5 h-5 mr-3" />
          OneDrive Files
        </Link>
        <Link 
          to="/analytics" 
          className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
            location === "/analytics" 
              ? "bg-secondary text-secondary-foreground" 
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          }`}
          data-testid="nav-analytics"
        >
          <BarChart3 className="w-5 h-5 mr-3" />
          Analytics
        </Link>
      </nav>
      
    </aside>
  );
}
